---
name: scss
description: /scss — Compila SCSS e TypeScript della Tavola e lancia i test
---
# /scss — Compila

Compila tutto con lo script del progetto: TypeScript (`src/tavola/` → `Script/tavola/`), SCSS
(`CSS/tavola.scss` → `CSS/tavola.css`) e i test.

## Passi

1. `sh scripts/build.sh 2>&1`
2. Se ci sono **errori** (di compilazione o test falliti), mostrali spiegando cosa vogliono dire e non procedere.
3. Se va tutto bene: "Compilato, test verdi."

## Note
- Si editano solo i sorgenti (`src/tavola/*.ts`, `CSS/tavola/_*.scss`), mai i file compilati.
- I file compilati stanno nel repo perché in produzione non c'è build: si committano insieme ai sorgenti.
