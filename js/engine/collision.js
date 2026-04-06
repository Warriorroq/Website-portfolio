'use strict';

function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
}

function entityRestitution(subsys, ent) {
    if (ent && typeof ent.collisionRestitution === 'number') return ent.collisionRestitution;
    return subsys.restitution;
}

function entityRestitutionVelThreshold(subsys, ent) {
    if (ent && typeof ent.collisionRestitutionVelocityThreshold === 'number') {
        return ent.collisionRestitutionVelocityThreshold;
    }
    return subsys.restitutionVelocityThreshold;
}

var _nextBodyId = 1;
function bodyId(body) {
    if (body._collisionBodyId == null) body._collisionBodyId = _nextBodyId++;
    return body._collisionBodyId;
}

var _nextDomStaticId = 1;
var _domStaticIds = typeof WeakMap === 'function' ? new WeakMap() : null;

function domStaticId(el) {
    if (!el) return _nextDomStaticId++;
    if (_domStaticIds) {
        var id = _domStaticIds.get(el);
        if (id == null) {
            id = _nextDomStaticId++;
            _domStaticIds.set(el, id);
        }
        return id;
    }
    if (el._collisionStaticId == null) el._collisionStaticId = _nextDomStaticId++;
    return el._collisionStaticId;
}

function pairKeyBodyBody(idA, idB) {
    return idA < idB ? 'b' + idA + ':b' + idB : 'b' + idB + ':b' + idA;
}

function pairKeyBodyZone(bodyId, zoneId) {
    return 'b' + bodyId + ':z' + zoneId;
}

function circleCirclePenetration(ax, ay, ar, bx, by, br) {
    var dx = bx - ax;
    var dy = by - ay;
    var dist = Math.sqrt(dx * dx + dy * dy);
    var minDist = ar + br;
    if (dist >= minDist || dist < 1e-8) return null;
    var pen = minDist - dist;
    var nx = dx / dist;
    var ny = dy / dist;
    return { nx: -nx, ny: -ny, pen: pen };
}

function rectRectOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function rectRectMinimumTranslation(ax, ay, aw, ah, bx, by, bw, bh) {
    var overlapX = Math.min(ax + aw, bx + bw) - Math.max(ax, bx);
    var overlapY = Math.min(ay + ah, by + bh) - Math.max(ay, by);
    if (overlapX <= 0 || overlapY <= 0) return null;
    var cxA = ax + aw * 0.5;
    var cyA = ay + ah * 0.5;
    var cxB = bx + bw * 0.5;
    var cyB = by + bh * 0.5;
    var eps = 0.5;
    var nx;
    var ny;
    var pen;
    if (overlapX < overlapY - eps) {
        nx = cxA < cxB ? -1 : 1;
        ny = 0;
        pen = overlapX;
    } else if (overlapY < overlapX - eps) {
        nx = 0;
        ny = cyA < cyB ? -1 : 1;
        pen = overlapY;
    } else {
        var dcx = Math.abs(cxA - cxB);
        var dcy = Math.abs(cyA - cyB);
        if (dcy >= dcx) {
            nx = 0;
            ny = cyA < cyB ? -1 : 1;
            pen = overlapY;
        } else {
            nx = cxA < cxB ? -1 : 1;
            ny = 0;
            pen = overlapX;
        }
    }
    return { nx: nx, ny: ny, pen: pen };
}

function resolveVelocityAlongNormal(e, nx, ny, rest, velThreshold) {
    var vn = (e.vx || 0) * nx + (e.vy || 0) * ny;
    if (vn < 0) {
        var r = rest;
        if (velThreshold != null && velThreshold > 0 && Math.abs(vn) < velThreshold) r = 0;
        e.vx = (e.vx || 0) - (1 + r) * vn * nx;
        e.vy = (e.vy || 0) - (1 + r) * vn * ny;
    }
}

