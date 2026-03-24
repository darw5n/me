# /debug-mobile — Aggiunge Eruda per debug su mobile

Inietta temporaneamente [Eruda](https://github.com/liriliri/eruda) in `index.html`:
una DevTools completa direttamente nel browser mobile (console, network, elementi).

**⚠ Solo per debug — rimuovere prima di fare commit/push.**

## Passi

1. Aggiungi in fondo al `<head>` di `index.html`, subito prima del `</head>`:
   ```html
   <!-- DEBUG MOBILE — rimuovere prima del commit -->
   <script src="https://cdn.jsdelivr.net/npm/eruda"></script>
   <script>eruda.init();</script>
   ```

2. Compila SCSS se necessario (`/scss`).

3. Fai un commit **temporaneo** con messaggio `wip: debug mobile (da rimuovere)` e push su `main` direttamente:
   ```bash
   git add index.html
   git commit -m "wip: debug mobile (da rimuovere)"
   git push origin main
   ```
   > Push diretto su main perché è solo per test live — non passa da update-2026.

4. Dopo il test, rimuovi le due righe Eruda da `index.html` e fai:
   ```bash
   git add index.html
   git commit -m "chore: remove debug eruda"
   git push origin main
   ```

## Come usare Eruda sul telefono
- Apri il sito sul browser mobile
- Apparirà un bottone nell'angolo in basso a destra
- Toccalo per aprire la console — puoi vedere log, errori, network, elementi DOM
