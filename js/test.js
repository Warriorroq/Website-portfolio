(function () {
    'use strict';

    var engine = new Engine({
        zoneSelector: ['pre', '.physics-collider', '.dom-playground']
    });

    ZoneDebugOverlay.attach(engine, { edgeMidpoints: true });

    engine.addEntity(new DomBall({ radius: 28 }));

    engine.start();
})();
