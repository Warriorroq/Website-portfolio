'use strict';

function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
}

class Mouse {
    constructor(opts) {
        opts = opts || {};
        this.w = opts.width != null ? opts.width : opts.radius != null ? opts.radius * 2 : 52;
        this.h = opts.height != null ? opts.height : opts.radius != null ? opts.radius * 2 : 52;
        var vw = document.documentElement.clientWidth;
        var vh = document.documentElement.clientHeight;
        this.x = opts.x != null ? opts.x : vw * 0.5;
        this.y = opts.y != null ? opts.y : vh * 0.35;
        this.vx = 0;
        this.vy = 0;
        this.lastCollision = null;
        this.el = null;
        this._dragging = false;
        this._ptrId = null;
        this._lastPtrX = 0;
        this._lastPtrY = 0;
        this._lastMoveT = 0;
        this._boundResize = this._onResize.bind(this);
        this._boundPtrDown = this._onPointerDown.bind(this);
        this._boundPtrMove = this._onPointerMove.bind(this);
        this._boundPtrUp = this._onPointerUp.bind(this);
        this._engine = null;
        this.animator = opts.animator || null;
    }

    collisionSkip() {
        return this._dragging;
    }

    _halfW() {
        return this.w * 0.5;
    }

    _halfH() {
        return this.h * 0.5;
    }

    getCollisionShape() {
        return {
            type: 'rect',
            x: this.x - this._halfW(),
            y: this.y - this._halfH(),
            w: this.w,
            h: this.h,
        };
    }

    _syncStyle() {
        if (!this.el) return;
        this.el.style.width = this.w + 'px';
        this.el.style.height = this.h + 'px';
        this.el.style.left = this.x - this._halfW() + 'px';
        this.el.style.top = this.y - this._halfH() + 'px';
    }

    _clampToViewport() {
        var vw = document.documentElement.clientWidth;
        var vh = document.documentElement.clientHeight;
        var hw = this._halfW();
        var hh = this._halfH();
        this.x = clamp(this.x, hw, vw - hw);
        this.y = clamp(this.y, hh, vh - hh);
    }

    _onResize() {
        this._clampToViewport();
        this._syncStyle();
    }

    _onPointerDown(e) {
        if (e.button !== 0 && e.pointerType !== 'touch' && e.pointerType !== 'pen') return;
        e.preventDefault();
        this._dragging = true;
        this._ptrId = e.pointerId;
        this.vx = 0;
        this.vy = 0;
        this._lastPtrX = e.clientX;
        this._lastPtrY = e.clientY;
        this._lastMoveT = performance.now();
        this.x = e.clientX;
        this.y = e.clientY;
        this._clampToViewport();
        this.el.style.cursor = 'grabbing';
        this.el.setPointerCapture(e.pointerId);
    }

    _onPointerMove(e) {
        if (!this._dragging || e.pointerId !== this._ptrId) return;
        e.preventDefault();
        var now = performance.now();
        var dtMs = now - this._lastMoveT;
        this._lastMoveT = now;
        var dt = dtMs / 1000;
        if (dt < 0.001) dt = 0.001;
        var dx = e.clientX - this._lastPtrX;
        var dy = e.clientY - this._lastPtrY;
        this._lastPtrX = e.clientX;
        this._lastPtrY = e.clientY;
        this.x = e.clientX;
        this.y = e.clientY;
        this._clampToViewport();
        this.vx = dx / dt;
        this.vy = dy / dt;
    }

    _onPointerUp(e) {
        if (e.pointerId !== this._ptrId) return;
        this._dragging = false;
        this._ptrId = null;
        this.el.style.cursor = 'grab';
        try {
            this.el.releasePointerCapture(e.pointerId);
        } catch (err) {}
        var cap = 2200;
        this.vx = clamp(this.vx, -cap, cap);
        this.vy = clamp(this.vy, -cap, cap);
    }

    onAdd(engine) {
        this._engine = engine || null;
        var el = document.createElement('div');
        el.className = 'dom-mouse';
        el.setAttribute('role', 'presentation');
        if (this.animator) {
            el.style.cssText =
                'position:fixed;z-index:99999;box-sizing:border-box;border-radius:2px;overflow:hidden;' +
                'background-color:transparent;' +
                'box-shadow:0 4px 14px rgba(0,0,0,0.35),inset 0 -6px 12px rgba(0,0,0,0.15);' +
                'touch-action:none;cursor:grab;user-select:none;-webkit-user-select:none;' +
                'will-change:left,top';
        } else {
            el.style.cssText =
                'position:fixed;z-index:99999;box-sizing:border-box;border-radius:2px;' +
                'background-color:transparent;' +
                'box-shadow:0 4px 14px rgba(0,0,0,0.35),inset 0 -6px 12px rgba(0,0,0,0.15);' +
                'touch-action:none;cursor:grab;user-select:none;-webkit-user-select:none;' +
                'will-change:left,top';
        }
        document.body.appendChild(el);
        this.el = el;
        this._clampToViewport();
        this._syncStyle();
        el.addEventListener('pointerdown', this._boundPtrDown);
        el.addEventListener('pointermove', this._boundPtrMove);
        el.addEventListener('pointerup', this._boundPtrUp);
        el.addEventListener('pointercancel', this._boundPtrUp);
        window.addEventListener('resize', this._boundResize);
        if (this._engine && this._engine.collision) this._engine.collision.register(this);
        if (this.animator) this.animator.attach(this.el);
    }

    update(dt) {
        if (!this.el) return;
        this._syncStyle();
        if (this.animator) this.animator.update(dt);
    }

    destroy() {
        window.removeEventListener('resize', this._boundResize);
        if (this._engine && this._engine.collision) this._engine.collision.unregister(this);
        this._engine = null;
        if (this.el) {
            this.el.removeEventListener('pointerdown', this._boundPtrDown);
            this.el.removeEventListener('pointermove', this._boundPtrMove);
            this.el.removeEventListener('pointerup', this._boundPtrUp);
            this.el.removeEventListener('pointercancel', this._boundPtrUp);
            if (this.el.parentNode) this.el.parentNode.removeChild(this.el);
            this.el = null;
        }
    }
}

export { Mouse };
