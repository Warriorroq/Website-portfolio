'use strict';

import { CatBehaviorState } from './cat-behavior-state.js';
import { CatState } from '../cat-state.js';

class InAirState extends CatBehaviorState {
    constructor(cat) {
        super(CatState.InAir, 'InAir');
        this._cat = cat;
    }

    enter(ctx, payload) {
        this._cat._stateTime = 0;
    }

    updateLogic(ctx) {}
}

export { InAirState };
