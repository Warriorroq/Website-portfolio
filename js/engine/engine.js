(function (global) {
    'use strict';

    class Engine {
        constructor(options) {
            options = options || {};
            this.root = options.root || document.body;
            this.ignoreSelectors = options.ignoreSelectors
                ? options.ignoreSelectors.slice()
                : [];
            this.zoneSelector = this._normalizeZoneSelector(options.zoneSelector || 'section[id]');
            this.maxDt = options.maxDt != null ? options.maxDt : 0.1;
            this.debugZoneBoundaries = !!options.debugZoneBoundaries;
            this._zoneDebugCanvas = null;
            this._zoneDebugCtx = null;
            this._zoneDebugResizeBound = this._onZoneDebugResize.bind(this);
            this._zoneDebugCornerR = options.debugZoneCornerRadius != null ? options.debugZoneCornerRadius : 8;

            this.zones = [];
            this._collectZones();

            this.entities = [];
            this._updatables = [];
            this._drawables = [];

            this._running = false;
            this._raf = null;
            this._lastTime = 0;
            this._boundTick = this._tick.bind(this);
            this._boundVis = this._onVisibilityChange.bind(this);

            if (this.debugZoneBoundaries) {
                this._ensureZoneDebugLayer();
            }
        }

        _normalizeZoneSelector(sel) {
            if (typeof sel === 'string') return sel;
            if (Array.isArray(sel)) return sel.filter(Boolean).join(', ');
            return String(sel);
        }

        setDebugZoneBoundaries(enabled) {
            this.debugZoneBoundaries = !!enabled;
            if (this.debugZoneBoundaries) {
                this._ensureZoneDebugLayer();
            } else {
                this._removeZoneDebugLayer();
            }
        }

        _ensureZoneDebugLayer() {
            if (this._zoneDebugCanvas) return;
            var c = document.createElement('canvas');
            c.setAttribute('data-engine-zone-debug', '');
            c.style.cssText = 'position:fixed;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:2147483646;';
            document.body.appendChild(c);
            this._zoneDebugCanvas = c;
            this._zoneDebugCtx = c.getContext('2d');
            window.addEventListener('resize', this._zoneDebugResizeBound);
            document.addEventListener('scroll', this._zoneDebugResizeBound, true);
        }

        _removeZoneDebugLayer() {
            window.removeEventListener('resize', this._zoneDebugResizeBound);
            document.removeEventListener('scroll', this._zoneDebugResizeBound, true);
            if (this._zoneDebugCanvas && this._zoneDebugCanvas.parentNode) {
                this._zoneDebugCanvas.parentNode.removeChild(this._zoneDebugCanvas);
            }
            this._zoneDebugCanvas = null;
            this._zoneDebugCtx = null;
        }

        _onZoneDebugResize() {
            if (!this._zoneDebugCanvas || !this._zoneDebugCtx) return;
            var dpr = window.devicePixelRatio || 1;
            var w = window.innerWidth;
            var h = window.innerHeight;
            var c = this._zoneDebugCanvas;
            c.width = Math.floor(w * dpr);
            c.height = Math.floor(h * dpr);
            c.style.width = w + 'px';
            c.style.height = h + 'px';
            this._zoneDebugCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }

        _drawZoneDebugOverlay() {
            if (!this.debugZoneBoundaries || !this._zoneDebugCtx) return;
            if (
                this._zoneDebugCanvas &&
                (this._zoneDebugCanvas.width === 0 ||
                    Math.abs(this._zoneDebugCanvas.clientWidth - window.innerWidth) > 0.5)
            ) {
                this._onZoneDebugResize();
            }
            var ctx = this._zoneDebugCtx;
            var w = window.innerWidth;
            var h = window.innerHeight;
            ctx.clearRect(0, 0, w, h);
            var r = this._zoneDebugCornerR;
            var zones = this.zones;
            ctx.strokeStyle = 'rgba(124, 108, 240, 0.95)';
            ctx.fillStyle = 'rgba(124, 108, 240, 0.35)';
            ctx.lineWidth = 2;
            for (var i = 0, n = zones.length; i < n; i++) {
                var el = zones[i];
                if (!el || !el.getBoundingClientRect) continue;
                var rect = el.getBoundingClientRect();
                if (rect.width < 1 && rect.height < 1) continue;
                var corners = [
                    { x: rect.left, y: rect.top },
                    { x: rect.right, y: rect.top },
                    { x: rect.right, y: rect.bottom },
                    { x: rect.left, y: rect.bottom }
                ];
                for (var j = 0; j < 4; j++) {
                    var p = corners[j];
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.stroke();
                }
            }
        }

        _collectZones() {
            if (!this.root || !this.root.querySelectorAll) {
                this.zones = [];
                return;
            }
            this.zones = Array.prototype.slice.call(this.root.querySelectorAll(this.zoneSelector));
        }

        refreshZones() {
            this._collectZones();
        }

        addEntity(entity) {
            if (!entity) return;
            this.entities.push(entity);
            if (typeof entity.update === 'function') this._updatables.push(entity);
            if (typeof entity.draw === 'function') this._drawables.push(entity);
            if (typeof entity.onAdd === 'function') entity.onAdd(this);
        }

        removeEntity(entity) {
            var i = this.entities.indexOf(entity);
            if (i === -1) return;
            this.entities.splice(i, 1);
            i = this._updatables.indexOf(entity);
            if (i !== -1) this._updatables.splice(i, 1);
            i = this._drawables.indexOf(entity);
            if (i !== -1) this._drawables.splice(i, 1);
        }

        _updateEntities(dt) {
            var list = this._updatables;
            for (var i = 0, n = list.length; i < n; i++) {
                list[i].update(dt, this);
            }
        }

        _drawEntities() {
            var list = this._drawables;
            for (var i = 0, n = list.length; i < n; i++) {
                list[i].draw(this.ctx, this);
            }
        }

        _onVisibilityChange() {
            if (document.hidden) this._lastTime = 0;
        }

        _tick(now) {
            if (!this._running) return;
            if (!this._lastTime) this._lastTime = now;
            var dt = (now - this._lastTime) / 1000;
            this._lastTime = now;
            if (dt > this.maxDt) dt = this.maxDt;

            this.update(dt);
            this.draw();
            this._drawZoneDebugOverlay();

            this._raf = requestAnimationFrame(this._boundTick);
        }

        update(dt) {
            if (arguments.length === 0) {
                this.start();
                return;
            }
            this._updateEntities(dt);
        }

        draw() {
            this._drawEntities();
        }

        start() {
            if (this._running) return;
            this._running = true;
            this._lastTime = 0;
            document.addEventListener('visibilitychange', this._boundVis);
            this._raf = requestAnimationFrame(this._boundTick);
        }

        stop() {
            this._running = false;
            document.removeEventListener('visibilitychange', this._boundVis);
            if (this._raf) {
                cancelAnimationFrame(this._raf);
                this._raf = null;
            }
        }

        run() {
            this.start();
        }
    }

    global.Engine = Engine;
})(typeof window !== 'undefined' ? window : this);
