'use strict';

import { CatState } from './cat-state.js';
import { clamp, hypot } from './math.js';
import { CatEventEmitter } from './cat-event-emitter.js';
import { CatStateMachine } from './cat-state-machine.js';
import { createCatStateInstances } from './states/create-cat-states.js';
import { tryCatImpact } from './states/impact-state.js';

class Cat {
    constructor(opts) {
        opts = opts || {};
        this.w = opts.width != null ? opts.width : 56;
        this.h = opts.height != null ? opts.height : 56;
        var vw = document.documentElement.clientWidth;
        var vh = document.documentElement.clientHeight;
        this.x = opts.x != null ? opts.x : vw * 0.5;
        this.y = opts.y != null ? opts.y : vh * 0.35;
        this.vx = 0;
        this.vy = 0;
        this.lastCollision = null;

        this._state = CatState.Idle;
        this._stateTime = 0;
        this._walkDir = 1;
        this._walkUntil = 0;
        this._idleUntil = 0;
        this._impactUntil = 0;
        this._impactCooldown = 0;
        this._impactResumeKey = CatState.Idle;
        this._resumeFromAir = CatState.Idle;
        this._resumeFromGrab = CatState.Idle;
        this._impactSquash = { sx: 1, sy: 1 };

        this.el = null;
        this.headEl = null;
        this.torsoEl = null;
        this.stateLabelEl = null;

        this._dragging = false;
        this._ptrId = null;
        this._lastPtrX = 0;
        this._lastPtrY = 0;
        this._lastMoveT = 0;
        this._headPtrDown = false;
        this._headPtrX = 0;
        this._headPtrY = 0;
        this._headPtrId = null;

        this._boundResize = this._onResize.bind(this);
        this._boundTorsoDown = this._onTorsoPointerDown.bind(this);
        this._boundPtrMove = this._onPointerMove.bind(this);
        this._boundPtrUp = this._onPointerUp.bind(this);
        this._boundHeadDown = this._onHeadPointerDown.bind(this);
        this._boundHeadMove = this._onHeadPointerMove.bind(this);
        this._boundHeadUp = this._onHeadPointerUp.bind(this);

        this._engine = null;

        this.walkSpeed = opts.walkSpeed != null ? opts.walkSpeed : 140;
        this.impactSpeedFloor = opts.impactSpeedFloor != null ? opts.impactSpeedFloor : 420;
        this.impactSpeedWall = opts.impactSpeedWall != null ? opts.impactSpeedWall : 380;

        this.collisionRestitution = opts.collisionRestitution != null ? opts.collisionRestitution : 0.05;
        this.collisionRestitutionVelocityThreshold =
            opts.collisionRestitutionVelocityThreshold != null ? opts.collisionRestitutionVelocityThreshold : 55;

        this.events = new CatEventEmitter();
        this.on = this.events.on.bind(this.events);
        this.once = this.events.once.bind(this.events);
        this.off = this.events.off.bind(this.events);

        var instances = createCatStateInstances(this);
        this._sm = new CatStateMachine(this, instances);
        this._sm.debug = opts.stateMachineDebug === true;
    }

    get state() {
        return this._state;
    }

    get stateMachine() {
        return this._sm;
    }

    get currentStateObject() {
        return this._sm.current;
    }

    _syncStateId(id) {
        this._state = id;
    }

    _emptyFrameCtx() {
        return this._buildFrameCtx(0, [], false);
    }

    _buildFrameCtx(dt, contacts, grounded) {
        return {
            cat: this,
            machine: this._sm,
            dt: dt,
            contacts: contacts,
            grounded: grounded,
        };
    }

    requestState(id, payload) {
        if (!this.el) return false;
        var contacts = this._contacts();
        var ctx = this._buildFrameCtx(0, contacts, this._isGrounded(contacts));
        return this._sm.changeState(this._sm.get(id), ctx, payload);
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
        if (this.stateLabelEl) {
            this.stateLabelEl.style.left = this.x - this._halfW() + 'px';
            this.stateLabelEl.style.top = this.y + this._halfH() + 4 + 'px';
            this.stateLabelEl.style.width = this.w + 'px';
        }
    }

