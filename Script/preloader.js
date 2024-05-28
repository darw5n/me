window.onload = function() {
    preload();
};

document.addEventListener("DOMContentLoaded", function () {
    preload();
});

function preload() {
    const loader = document.getElementById("loader");
    const progress = document.getElementById("progress");
    const percentage = document.getElementById("percentage");

    const loadingPromise = new Promise((resolve) => {
        let percentLoaded = 0;
        const interval = setInterval(() => {
            percentLoaded++;
            gsap.to(progress, { width: `${percentLoaded}%`, duration: 0.1 });
            percentage.textContent = `${percentLoaded}%`;

            if (percentLoaded >= 100) {
                clearInterval(interval);
                setTimeout(resolve, 500);
            }
        }, 20);
    });

    loadingPromise.then(() => {
        gsap.to("#preloader", { y: "100%", ease: "power2.inOut", duration: 0.8, onComplete: () => {
            document.getElementById("preloader").classList.add("hidden");
            document.getElementById("page-content").classList.remove("hidden"); // Mostra il contenuto della pagina
        }});

        gsap.to("#page-content", { opacity: 1, duration: 0.5 });
    });
}
