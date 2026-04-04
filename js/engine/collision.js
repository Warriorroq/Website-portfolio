(function (global) {
    'use strict';

    function clamp(v, a, b) {
        return v < a ? a : v > b ? b : v;
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

    function circleRectPenetration(cx, cy, rad, rx, ry, rw, rh) {
        var nx = clamp(cx, rx, rx + rw);
        var ny = clamp(cy, ry, ry + rh);
        var dx = cx - nx;
        var dy = cy - ny;
        var d2 = dx * dx + dy * dy;
        if (d2 >= rad * rad) return null;
        var dist = Math.sqrt(d2);
        var pen = rad - dist;
        if (dist < 1e-6) {
            var cx2 = rx + rw * 0.5;
            var cy2 = ry + rh * 0.5;
            dx = cx - cx2;
            dy = cy - cy2;
            var L = Math.sqrt(dx * dx + dy * dy) || 1;
            dx /= L;
            dy /= L;
            return { nx: dx, ny: dy, pen: pen };
        }
        return { nx: dx / dist, ny: dy / dist, pen: pen };
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

    function CollisionSubsystem(engine, opts) {
        opts = opts || {};
        this.engine = engine;
        this.gravity = opts.gravity != null ? opts.gravity : 1500;
        this.restitution = opts.restitution != null ? opts.restitution : 0.72;
        this._bodies = [];
        this._activeOverlapKeys = Object.create(null);
    }

    CollisionSubsystem.prototype.register = function (body) {
        if (!body || this._bodies.indexOf(body) !== -1) return;
        this._bodies.push(body);
    };

    CollisionSubsystem.prototype.unregister = function (body) {
        if (!body) return;
        var i = this._bodies.indexOf(body);
        if (i !== -1) this._bodies.splice(i, 1);
        var bid = body._collisionBodyId;
        if (bid != null) this._purgePairsForBodyId(bid);
    };

    CollisionSubsystem.prototype._purgePairsForBodyId = function (bid) {
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
    };

    CollisionSubsystem.prototype._staticRectsFromZones = function () {
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
    };

    CollisionSubsystem.prototype._overlap = function (sa, sb) {
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
            var p = circleRectPenetration(sa.cx, sa.cy, sa.r, sb.x, sb.y, sb.w, sb.h);
            return p != null;
        }
        if (sa.type === 'rect' && sb.type === 'circle') {
            var p2 = circleRectPenetration(sb.cx, sb.cy, sb.r, sa.x, sa.y, sa.w, sa.h);
            return p2 != null;
        }
        return false;
    };

    CollisionSubsystem.prototype._emitNewOverlaps = function (pairsThisFrame) {
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
    };

    CollisionSubsystem.prototype._integrateAndResolve = function (dt) {
        var bodies = this._bodies;
        var vw = document.documentElement.clientWidth;
        var vh = document.documentElement.clientHeight;
        var rest = this.restitution;
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
            if (!sh || sh.type !== 'circle') continue;

            ent.vy = (ent.vy || 0) + this.gravity * dt;
            ent.x = ent.x + (ent.vx || 0) * dt;
            ent.y = ent.y + (ent.vy || 0) * dt;
            contactsPer[i] = [];
        }

        for (i = 0; i < bodies.length; i++) {
            var buf = contactsPer[i];
            if (!buf) continue;
            var e = bodies[i];
            var shW = shapeFromEntity(e);
            var r = shW.r;

            if (e.x < r) {
                e.x = r;
                if ((e.vx || 0) < 0) e.vx = -(e.vx) * rest;
                buf.push({ kind: 'viewport', edge: 'left' });
            } else if (e.x > vw - r) {
                e.x = vw - r;
                if ((e.vx || 0) > 0) e.vx = -(e.vx) * rest;
                buf.push({ kind: 'viewport', edge: 'right' });
            }
            if (e.y < r) {
                e.y = r;
                if ((e.vy || 0) < 0) e.vy = -(e.vy) * rest;
                buf.push({ kind: 'viewport', edge: 'top' });
            } else if (e.y > vh - r) {
                e.y = vh - r;
                if ((e.vy || 0) > 0) e.vy = -(e.vy) * rest;
                buf.push({ kind: 'viewport', edge: 'bottom' });
            }

            for (var s = 0; s < statics.length; s++) {
                var box = statics[s];
                var pen = circleRectPenetration(e.x, e.y, r, box.x, box.y, box.w, box.h);
                if (!pen) continue;
                e.x += pen.nx * pen.pen;
                e.y += pen.ny * pen.pen;
                var vn = (e.vx || 0) * pen.nx + (e.vy || 0) * pen.ny;
                if (vn < 0) {
                    e.vx = (e.vx || 0) - (1 + rest) * vn * pen.nx;
                    e.vy = (e.vy || 0) - (1 + rest) * vn * pen.ny;
                }
                buf.push({ kind: 'static', rect: box });
            }
        }

        for (i = 0; i < bodies.length; i++) {
            var eA = bodies[i];
            if (!contactsPer[i]) continue;
            var shA = shapeFromEntity(eA);
            if (!shA || shA.type !== 'circle') continue;
            var rA = shA.r;
            var j;
            for (j = i + 1; j < bodies.length; j++) {
                if (!contactsPer[j]) continue;
                var eB = bodies[j];
                if (typeof eB.collisionSkip === 'function' && eB.collisionSkip()) continue;
                var shB = shapeFromEntity(eB);
                if (!shB || shB.type !== 'circle') continue;
                var rB = shB.r;
                var pen2 = circleCirclePenetration(eA.x, eA.y, rA, eB.x, eB.y, rB);
                if (!pen2) continue;
                eA.x += pen2.nx * pen2.pen * 0.5;
                eA.y += pen2.ny * pen2.pen * 0.5;
                eB.x -= pen2.nx * pen2.pen * 0.5;
                eB.y -= pen2.ny * pen2.pen * 0.5;
                var vnx = pen2.nx;
                var vny = pen2.ny;
                var relvx = (eA.vx || 0) - (eB.vx || 0);
                var relvy = (eA.vy || 0) - (eB.vy || 0);
                var reln = relvx * vnx + relvy * vny;
                if (reln < 0) {
                    var imp = -(1 + rest) * reln * 0.5;
                    eA.vx = (eA.vx || 0) + imp * vnx;
                    eA.vy = (eA.vy || 0) + imp * vny;
                    eB.vx = (eB.vx || 0) - imp * vnx;
                    eB.vy = (eB.vy || 0) - imp * vny;
                }
                contactsPer[i].push({ kind: 'body', other: eB });
                contactsPer[j].push({ kind: 'body', other: eA });
            }
        }

        for (i = 0; i < bodies.length; i++) {
            var entF = bodies[i];
            if (contactsPer[i]) entF.lastCollision = { dt: dt, contacts: contactsPer[i].slice() };
        }
    };

    CollisionSubsystem.prototype._overlapShapeWorld = function (ent, s) {
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
    };

    CollisionSubsystem.prototype._collectOverlapPairs = function () {
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
                        el._collisionZoneProxy = {
                            collisionZone: true,
                            element: el,
                            getCollisionShape: function () {
                                if (!this.element || !this.element.getBoundingClientRect) return null;
                                var rr = this.element.getBoundingClientRect();
                                return { type: 'rect', x: rr.left, y: rr.top, w: rr.width, h: rr.height };
                            }
                        };
                    }
                    var zp = el._collisionZoneProxy;
                    pairs.push({ key: pairKeyBodyZone(idA, st.id), a: a, b: zp });
                }
            }
        }

        return pairs;
    };

    CollisionSubsystem.prototype.update = function (dt) {
        this._integrateAndResolve(dt);
        var pairs = this._collectOverlapPairs();
        this._emitNewOverlaps(pairs);
    };

    global.CollisionSubsystem = CollisionSubsystem;
})(typeof window !== 'undefined' ? window : this);