    _syncStateLabel() {
        if (!this.stateLabelEl) return;
        this.stateLabelEl.textContent = String(this._state);
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

    _onTorsoPointerDown(e) {
        if (e.button !== 0 && e.pointerType !== 'touch' && e.pointerType !== 'pen') return;
        e.preventDefault();
        e.stopPropagation();
        this.vx = 0;
        this.vy = 0;
        if (this._sm.currentId !== CatState.Grabbed) {
            this._resumeFromGrab = this._sm.currentId;
        }
        this._dragging = true;
        var ctx = this._buildFrameCtx(0, this._contacts(), this._isGrounded(this._contacts()));
        this._sm.changeState(this._sm.get(CatState.Grabbed), ctx);
        this.events.emit('grabbed', { resumeFrom: this._resumeFromGrab });
        this._ptrId = e.pointerId;
        this._lastPtrX = e.clientX;
        this._lastPtrY = e.clientY;
        this._lastMoveT = performance.now();
        this.x = e.clientX;
        this.y = e.clientY;
        this._clampToViewport();
        this.torsoEl.style.cursor = 'grabbing';
        this.torsoEl.setPointerCapture(e.pointerId);
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
        this.torsoEl.style.cursor = 'grab';
        try {
            this.torsoEl.releasePointerCapture(e.pointerId);
        } catch (err) {}
        var cap = 2200;
        this.vx = clamp(this.vx, -cap, cap);
        this.vy = clamp(this.vy, -cap, cap);
        var ctx = this._buildFrameCtx(0, this._contacts(), this._isGrounded(this._contacts()));
        var key = this._resumeFromGrab;
        var payload = key === CatState.Walk ? { resumeFromGrab: true } : null;
        this._sm.changeState(this._sm.get(key), ctx, payload);
        this.events.emit('released', { vx: this.vx, vy: this.vy, state: key });
    }

    _onHeadPointerDown(e) {
        if (e.button !== 0 && e.pointerType !== 'touch' && e.pointerType !== 'pen') return;
        e.preventDefault();
        e.stopPropagation();
        this._headPtrDown = true;
        this._headPtrId = e.pointerId;
        this._headPtrX = e.clientX;
        this._headPtrY = e.clientY;
        this.headEl.setPointerCapture(e.pointerId);
    }

    _onHeadPointerMove(e) {
        if (!this._headPtrDown || e.pointerId !== this._headPtrId) return;
        e.stopPropagation();
    }

    _onHeadPointerUp(e) {
        if (e.pointerId !== this._headPtrId) return;
        var dx = e.clientX - this._headPtrX;
        var dy = e.clientY - this._headPtrY;
        var moved = hypot(dx, dy);
        this._headPtrDown = false;
        this._headPtrId = null;
        try {
            this.headEl.releasePointerCapture(e.pointerId);
        } catch (err2) {}
        if (moved < 10) {
            this._toggleLieFromHead();
        }
    }

    _toggleLieFromHead() {
        if (this._sm.currentId === CatState.Grabbed) return;
        if (this._sm.currentId === CatState.Impact) return;
        if (this._sm.currentId === CatState.InAir && this._resumeFromAir === CatState.Lie) {
            this._resumeFromAir = CatState.Idle;
            this._applyHeadVisual();
            this.events.emit('lieToggle', { lyingIntent: false, inAir: true });
            return;
        }
        var ctx = this._buildFrameCtx(0, this._contacts(), this._isGrounded(this._contacts()));
        if (this._sm.currentId === CatState.Lie) {
            this._sm.changeState(this._sm.get(CatState.Idle), ctx);
            this.events.emit('lieToggle', { lyingIntent: false, inAir: false });
            return;
        }
        if (this._sm.currentId === CatState.InAir) {
            this._resumeFromAir = CatState.Lie;
        } else {
            this._sm.changeState(this._sm.get(CatState.Lie), ctx);
        }
        this.vx *= 0.35;
        this._applyHeadVisual();
        this.events.emit('lieToggle', { lyingIntent: true, inAir: this._sm.currentId === CatState.InAir });
    }

    _pickNextIdleDuration() {
        this._idleUntil = 0.8 + Math.random() * 1.6;
    }

    _pickWalkDuration() {
        this._walkUntil = 1.2 + Math.random() * 2.2;
        this._walkDir = Math.random() < 0.5 ? -1 : 1;
    }

    _contacts() {
        var lc = this.lastCollision;
        if (!lc || !lc.contacts) return [];
        return lc.contacts;
    }

    _isGrounded(contacts) {
        var hh = this._halfH();
        var bot = this.y + hh;
        var i;
        for (i = 0; i < contacts.length; i++) {
            var c = contacts[i];
            if (c.kind === 'viewport' && c.edge === 'bottom') return true;
            if (c.kind === 'static' && c.rect) {
                var r = c.rect;
                if (bot >= r.y - 4 && bot <= r.y + 14 && this.x + this._halfW() > r.x && this.x - this._halfW() < r.x + r.w) {
                    return true;
                }
            }
        }
        return false;
    }

    _wallNormalFromContacts(contacts) {
        var nx = 0;
        var ny = 0;
        var i;
        for (i = 0; i < contacts.length; i++) {
            var c = contacts[i];
            if (c.kind === 'viewport') {
                if (c.edge === 'left') nx += 1;
                else if (c.edge === 'right') nx -= 1;
                else if (c.edge === 'top') ny += 1;
                else if (c.edge === 'bottom') ny -= 1;
            }
        }
        return { nx: nx, ny: ny };
    }

    _applyHeadVisual() {
        if (!this.headEl) return;
        this.headEl.classList.remove('cat-head--sleep', 'cat-head--pain', 'cat-head--idle');
        var lieFace =
            this._state === CatState.Lie ||
            (this._state === CatState.InAir && this._resumeFromAir === CatState.Lie);
        if (lieFace) {
            this.headEl.classList.add('cat-head--sleep');
        } else if (this._state === CatState.Impact) {
            this.headEl.classList.add('cat-head--pain');
        } else {
            this.headEl.classList.add('cat-head--idle');
        }
    }

    _applyBodyVisual() {
        if (!this.torsoEl || !this.el) return;
        var lie =
            this._state === CatState.Lie ||
            (this._state === CatState.InAir && this._resumeFromAir === CatState.Lie);
        var squ = this._state === CatState.Impact ? this._impactSquash : { sx: 1, sy: 1 };
        var ly = lie ? 0.62 : 1;
        this.torsoEl.style.transform =
            'scale(' + (squ.sx * (lie ? 1.04 : 1)).toFixed(3) + ',' + (squ.sy * ly).toFixed(3) + ')';
        this.torsoEl.style.transformOrigin = 'center bottom';
        this.el.style.opacity = this._state === CatState.Impact ? '0.95' : '1';
    }

    onAdd(engine) {
        this._engine = engine || null;
        var el = document.createElement('div');
        el.className = 'dom-cat';
        el.setAttribute('role', 'presentation');
        el.style.cssText =
            'position:fixed;z-index:99997;box-sizing:border-box;display:flex;flex-direction:column;' +
            'overflow:visible;touch-action:none;user-select:none;-webkit-user-select:none;' +
            'will-change:left,top;filter:drop-shadow(0 4px 10px rgba(0,0,0,0.28))';

        var head = document.createElement('div');
        head.className = 'cat-head cat-head--idle';
        head.setAttribute('role', 'button');
        head.setAttribute('aria-label', 'Кот: нажми, чтобы лечь или встать');
        var headH = Math.max(14, Math.round(this.h * 0.32));
        head.style.cssText =
            'flex:0 0 ' +
            headH +
            'px;height:' +
            headH +
            'px;width:100%;border-radius:4px 4px 2px 2px;cursor:pointer;' +
            'background:linear-gradient(180deg,#f4c27a,#d89a4a);' +
            'border:2px solid rgba(80,50,20,0.35);box-sizing:border-box;' +
            'display:flex;align-items:center;justify-content:center;font-size:11px;color:rgba(60,40,20,0.55);';

        var torso = document.createElement('div');
        torso.className = 'cat-torso';
        torso.style.cssText =
            'flex:1 1 auto;min-height:0;width:100%;border-radius:2px 2px 6px 6px;cursor:grab;' +
            'background:linear-gradient(180deg,#c9a06c,#8b6914);' +
            'border:2px solid rgba(60,40,15,0.4);border-top:none;box-sizing:border-box;';

        el.appendChild(head);
        el.appendChild(torso);

        var stateLab = document.createElement('div');
        stateLab.className = 'dom-cat-state';
        stateLab.setAttribute('aria-hidden', 'true');
        stateLab.style.cssText =
            'position:fixed;z-index:99996;box-sizing:border-box;margin:0;padding:0;' +
            'font:600 10px/1.2 system-ui,Segoe UI,sans-serif;text-align:center;' +
            'color:rgba(25,20,15,0.72);text-shadow:0 0 3px #fff,0 0 6px #fff;' +
            'pointer-events:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis';

        document.body.appendChild(el);
        document.body.appendChild(stateLab);

        this.el = el;
        this.headEl = head;
        this.torsoEl = torso;
        this.stateLabelEl = stateLab;

        this._injectHeadStylesOnce();

        this._clampToViewport();
        this._syncStyle();

        this._sm.start(CatState.Idle, this._emptyFrameCtx());

        torso.addEventListener('pointerdown', this._boundTorsoDown);
        torso.addEventListener('pointermove', this._boundPtrMove);
        torso.addEventListener('pointerup', this._boundPtrUp);
        torso.addEventListener('pointercancel', this._boundPtrUp);
        head.addEventListener('pointerdown', this._boundHeadDown);
        head.addEventListener('pointermove', this._boundHeadMove);
        head.addEventListener('pointerup', this._boundHeadUp);
        head.addEventListener('pointercancel', this._boundHeadUp);

        window.addEventListener('resize', this._boundResize);
        if (this._engine && this._engine.collision) this._engine.collision.register(this);
        this._applyHeadVisual();
        this._applyBodyVisual();
        this._syncStateLabel();
    }

    _injectHeadStylesOnce() {
        if (document.getElementById('cat-entity-styles')) return;
        var st = document.createElement('style');
        st.id = 'cat-entity-styles';
        st.textContent =
            '.cat-head.cat-head--idle::after{content:"• •";letter-spacing:2px;}' +
            '.cat-head.cat-head--sleep::after{content:"– –";letter-spacing:3px;opacity:0.85;}' +
            '.cat-head.cat-head--pain::after{content:"> <";font-size:10px;}' +
            '.cat-head.cat-head--sleep{background:linear-gradient(180deg,#d4a86a,#a67c38)!important;}' +
            '.cat-head.cat-head--pain{background:linear-gradient(180deg,#e8a070,#c06040)!important;}';
        document.head.appendChild(st);
    }

    update(dt) {
        if (!this.el) return;
        var contacts = this._contacts();
        var grounded = this._isGrounded(contacts);
        var ctx = this._buildFrameCtx(dt, contacts, grounded);

        if (this._impactCooldown > 0) this._impactCooldown -= dt;

        if (!this._dragging) {
            tryCatImpact(this, ctx, this._sm);

            if (
                !grounded &&
                this._sm.currentId !== CatState.Grabbed &&
                this._sm.currentId !== CatState.Impact &&
                this._sm.currentId !== CatState.InAir
            ) {
                if (
                    this._sm.currentId === CatState.Idle ||
                    this._sm.currentId === CatState.Walk ||
                    this._sm.currentId === CatState.Lie
                ) {
                    var fromLoco = this._sm.currentId;
                    this._resumeFromAir = fromLoco;
                    this._sm.changeState(this._sm.get(CatState.InAir), ctx);
                    this.events.emit('airborne', { from: fromLoco });
                }
            }

            this._stateTime += dt;
            this._sm.current.updateLogic(ctx);

            if (this._sm.currentId === CatState.InAir && grounded) {
                var landKey = this._resumeFromAir;
                this._sm.changeState(this._sm.get(landKey), ctx, { resumeFromAir: true });
                this.events.emit('landed', { to: landKey, grounded: true });
            }

            this._sm.current.updateLate(ctx);
            this._sm.current.updateAnimator(ctx);
        }

        this._syncStyle();
        this._syncStateLabel();
        this._applyBodyVisual();
        this._applyHeadVisual();
    }

    destroy() {
        window.removeEventListener('resize', this._boundResize);
        if (this._engine && this._engine.collision) this._engine.collision.unregister(this);
        this._engine = null;
        if (this.torsoEl) {
            this.torsoEl.removeEventListener('pointerdown', this._boundTorsoDown);
            this.torsoEl.removeEventListener('pointermove', this._boundPtrMove);
            this.torsoEl.removeEventListener('pointerup', this._boundPtrUp);
            this.torsoEl.removeEventListener('pointercancel', this._boundPtrUp);
        }
        if (this.headEl) {
            this.headEl.removeEventListener('pointerdown', this._boundHeadDown);
            this.headEl.removeEventListener('pointermove', this._boundHeadMove);
            this.headEl.removeEventListener('pointerup', this._boundHeadUp);
            this.headEl.removeEventListener('pointercancel', this._boundHeadUp);
        }
        if (this.el && this.el.parentNode) this.el.parentNode.removeChild(this.el);
        if (this.stateLabelEl && this.stateLabelEl.parentNode) this.stateLabelEl.parentNode.removeChild(this.stateLabelEl);
        this.el = null;
        this.headEl = null;
        this.torsoEl = null;
        this.stateLabelEl = null;
    }
}

export { Cat };
export { CatState } from './cat-state.js';
export { CatStateMachine } from './cat-state-machine.js';
export { CatBehaviorState } from './states/cat-behavior-state.js';
export { CatEventEmitter } from './cat-event-emitter.js';
