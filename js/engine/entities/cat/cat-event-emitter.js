'use strict';

class CatEventEmitter {
    constructor() {
        this._listeners = Object.create(null);
    }

    on(name, fn) {
        if (!name || typeof fn !== 'function') return function () {};
        if (!this._listeners[name]) this._listeners[name] = [];
        this._listeners[name].push(fn);
        var self = this;
        return function unsubscribe() {
            self.off(name, fn);
        };
    }

    off(name, fn) {
        var a = this._listeners[name];
        if (!a) return;
        var i = a.indexOf(fn);
        if (i !== -1) a.splice(i, 1);
    }

    once(name, fn) {
        var self = this;
        var wrapped = function (payload) {
            self.off(name, wrapped);
            fn(payload);
        };
        return this.on(name, wrapped);
    }

    emit(name, payload) {
        var a = this._listeners[name];
        if (!a || a.length === 0) return;
        var copy = a.slice();
        for (var i = 0; i < copy.length; i++) copy[i](payload);
    }
}

export { CatEventEmitter };
