const contentDivs = document.querySelectorAll('.sticky-titles-section .content');

contentDivs.forEach(contentDiv => {
    const elements = contentDiv.querySelectorAll('p, ul, li, h6');

    elements.forEach(element => {
        // Suddividi il contenuto in parole
        Splitting({ target: element, by: 'words' });

        // Seleziona tutte le parole suddivise
        const words = element.querySelectorAll('.word');

        words.forEach((word, index) => {
            // Controlla se non è l'ultima parola e aggiungi uno spazio
            if (index < words.length - 1) {
                word.insertAdjacentHTML('afterend', ' ');
            }

            // Applica l'animazione di dissolvenza a ciascuna parola con easing
            gsap.to(word, {
                opacity: 0,
                // ease: 'power2.out', // Cambia la curva dell'animazione qui
                scrollTrigger: {
                    trigger: word,
                    scroller: '.smooth-scroll',
                    start: 'top 50%',
                    end: 'top 25%',
                    scrub: true
                }
            });
        });
    });
});
