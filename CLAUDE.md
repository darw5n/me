# CLAUDE.md — Istruzioni per il progetto "me" (sito personale)

## Contesto del progetto

Sito personale / portfolio di Darwin. Progetto vanilla: HTML + SCSS + JavaScript.
Nessun bundler, nessun package manager. Le dipendenze sono caricate via CDN.
Il SCSS viene compilato manualmente (es. estensione VS Code o CLI sass).

---

## Stack tecnico

| Tecnologia | Versione | Ruolo |
|---|---|---|
| Locomotive Scroll | 3.5.4 | Virtual scroll + scroll-based animations |
| GSAP | 3 | Animazioni (timeline, ScrollTrigger) |
| Splitting.js | — | Text splitting per animazioni su caratteri/parole |
| Bootstrap | 5.0.2 | Solo per il grid system |
| FontAwesome | 6.1.2 | Icone |

> **Non usare** jQuery o ScrollMagic — entrambe erano dipendenze legacy e sono state rimosse.

---

## Struttura file principali

```
index.html             ← unica pagina (SPA-like)
CSS/
  main.scss            ← sorgente SCSS, importa i partial
  main.css             ← file compilato (NON editare direttamente)
  _variables.scss      ← design tokens (colori, font, spacing)
  _common.scss         ← base styles, font face, noise animation
  _typo.scss           ← tipografia
  _light-theme.scss    ← variabili tema chiaro
  _dark-theme.scss     ← variabili tema scuro
Script/
  preloader.js         ← progress bar + reveal del contenuto
  theme.js             ← toggle dark/light + localStorage
  Accordion.js         ← accordion animato con GSAP (vanilla JS)
  Age.js               ← calcolo età da data di nascita
  email.js             ← obfuscazione indirizzo email
  locomotive-scroll.min.js  ← libreria locale (non CDN)
Font/
  Matahari/            ← font principale (4 varianti)
  Nognathy/            ← font decorativo
```

---

## Funzionalità da preservare sempre

- **Smooth scroll** via Locomotive Scroll (sia desktop che mobile)
- **Scroll orizzontale** nella sezione "Last Dances" (skills) — gestito con GSAP ScrollTrigger + pinning
- **Accordion animato** nella sezione esperienze/educazione — animazione altezza con GSAP
- **Preloader** con progress bar 0→100% prima che il contenuto sia visibile
- **Dark/Light theme** con persistenza in localStorage
- **Dissolvenza testi** al scroll (Splitting.js + GSAP)

---

## Come funziona lo scroll (architettura)

```
LocomotiveScroll (virtual scroll)
    │
    ├── emette eventi "scroll"
    │       └── ScrollTrigger.update() ← tiene sincronizzati i trigger GSAP
    │
    └── ScrollTrigger usa proxy per leggere la posizione da Locomotive
            └── locoScroll.scroll.instance.scroll.y
```

**Regola chiave:** ogni volta che il DOM cambia (accordion apre/chiude, immagini caricate),
bisogna chiamare `locoScroll.update()` per ricalcolare le altezze.

---

## Problemi noti / storico fix

### [update-2026] Fix Firefox mobile — sezioni sovrapposte
- **Problema:** Su Firefox mobile le sezioni collassano tutte verso l'alto
- **Causa probabile:** Locomotive Scroll applica `transform: translateY` al container;
  Firefox mobile gestisce diversamente `overflow: hidden` + `transform`
- **Branch:** `update-2026/fix-firefox-mobile`

### [update-2026] Fix preloader (branch: fix-preloader + fix-preloader-animation)
- **Problema 1:** Contenuto visibile sotto il preloader trasparente
- **Fix:** Rimosso `class="hidden"` dal `#preloader`; aggiunto `opacity: 0` a `#page-content`; fallback background in CSS; rimosso `setTimeout` in theme.js
- **Problema 2:** Su connessione lenta il preloader stava a 0% per secondi poi correva a 100%
- **Causa:** `DOMContentLoaded` era bloccato dai body scripts CDN (jQuery, ScrollMagic, ecc.)
- **Fix:** Il preloader usa `requestAnimationFrame` dall'inizio (no `DOMContentLoaded`), curva ease-in (t²), si ferma all'85% e aspetta `window.load`, poi corre a 100%
- **Fix tema:** Inline script a inizio `<body>` applica la classe tema prima del primo paint

### [update-2026] Fix conflitto accordion ↔ scroll orizzontale
- **Problema:** Aprire/chiudere un accordion mentre si è nella sezione orizzontale
  causava desincronizzazione dello scroll
- **Branch:** `update-2026/fix-accordion-scroll-conflict`

---

## Strategia branch e commit

```
main              ← produzione: il push su main pubblica il sito
fix-<cosa>        ← un branch per ogni richiesta, nasce da main
feat-<cosa>
```

- Branch di lavoro: `fix-<cosa>` per bug, `feat-<cosa>` per nuove funzionalità. Nascono da `main` e tornano su `main`.
- `update-2026` è stato unito in `main` il 13/04/2026 e non esiste più; `update-2025` è legacy, non usarlo.
- **Non eseguire mai `git merge` o `git push` senza conferma esplicita dell'utente** — prima mostrare il riepilogo del branch e aspettare il via libera
- Anno e data si leggono dalla data del commit, non serve nel nome del branch
- Non includere nei commit i `.DS_Store` né `Script/debug-mobile.js` (file locali di Darwin)

## Testi del sito
I testi su Darwin (titolo, intro, esperienze, strumenti) seguono la cartella `~/Documents/GitHub/storytelling/`
(fonte dei fatti: `strategia/fatti.md`). Se cambi un testo qui, controlla che sia coerente con quella cartella.
Il sito è **pubblico**: niente link al portfolio privato.

- **Fav tools:** le icone sono quelle delle app macOS, in `Img/Logo/apps/` (96×96 PNG). Per estrarne una nuova:
  `sips -s format png -z 96 96 "/Applications/<App>.app/Contents/Resources/<icona>.icns" --out Img/Logo/apps/<nome>.png`
  (il nome del file `.icns` è in `Contents/Info.plist`, chiave `CFBundleIconFile`). `alt=""` perché il nome è già scritto accanto.
- **Footer:** "© August 2022" resta così: è l'anno di creazione del sito (scelta di Darwin).

---

## Note SCSS

- Editare sempre i file `_*.scss`, mai `main.css` direttamente
- Dopo aver salvato un partial, ricompilare: `sass CSS/main.scss CSS/main.css` (o `npx sass …` se `sass` non è installato)
- Il `main.css` in repo era compilato con autoprefixer (es. `width: -moz-fit-content`): la CLI sass non aggiunge i
  prefissi, quindi dopo la compilazione controlla il diff e rimetti quelli spariti
- `main.css` è nel repo per compatibilità (nessun build step in produzione),
  ma non va editato manualmente

---

## Accessibilità e UX (priorità trasversali)

- Rispettare `prefers-reduced-motion` per tutte le animazioni
- Mantenere contrasto WCAG 2.1 AA su entrambi i temi
- Testare sempre su: Chrome desktop, Safari iOS, Firefox mobile
