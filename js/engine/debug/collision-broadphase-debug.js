'use strict';

class CollisionBroadphaseDebugHandle {
    constructor(opts) {
        this._opts = opts;
    }

    destroy() {
        if (this._opts.onKeyDown) window.removeEventListener('keydown', this._opts.onKeyDown);
        if (this._opts.raf) cancelAnimationFrame(this._opts.raf);
        this._opts.raf = 0;
        if (this._opts.gridWrap && this._opts.gridWrap.parentNode) this._opts.gridWrap.parentNode.removeChild(this._opts.gridWrap);
        this._opts.gridWrap = null;
        if (this._opts.createdHud && this._opts.hudEl && this._opts.hudEl.parentNode) {
            this._opts.hudEl.parentNode.removeChild(this._opts.hudEl);
        }
        this._opts.hudEl = null;
    }
}

function safeText(v) {
    return v == null ? '—' : String(v);
}

class CollisionBroadphaseDebugOverlay {
    static attach(engine, options) {
        options = options || {};
        var zIndex = options.zIndex != null ? options.zIndex : 2147483644;
        var maxCellsDrawn = options.maxCellsDrawn != null ? options.maxCellsDrawn : 400;
        var hudTargetId = options.hudTargetId != null ? options.hudTargetId : 'perf-hud';
        var toggleKey = options.toggleKey != null ? options.toggleKey : 'KeyH';
        var drawGrid = options.drawGrid === true;

        if (!engine || !engine.collision) {
            throw new Error('CollisionBroadphaseDebugOverlay.attach: expected Engine with collision');
        }

        var hudEl = document.getElementById(hudTargetId);
        var createdHud = false;
        if (!hudEl) {
            hudEl = document.createElement('div');
            hudEl.setAttribute('aria-hidden', 'true');
            hudEl.style.cssText =
                'position:fixed;left:12px;bottom:12px;padding:8px 10px;border-radius:10px;' +
                'font:600 12px/1.25 system-ui,Segoe UI,sans-serif;color:rgba(255,255,255,0.92);' +
                'background:rgba(0,0,0,0.6);border:1px solid rgba(255,255,255,0.12);' +
                'z-index:' +
                zIndex +
                ';pointer-events:none;';
            document.body.appendChild(hudEl);
            createdHud = true;
        }

        var gridWrap = null;
        function ensureGridWrap() {
            if (gridWrap) return gridWrap;
            var el = document.createElement('div');
            el.setAttribute('aria-hidden', 'true');
            el.style.cssText =
                'position:fixed;left:0;top:0;width:100vw;height:100vh;pointer-events:none;' +
                'z-index:' +
                zIndex +
                ';contain:layout style paint;';
            document.body.appendChild(el);
            gridWrap = el;
            return el;
        }

        var raf = 0;
        var lastT = performance.now();
        var fpsEMA = 60;
        var lastGridDrawT = 0;

        function updateHudAndGrid() {
            raf = requestAnimationFrame(updateHudAndGrid);

            var now = performance.now();
            var dt = now - lastT;
            if (dt > 0) {
                var fps = 1000 / dt;
                fpsEMA = fpsEMA * 0.9 + fps * 0.1;
            }
            lastT = now;

            var entityCount = engine && engine.entities ? engine.entities.length : 0;
            var bodyCount = engine && engine.collision && engine.collision._bodies ? engine.collision._bodies.length : 0;
            var pairApprox = bodyCount > 1 ? (bodyCount * (bodyCount - 1)) / 2 : 0;

            var bp = engine && engine.collision ? engine.collision.lastBroadphase : null;
            var bpTxt = '';
            if (bp && bp.cellSize) {
                var avg = bp.cellsUsed > 0 ? bp.inserts / bp.cellsUsed : 0;
                bpTxt =
                    ' | Hash[' +
                    safeText(bp.phase) +
                    '] cs=' +
                    safeText(bp.cellSize) +
                    ' cells=' +
                    safeText(bp.cellsUsed) +
                    ' ins=' +
                    safeText(bp.inserts) +
                    ' avg=' +
                    avg.toFixed(2) +
                    ' max=' +
                    safeText(bp.maxBucketSize) +
                    ' cand=' +
                    safeText(bp.candidatePairs);
            }

            hudEl.textContent =
                'FPS: ' +
                fpsEMA.toFixed(0) +
                ' | Entities: ' +
                entityCount +
                ' | Bodies: ' +
                bodyCount +
                ' | Pairs (naive): ' +
                Math.round(pairApprox) +
                bpTxt +
                (drawGrid ? ' | Grid: ON (' + (toggleKey === 'KeyH' ? 'H' : toggleKey) + ' toggles)' : '');

            if (!drawGrid) return;
            if (!engine || !engine.collision || !engine.collision._broadphaseScratch) return;
            if (now - lastGridDrawT < 120) return;
            lastGridDrawT = now;

            var scratch = engine.collision._broadphaseScratch;
            var keys = scratch.keys;
            var stats = scratch.stats;
            if (!keys || !stats) return;
            var cellSize = stats.cellSize || engine.collision.broadphaseCellSize || 128;

            var wrap = ensureGridWrap();
            wrap.textContent = '';

            var cap = maxCellsDrawn;
            var count = keys.length < cap ? keys.length : cap;
            var frag = document.createDocumentFragment();
            for (var i = 0; i < count; i++) {
                var key = keys[i];
                var parts = key.split(',');
                if (parts.length !== 2) continue;
                var cx = +parts[0];
                var cy = +parts[1];
                if (!isFinite(cx) || !isFinite(cy)) continue;
                var x = cx * cellSize;
                var y = cy * cellSize;
                var d = document.createElement('div');
                d.style.cssText =
                    'position:absolute;left:' +
                    x +
                    'px;top:' +
                    y +
                    'px;width:' +
                    cellSize +
                    'px;height:' +
                    cellSize +
                    'px;box-sizing:border-box;border:1px dashed rgba(255,0,180,0.35);' +
                    'background:rgba(255,0,180,0.035);';
                frag.appendChild(d);
            }
            wrap.appendChild(frag);
        }

        function onKeyDown(e) {
            if (e.code !== toggleKey) return;
            var t = e.target;
            if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
            e.preventDefault();
            drawGrid = !drawGrid;
            if (!drawGrid && gridWrap) gridWrap.textContent = '';
        }

        if (options.enableToggle !== false) window.addEventListener('keydown', onKeyDown);

        updateHudAndGrid();

        return new CollisionBroadphaseDebugHandle({
            raf: raf,
            hudEl: hudEl,
            createdHud: createdHud,
            gridWrap: gridWrap,
            onKeyDown: options.enableToggle !== false ? onKeyDown : null,
        });
    }
}

export { CollisionBroadphaseDebugOverlay };

