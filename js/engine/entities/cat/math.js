'use strict';

function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
}

function hypot(x, y) {
    return Math.sqrt(x * x + y * y);
}

export { clamp, hypot };
