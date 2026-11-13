# CLAUDE.md — Istruzioni per il progetto "me" (sito personale)

> **Questo file è pubblico** (il repo `darw5n/me` è pubblico). Niente dati personali, password, informazioni
> prese da Goldfish o dettagli di lavoro qui o in `.claude/`. È escluso dal sito con `_config.yml`, ma resta
> leggibile su GitHub.

## Email: mai in chiaro (Darwin, 10/11/2026)
L'indirizzo email di Darwin non deve mai comparire come testo nel repo pubblico: né nell'HTML, né nel JS, né in
documenti, test o messaggi di commit (lo spam lo raccoglie). Nella pagina sta solo codificato in `data-mail`
(rovesciato e in base64, vedi `src/tavola/mail.ts`) e si decodifica solo quando qualcuno clicca o invia il modulo.
Prima di un commit, questo controllo deve restare vuoto: `git grep -nE "vegher(@| ?[[(]at[])])"`.

## Contesto del progetto

Sito personale di Darwin (darw.it), pubblico. Dal 10/11/2026 è **"la Tavola"**: un tavolo infinito con oggetti
veri (note con il nastro, stampe, post-it, cartelle, strisce di nastro, gesso,
adesivi) che si spostano, si riordinano con "Tidy up" e reagiscono al mouse. Il portfolio (repo privato
`portfolio`) userà lo stesso motore, copiato compilato.

Progetto vanilla: **HTML + SCSS + TypeScript** compilato in moduli ES. Nessun bundler, nessun package manager,
nessuna libreria esterna: i compilatori arrivano con `npx` al momento. Le decisioni non ovvie sono in `DECISIONS.md`.

---

## Comandi

| Comando | |
|---|---|
| `sh scripts/build.sh` | compila TypeScript e SCSS e lancia i test (tutto insieme) |
| `npx -y -p typescript tsc` | solo TypeScript: `src/tavola/*.ts` → `Script/tavola/*.js` |
| `npx -y sass --no-source-map CSS/tavola.scss CSS/tavola.css` | solo SCSS |
| `node --test tests/` | test delle funzioni pure di layout (serve il TypeScript già compilato) |
| `python3 -m http.server 4142` | server locale |

I file compilati (`Script/tavola/`, `CSS/tavola.css`) **stanno nel repo** perché in produzione non c'è build:
si editano solo i sorgenti (`src/tavola/`, `CSS/tavola/`) e si ricompila prima di ogni commit.

**Cache:** il browser tiene in cache CSS e JS serviti da `http.server`. Per essere sicuri di provare il codice
nuovo, ricarica ignorando la cache (Cmd+Shift+R) o, dagli strumenti automatici, un reload con `ignoreCache`.

---

## Struttura

```
index.html              ← la Home (unica pagina, per ora); contenuto già nell'HTML, leggibile senza JS
src/tavola/             ← sorgenti TypeScript, un modulo per compito
  types.ts geometry.ts  ← tipi e geometria pura
  layout.ts             ← layout puro: messy (gruppi), phone (colonna + corsie), tidy (griglia); nessun DOM
  items.ts              ← legge gli oggetti dal DOM (data-*), misura, scrive --x/--y/--rot
  camera.ts             ← camera: spostamento, zoom, voli animati (tavolo infinito)
  input.ts              ← puntatori (sposta tavolo/oggetti, pressione lunga col dito, pizzico), rotella, tastiera
  board.ts              ← regia: arrangiamenti, cartelle, salti tra oggetti, fuoco da tastiera
  actions.ts            ← cosa fa il clic in un punto (view, leave, ring, move): lo usano cursore e reazioni
  reactions.ts          ← cerchio a matita (mai sui link che portano fuori), rimbalzo degli adesivi
  cursor.ts controls.ts backgrounds.ts sound.ts preloader.ts viewer.ts email.ts
  request.ts            ← "Ask for the portfolio": modulo che scrive l'email nell'app di chi visita (mailto),
                          con ripiego copia testo/indirizzo; niente servizi esterni
  phone-zoom.ts         ← pinch e vista d'insieme sul telefono
  main.ts               ← avvio
Script/tavola/          ← JS compilato (NON editare)
CSS/tavola.scss         ← entry SCSS; partial in CSS/tavola/ (_tokens _surfaces _fonts _base _table _materials _ui)
CSS/tavola.css          ← compilato (NON editare)
tests/layout.test.mjs   ← niente sovrapposizioni, colonna dentro lo schermo, griglia del Tidy up
Font/Antonia Circular HaveHeart   ← licenze da verificare (Darwin) prima di andare online
Img/                    ← il ritratto e `og-darwin.jpg`, l'anteprima per i link (1200×630, foto vera del tavolo).
                          Se cambia, cambia anche il nome del file: così LinkedIn e WhatsApp non usano quella vecchia
Img/work/               ← immagini dei progetti (lavoro e lab) usate come anteprime
Img/photos/             ← foto di viaggio grandi (si caricano solo nel visore)
Img/photos/thumbs/      ← foto piccole per il tavolo (rullino 360 px, stampe 640 px); il link (href) punta al file
                          grande. Foto nuova: crea la miniatura con
                          `cwebp -resize 360 0 -q 78 Img/photos/<foto>.webp -o Img/photos/thumbs/<foto>.webp`
Img/tools/              ← icone delle app sui tasti della tastierina (96 px; Figma in SVG) e il repository Notion
Img/records/            ← dischi veri (vinile scontornato, sfondo trasparente); le copertine sono disegnate in SVG
```

Il sito precedente (Locomotive, accordion, tema chiaro/scuro, font Matahari e Nognathy) è stato tolto il
10/11/2026 con l'ok di Darwin: è nel tag `old-site`. Il 13/11/2026 sono stati tolti anche i file che usava solo lui
(originali jpg, favicon in più, copertine): si recuperano dal tag, es. `git checkout old-site -- Img/<file>`.

