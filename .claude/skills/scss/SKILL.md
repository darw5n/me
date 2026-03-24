# /scss — Compila SCSS

Compila `CSS/main.scss` → `CSS/main.css`.

## Passi

1. Compila:
   ```bash
   npx sass CSS/main.scss CSS/main.css --no-source-map 2>&1
   ```

2. Se ci sono **errori** (non solo DEPRECATION warning), mostrali e non procedere.

3. Se la compilazione ha successo, conferma con: "CSS compilato correttamente."

## Note
- Editare sempre i `_*.scss`, mai `main.css` direttamente
- I DEPRECATION warning su `@import` sono noti e non bloccanti (Dart Sass 3.x)
- `main.css` è committato nel repo per compatibilità (nessun build step in produzione)
