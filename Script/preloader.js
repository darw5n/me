document.addEventListener("DOMContentLoaded", function () {
    // Quando il DOM è completamente caricato, avviamo la funzione di pre-caricamento
    preload();
});

function preload() {
    // Recuperiamo l'elemento della barra di caricamento e il testo percentuale
    const loader = document.getElementById("loader");
    const progress = document.getElementById("progress");
    const percentage = document.getElementById("percentage");

    // Simuliamo il caricamento con una percentuale utilizzando una Promise
    const loadingPromise = new Promise((resolve) => {
        let percentLoaded = 0;
        const interval = setInterval(() => {
            percentLoaded++;
            // Aggiorniamo la barra di caricamento e il testo percentuale
            gsap.to(progress, { width: `${percentLoaded}%`, duration: 0.1 });
            percentage.textContent = `${percentLoaded}%`;

            if (percentLoaded >= 100) {
                clearInterval(interval);
                // Ritardiamo l'avvio dell'animazione slide-down di 0.5 secondi
                setTimeout(resolve, 500);
            }
        }, 20); // Abbiamo diminuito l'intervallo a 20 millisecondi per far aumentare la percentuale più velocemente
    });

    // Nascondiamo la schermata di pre-caricamento quando il caricamento effettivo è completato
    loadingPromise.then(() => {
        // Animazione per far scorrere il preloader verso il basso in modo più fluido
        gsap.to("#preloader", { y: "100%", ease: "power2.inOut", duration: 0.8, onComplete: () => {
            // Una volta completata l'animazione, nascondiamo il preloader
            document.getElementById("preloader").classList.add("hidden");
        }});

        // Facciamo apparire il contenuto della pagina una volta nascosto il preloader
        gsap.to("#page-content", { opacity: 1, duration: 0.5 });
    });
}
