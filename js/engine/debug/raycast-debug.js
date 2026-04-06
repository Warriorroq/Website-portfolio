'use strict';

var NS = 'http://www.w3.org/2000/svg';
var TAU = Math.PI * 2;

class RaycastDebugHandle {
    constructor(svg, cancelLoop) {
        this._svg = svg;
        this._cancelLoop = cancelLoop;
    }

    destroy() {
        if (this._cancelLoop) {
            this._cancelLoop();
            this._cancelLoop = null;
        }
        if (this._svg && this._svg.parentNode) {
            this._svg.parentNode.removeChild(this._svg);
        }
        this._svg = null;
    }
}

class RaycastDebugOverlay {
    /**
     * @param {import('../engine.js').Engine} engine
     * @param {object} [options]
     * @param {number} [options.rayCount=60]
     * @param {function(import('../engine.js').Engine): {x:number,y:number}} [options.getOrigin]
     * @param {number} [options.maxDistance]
     * @param {object} [options.ignore]
     * @param {string} [options.strokeHit]
     * @param {string} [options.strokeMiss]
     * @param {string} [options.strokeHitPoint]
     * @param {number} [options.hitRadius]
     * @param {number} [options.zIndex]
     */
    static attach(engine, options) {
        options = options || {};
        var rayCount = options.rayCount != null ? options.rayCount : 60;
        if (rayCount < 1) rayCount = 1;
        var getOrigin = options.getOrigin;
        var maxDistance = options.maxDistance != null ? options.maxDistance : 600;
        var ignore = options.ignore;
        var strokeHit = options.strokeHit != null ? options.strokeHit : 'rgba(34, 211, 238, 0.85)';
        var strokeMiss = options.strokeMiss != null ? options.strokeMiss : 'rgba(148, 163, 184, 0.35)';
        var strokeHitPoint = options.strokeHitPoint != null ? options.strokeHitPoint : 'rgba(244, 63, 94, 0.95)';
        var hitRadius = options.hitRadius != null ? options.hitRadius : 3;
        var zIndex = options.zIndex != null ? options.zIndex : 2147483645;

        if (!engine || !engine.collision || typeof engine.collision.raycast !== 'function') {
            throw new Error('RaycastDebugOverlay.attach: expected Engine with collision');
        }

        var svg = document.createElementNS(NS, 'svg');
        svg.setAttribute('aria-hidden', 'true');
        svg.style.cssText =
            'position:fixed;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:' +
            zIndex +
            ';overflow:visible';

        var g = document.createElementNS(NS, 'g');
        svg.appendChild(g);
        document.body.appendChild(svg);

        var raf = 0;
        var stopped = false;

        function syncSvgSize() {
            svg.setAttribute('width', String(document.documentElement.clientWidth));
            svg.setAttribute('height', String(document.documentElement.clientHeight));
        }

        function defaultOrigin() {
            var vw = document.documentElement.clientWidth;
            var vh = document.documentElement.clientHeight;
            return { x: vw * 0.5, y: vh * 0.5 };
        }

        function origin() {
            if (typeof getOrigin === 'function') {
                var o = getOrigin(engine);
                if (o && typeof o.x === 'number' && typeof o.y === 'number') return o;
            }
            return defaultOrigin();
        }

        function tick() {
            if (stopped) return;
            raf = requestAnimationFrame(tick);
            redraw();
        }

        function redraw() {
            engine.refreshZones();
            syncSvgSize();
            while (g.firstChild) g.removeChild(g.firstChild);

            var o = origin();
            var ox = o.x;
            var oy = o.y;
            var n = rayCount;
            var i;
            for (i = 0; i < n; i++) {
                var ang = (i / n) * TAU;
                var dx = Math.cos(ang);
                var dy = Math.sin(ang);
                var hit = engine.collision.raycast(ox, oy, dx, dy, {
                    maxDistance: maxDistance,
                    ignore: ignore,
                });

                var line = document.createElementNS(NS, 'line');
                line.setAttribute('x1', String(ox));
                line.setAttribute('y1', String(oy));
                if (hit) {
                    line.setAttribute('x2', String(hit.x));
                    line.setAttribute('y2', String(hit.y));
                    line.setAttribute('stroke', strokeHit);
                    var dot = document.createElementNS(NS, 'circle');
                    dot.setAttribute('cx', String(hit.x));
                    dot.setAttribute('cy', String(hit.y));
                    dot.setAttribute('r', String(hitRadius));
                    dot.setAttribute('fill', strokeHitPoint);
                    dot.setAttribute('stroke', 'none');
                    g.appendChild(line);
                    g.appendChild(dot);
                } else {
                    line.setAttribute('x2', String(ox + dx * maxDistance));
                    line.setAttribute('y2', String(oy + dy * maxDistance));
                    line.setAttribute('stroke', strokeMiss);
                    g.appendChild(line);
                }
                line.setAttribute('stroke-width', '1');
                line.setAttribute('stroke-linecap', 'round');
            }
        }

        function cancelLoop() {
            stopped = true;
            if (raf) cancelAnimationFrame(raf);
            raf = 0;
        }

        tick();

        return new RaycastDebugHandle(svg, cancelLoop);
    }
}

export { RaycastDebugOverlay };
