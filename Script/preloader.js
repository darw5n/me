(function () {
    var progressEl = null;
    var percentageEl = null;
    var startTime = null;
    var isFullyLoaded = false;

    // Tre fasi: 'ease' → 'creep' → 'rush'
    var phase = 'ease';
    var rushStart = null;
    var rushStartValue = 0;
    var currentValue = 0;

    var EASE_DURATION = 2500;  // ms per la curva principale 0% → 80%
    var EASE_TARGET   = 80;    // % target della fase ease
    var CREEP_SPEED   = 0.004; // % per frame in attesa di window.load (quasi impercettibile)
    var RUSH_DURATION = 600;   // ms per completare dopo window.load

    // easeInOutQuint: parte lenta, accelera al centro, rallenta in uscita
    function easeInOutQuint(t) {
        return t < 0.5
            ? 16 * t * t * t * t * t
            : 1 - Math.pow(-2 * t + 2, 5) / 2;
    }

    window.addEventListener('load', function () {
        isFullyLoaded = true;
    });

    function findElements() {
        if (!progressEl) progressEl = document.getElementById('progress');
        if (!percentageEl) percentageEl = document.getElementById('percentage');
        return progressEl && percentageEl;
    }

    function setProgress(value) {
        var rounded = Math.min(Math.round(value), 100);
        progressEl.style.width = rounded + '%';
        percentageEl.textContent = rounded + '%';
        return rounded;
    }

    function complete() {
        setTimeout(function () {
            gsap.to('#preloader', {
                y: '100%',
                ease: 'power2.inOut',
                duration: 0.8,
                onComplete: function () {
                    document.getElementById('preloader').classList.add('hidden');
                }
            });
            gsap.to('#page-content', {
                opacity: 1,
                duration: 0.5,
                delay: 0.3,
                onStart: function () {
                    // Rimuove l'overlay blocca-scroll
                    var blocker = document.getElementById('scroll-blocker');
                    if (blocker) blocker.remove();
                    document.body.classList.remove('is-loading');
                    if (typeof locoScroll !== 'undefined' && window._locomotiveSmoothActive) {
                        locoScroll.start();
                    }
                },
                onComplete: function () {
                    // Avvia le animazioni di entrata (lettere dal basso)
                    // ora che il contenuto è completamente visibile
                    document.body.classList.add('animations-ready');

                    if (typeof locoScroll === 'undefined') return;
                    // Aspetta che i font siano applicati al layout prima di ricalcolare.
                    // Su Firefox, i font non vengono misurati mentre il contenuto è a
                    // opacity:0, causando offset parallax sbagliati (translateY -1096px ecc).
                    document.fonts.ready.then(function () {
                        locoScroll.update();
                        if (typeof ScrollTrigger !== 'undefined') {
                            ScrollTrigger.refresh();
                        }
                    });
                }
            });
        }, 200);
    }

    function tick(timestamp) {
        if (!findElements()) {
            requestAnimationFrame(tick);
            return;
        }

        if (!startTime) startTime = timestamp;

        // Transizione a rush non appena window.load scatta
        if (isFullyLoaded && phase !== 'rush') {
            phase = 'rush';
            rushStart = timestamp;
            rushStartValue = currentValue;
        }

        if (phase === 'ease') {
            var t = Math.min((timestamp - startTime) / EASE_DURATION, 1);
            currentValue = easeInOutQuint(t) * EASE_TARGET;
            if (t >= 1) phase = 'creep';

        } else if (phase === 'creep') {
            // La barra si muove sempre — non si blocca mai visivamente
            currentValue = Math.min(currentValue + CREEP_SPEED, 95);

        } else if (phase === 'rush') {
            // Ease-out cubic: scatta veloce e rallenta verso il 100%
            var rt = Math.min((timestamp - rushStart) / RUSH_DURATION, 1);
            var rushEased = 1 - Math.pow(1 - rt, 3);
            currentValue = rushStartValue + rushEased * (100 - rushStartValue);
        }

        var rounded = setProgress(currentValue);

        if (rounded < 100) {
            requestAnimationFrame(tick);
        } else {
            complete();
        }
    }

    requestAnimationFrame(tick);
})();
