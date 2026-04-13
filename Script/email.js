// Email obfuscation — anti-Googlebot
// La mail viene costruita da CSS (content: attr()), non da JS al load.
// Il link mailto viene aggiunto solo al primo click, così Googlebot
// (che esegue JS ma non simula click utente) non indicizza l'indirizzo.

(function () {
    var el = document.querySelector('.obf-email');
    if (!el) return;

    el.addEventListener('click', function handler() {
        var address = el.getAttribute('data-a') + '@' + el.getAttribute('data-b');
        var link = document.createElement('a');
        link.href = 'mailto:' + address;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        // Rimuove il listener dopo il primo click
        el.removeEventListener('click', handler);
    }, { once: true });
})();
