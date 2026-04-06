'use strict';

import { CatBehaviorState } from './cat-behavior-state.js';
import { CatState } from '../cat-state.js';

class GrabbedState extends CatBehaviorState {
    constructor(cat) {
        super(CatState.Grabbed, 'Grabbed');
        this._cat = cat;
    }

    enter(ctx, payload) {
        this._cat._stateTime = 0;
    }

    updateLogic(ctx) {}

    updateLate(ctx) {}
}

export { GrabbedState };
