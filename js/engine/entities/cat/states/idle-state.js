'use strict';

import { CatState } from '../cat-state.js';
import { CatBehaviorState } from './cat-behavior-state.js';
import { clamp } from '../math.js';

class IdleState extends CatBehaviorState {
    constructor(cat) {
        super(CatState.Idle, 'Idle');
        this._cat = cat;
    }

    enter(ctx, payload) {
        if (!(payload && payload.resumeFromAir)) {
            this._cat._pickNextIdleDuration();
        }
    }

    updateLogic(ctx) {
        var c = this._cat;
        if (!ctx.grounded) return;
        c.vx *= Math.pow(0.88, ctx.dt * 60);
        if (c._stateTime >= c._idleUntil) {
            c._stateTime = 0;
            ctx.machine.changeState(ctx.machine.get(CatState.Walk), ctx);
        }
    }
}

export { IdleState };
