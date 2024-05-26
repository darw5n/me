// Seleziona tutti gli elementi con la classe hover-word
const hoverWords = document.querySelectorAll('.hover-word');
// Seleziona l'elemento dell'immagine di default
const defaultImage = document.querySelector('.default-image');

let timeoutId; // Variabile per memorizzare l'ID del timeout

// Funzione per gestire l'animazione di dissolvenza
function fadeImage(imagePath) {
    // Effettua l'animazione per sostituire l'immagine
    gsap.to(defaultImage, { duration: 0.5, opacity: 0, onComplete: function() {
        // Cambia l'immagine al completamento dell'animazione
        defaultImage.src = imagePath;
        // Effettua un'altra animazione per mostrare la nuova immagine
        gsap.to(defaultImage, { duration: 0.5, opacity: 1 });
    }});
}

// Aggiungi event listener per il caricamento completo dell'immagine di default
defaultImage.addEventListener('load', function() {
    // Mostra l'immagine di default
    gsap.to(defaultImage, { duration: 0.5, opacity: 1 });
});

// Aggiungi event listener per il passaggio del mouse su ciascuna parola chiave
hoverWords.forEach(word => {
    word.addEventListener('mouseenter', function() {
        // Ottieni il percorso dell'immagine da mostrare
        const imagePath = this.dataset.image;
        // Cancella il timeout se è già stato avviato
        clearTimeout(timeoutId);
        // Effettua l'animazione per sostituire l'immagine
        fadeImage(imagePath);
    });

    word.addEventListener('mouseleave', function() {
        // Avvia un timeout per mostrare l'immagine per 5 secondi dopo aver lasciato l'hover
        timeoutId = setTimeout(function() {
            // Effettua l'animazione per tornare all'immagine di default dopo il ritardo
            fadeImage("https://massimilianobolognesi.com/wp-content/uploads/2022/08/Slide-16_9-1-1.png");
        }, 5000);
    });
});
