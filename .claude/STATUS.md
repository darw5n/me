# Stato del progetto — darw.it

Ultimo aggiornamento: 2026-03-24

---

## Riepilogo rapido

Sito personale / portfolio. Vanilla HTML + SCSS + JS. Live su [darw.it](https://darw.it) via GitHub Pages.

**Branch attivo:** `update-2026` → merge su `main` per andare in produzione.

---

## Cosa funziona ✅

- Hero con parallax (DARWIN scalinata) — desktop e mobile
- Sezione `.thanks` con staircase corretta su mobile
- Scroll orizzontale "Last Dances" (GSAP ScrollTrigger + pinning)
- Accordion esperienze/educazione (GSAP)
- Preloader progress bar 0→100% con animazione a 3 fasi (ease → creep → rush)
- Dark/Light theme con persistenza localStorage
- Dissolvenza testi al scroll (Splitting.js + GSAP)
- `splitting.min.js` ora locale (non CDN) — evita blocchi su connessioni lente

---

## Bug aperti 🐛

### Firefox Android — scroll/animazioni non immediate al caricamento
- **Sintomo:** Dopo il preloader, Locomotive Scroll non è subito attivo.
  Dopo qualche secondo funziona tutto normalmente. Su Brave/Chrome mobile: ok.
- **Tentativi già fatti:**
  - `pageReady` custom event per sincronizzare preloader con init Locomotive
  - `locoScroll.update()` front-loaded prima delle animazioni di uscita
  - Rimosso `delay: 0.3` su `#page-content` (fix flash noise)
  - `splitting.min.js` scaricato localmente (fix CDN lento)
- **Root cause:** Non ancora identificata con certezza.
  Ipotesi: su Firefox Android `locoScroll.scroll.resize()` chiamato su `window.load`
  interfere con lo stato iniziale di Locomotive in native scroll mode.
- **Prossimo passo:** Usare `/debug-mobile` (Eruda) per vedere console errors reali
  direttamente da Firefox Android.

### Percentuale preloader dietro barra browser (risolto parzialmente)
- **Fix applicato:** `height: 100svh` dove supportato + `padding-bottom: env(safe-area-inset-bottom)`
- **Da verificare** su Android Firefox dopo il fix splitting.js

---

## Architettura scroll

```
LocomotiveScroll (virtual scroll su desktop, native su Firefox mobile)
    │
    ├── emette "scroll" → ScrollTrigger.update()
    │
    └── ScrollTrigger proxy legge locoScroll.scroll.instance.scroll.y
```

**Mobile Firefox:** `smooth: false` (native scroll), `useSmoothMobile = false`.
`locoScroll.scroll.resize()` chiamato su `window.load` per correggere `windowMiddle.y`
(Firefox legge `window.innerHeight` sbagliato al momento dell'init).

---

## Branch strategy

```
main              ← produzione stabile (GitHub Pages)
update-2026       ← integrazione — tutti i fix/feat mergiano qui prima
fix-<cosa>        ← branch di lavoro per bug
feat-<cosa>       ← branch di lavoro per nuove funzionalità
```

Regola: **mai merge senza conferma esplicita.**

---

## Skill disponibili

| Comando | Cosa fa |
|---|---|
| `/deploy` | Merge branch → update-2026 → main → push |
| `/fix nome` | Crea un branch `fix-<nome>` da update-2026 |
| `/scss` | Compila `CSS/main.scss` → `CSS/main.css` |
| `/debug-mobile` | Aggiunge Eruda per debug console su browser mobile |

---

## Prossimi lavori pianificati

- [ ] **Aggiornamento contenuti** — testi e informazioni da aggiornare (branch `feat-content-update` già esistente ma non iniziato)
- [ ] **Debug Firefox Android** — usare Eruda per identificare root cause
- [ ] **Verifica fix percentuale preloader** su Firefox Android live
