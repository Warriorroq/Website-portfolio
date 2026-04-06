'use strict';

class CatStateMachine {
    constructor(cat, instancesById) {
        this._cat = cat;
        this._instances = instancesById;
        this._current = null;
        this.debug = false;
    }

    get current() {
        return this._current;
    }

    get currentId() {
        return this._current ? this._current.id : null;
    }

    get(id) {
        return this._instances[id] || null;
    }

    isCurrentId(id) {
        return this._current != null && this._current.id === id;
    }

    isCurrent(ctor) {
        return this._current != null && this._current instanceof ctor;
    }

    start(initialId, ctx) {
        var s = this.get(initialId);
        if (!s) return false;
        this._current = s;
        this._cat._syncStateId(s.id);
        var c = ctx || this._cat._emptyFrameCtx();
        s.enter(c, null);
        this._cat.events.emit('stateChange', {
            from: null,
            to: s.id,
            prevState: null,
            nextState: s,
        });
        if (this.debug) console.log('[CatSM] start', s.name);
        return true;
    }

    changeState(next, ctx, payload) {
        if (!next) return false;
        if (!next.isPossibleToEnter(ctx, payload)) return false;
        var prev = this._current;
        if (prev) prev.exit(ctx, next);
        this._current = next;
        this._cat._syncStateId(next.id);
        next.enter(ctx, payload);
        this._cat.events.emit('stateChange', {
            from: prev ? prev.id : null,
            to: next.id,
            prevState: prev,
            nextState: next,
        });
        if (this.debug) console.log('[CatSM]', prev && prev.name, '->', next.name);
        return true;
    }
}

export { CatStateMachine };
