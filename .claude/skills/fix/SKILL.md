---
name: fix
description: /fix — Crea un branch di fix (o di feature) partendo da main
---
# /fix — Crea un branch di fix

Crea un branch nuovo a partire da `main` aggiornato.

## Uso

```
/fix nome-del-problema
```

Esempio: `/fix pinch-iphone` → crea `fix-pinch-iphone`

## Passi

1. Se non è stato passato un nome, chiedi: "Come si chiama il fix? (es. `pinch-iphone`)"
2. Parti da `main` pulito e aggiornato:
   ```bash
   git checkout main
   git pull --ff-only
   git status
   ```
3. Crea il branch: `git checkout -b fix-<nome>`
4. Conferma il branch creato e chiedi: "Cosa dobbiamo sistemare?"

## Convenzioni nome branch
- `fix-<cosa>` per bug, `feat-<cosa>` per novità, `chore-<cosa>` per pulizie
- Mai spazi, usa trattini; niente date nel nome

## Se il fix tocca il motore della Tavola
Il motore (`src/tavola/`, `CSS/tavola/`) è condiviso col portfolio, che ne tiene una copia compilata.
Dopo il merge qui, nel repo `portfolio` apri un branch con lo stesso nome e lancia `sh scripts/sync-tavola.sh`.
