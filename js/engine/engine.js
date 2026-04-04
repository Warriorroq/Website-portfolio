(function (global) {
    'use strict';

    class Engine {
        constructor(options) {
            options = options || {};
            this.root = options.root || document.body;
            this.ignoreSelectors = options.ignoreSelectors
                ? options.ignoreSelectors.slice()
                : [];
            this.zoneSelector = options.zoneSelector || 'section[id]';
            this.maxDt = options.maxDt != null ? options.maxDt : 0.1;

            this.zones = [];
            this._collectZones();

            this.entities = [];
            this._updatables = [];
            this._drawables = [];

            this.collision =
                typeof global.CollisionSubsystem === 'function'
                    ? new global.CollisionSubsystem(this)
                    : null;

            this._running = false;
            this._raf = null;
            this._lastTime = 0;
            this._boundTick = this._tick.bind(this);
            this._boundVis = this._onVisibilityChange.bind(this);
        }

        _collectZones() {
            if (!this.root || !this.root.querySelectorAll) {
                this.zones = [];
                return;
            }
            var sel = this.zoneSelector;
            if (typeof sel === 'string') {
                this.zones = Array.prototype.slice.call(this.root.querySelectorAll(sel));
                return;
            }
            if (Array.isArray(sel)) {
                var seen = typeof WeakSet === 'function' ? new WeakSet() : null;
                var out = [];
                for (var i = 0; i < sel.length; i++) {
                    var list = this.root.querySelectorAll(sel[i]);
                    for (var j = 0; j < list.length; j++) {
                        var node = list[j];
                        if (seen) {
                            if (seen.has(node)) continue;
                            seen.add(node);
                        } else if (out.indexOf(node) !== -1) {
                            continue;
                        }
                        out.push(node);
                    }
                }
                this.zones = out;
                return;
            }
            this.zones = [];
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

            this._raf = requestAnimationFrame(this._boundTick);
        }

        update(dt) {
            if (arguments.length === 0) {
                this.start();
                return;
            }
            if (this.collision) this.collision.update(dt);
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