function horizontalOverlap1D(ax, aw, bx, bw) {
    return Math.min(ax + aw, bx + bw) - Math.max(ax, bx);
}

function shapeFromEntity(ent) {
    if (typeof ent.getCollisionShape === 'function') {
        var s = ent.getCollisionShape();
        if (!s || !s.type) return null;
        if (s.type === 'circle') {
            return {
                type: 'circle',
                cx: s.x != null ? s.x : ent.x,
                cy: s.y != null ? s.y : ent.y,
                r: s.r != null ? s.r : s.radius
            };
        }
        if (s.type === 'rect') {
            return { type: 'rect', x: s.x, y: s.y, w: s.w, h: s.h };
        }
        return null;
    }
    if (ent.radius != null && ent.x != null && ent.y != null) {
        return { type: 'circle', cx: ent.x, cy: ent.y, r: ent.radius };
    }
    return null;
}

function raycastCircle(ox, oy, ux, uy, cx, cy, r) {
    var Lx = ox - cx;
    var Ly = oy - cy;
    var b = 2 * (Lx * ux + Ly * uy);
    var c = Lx * Lx + Ly * Ly - r * r;
    var disc = b * b - 4 * c;
    if (disc < 0) return null;
    var s = Math.sqrt(disc);
    var t1 = (-b - s) * 0.5;
    var t2 = (-b + s) * 0.5;
    var eps = 1e-9;
    var t;
    if (t1 >= eps) t = t1;
    else if (t2 >= eps) t = t2;
    else return null;
    var x = ox + ux * t;
    var y = oy + uy * t;
    var nx = (x - cx) / r;
    var ny = (y - cy) / r;
    return { t: t, x: x, y: y, nx: nx, ny: ny };
}

function raycastRect(ox, oy, ux, uy, x, y, w, h) {
    var minX = x;
    var minY = y;
    var maxX = x + w;
    var maxY = y + h;
    var eps = 1e-9;
    var inf = 1e30;

    var txEnter;
    var txExit;
    if (Math.abs(ux) < eps) {
        if (ox < minX || ox > maxX) return null;
        txEnter = -inf;
        txExit = inf;
    } else {
        var tx1 = (minX - ox) / ux;
        var tx2 = (maxX - ox) / ux;
        txEnter = tx1 < tx2 ? tx1 : tx2;
        txExit = tx1 < tx2 ? tx2 : tx1;
    }

    var tyEnter;
    var tyExit;
    if (Math.abs(uy) < eps) {
        if (oy < minY || oy > maxY) return null;
        tyEnter = -inf;
        tyExit = inf;
    } else {
        var ty1 = (minY - oy) / uy;
        var ty2 = (maxY - oy) / uy;
        tyEnter = ty1 < ty2 ? ty1 : ty2;
        tyExit = ty1 < ty2 ? ty2 : ty1;
    }

    var tEnter = txEnter > tyEnter ? txEnter : tyEnter;
    var tExit = txExit < tyExit ? txExit : tyExit;
    if (tEnter > tExit + eps) return null;
    if (tExit < -eps) return null;

    var t;
    if (tEnter >= eps) t = tEnter;
    else if (tExit >= eps) t = tExit;
    else return null;

    var px = ox + ux * t;
    var py = oy + uy * t;
    var nx = 0;
    var ny = 0;
    if (Math.abs(px - minX) < 1e-5) {
        nx = -1;
        ny = 0;
    } else if (Math.abs(px - maxX) < 1e-5) {
        nx = 1;
        ny = 0;
    } else if (Math.abs(py - minY) < 1e-5) {
        nx = 0;
        ny = -1;
    } else if (Math.abs(py - maxY) < 1e-5) {
        nx = 0;
        ny = 1;
    }
    return { t: t, x: px, y: py, nx: nx, ny: ny };
}

class CollisionZoneProxy {
    constructor(element) {
        this.collisionZone = true;
        this.element = element;
    }

