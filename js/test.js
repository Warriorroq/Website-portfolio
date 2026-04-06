'use strict';

import { Engine } from './engine/engine.js';
import { DomBall } from './engine/dom-ball.js';
import { ZoneDebugOverlay } from './engine/zone-debug.js';

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

engine.start();