---

## Come funziona il tavolo (in breve)

- **Oggetti** = elementi `.item` con `data-cluster`, `data-at="x,y"`, `data-width`, `data-rotate`, `data-span`,
  `data-group`, `data-small`, `data-decoration`, `data-material`. Il contratto completo è in cima a `items.ts`.
  L'ordine nel DOM è l'ordine di lettura (Tab).
- **Configurazione** nel JSON `#table-config` dentro `index.html`: ordine dei gruppi (messy) e etichette a gesso
  del Tidy up.
- **Computer (≥ 900 px):** `#view` fisso, `#world` trasformato dalla camera. Il tavolo è **infinito**: il pattern
  dello sfondo sta su `#view` e segue la camera (`--cam-x/--cam-y/--k`). Mouse: sposta subito gli oggetti; sul
  vuoto sposta il tavolo. Tastiera: frecce, `+`/`-`, `0` = See all, `T` = Tidy up.
- **Telefono (< 900 px):** niente camera; il tavolo scorre dentro `.view` (mai la pagina, che resta larga quanto lo
  schermo). In disordine: la composizione fatta a mano da Darwin su uno schermo di 390 px
  (`data-phone="x,y"` su ogni oggetto, x dal bordo sinistro dello schermo iniziale), scalata sugli altri schermi;
  gli oggetti hanno le larghezze dei 390 px, così il testo va a capo uguale ovunque. Il tavolo è largo 7 schermi
  (3 per lato), scorre libero e si allarga quando porti un oggetto verso un bordo. Per cambiare la composizione:
  sposta gli oggetti nel browser a 390 px e rileggi le posizioni. In Tidy up: una
  colonna sola (a due colonne per gli oggetti stretti), niente scorrimento laterale. Pressione lunga per sollevare
  un oggetto. Due dita zoomano il tavolo, non la pagina (`phone-zoom.ts`, fino al 250%).
  "See all" mostra tutta la composizione in larghezza e diventa "Zoom back in" (anche dopo un pinch).
- **Barra in basso** = tutti i comandi: Tidy up, See all, zoom, sfondo (cerchio con il pattern), suono. Niente minimappa.
- **Sfondi** (`data-surface` su `<html>`, salvato in localStorage): felt, slate, kraft, plum. Ogni preset definisce
  anche il colore del gesso, così il testo resta leggibile.
- **Suoni** originali sintetizzati con Web Audio (nessun file, nessuna libreria), spenti di default. **Cursore** solo con mouse, annuncia cosa fa il clic
  (`actions.ts`): mano aperta sul tavolo, lente su foto e schermate, freccia ↗ con
  etichetta (`data-cursor="…"`) sui link che portano fuori, mano gialla su tutti gli altri oggetti (si spostano); appena premi
  diventa mano chiusa. **Penna e cerchio rosso al clic sono in pausa** (`PENCIL_ENABLED = false` in `actions.ts`):
  il codice c'è, si riaccende cambiando quel valore. Resta solo il cerchio che segue il mouse sui fotogrammi del
  rullino (hover, `attachFilmHover` in `reactions.ts`). Sulla barra in basso resta il cursore di sistema.

---

## Strategia branch e commit

```
main              ← produzione: il push su main pubblica il sito
feat-<cosa>       ← nuove funzionalità (es. feat-tavola)
fix-<cosa>        ← bug
```

- Nascono da `main` e tornano su `main`.
- **Non eseguire mai `git merge` o `git push` senza conferma esplicita dell'utente**: prima mostrare il riepilogo
  del branch e aspettare il via libera.
- Non includere nei commit i `.DS_Store` né `Script/debug-mobile.js` (sono in `.gitignore`).

## Testi del sito
I testi su Darwin seguono la cartella `~/Documents/GitHub/storytelling/` (fonte dei fatti: `strategy/facts.md`).
Se cambi un testo qui, controlla che sia coerente con quella cartella. Il sito è **pubblico**: niente link diretto
al portfolio privato; si chiede il link (post-it arancione, poi il modulo).
Il footer, quando tornerà, resta "© August 2022": è l'anno di creazione del sito (scelta di Darwin).

---

## Testi sul tavolo
- **Niente orfane:** nessuna parola da sola sull'ultima riga. CSS `text-wrap: balance/pretty` (in `_materials.scss`)
  più `&nbsp;` tra le ultime due parole, perché Firefox/Zen non applica ancora `pretty`. Frasi divise in righe
  volute con `<span class="line">` (titolo e frase sotto) e `.postit__line` (frasi separate su un post-it).
- **Niente stili in linea nell'HTML:** classi e regole SCSS. Fanno eccezione solo i valori che il JS scrive a runtime
  (`--x`, `--y`, `--rot`, larghezze).
- **Link che portano fuori** (altri siti, email): `target="_blank" rel="noopener"`, "(opens in a new tab)" per i
  lettori di schermo, e niente cerchio a matita.
- Misure dei testi negli oggetti in `rem` fissi, non in `vw`: gli oggetti hanno misure fisse sul tavolo.

## Accessibilità e UX (priorità trasversali)

- `prefers-reduced-motion`: niente voli di camera né animazioni; tutto resta visibile.
- Contrasto WCAG 2.1 AA su ogni sfondo (il gesso cambia colore per sfondo).
- Target minimo 44×44 px; focus visibile (giallo); la camera segue il fuoco da tastiera.
- Testare sempre su Chrome (DevTools MCP) e Firefox/Zen (Firefox DevTools MCP), da 360 a 3440 px, con mouse e dito.
