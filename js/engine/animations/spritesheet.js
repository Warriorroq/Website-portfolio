'use strict';

class Spritesheet {
    constructor(opts) {
        opts = opts || {};
        this.src = opts.src || '';
        this.sheetWidth = opts.sheetWidth != null ? opts.sheetWidth : 0;
        this.sheetHeight = opts.sheetHeight != null ? opts.sheetHeight : 0;
        this.columns = opts.columns != null ? opts.columns : 1;
        this.rows = opts.rows != null ? opts.rows : 1;
        this.frameNames = opts.frameNames ? opts.frameNames.slice() : null;
        this.frameCount = this.columns * this.rows;
        this.image = null;
        this.frames = null;
        this.naturalWidth = null;
        this.naturalHeight = null;
    }

    load(opts) {
        return loadAndSliceImage(this, opts);
    }

    _colWidth(col) {
        var base = Math.floor(this.sheetWidth / this.columns);
        var rem = this.sheetWidth % this.columns;
        return base + (col < rem ? 1 : 0);
    }

    _rowHeight(row) {
        var base = Math.floor(this.sheetHeight / this.rows);
        var rem = this.sheetHeight % this.rows;
        return base + (row < rem ? 1 : 0);
    }

    getFrameRect(index) {
        var i = index | 0;
        if (i < 0 || i >= this.frameCount) {
            return { sx: 0, sy: 0, sw: 0, sh: 0 };
        }
        var col = i % this.columns;
        var row = (i / this.columns) | 0;
        var sx = 0;
        var sy = 0;
        var c;
        var r;
        for (c = 0; c < col; c++) sx += this._colWidth(c);
        for (r = 0; r < row; r++) sy += this._rowHeight(r);
        return { sx: sx, sy: sy, sw: this._colWidth(col), sh: this._rowHeight(row) };
    }

    getFrameIndexByName(name) {
        if (!this.frameNames || typeof name !== 'string') return -1;
        var i = this.frameNames.indexOf(name);
        return i;
    }

    getFrameRectByName(name) {
        var i = this.getFrameIndexByName(name);
        if (i === -1) return { sx: 0, sy: 0, sw: 0, sh: 0 };
        return this.getFrameRect(i);
    }
}

function loadAndSliceImage(sheet, opts) {
    opts = opts || {};
    return new Promise(function (resolve, reject) {
        if (!sheet || !sheet.src) {
            reject(new TypeError('Spritesheet with a non-empty src is required'));
            return;
        }
        var img = new Image();
        if (opts.crossOrigin) img.crossOrigin = opts.crossOrigin;
        img.onload = function () {
            var frames = [];
            var i;
            var n = sheet.frameCount;
            var names = sheet.frameNames;
            for (i = 0; i < n; i++) {
                var rect = sheet.getFrameRect(i);
                frames.push({
                    index: i,
                    name: names && names[i] != null ? names[i] : null,
                    sx: rect.sx,
                    sy: rect.sy,
                    sw: rect.sw,
                    sh: rect.sh,
                });
            }
            sheet.image = img;
            sheet.frames = frames;
            sheet.naturalWidth = img.naturalWidth;
            sheet.naturalHeight = img.naturalHeight;
            resolve(sheet);
        };
        img.onerror = function () {
            reject(new Error('Failed to load image: ' + sheet.src));
        };
        img.src = sheet.src;
    });
}

export { Spritesheet };
