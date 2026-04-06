'use strict';

import { CatBehaviorState } from './cat-behavior-state.js';
import { CatState } from '../cat-state.js';

class LieState extends CatBehaviorState {
    constructor(cat) {
        super(CatState.Lie, 'Lie');
        this._cat = cat;
    }

    enter(ctx, payload) {
        this._cat._stateTime = 0;
    }

    updateLogic(ctx) {
        var c = this._cat;
        if (ctx.grounded) {
            c.vx *= Math.pow(0.72, ctx.dt * 60);
            c.vy = 0;
        }
    }
}

export { LieState };
