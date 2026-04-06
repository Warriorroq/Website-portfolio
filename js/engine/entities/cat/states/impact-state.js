'use strict';

import { CatBehaviorState } from './cat-behavior-state.js';
import { CatState } from '../cat-state.js';

class ImpactState extends CatBehaviorState {
    constructor(cat) {
        super(CatState.Impact, 'Impact');
        this._cat = cat;
    }

    isPossibleToEnter(ctx, payload) {
        var c = this._cat;
        if (c._impactCooldown > 0) return false;
        var cur = ctx.machine.currentId;
        if (cur === CatState.Grabbed || cur === CatState.Impact) return false;
        return true;
    }

    enter(ctx, payload) {
        var c = this._cat;
        c._stateTime = 0;
        c._impactCooldown = 0.35;
        if (payload) {
            if (payload.resumeId != null) c._impactResumeKey = payload.resumeId;
            if (payload.until != null) c._impactUntil = payload.until;
            if (payload.squash) c._impactSquash = payload.squash;
        }
        c._applyHeadVisual();
    }

    exit(ctx, nextState) {}

    updateLogic(ctx) {
        var c = this._cat;
        if (c._stateTime >= c._impactUntil) {
            var key = c._impactResumeKey;
            c._stateTime = 0;
            var next = null;
            if (key === CatState.Lie) next = ctx.machine.get(CatState.Lie);
            else if (key === CatState.InAir) next = ctx.machine.get(CatState.InAir);
            else if (key === CatState.Walk) next = ctx.machine.get(CatState.Walk);
            else {
                next = ctx.machine.get(CatState.Idle);
            }
            if (next) ctx.machine.changeState(next, ctx);
        }
    }
}

function resolveImpactResumeKey(cat, currentId) {
    if (currentId === CatState.Lie) return CatState.Lie;
    if (currentId === CatState.InAir) return CatState.InAir;
    if (currentId === CatState.Walk) return CatState.Walk;
    return CatState.Idle;
}

function tryCatImpact(cat, ctx, machine) {
    if (cat._impactCooldown > 0) return false;
    var cur = machine.currentId;
    if (cur === CatState.Grabbed || cur === CatState.Impact) return false;

    var preVx = cat._preResolveVx != null ? cat._preResolveVx : cat.vx;
    var preVy = cat._preResolveVy != null ? cat._preResolveVy : cat.vy;

    var floorHit = false;
    var wallHit = false;
    var hardVertical = preVy > cat.impactSpeedFloor * 0.22 || preVy < -cat.impactSpeedFloor * 0.2;
    var hardHorizontal = Math.abs(preVx) > cat.impactSpeedWall * 0.22;
    var contacts = ctx.contacts;
    var i;
    for (i = 0; i < contacts.length; i++) {
        var c = contacts[i];
        if (c.kind === 'viewport') {
            if (c.edge === 'bottom' && hardVertical) floorHit = true;
            if ((c.edge === 'left' || c.edge === 'right') && hardHorizontal) wallHit = true;
        }
        if (c.kind === 'static' && c.rect) {
            var r = c.rect;
            var hh = cat._halfH();
            var hw = cat._halfW();
            var bot = cat.y + hh;
            var onTop = bot >= r.y - 4 && bot <= r.y + 14 && cat.x + hw > r.x && cat.x - hw < r.x + r.w;
            if (onTop && hardVertical) floorHit = true;
            var leftWall =
                cat.x + hw >= r.x - 3 &&
                cat.x + hw <= r.x + 10 &&
                cat.y + hh > r.y + 6 &&
                cat.y - hh < r.y + r.h - 6;
            var rightWall =
                cat.x - hw <= r.x + r.w + 3 &&
                cat.x - hw >= r.x + r.w - 10 &&
                cat.y + hh > r.y + 6 &&
                cat.y - hh < r.y + r.h - 6;
            if ((leftWall || rightWall) && hardHorizontal) wallHit = true;
        }
    }

    if (!floorHit && !wallHit) return false;
    if (cur === CatState.Walk && wallHit && !floorHit) return false;

    var resumeId = resolveImpactResumeKey(cat, cur);
    var squash;
    if (floorHit && !wallHit) squash = { sx: 1.08, sy: 0.82 };
    else if (wallHit && !floorHit) squash = { sx: 0.82, sy: 1.06 };
    else squash = { sx: 0.92, sy: 0.92 };

    var kind = floorHit && wallHit ? 'both' : floorHit ? 'floor' : 'wall';
    var ok = machine.changeState(machine.get(CatState.Impact), ctx, {
        resumeId: resumeId,
        until: 0.18 + Math.random() * 0.1,
        squash: squash,
    });
    if (ok) {
        cat.events.emit('impact', { kind: kind, floorHit: floorHit, wallHit: wallHit, resumeId: resumeId });
    }
    return ok;
}

export { ImpactState, tryCatImpact };
