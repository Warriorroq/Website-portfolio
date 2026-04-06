'use strict';

import { CatState } from '../cat-state.js';
import { CatBehaviorState } from './cat-behavior-state.js';
import { clamp } from '../math.js';

class WalkState extends CatBehaviorState {
    constructor(cat) {
        super(CatState.Walk, 'Walk');
        this._cat = cat;
    }

    enter(ctx, payload) {
        this._cat._stateTime = 0;
        if (!(payload && (payload.resumeFromAir || payload.resumeFromGrab))) {
            this._cat._pickWalkDuration();
        }
    }

    updateLogic(ctx) {
        var c = this._cat;
        if (ctx.grounded) {
            var target = c._walkDir * c.walkSpeed;
            var k = 1 - Math.pow(0.001, ctx.dt * 60);
            c.vx += (target - c.vx) * clamp(k * 8, 0, 1);
        }
        var wn = c._wallNormalFromContacts(ctx.contacts);
        if (wn.nx !== 0 && c._walkDir * wn.nx < 0) {
            c._walkDir = -c._walkDir;
        }
        if (c._stateTime >= c._walkUntil) {
            c._stateTime = 0;
            ctx.machine.changeState(ctx.machine.get(CatState.Idle), ctx);
        }
    }
}

export { WalkState };
