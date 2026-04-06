'use strict';

import { Engine } from './engine/engine.js';
import { Mouse } from './engine/entities/mouse.js';
import { Ball } from './engine/entities/ball.js';
import { Cat } from './engine/entities/cat/cat.js';
import { ZoneDebugOverlay } from './engine/debug/zone-debug.js';
import { RaycastDebugOverlay } from './engine/debug/raycast-debug.js';
import { Spritesheet } from './engine/animations/spritesheet.js';
import { AnimationClip, WrapMode } from './engine/animations/animation-clip.js';
import { Animator } from './engine/animations/animator.js';

var mouseSpritesheet = new Spritesheet({
    src: 'images/mouse_spritesheet.png',
    sheetWidth: 383,
    sheetHeight: 97,
    columns: 3,
    rows: 1,
    frameNames: ['squash', 'mid', 'peak'],
});

var mouseHopClip = new AnimationClip({
    name: 'hop',
    speed: 8,
    spritesheet: mouseSpritesheet,
    wrapMode: WrapMode.Loop
});

var engine = new Engine({
    zoneSelector: ['pre', '.physics-collider', '.dom-playground']
});

ZoneDebugOverlay.attach(engine, { edgeMidpoints: true });

/*var rayDebugPtr = {
    x: document.documentElement.clientWidth * 0.5,
    y: document.documentElement.clientHeight * 0.5,
};
window.addEventListener(
    'pointermove',
    function (e) {
        rayDebugPtr.x = e.clientX;
        rayDebugPtr.y = e.clientY;
    },
    { passive: true }
);
RaycastDebugOverlay.attach(engine, {
    rayCount: 60,
    getOrigin: function () {
        return rayDebugPtr;
    },
});*/

window.addEventListener('keydown', function (e) {
    if (e.code !== 'KeyM') return;
    var t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    e.preventDefault();
    var vw = document.documentElement.clientWidth;
    var vh = document.documentElement.clientHeight;
    var r = 20 + Math.floor(Math.random() * 10);
    var sheetFrameW = mouseSpritesheet.sheetWidth / mouseSpritesheet.columns;
    var sheetFrameH = mouseSpritesheet.sheetHeight / mouseSpritesheet.rows;
    var h = 2 * r;
    var w = Math.round((h * sheetFrameW) / sheetFrameH);
    var hw = w * 0.5;
    var hh = h * 0.5;
    var x = hw + Math.random() * Math.max(0, vw - w);
    var y = hh + Math.random() * Math.max(0, vh * 0.45 - h);
    engine.addEntity(
        new Mouse({
            width: w,
            height: h,
            x: x,
            y: y,
            animator: new Animator({ clip: mouseHopClip }),
        })
    );
});

window.addEventListener('keydown', function (e) {
    if (e.code !== 'KeyB') return;
    var t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    e.preventDefault();
    var vw = document.documentElement.clientWidth;
    var vh = document.documentElement.clientHeight;
    var r = 14 + Math.floor(Math.random() * 12);
    var x = r + Math.random() * Math.max(0, vw - 2 * r);
    var y = r + Math.random() * Math.max(0, vh * 0.45 - 2 * r);
    engine.addEntity(new Ball({ radius: r, x: x, y: y }));
});

window.addEventListener('keydown', function (e) {
    if (e.code !== 'KeyC') return;
    var t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    e.preventDefault();
    var vw = document.documentElement.clientWidth;
    var vh = document.documentElement.clientHeight;
    var s = 48 + Math.floor(Math.random() * 16);
    var hw = s * 0.5;
    var hh = s * 0.5;
    var x = hw + Math.random() * Math.max(0, vw - s);
    var y = hh + Math.random() * Math.max(0, vh * 0.45 - s);
    engine.addEntity(new Cat({ width: s, height: s, x: x, y: y }));
});

mouseSpritesheet.load().then(function () {
    console.log(mouseSpritesheet);
    console.log(mouseHopClip.name, mouseHopClip.speed + ' fps', mouseHopClip.duration.toFixed(2) + 's');
}).catch(function (err) {
    console.warn('Mouse spritesheet load failed:', err);
});

engine.start();