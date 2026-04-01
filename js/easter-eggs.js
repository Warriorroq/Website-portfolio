(function () {
    'use strict';

    const KONAMI_KEYS = [
        'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
        'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
        'b', 'a'
    ];

    function initKonamiCode() {
        let step = 0;

        function normalizeKey(key) {
            return key.length === 1 ? key.toLowerCase() : key;
        }

        document.addEventListener('keydown', (e) => {
            if (e.repeat) return;
            if (e.target.closest('input, textarea, select, [contenteditable="true"]')) return;

            const k = normalizeKey(e.key);
            const need = normalizeKey(KONAMI_KEYS[step]);

            if (k === need) {
                step++;
                if (step === KONAMI_KEYS.length) {
                    step = 0;
                    console.log(
                        '%c↑ ↑ ↓ ↓ ← → ← → B A',
                        'font-size: 15px; font-weight: 700; color: #c084fc; letter-spacing: 0.08em;'
                    );
                    console.log(
                        '%cКод Konami. Читов нет — но ты настойчив.',
                        'font-size: 12px; color: #94a3b8;'
                    );
                    console.log(
                        '%cKonami code. No cheats — just respect.',
                        'font-size: 12px; color: #94a3b8;'
                    );
                }
            } else {
                const first = normalizeKey(KONAMI_KEYS[0]);
                step = k === first ? 1 : 0;
            }
        });
    }

    function init() {
        initKonamiCode();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
