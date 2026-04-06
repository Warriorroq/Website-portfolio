'use strict';

var WrapMode = { Loop: 0, PingPong: 1, Once: 2 };

class AnimationClip {
    constructor(opts) {
        opts = opts || {};
        this.name = opts.name != null ? String(opts.name) : '';
        this.speed = opts.speed != null ? opts.speed : 10;
        this.spritesheet = opts.spritesheet || null;
        this.frameIndices = opts.frameIndices ? opts.frameIndices.slice() : null;
        this.wrapMode = opts.wrapMode != null ? opts.wrapMode : WrapMode.Loop;
    }

    getClipFrameCount() {
        if (this.frameIndices) return this.frameIndices.length;
        if (this.spritesheet) return this.spritesheet.frameCount;
        return 0;
    }

    get duration() {
        var n = this.getClipFrameCount();
        var s = this.speed;
        if (n <= 0 || s <= 0) return 0;
        return n / s;
    }

    getSheetFrameIndex(clipFrameIndex) {
        var i = clipFrameIndex | 0;
        if (this.frameIndices) {
            if (i < 0 || i >= this.frameIndices.length) return -1;
            return this.frameIndices[i];
        }
        if (this.spritesheet) {
            if (i < 0 || i >= this.spritesheet.frameCount) return -1;
            return i;
        }
        return -1;
    }
}

export { AnimationClip, WrapMode };
