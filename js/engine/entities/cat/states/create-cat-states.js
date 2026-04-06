'use strict';

import { IdleState } from './idle-state.js';
import { WalkState } from './walk-state.js';
import { LieState } from './lie-state.js';
import { InAirState } from './in-air-state.js';
import { GrabbedState } from './grabbed-state.js';
import { ImpactState } from './impact-state.js';
import { CatState } from '../cat-state.js';

function createCatStateInstances(cat) {
    var o = Object.create(null);
    o[CatState.Idle] = new IdleState(cat);
    o[CatState.Walk] = new WalkState(cat);
    o[CatState.Lie] = new LieState(cat);
    o[CatState.InAir] = new InAirState(cat);
    o[CatState.Grabbed] = new GrabbedState(cat);
    o[CatState.Impact] = new ImpactState(cat);
    return o;
}

export { createCatStateInstances };
