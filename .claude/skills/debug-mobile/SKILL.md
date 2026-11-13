---
name: debug-mobile
description: /debug-mobile — Apre il sito locale sul telefono con Eruda (console nel browser del telefono), senza commit
---
# /debug-mobile — Eruda sul telefono

[Eruda](https://github.com/liriliri/eruda) è una DevTools dentro la pagina (console, network, elementi): serve per
vedere gli errori nei browser del telefono. Si usa **solo in locale**: niente commit, niente push.

## Passi

1. Aggiungi subito prima di `</head>` in `index.html`:
   ```html
   <!-- DEBUG MOBILE: non committare -->
   <script src="https://cdn.jsdelivr.net/npm/eruda@3.0.1/eruda.min.js"></script>
   <script>eruda.init();</script>
   ```
2. Avvia il server visibile in rete: `python3 -m http.server 4142 --bind 0.0.0.0`
3. Trova l'IP del Mac: `ipconfig getifaddr en0`. Sul telefono (stessa Wi-Fi) apri `http://<IP>:4142/`.
4. Il bottone di Eruda è in basso a destra: toccalo per la console.
5. Finito il test, togli le tre righe: `git diff index.html` non deve mostrarle prima di qualunque commit.
