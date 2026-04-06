'use strict';

import { Engine } from './engine/engine.js';
import { DomBall } from './engine/entities/dom-ball.js';
import { ZoneDebugOverlay } from './engine/debug/zone-debug.js';
import { Spritesheet } from './engine/animations/spritesheet.js';
import { AnimationClip } from './engine/animations/animation-clip.js';

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
});

var engine = new Engine({
    zoneSelector: ['pre', '.physics-collider', '.dom-playground']
});

ZoneDebugOverlay.attach(engine, { edgeMidpoints: true });

window.addEventListener('keydown', function (e) {
    if (e.code !== 'Space') return;
    var t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    e.preventDefault();
    var vw = document.documentElement.clientWidth;
    var vh = document.documentElement.clientHeight;
    var r = 20 + Math.floor(Math.random() * 10);
    var x = r + Math.random() * (vw - 2 * r);
    var y = r + Math.random() * (vh * 0.45);
    engine.addEntity(new DomBall({ radius: r, x: x, y: y }));
});

mouseSpritesheet.load().then(function () {
    console.log(mouseSpritesheet);
    console.log(mouseHopClip.name, mouseHopClip.speed + ' fps', mouseHopClip.duration.toFixed(2) + 's');
}).catch(function (err) {
    console.warn('Mouse spritesheet load failed:', err);
});

engine.start();