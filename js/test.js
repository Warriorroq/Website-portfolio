(function () {
    'use strict';

    var engine = new Engine({
        zoneSelector: ['pre', '.physics-collider', '.dom-playground']
    });

    ZoneDebugOverlay.attach(engine, { edgeMidpoints: true });

    engine.addEntity(new DomBall({ radius: 28 }));

    window.addEventListener('keydown', function (e) {
        if (e.code !== 'Space') return;
        var t = e.target;
        if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
        e.preventDefault();
        var vw = document.documentElement.clientWidth;
        var vh = document.documentElement.clientHeight;
        var r = 18 + Math.floor(Math.random() * 22);
        var x = r + Math.random() * (vw - 2 * r);
        var y = r + Math.random() * (vh * 0.45);
        engine.addEntity(new DomBall({ radius: r, x: x, y: y }));
    });

    engine.start();
})();
