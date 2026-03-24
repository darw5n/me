# /fix — Crea un branch di fix

Crea un nuovo branch di fix a partire da `update-2026`.

## Uso

```
/fix nome-del-problema
```

Esempio: `/fix preloader-android` → crea `fix-preloader-android`

## Passi

1. Se non è stato passato un nome, chiedi: "Come si chiama il fix? (es. `preloader-android`)"

2. Assicurati di essere su `update-2026` aggiornato:
   ```bash
   git checkout update-2026
   git status
   ```

3. Crea il branch:
   ```bash
   git checkout -b fix-<nome>
   ```

4. Conferma il branch creato e chiedi: "Cosa dobbiamo sistemare?"

## Convenzioni nome branch
- `fix-<cosa>` per bug
- `feat-<cosa>` per nuove funzionalità
- Mai spazi, usa trattini
- No date nel nome (si leggono dal commit)