    getCollisionShape() {
        if (!this.element || !this.element.getBoundingClientRect) return null;
        var rr = this.element.getBoundingClientRect();
        return { type: 'rect', x: rr.left, y: rr.top, w: rr.width, h: rr.height };
    }
}

class CollisionSubsystem {
    constructor(engine, opts) {
        opts = opts || {};
        this.engine = engine;
        this.gravity = opts.gravity != null ? opts.gravity : 1500;
        this.restitution = opts.restitution != null ? opts.restitution : 0.72;
        this.restitutionVelocityThreshold =
            opts.restitutionVelocityThreshold != null ? opts.restitutionVelocityThreshold : 120;
        this.pairRestitutionVelocityThreshold =
            opts.pairRestitutionVelocityThreshold != null ? opts.pairRestitutionVelocityThreshold : 35;
        this.sleepVelocityMax =
            opts.sleepVelocityMax != null ? opts.sleepVelocityMax : 72;
        this.bodyResolvePasses = opts.bodyResolvePasses != null ? opts.bodyResolvePasses : opts.circleResolvePasses != null ? opts.circleResolvePasses : 10;
        this._bodies = [];
        this._activeOverlapKeys = Object.create(null);
    }

    _applySleepingSupport(statics, bodies) {
        var n = bodies.length;
        if (n === 0) return;
        var grounded = new Array(n);
        var i;
        var j;
        var pass;
        var slack = 8;
        var sleepAbs = this.sleepVelocityMax > 0 ? this.sleepVelocityMax : 72;

        function rectGeom(ent) {
            var sh = shapeFromEntity(ent);
            if (!sh || sh.type !== 'rect') return null;
            var hw = sh.w * 0.5;
            var hh = sh.h * 0.5;
            return {
                ax: ent.x - hw,
                ay: ent.y - hh,
                w: sh.w,
                h: sh.h,
                top: ent.y - hh,
                bot: ent.y + hh,
            };
        }

        for (i = 0; i < n; i++) grounded[i] = false;

        for (i = 0; i < n; i++) {
            var entS = bodies[i];
            if (typeof entS.collisionSkip === 'function' && entS.collisionSkip()) continue;
            var gS = rectGeom(entS);
            if (!gS) continue;
            if (Math.abs(entS.vy || 0) > sleepAbs) continue;
            var sidx;
            for (sidx = 0; sidx < statics.length; sidx++) {
                var st = statics[sidx];
                if (horizontalOverlap1D(gS.ax, gS.w, st.x, st.w) < 0.5) continue;
                if (gS.bot >= st.y - 2 && gS.bot <= st.y + slack) {
                    grounded[i] = true;
                    entS.vy = 0;
                    break;
                }
            }
        }

        for (pass = 0; pass < n; pass++) {
            var changed = false;
            for (i = 0; i < n; i++) {
                if (grounded[i]) continue;
                var entA = bodies[i];
                if (typeof entA.collisionSkip === 'function' && entA.collisionSkip()) continue;
                var gA = rectGeom(entA);
                if (!gA) continue;
                if (Math.abs(entA.vy || 0) > sleepAbs) continue;
                for (j = 0; j < n; j++) {
                    if (!grounded[j]) continue;
                    var entB = bodies[j];
                    var gB = rectGeom(entB);
                    if (!gB) continue;
                    if (entA.y >= entB.y) continue;
                    if (horizontalOverlap1D(gA.ax, gA.w, gB.ax, gB.w) < 0.5) continue;
                    if (gA.bot < gB.top - 2 || gA.bot > gB.top + slack) continue;
                    grounded[i] = true;
                    entA.vy = 0;
                    changed = true;
                    break;
                }
            }
            if (!changed) break;
        }
    }

    register(body) {
        if (!body || this._bodies.indexOf(body) !== -1) return;
        this._bodies.push(body);
    }

