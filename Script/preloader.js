(function () {
    var progressEl = null;
    var percentageEl = null;
    var startTime = null;
    var isFullyLoaded = false;
    var rushStart = null;
    var currentAtRush = 0;

    // Durata dell'animazione ease-in verso l'85% (in ms)
    var EASE_DURATION = 2800;
    // Percentuale target mentre si aspetta window.load
    var EASE_TARGET = 85;
    // Velocità di completamento dopo window.load (% al secondo)
    var RUSH_SPEED = 80;

    // Segna il caricamento completo al window.load
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
            gsap.to('#page-content', { opacity: 1, duration: 0.5, delay: 0.3 });
        }, 200);
    }

    function tick(timestamp) {
        // Aspetta che gli elementi del DOM esistano (pochi frame dopo il <body>)
        if (!findElements()) {
            requestAnimationFrame(tick);
            return;
        }

        if (!startTime) startTime = timestamp;

        var current;

        if (!isFullyLoaded) {
            // Curva ease-in (t²): parte lenta, accelera verso l'85%
            var t = Math.min((timestamp - startTime) / EASE_DURATION, 1);
            current = t * t * EASE_TARGET;
        } else {
            // window.load scattato: corsa lineare verso il 100%
            if (!rushStart) {
                rushStart = timestamp;
                currentAtRush = parseFloat(progressEl.style.width) || 0;
            }
            var elapsed = (timestamp - rushStart) / 1000;
            current = Math.min(currentAtRush + elapsed * RUSH_SPEED, 100);
        }

        var rounded = setProgress(current);

        if (rounded < 100) {
            requestAnimationFrame(tick);
        } else {
            complete();
        }
    }

    requestAnimationFrame(tick);
})();
