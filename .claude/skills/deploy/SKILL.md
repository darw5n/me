# /deploy — Pubblica su main

Workflow standard per questo progetto: branch attivo → update-2026 → main → push.

## Passi

1. Mostra il riepilogo del branch corrente:
   - `git log update-2026..HEAD --oneline` per vedere i commit da mergare
   - `git diff --stat update-2026` per vedere i file cambiati

2. Presenta il riepilogo all'utente e **aspetta conferma esplicita** prima di procedere.

3. Solo dopo conferma:
   ```bash
   git checkout update-2026
   git merge <branch-corrente> --no-ff -m "Merge <branch> into update-2026"
   git checkout main
   git merge update-2026 --no-ff -m "Merge update-2026 into main"
   git push origin main
   ```

4. Conferma il push mostrando l'output di `git log --oneline -3`.

## Regole
- Non fare mai `git merge` senza conferma esplicita dell'utente
- Il branch di lavoro nasce sempre da `update-2026`, non da `main`
- Non pushare mai direttamente su `main` senza passare da `update-2026`
