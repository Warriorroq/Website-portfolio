'use strict';

import { WrapMode } from './animation-clip.js';

function mod(a, n) {
    return ((a % n) + n) % n;
}

function clipFrameIndexAtTime(clip, time) {
    var n = clip.getClipFrameCount();
    if (n <= 0) return -1;
    var raw = time * clip.speed;
    var f = Math.floor(raw);
    var wm = clip.wrapMode;

    if (wm === WrapMode.Once) {
        if (f < 0) return 0;
        return f >= n ? n - 1 : f;
    }

    if (n === 1) return 0;

    if (wm === WrapMode.PingPong) {
        var cycle = (n - 1) * 2;
        var pos = mod(f, cycle);
        return pos < n ? pos : 2 * (n - 1) - pos;
    }

    return mod(f, n);
}

class Animator {
    constructor(opts) {
        opts = opts || {};
        this.clip = opts.clip || null;
        this.el = opts.el || null;
        this.time = 0;
        this.flipByX = opts.flipByX === true;
    }

    attach(el) {
        this.el = el || null;
        if (this.el) {
            this.el.style.backgroundRepeat = 'no-repeat';
            this.el.style.transformOrigin = '50% 50%';
        }
    }

    reset() {
        this.time = 0;
    }

    update(dt) {
        if (!this.clip || !this.el) return;
        var sheet = this.clip.spritesheet;
        if (!sheet || !sheet.image) return;

        var n = this.clip.getClipFrameCount();
        if (n <= 0) return;

        this.time += dt;
        var idx = clipFrameIndexAtTime(this.clip, this.time);
        if (idx < 0) return;

        var sheetIdx = this.clip.getSheetFrameIndex(idx);
        if (sheetIdx < 0) return;

        var rect = sheet.getFrameRect(sheetIdx);
        if (rect.sw <= 0 || rect.sh <= 0) return;

        var img = sheet.image;
        var ew = this.el.offsetWidth;
        var eh = this.el.offsetHeight;
        if (ew <= 0 || eh <= 0) return;

        var s = Math.max(ew / rect.sw, eh / rect.sh);
        var bw = img.naturalWidth * s;
        var bh = img.naturalHeight * s;
        var px = -rect.sx * s;
        var py = -rect.sy * s;

        this.el.style.backgroundImage = 'url(' + JSON.stringify(sheet.src) + ')';
        this.el.style.backgroundSize = bw + 'px ' + bh + 'px';
        this.el.style.backgroundPosition = px + 'px ' + py + 'px';
        this.el.style.transform = this.flipByX ? 'scaleX(-1)' : '';
    }
}

export { Animator };
