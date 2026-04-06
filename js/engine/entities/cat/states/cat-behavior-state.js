'use strict';

class CatBehaviorState {
    constructor(id, name) {
        this.id = id;
        this.name = name != null ? name : String(id);
    }

    isPossibleToEnter(ctx, payload) {
        return true;
    }

    enter(ctx, payload) {}

    exit(ctx, nextState) {}

    updateLogic(ctx) {}

    updateLate(ctx) {}

    updateAnimator(ctx) {}
}

export { CatBehaviorState };
