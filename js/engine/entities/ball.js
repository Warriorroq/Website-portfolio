'use strict';

function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
}

class Ball {
    constructor(opts) {
        opts = opts || {};
        this.radius = opts.radius != null ? opts.radius : 22;
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
    }

    collisionSkip() {
        return this._dragging;
    }

    getCollisionShape() {
        return { type: 'circle', x: this.x, y: this.y, r: this.radius };
    }

    _syncStyle() {
        if (!this.el) return;
        var d = this.radius * 2;
        this.el.style.width = d + 'px';
        this.el.style.height = d + 'px';
        this.el.style.left = this.x - this.radius + 'px';
        this.el.style.top = this.y - this.radius + 'px';
    }

    _clampToViewport() {
        var vw = document.documentElement.clientWidth;
        var vh = document.documentElement.clientHeight;
        var r = this.radius;
        this.x = clamp(this.x, r, vw - r);
        this.y = clamp(this.y, r, vh - r);
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
        el.className = 'dom-ball';
        el.setAttribute('role', 'presentation');
        el.style.cssText =
            'position:fixed;z-index:99998;box-sizing:border-box;border-radius:50%;' +
            'background:radial-gradient(circle at 32% 28%, #fff8f0, #ff9a6b 42%, #e85d2c);' +
            'box-shadow:0 4px 14px rgba(0,0,0,0.35),inset 0 -5px 10px rgba(0,0,0,0.18);' +
            'touch-action:none;cursor:grab;user-select:none;-webkit-user-select:none;' +
            'will-change:left,top';
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
    }

    update(dt) {
        if (!this.el) return;
        this._syncStyle();
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

export { Ball };
