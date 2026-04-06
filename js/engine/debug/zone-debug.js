'use strict';

var NS = 'http://www.w3.org/2000/svg';

class ZoneDebugHandle {
    constructor(svg, scheduleRedraw, redraw) {
        this._svg = svg;
        this._scheduleRedraw = scheduleRedraw;
        this._redraw = redraw;
    }

    destroy() {
        window.removeEventListener('scroll', this._scheduleRedraw, true);
        window.removeEventListener('resize', this._scheduleRedraw);
        if (this._svg.parentNode) this._svg.parentNode.removeChild(this._svg);
    }

    redraw() {
        this._redraw();
    }
}

class ZoneDebugOverlay {
    static attach(engine, options) {
        options = options || {};
        var radius = options.radius != null ? options.radius : 6;
        var stroke = options.stroke != null ? options.stroke : 'rgba(236, 72, 153, 0.95)';
        var fill = options.fill != null ? options.fill : 'rgba(236, 72, 153, 0.25)';
        var edgeMidpoints = !!options.edgeMidpoints;
        var zIndex = options.zIndex != null ? options.zIndex : 2147483646;

        if (!engine || typeof engine.refreshZones !== 'function') {
            throw new Error('ZoneDebugOverlay.attach: expected Engine instance');
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

        function syncSvgSize() {
            svg.setAttribute('width', String(document.documentElement.clientWidth));
            svg.setAttribute('height', String(document.documentElement.clientHeight));
        }

        function addCircle(cx, cy) {
            var c = document.createElementNS(NS, 'circle');
            c.setAttribute('cx', String(cx));
            c.setAttribute('cy', String(cy));
            c.setAttribute('r', String(radius));
            c.setAttribute('fill', fill);
            c.setAttribute('stroke', stroke);
            c.setAttribute('stroke-width', '1.5');
            g.appendChild(c);
        }

        function redraw() {
            engine.refreshZones();
            syncSvgSize();
            while (g.firstChild) g.removeChild(g.firstChild);

            var zones = engine.zones || [];
            for (var i = 0; i < zones.length; i++) {
                var el = zones[i];
                if (!el || !el.getBoundingClientRect) continue;
                var r = el.getBoundingClientRect();
                if (r.width === 0 && r.height === 0) continue;

                var left = r.left;
                var right = r.right;
                var top = r.top;
                var bottom = r.bottom;

                addCircle(left, top);
                addCircle(right, top);
                addCircle(left, bottom);
                addCircle(right, bottom);

                if (edgeMidpoints) {
                    addCircle((left + right) / 2, top);
                    addCircle((left + right) / 2, bottom);
                    addCircle(left, (top + bottom) / 2);
                    addCircle(right, (top + bottom) / 2);
                }
            }
        }

        var scheduled = false;
        function scheduleRedraw() {
            if (scheduled) return;
            scheduled = true;
            requestAnimationFrame(function () {
                scheduled = false;
                redraw();
            });
        }

        syncSvgSize();
        redraw();

        window.addEventListener('scroll', scheduleRedraw, true);
        window.addEventListener('resize', scheduleRedraw);

        return new ZoneDebugHandle(svg, scheduleRedraw, redraw);
    }
}

export { ZoneDebugOverlay };
