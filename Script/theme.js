// Questo evento viene eseguito quando il documento HTML è completamente caricato e pronto per essere manipolato dal JavaScript.
document.addEventListener("DOMContentLoaded", function () {
    // Ottieni il riferimento al pulsante di toggle del tema dall'ID 'theme-toggle'.
    const themeToggle = document.getElementById('theme-toggle');

    // Ottieni il riferimento all'elemento del corpo del documento.
    const body = document.body;

    // Ottieni il riferimento all'icona del tema.
    const themeIcon = document.getElementById('theme-icon');

    // Funzione per impostare la preferenza del tema nel corpo del documento e nel localStorage.
    function setThemePreference(theme) {
        // Rimuovi entrambe le classi 'dark-theme' e 'light-theme' dal corpo.
        body.classList.remove('dark-theme', 'light-theme');

        // Aggiungi la classe specificata (theme) al corpo del documento.
        //   body.classList.add(theme); <!-- abilita se vuoi che non ci sia un timout
        setTimeout(() => {
            body.classList.add(theme);
        }, 10); // Aggiungi un piccolo ritardo prima di applicare la classe

        // Salva la preferenza del tema nel localStorage del browser in modo da mantenerla tra le visite.
        localStorage.setItem('themePreference', theme);

        // Cambia l'emoji del pulsante in base al tema impostato.
        if (theme === 'dark-theme') {
            themeIcon.textContent = '🌙'; // Emoji della luna per il tema scuro
        } else {
            themeIcon.textContent = '☀️'; // Emoji del sole per il tema chiaro
        }
    }

    // Funzione per ottenere la preferenza del tema dal localStorage.
    function getThemePreference() {
        return localStorage.getItem('themePreference');
    }

    // Ottieni la preferenza del tema dall'archivio locale.
    const userPreference = getThemePreference();

    // Verifica se l'utente ha una preferenza del tema salvata nel localStorage.
    // Se sì, imposta il tema in base alla preferenza salvata.
    // Altrimenti, imposta il tema in base alla preferenza del color scheme del dispositivo.
    if (userPreference === 'dark-theme' || userPreference === 'light-theme') {
        setThemePreference(userPreference);
    } else {
        // Ottieni la preferenza del color scheme del dispositivo tramite la media query.
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        // Imposta il tema in base alla preferenza del color scheme del dispositivo.
        setThemePreference(prefersDark ? 'dark-theme' : 'light-theme');
    }

    // Aggiungi un listener per il clic sul pulsante di toggle del tema.
    // Quando viene cliccato, cambia il tema corrente in base alla preferenza opposta.
    themeToggle.addEventListener('click', () => {
        // Controlla se il corpo del documento ha la classe 'dark-theme'.
        // Se sì, imposta il nuovo tema a 'light-theme', altrimenti imposta il tema a 'dark-theme'.
        const currentTheme = body.classList.contains('dark-theme') ? 'dark-theme' : 'light-theme';
        const newTheme = currentTheme === 'dark-theme' ? 'light-theme' : 'dark-theme';

        // Imposta il nuovo tema.
        setThemePreference(newTheme);
    });
});
