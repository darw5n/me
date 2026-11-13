---
name: deploy
description: /deploy — Unisce il branch corrente a main e pubblica (solo dopo conferma)
---
# /deploy — Pubblica su main

Il push su `main` pubblica subito darw.it (GitHub Pages). Flusso: branch di lavoro → `main` → push.

## Passi

1. Controlla che sia tutto compilato e verde: `sh scripts/build.sh`, poi `git status` pulito.
2. Controlla che l'email non compaia in chiaro: `git grep -nE "vegher(@| ?[[(]at[])])"` deve restare vuoto.
3. Mostra il riepilogo del branch:
   - `git log main..HEAD --oneline`
   - `git diff --stat main`
4. Presenta il riepilogo e **aspetta conferma esplicita** prima di procedere.
5. Solo dopo conferma:
   ```bash
   git checkout main
   git merge <branch> --no-ff -m "Merge <branch>: <cosa cambia>"
   git push origin main
   ```
6. Mostra `git log --oneline -3` e ricorda di controllare il sito live (`darw5n.github.io/me`) dopo un minuto.

## Regole
- Mai `git merge` o `git push` senza conferma esplicita.
- Se il branch ha toccato il motore (`src/tavola/`, `CSS/tavola/`), ricorda di riportarlo nel portfolio
  (`sh scripts/sync-tavola.sh` nel repo `portfolio`, su un suo branch).