    unregister(body) {
        if (!body) return;
        var i = this._bodies.indexOf(body);
        if (i !== -1) this._bodies.splice(i, 1);
        var bid = body._collisionBodyId;
        if (bid != null) this._purgePairsForBodyId(bid);
    }

    _purgePairsForBodyId(bid) {
        var keys = Object.keys(this._activeOverlapKeys);
        var tag = 'b' + bid;
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            var parts = key.split(':');
            for (var p = 0; p < parts.length; p++) {
                if (parts[p] === tag) {
                    delete this._activeOverlapKeys[key];
                    break;
                }
            }
        }
    }

    _staticRectsFromZones() {
        var engine = this.engine;
        if (!engine || !engine.zones) return [];
        var zones = engine.zones;
        var out = [];
        for (var i = 0; i < zones.length; i++) {
            var el = zones[i];
            if (!el || !el.getBoundingClientRect) continue;
            var r = el.getBoundingClientRect();
            if (r.width <= 0 && r.height <= 0) continue;
            out.push({
                kind: 'static',
                id: domStaticId(el),
                el: el,
                x: r.left,
                y: r.top,
                w: r.width,
                h: r.height
            });
        }
        return out;
    }

    _overlap(sa, sb) {
        if (sa.type === 'circle' && sb.type === 'circle') {
            var dx = sa.cx - sb.cx;
            var dy = sa.cy - sb.cy;
            var rr = sa.r + sb.r;
            return dx * dx + dy * dy < rr * rr;
        }
        if (sa.type === 'rect' && sb.type === 'rect') {
            return rectRectOverlap(sa.x, sa.y, sa.w, sa.h, sb.x, sb.y, sb.w, sb.h);
        }
        if (sa.type === 'circle' && sb.type === 'rect') {
            var dr = sa.r * 2;
            return rectRectOverlap(sa.cx - sa.r, sa.cy - sa.r, dr, dr, sb.x, sb.y, sb.w, sb.h);
        }
        if (sa.type === 'rect' && sb.type === 'circle') {
            var dr2 = sb.r * 2;
            return rectRectOverlap(sa.x, sa.y, sa.w, sa.h, sb.cx - sb.r, sb.cy - sb.r, dr2, dr2);
        }
        return false;
    }

    _emitNewOverlaps(pairsThisFrame) {
        var prev = this._activeOverlapKeys;
        var next = Object.create(null);
        for (var i = 0; i < pairsThisFrame.length; i++) {
            var p = pairsThisFrame[i];
            next[p.key] = true;
            if (!prev[p.key]) {
                var a = p.a;
                var b = p.b;
                var info = { other: b, pairKey: p.key };
                if (typeof a.onCollisionCreated === 'function') a.onCollisionCreated(b, info);
                var infoB = { other: a, pairKey: p.key };
                if (typeof b.onCollisionCreated === 'function') b.onCollisionCreated(a, infoB);
            }
        }
        this._activeOverlapKeys = next;
    }

    _integrateAndResolve(dt) {
        var bodies = this._bodies;
        var vw = document.documentElement.clientWidth;
        var vh = document.documentElement.clientHeight;
        var pairVelTh = this.pairRestitutionVelocityThreshold;
        var statics = this._staticRectsFromZones();
        var contactsPer = [];

        var i;
        for (i = 0; i < bodies.length; i++) {
            contactsPer[i] = null;
            var ent = bodies[i];
            if (typeof ent.collisionSkip === 'function' && ent.collisionSkip()) {
                ent.lastCollision = { dt: dt, contacts: [] };
                continue;
            }
            var sh = shapeFromEntity(ent);
            if (!sh || (sh.type !== 'circle' && sh.type !== 'rect')) continue;

            ent.vy = (ent.vy || 0) + this.gravity * dt;
            ent.x = ent.x + (ent.vx || 0) * dt;
            ent.y = ent.y + (ent.vy || 0) * dt;
            contactsPer[i] = [];
        }

        for (i = 0; i < bodies.length; i++) {
            if (!contactsPer[i]) continue;
            var entSnap = bodies[i];
            entSnap._preResolveVx = entSnap.vx || 0;
            entSnap._preResolveVy = entSnap.vy || 0;
        }

        for (i = 0; i < bodies.length; i++) {
            var buf = contactsPer[i];
            if (!buf) continue;
            var e = bodies[i];
            var shW = shapeFromEntity(e);
            if (!shW || (shW.type !== 'circle' && shW.type !== 'rect')) continue;

            var restE = entityRestitution(this, e);
            var velThE = entityRestitutionVelThreshold(this, e);

            if (shW.type === 'circle') {
                var r = shW.r;
                if (e.x < r) {
                    e.x = r;
                    if ((e.vx || 0) < 0) e.vx = -(e.vx) * restE;
                    buf.push({ kind: 'viewport', edge: 'left' });
                } else if (e.x > vw - r) {
                    e.x = vw - r;
                    if ((e.vx || 0) > 0) e.vx = -(e.vx) * restE;
                    buf.push({ kind: 'viewport', edge: 'right' });
                }
                if (e.y < r) {
                    e.y = r;
                    if ((e.vy || 0) < 0) e.vy = -(e.vy) * restE;
                    buf.push({ kind: 'viewport', edge: 'top' });
                } else if (e.y > vh - r) {
                    e.y = vh - r;
                    if ((e.vy || 0) > 0) e.vy = -(e.vy) * restE;
                    buf.push({ kind: 'viewport', edge: 'bottom' });
                }
                for (var s = 0; s < statics.length; s++) {
                    var box = statics[s];
                    var dCirc = r * 2;
                    var sepC = rectRectMinimumTranslation(e.x - r, e.y - r, dCirc, dCirc, box.x, box.y, box.w, box.h);
                    if (!sepC) continue;
                    e.x += sepC.nx * sepC.pen;
                    e.y += sepC.ny * sepC.pen;
                    resolveVelocityAlongNormal(e, sepC.nx, sepC.ny, restE, velThE);
                    buf.push({ kind: 'static', rect: box });
                }
            } else {
                var hw = shW.w * 0.5;
                var hh = shW.h * 0.5;
                if (e.x - hw < 0) {
                    e.x = hw;
                    if ((e.vx || 0) < 0) e.vx = -(e.vx) * restE;
                    buf.push({ kind: 'viewport', edge: 'left' });
                } else if (e.x + hw > vw) {
                    e.x = vw - hw;
                    if ((e.vx || 0) > 0) e.vx = -(e.vx) * restE;
                    buf.push({ kind: 'viewport', edge: 'right' });
                }
                if (e.y - hh < 0) {
                    e.y = hh;
                    if ((e.vy || 0) < 0) e.vy = -(e.vy) * restE;
                    buf.push({ kind: 'viewport', edge: 'top' });
                } else if (e.y + hh > vh) {
                    e.y = vh - hh;
                    if ((e.vy || 0) > 0) e.vy = -(e.vy) * restE;
                    buf.push({ kind: 'viewport', edge: 'bottom' });
                }
                for (var s2 = 0; s2 < statics.length; s2++) {
                    var box2 = statics[s2];
                    var ax = e.x - hw;
                    var ay = e.y - hh;
                    var sep = rectRectMinimumTranslation(ax, ay, shW.w, shW.h, box2.x, box2.y, box2.w, box2.h);
                    if (!sep) continue;
                    e.x += sep.nx * sep.pen;
                    e.y += sep.ny * sep.pen;
                    resolveVelocityAlongNormal(e, sep.nx, sep.ny, restE, velThE);
                    buf.push({ kind: 'static', rect: box2 });
                }
            }
        }

        var pairPasses = this.bodyResolvePasses;
        if (pairPasses < 1) pairPasses = 1;
        var pairImpulsed = Object.create(null);
        var pass;
        for (pass = 0; pass < pairPasses; pass++) {
            for (i = 0; i < bodies.length; i++) {
                var eA = bodies[i];
                if (!contactsPer[i]) continue;
                var shA = shapeFromEntity(eA);
                if (!shA || (shA.type !== 'circle' && shA.type !== 'rect')) continue;
                var j;
                for (j = i + 1; j < bodies.length; j++) {
                    if (!contactsPer[j]) continue;
                    var eB = bodies[j];
                    if (typeof eB.collisionSkip === 'function' && eB.collisionSkip()) continue;
                    var shB = shapeFromEntity(eB);
                    if (!shB || (shB.type !== 'circle' && shB.type !== 'rect')) continue;

                    var pen2 = null;
                    var bnx;
                    var bny;
                    if (shA.type === 'circle' && shB.type === 'circle') {
                        pen2 = circleCirclePenetration(eA.x, eA.y, shA.r, eB.x, eB.y, shB.r);
                        if (!pen2) continue;
                        bnx = pen2.nx;
                        bny = pen2.ny;
                    } else if (shA.type === 'rect' && shB.type === 'rect') {
                        pen2 = rectRectMinimumTranslation(
                            eA.x - shA.w * 0.5,
                            eA.y - shA.h * 0.5,
                            shA.w,
                            shA.h,
                            eB.x - shB.w * 0.5,
                            eB.y - shB.h * 0.5,
                            shB.w,
                            shB.h
                        );
                        if (!pen2) continue;
                        bnx = pen2.nx;
                        bny = pen2.ny;
                    } else if (shA.type === 'circle' && shB.type === 'rect') {
                        var ra = shA.r;
                        var da = ra * 2;
                        pen2 = rectRectMinimumTranslation(
                            eA.x - ra,
                            eA.y - ra,
                            da,
                            da,
                            eB.x - shB.w * 0.5,
                            eB.y - shB.h * 0.5,
                            shB.w,
                            shB.h
                        );
                        if (!pen2) continue;
                        bnx = pen2.nx;
                        bny = pen2.ny;
                    } else if (shA.type === 'rect' && shB.type === 'circle') {
                        var rb = shB.r;
                        var db = rb * 2;
                        pen2 = rectRectMinimumTranslation(
                            eA.x - shA.w * 0.5,
                            eA.y - shA.h * 0.5,
                            shA.w,
                            shA.h,
                            eB.x - rb,
                            eB.y - rb,
                            db,
                            db
                        );
                        if (!pen2) continue;
                        bnx = pen2.nx;
                        bny = pen2.ny;
                    } else {
                        continue;
                    }

                    var pkey = i + ',' + j;
                    if (!pairImpulsed[pkey]) {
                        var relvx = (eA.vx || 0) - (eB.vx || 0);
                        var relvy = (eA.vy || 0) - (eB.vy || 0);
                        var reln = relvx * bnx + relvy * bny;
                        if (reln < 0) {
                            pairImpulsed[pkey] = true;
                            var rA = entityRestitution(this, eA);
                            var rB = entityRestitution(this, eB);
                            var rEff = rA < rB ? rA : rB;
                            if (pairVelTh > 0 && Math.abs(reln) < pairVelTh) rEff = 0;
                            var imp = -(1 + rEff) * reln * 0.5;
                            eA.vx = (eA.vx || 0) + imp * bnx;
                            eA.vy = (eA.vy || 0) + imp * bny;
                            eB.vx = (eB.vx || 0) - imp * bnx;
                            eB.vy = (eB.vy || 0) - imp * bny;
                            contactsPer[i].push({ kind: 'body', other: eB });
                            contactsPer[j].push({ kind: 'body', other: eA });
                        }
                    }

                    if (shA.type === 'circle' && shB.type === 'circle') {
                        eA.x += pen2.nx * pen2.pen * 0.5;
                        eA.y += pen2.ny * pen2.pen * 0.5;
                        eB.x -= pen2.nx * pen2.pen * 0.5;
                        eB.y -= pen2.ny * pen2.pen * 0.5;
                    } else if (shA.type === 'rect' && shB.type === 'rect') {
                        eA.x += pen2.nx * pen2.pen * 0.5;
                        eA.y += pen2.ny * pen2.pen * 0.5;
                        eB.x -= pen2.nx * pen2.pen * 0.5;
                        eB.y -= pen2.ny * pen2.pen * 0.5;
                    } else if (shA.type === 'circle' && shB.type === 'rect') {
                        eA.x += pen2.nx * pen2.pen * 0.5;
                        eA.y += pen2.ny * pen2.pen * 0.5;
                        eB.x -= pen2.nx * pen2.pen * 0.5;
                        eB.y -= pen2.ny * pen2.pen * 0.5;
                    } else if (shA.type === 'rect' && shB.type === 'circle') {
                        eA.x += pen2.nx * pen2.pen * 0.5;
                        eA.y += pen2.ny * pen2.pen * 0.5;
                        eB.x -= pen2.nx * pen2.pen * 0.5;
                        eB.y -= pen2.ny * pen2.pen * 0.5;
                    }
                }
            }
        }

        for (i = 0; i < bodies.length; i++) {
            var bufP = contactsPer[i];
            if (!bufP) continue;
            var eP = bodies[i];
            var shP = shapeFromEntity(eP);
            if (!shP || (shP.type !== 'circle' && shP.type !== 'rect')) continue;

            if (shP.type === 'circle') {
                var rP = shP.r;
                if (eP.x < rP) eP.x = rP;
                else if (eP.x > vw - rP) eP.x = vw - rP;
                if (eP.y < rP) eP.y = rP;
                else if (eP.y > vh - rP) eP.y = vh - rP;
                for (var sp = 0; sp < statics.length; sp++) {
                    var boxP = statics[sp];
                    var dP = rP * 2;
                    var penPR = rectRectMinimumTranslation(eP.x - rP, eP.y - rP, dP, dP, boxP.x, boxP.y, boxP.w, boxP.h);
                    if (!penPR) continue;
                    eP.x += penPR.nx * penPR.pen;
                    eP.y += penPR.ny * penPR.pen;
                }
            } else {
                var hwP = shP.w * 0.5;
                var hhP = shP.h * 0.5;
                if (eP.x - hwP < 0) eP.x = hwP;
                else if (eP.x + hwP > vw) eP.x = vw - hwP;
                if (eP.y - hhP < 0) eP.y = hhP;
                else if (eP.y + hhP > vh) eP.y = vh - hhP;
                for (var sp2 = 0; sp2 < statics.length; sp2++) {
                    var boxP2 = statics[sp2];
                    var axP = eP.x - hwP;
                    var ayP = eP.y - hhP;
                    var penR = rectRectMinimumTranslation(axP, ayP, shP.w, shP.h, boxP2.x, boxP2.y, boxP2.w, boxP2.h);
                    if (!penR) continue;
                    eP.x += penR.nx * penR.pen;
                    eP.y += penR.ny * penR.pen;
                }
            }
        }

        this._applySleepingSupport(statics, bodies);

        for (i = 0; i < bodies.length; i++) {
            var entF = bodies[i];
            if (contactsPer[i]) entF.lastCollision = { dt: dt, contacts: contactsPer[i].slice() };
        }
    }

    _overlapShapeWorld(ent, s) {
        if (!s) return null;
        if (s.type === 'circle') {
            return {
                type: 'circle',
                cx: s.cx != null ? s.cx : ent.x,
                cy: s.cy != null ? s.cy : ent.y,
                r: s.r
            };
        }
        return { type: 'rect', x: s.x, y: s.y, w: s.w, h: s.h };
    }

    _collectOverlapPairs() {
        var pairs = [];
        var bodies = this._bodies;
        var statics = this._staticRectsFromZones();

        for (var i = 0; i < bodies.length; i++) {
            var a = bodies[i];
            var sa = shapeFromEntity(a);
            if (!sa) continue;
            var idA = bodyId(a);
            var saW = this._overlapShapeWorld(a, sa);

            for (var j = i + 1; j < bodies.length; j++) {
                var b = bodies[j];
                var sb = shapeFromEntity(b);
                if (!sb) continue;
                var sbW = this._overlapShapeWorld(b, sb);
                if (this._overlap(saW, sbW)) {
                    pairs.push({ key: pairKeyBodyBody(idA, bodyId(b)), a: a, b: b });
                }
            }

            for (var s = 0; s < statics.length; s++) {
                var st = statics[s];
                var sr = { type: 'rect', x: st.x, y: st.y, w: st.w, h: st.h };
                if (this._overlap(saW, sr)) {
                    var el = st.el;
                    if (!el._collisionZoneProxy) {
                        el._collisionZoneProxy = new CollisionZoneProxy(el);
                    }
                    var zp = el._collisionZoneProxy;
                    pairs.push({ key: pairKeyBodyZone(idA, st.id), a: a, b: zp });
                }
            }
        }

        return pairs;
    }

    raycast(ox, oy, dirX, dirY, opts) {
        opts = opts || {};
        var maxDist = opts.maxDistance != null ? opts.maxDistance : Infinity;
        var ignore = opts.ignore;
        var includeBodies = opts.includeBodies !== false;
        var includeStatics = opts.includeStatics !== false;

        var len = Math.hypot(dirX, dirY);
        if (len < 1e-12) return null;
        var ux = dirX / len;
        var uy = dirY / len;

        var best = null;
        var bestT = Infinity;
        var tol = 1e-9;

        function consider(hit, meta) {
            if (!hit || hit.t < -tol || hit.t > maxDist + tol) return;
            if (hit.t < bestT - tol) {
                bestT = hit.t;
                best = {
                    t: hit.t,
                    x: hit.x,
                    y: hit.y,
                    nx: hit.nx,
                    ny: hit.ny,
                    kind: meta.kind,
                    entity: meta.entity,
                    staticRect: meta.staticRect,
                };
            }
        }

        if (includeStatics) {
            var statics = this._staticRectsFromZones();
            for (var s = 0; s < statics.length; s++) {
                var st = statics[s];
                var hr = raycastRect(ox, oy, ux, uy, st.x, st.y, st.w, st.h);
                consider(hr, { kind: 'static', staticRect: st, entity: undefined });
            }
        }

        if (includeBodies) {
            var bodies = this._bodies;
            for (var i = 0; i < bodies.length; i++) {
                var ent = bodies[i];
                if (ignore != null && ent === ignore) continue;
                if (typeof ent.collisionSkip === 'function' && ent.collisionSkip()) continue;
                var sh = shapeFromEntity(ent);
                if (!sh) continue;
                var shW = this._overlapShapeWorld(ent, sh);
                if (!shW) continue;
                if (shW.type === 'circle') {
                    var hc = raycastCircle(ox, oy, ux, uy, shW.cx, shW.cy, shW.r);
                    consider(hc, { kind: 'body', entity: ent, staticRect: undefined });
                } else if (shW.type === 'rect') {
                    var hr2 = raycastRect(ox, oy, ux, uy, shW.x, shW.y, shW.w, shW.h);
                    consider(hr2, { kind: 'body', entity: ent, staticRect: undefined });
                }
            }
        }

        return best;
    }

    raycastPoint(ox, oy, dirX, dirY, opts) {
        var h = this.raycast(ox, oy, dirX, dirY, opts);
        if (!h) return null;
        return { x: h.x, y: h.y, t: h.t };
    }

    update(dt) {
        this._integrateAndResolve(dt);
        var pairs = this._collectOverlapPairs();
        this._emitNewOverlaps(pairs);
    }
}

export { CollisionSubsystem };
