# Decisions

Log of design and architecture decisions that are not obvious from the code. Newest last.

## 2026-11-10 · The site becomes a table

**Decision.** /me is rebuilt as "the table": an endless surface with real objects (notes held
with tape, prints, post-its, folders, tape strips, chalk, stickers) that the visitor can move
and tidy up. The portfolio will share the same engine.

**Why.** Ten rounds of prototypes (storytelling map, ticket "Direzione visiva di /me e
portfolio") converged on this direction. An originality check found the "desk with
draggable objects" genre crowded, but project status stamps, chalk, the pencil ring, Tidy
up, the three-state cursor and the minimap were not found elsewhere: those are the parts to
push.

**Rules agreed with Darwin.**
- The table is **infinite** (first built finite, then changed the same day: with a finite
  table "See all" showed its edges, which looked wrong). The surface pattern is painted on
  the viewport and follows the camera, so it never ends. "See all" frames the objects.
- All commands live in one floating bar at the bottom: Tidy up, See all, zoom, surface
  (a disc filled with the current pattern, a click moves to the next), sound. No minimap.
- Sounds are original and synthesised with Web Audio: no files, no library.
- On phones (< 900 px, < 720 px since 13/11/2026) the table is as wide as the screen and the page scrolls vertically.
  No camera. A long press lifts an object; it stays inside the column.
- Every object can be moved, also under Tidy up (offsets are kept per arrangement).
- Objects are drafts: they are reviewed one at a time. Darwin redraws some stickers.
- Font licences are Darwin's to verify before going live (Antonia, Circular, Have Heart).

## 2026-11-10 · TypeScript, compiled into the repo

**Decision.** The engine is written in TypeScript (`src/tavola/`), compiled to plain ES
modules in `Script/tavola/` with `npx -y -p typescript tsc`. The compiled files are
committed, like `CSS/tavola.css`, because the site has no build step in production
(GitHub Pages serves the repo as is).

**Why.** The engine has a lot of moving state (camera, layout, drag offsets); types keep
it honest, and the pure layout functions are unit-tested with `node --test`. No bundler, no
package.json: nothing to install.

## 2026-11-10 · Layout is pure, the DOM only measures

**Decision.** `layout.ts` knows nothing about the DOM: it receives sizes and returns
positions. `board.ts` sets widths, measures, calls the layout, writes `--x/--y/--rot`.

**Why.** It makes the three arrangements (messy, column, tidy) testable from Node, and the
overlap checks run on every change without a browser.

## 2026-11-10 · Portfolio request goes through a form

**Decision.** /me will have a form to ask for the portfolio link; the request reaches Darwin
by email and he sends the link. Until the form exists, the orange post-it opens an email
with the subject already filled in.

**Why.** The portfolio is private by link, not protected. A form lets a recruiter ask
without a mail client and lets Darwin decide who gets the link. Note: `darw.it` DNS is on
Aruba, not Cloudflare, so the email sending service is still to be chosen.

## 2026-11-10 · Text on the table

**Decision.** No orphans (a single word on the last line), anywhere. Clauses that must start
a line are `<span class="line">`; CSS `text-wrap: balance / pretty`; and `&nbsp;` between
the last two words of every multi-line text, because Firefox (Zen) does not apply `pretty`
yet. Font sizes inside objects are fixed `rem`, not `vw`: objects have fixed sizes on the
table, so text in `vw` wrapped differently on every screen. No authored inline styles: the
only `style` values are those JavaScript writes at runtime (position, rotation, width).

## 2026-11-10 · Links that leave the table

**Decision.** Links to other sites and email open in a new tab (`rel="noopener"`, "(opens in a
new tab)" for screen readers) and never get the red pencil ring: the ring means "I looked at
this here". Each profile is a different object (business card, tape strip, luggage tag,
label-maker tape, embroidered logo patches, ticket, postage stamp). Vimeo and CodePen, linked on the old
site, are left out for now (to be confirmed by Darwin).

## 2026-11-10 · Props on the desk

**Decision.** A few objects with no content, as drafts: the red pencil (the tool of the
rings) and a roll of film by the photos, which tell something; a paper clip, an eraser and a
coffee ring, which are only atmosphere (Darwin's choice: "anche qualche decorativo"). They
move like everything else, disappear under Tidy up, are hidden from screen readers and never
get the ring (`data-no-ring`). To be reviewed one at a time with the other objects.

## 2026-11-10 · The cursor says what a click does

**Decision.** (Darwin's idea.) The cursor changes with the action: pencil where a click draws
the ring, magnifier on photos and screens, an arrow with a taped label on links that leave
the table, a yellow open hand on things that can only be moved, an open hand on the empty
table. Pressing the button on anything turns it into a closed hand at once, before any
movement: that is how every object shows it can be carried. The bottom bar keeps the
system cursor. Cursor and reactions read the same rules (`actions.ts`), so what the cursor
promises is what the click does.

**Update, same day.** The pencil is on hold: it showed on almost every object and added
little. `PENCIL_ENABLED = false` in `actions.ts` turns off both the pencil cursor and the
ring (notes and cards now show the yellow open hand, like stickers). The code stays, ready
to come back.
The one exception: on the film strip the red ring follows the mouse from frame to frame
(hover only), like a pencil choosing on a contact sheet. Clicking a frame opens it and
leaves no ring.

## 2026-11-10 · Tidy up glides

**Decision.** Tidy up / Mess it up use one curve for everything (`--ease-tidy`, a CSS
`linear()` built from an ease-in-out that lands 3.5% past the spot and settles back), 950 ms,
objects starting 8 ms apart; tilt and camera travel on the same rhythm. Under Tidy up objects
are no longer resized: they keep their width and get a uniform scale (0.72–1.3) to fit the
grid, so text never re-wraps mid-flight. Chalk and props fade out instead of vanishing.

**Why.** Darwin asked for an ease-in-out with a final bounce, smooth and without jumps. The
jumps came from width changes (text re-wrapping) and from objects disappearing at once.

## 2026-11-10 · More things on the desk

**Decision.** Pushpins join the tape: cards and the quote are pinned (red, yellow, blue,
green heads), prints and sheets keep their tape. New objects, all drafts: a stack of three
essays Darwin has read (Thinking, Fast and Slow; Rich Dad Poor Dad; How to Be Everything)
and the one he is reading (The Italian Dream, Alec Ross), plus The Vignelli Canon. Tried with
the real covers, then back to a drawn stack (Darwin preferred it): each spine borrows the
colours and type of its real English cover; The Italian Dream, drawn like its Italian cover
(the only edition); his Nothing Phone (3) and Nothing Headphone (1), as simplified drawings, not
product photos. They carry information, so they stay under Tidy up and have a text
alternative.

## 2026-11-10 · Phone: the column plus side lanes

**Decision.** On phones, when the table is messy, only what matters stays in the centre
column (who Darwin is, the portfolio folder, path, photos, lab, the quote, contacts, other
channels). Extras (project sheets, prints, cards, props, stickers, chalk) lie in a lane to
the left or right of their group, chosen per object with `data-lane` in the HTML, and peek
30 px into the screen from its edges. A sideways swipe rests on the left lane, the centre or
the right lane. Tidy up is still one column with everything, without sideways scrolling.
The table scrolls inside `.view`, not the page.

**Why.** Darwin found the phone page too long (9.5 screens at 390 px, the last two only
decorations) and asked for extras on the sides. The column is now 5 screens. Anything a
recruiter needs (portfolio, contacts) stays in the column. Scrolling inside `.view` keeps
the page as wide as the screen, so the bug where the layout grew with its own overflow
cannot come back; the cost is that the iOS address bar no longer shrinks while scrolling.

## 2026-11-10 · Phone: pinch zooms the table

**Decision.** On phones two fingers zoom the table (50% to 250%), not the page: the corner
and the bar keep their size. Zoomed, the table pans freely; at 100% the lanes snap again.
"See all" and Tidy up come back to 100%. Safari's page zoom is blocked on the table only.

**Why.** Darwin asked for pinch zoom like on the desktop. Browser zoom scaled the fixed bar
too. Text can still be enlarged to 250%, above the 200% that WCAG asks for.

## 2026-11-10 · Phone: a much wider table, scrolling freely

**Decision.** The phone table, when messy, is 7 screens wide (3 on each side of the
column) and scrolls freely in both directions with native scrolling: no more snapping to
three positions. It grows when an object is carried to its left edge (two more screens);
the right and the bottom grow by themselves. Tidy up is unchanged.

**Why.** Darwin wanted much more room sideways, close to the desktop's infinite table. Of
the two ways offered, he chose a very wide native table over a desktop-like infinite
canvas, which would have replaced native vertical scrolling with dragging the table.

## 2026-11-10 · Phone: a composition laid out by hand

**Decision.** The messy phone table is no longer computed: Darwin arranged the objects
himself on a 390 px screen, and each object carries its spot as `data-phone="x,y"`. Other
phones get the same composition scaled as a whole (0.8 to 1.15), with objects at their
390 px widths, so text wraps the same everywhere and overlaps stay as he chose them (the
Now post-it over the portrait's corner, a sticker on the photos note). The side lanes
(`data-lane`) are gone. Chalk is a little larger on phones (3rem and 2.35rem) so it stands
out on the dark table.

**Why.** Darwin showed the arrangement he wanted by moving the objects himself: a desk
where things also sit half off screen, inviting a look around, rather than a column with
lanes. Scaling the whole composition keeps it intact from 320 px up.

## 2026-11-10 · Phone: See all shows the whole table

**Decision.** On phones "See all" zooms the table out until the whole composition fits
across the screen, keeping the spot in the middle at the same height, and becomes "Zoom
back in", which returns to 100% at the height of the spot in the middle, lined up
with the opening screen. Any zoom other than 100%
(pinch included) shows "Zoom back in". Tidy up fits the screen already: there See all
goes to the top.

**Why.** Scrolling back to the top was not useful (Darwin). The overview is the same idea
as on the desktop, and gives the view of the whole table that Darwin missed while
arranging it.

## 2026-11-10 · Viewer bar and hand-written chalk labels

**Decision.** The photo viewer's commands sit in a bar shaped like the table's, in the same
spot, but light (paper) on the dark backdrop: ‹ 2 / 6 › first, with 48 px arrows and the
count as a plain label between them, then Close, yellow, on the right. No outline. Under
Tidy up the chalk labels of the groups are written by hand after the objects land: a mask
uncovers each word left to right with a soft edge, one after the other, longer words
taking longer. Reduced motion shows them at once.

**Why.** Darwin found the arrows hard to tap (the count was squeezed between them), wanted
Close on the right and no outline, and asked to try a white bar first, falling back to the
black one if it did not work. He asked for the chalk to appear as if someone were writing it.

## 2026-11-10 · Ask for the portfolio: a form that writes the email

**Decision.** The orange post-it opens a short form (name, optional company and message).
Submitting opens the visitor's own email app with the subject and text ready (mailto:),
from their address; nothing is sent or stored by the site. The second state shows the
message and Darwin's address with buttons to copy them, for visitors without an email app.
The address stays split in data attributes, out of the HTML.

**Why.** The site is static on GitHub Pages and the domain's DNS is on Aruba. Of the three
ways offered (a form service, a Cloudflare Worker that needs the DNS moved, a pre-filled
email), Darwin chose the pre-filled email: no third party, no cost. The copy buttons cover
its weak spot.


## 2026-11-13 · Meta, link preview and icon follow the table

**Decision.** Title and description use the headline from the storytelling folder ("Tinkerer by nature, product
designer by trade…"), not the older "complicated products feel simple" line. The preview image (`Img/og-darwin.jpg`)
is a real shot of the table at 1200×630, and the favicon is a chalk "D" on the felt mat, the same in the portfolio.
Both are proposals: Darwin may redraw them in Figma at the end.

**Why.** Everything in the head still came from the previous site (pink "chi sono e cosa faccio" image, Trento in the
title). A new file name for the preview also makes LinkedIn and WhatsApp fetch it again instead of the cached one.

**Open: the domain.** darw.it is an Aruba frame around `darw5n.github.io/me`: crawlers read the frame (title
"darw.it", no description, no image), not this page. Until the domain points to GitHub Pages, `og:url` and
`og:image` use the github.io address. When it moves: Aruba A records → GitHub Pages, custom domain in the repo
settings, then switch those two URLs to `https://darw.it/`.

## 2026-11-15 · darw.it points to GitHub Pages, no more frame

**Decision.** The Aruba frame goes: the DNS of `darw.it` points to GitHub Pages (A records of `@` to GitHub's four
addresses, `www` as a CNAME to `darw5n.github.io`), the repo has a `CNAME` file with `darw.it`, and GitHub serves the
site there with HTTPS; `darw5n.github.io/me` redirects to it. The page names `https://darw.it/` as canonical, in
`og:url` and `og:image`, and gives its name to search engines (WebSite in JSON-LD). The mail records on Aruba stay
as they are.

**Why.** Google showed two results: the frame on darw.it (old title and text, plain http, no preview) and the real page
on github.io, named "GitHub Pages documentation". One address, the real page on it, merges them over time.

**Order.** DNS first, then the push with the `CNAME`: with the frame still on, github.io would send visitors to
darw.it, which frames github.io again. **Back:** the old values in the Aruba DNS and the frame, then remove `CNAME`.

## 2026-11-13 · Tools: a macro pad, not a row of logos

**Decision.** The apps Darwin opens every day sit on ten keycaps of a small macro pad (cluster `tools`, "on my
desk"): the icon printed on top, the name on the front edge. Next to it, his mouse (MX Master 4), drawn.
The list comes from the `tools` note of his context (Claude, Figma, Notion, Notion Calendar, Granola, Wispr Flow,
Raycast, Zen, Goldfish, Spotify); tools he no longer uses (Arc, VS Code, Cursor…) are out, and their logos left the repo.

**Why.** The icons come in mixed styles (some with their own rounded square, some cut out). On a keycap they read as
one set, and a keycap is a real object on a desk, like everything else on the table. The name on the key keeps them
readable for those who don't know the icon; the `alt` of each icon carries it for screen readers. Under the pad, a
sheet with Darwin's design repository in Notion ("Where I go looking for ideas"), shareable by his choice.

## 2026-11-13 · On repeat: records whose vinyl slides out

**Decision.** A cluster `records` ("on repeat"): sleeves with the vinyl peeking out on the right; under the mouse
the vinyl slides out and turns. With reduced motion, or with a finger, it stays peeking. The headphones moved here.
Sleeves and game cases show the real covers (Darwin's choice, 13/11/2026), taken from Wikipedia
and, for Cosmo, from the iTunes catalogue; Cosmo's vinyl is the picture Darwin had. Jamie xx *In Colour* and Tame Impala *Currents* are a first pick among the artists Darwin listens to:
to confirm or swap.

## 2026-11-13 · Been there: a passport and the next boarding pass

**Decision.** A cluster `trips` ("been there"): an open passport with one stamp per trip abroad, and a boarding
pass for the next trip ("To China · Planning · In Notion").

Stamps follow the style of travel-app stamps (13/11/2026, Darwin's reference): one ink colour, the city on top in
its own script (서울, 京都…), the country code on the left, a line icon of a landmark, the year below.

The boarding pass is a real one (Trento → Shanghai, a perforated stub with the barcode), and next to it a folded map
of China with the route drawn by hand: Shanghai, Hong Kong, Guilin · Yangshuo, Kunming, Lijiang, back to Shanghai.
Coast and cities sit at their real longitude and latitude (`index.html`, simple equirectangular projection).

**Privacy rule.** The site is public: only city and year. No companions, costs, reasons or exact dates, and the
next trip has no dates (they would say when the house is empty). The full diary lives in Darwin's private notes.

## 2026-11-13 · The boss: Caramella in polaroids

**Decision.** Caramella gets her own cluster (`caramella`, "the boss"): her card, three polaroids (square photo,
handwritten caption, no tape: `.print--polaroid`) and her sticker, now cut from a real photo along the outline of her
head (`.sticker--photo`, the white edge is in the image). Photos are cropped from Darwin's originals with the
orientation applied and **all metadata removed** (phone photos carry GPS).

## 2026-11-13 · Press start: the controller and a few games

**Decision.** A cluster `games` ("press start"): Darwin's white DualSense, drawn from above, and four game cases,
each a separate object with its real cover, picked from his favourites (Astro Bot, Ratchet & Clank: Rift Apart, The Last of Us Part I, Rayman Legends).
The band on the case says PS5 or PS4, as the real game.

## 2026-11-13 · The viewer becomes the portfolio's

**Decision.** `viewer.ts` now works like the portfolio's lightbox: the whole screen is a window on the picture, a
click zooms in there (wheel and two fingers too, a drag moves it), a click off the picture closes; the caption is a
strip of tape above the bar; the veil takes the colour of the picture on show (its hue, dark and soft, with grain)
and changes with every picture. The arrows walk through every picture on the table in reading order.

**Why.** With one picture per object the bar shrank to a lonely yellow Close (Darwin, 13/11/2026). Walking through
all the pictures fixes it at the root; a Close alone, should it happen, keeps a real width (`.is-solo`).

## 2026-11-13 · Breakpoints: the table takes the shape of the screen

**Decision.**
- **Tablets and landscape phones get the camera table.** The breakpoint moves from 900 to 720 px
  (`NARROW_BREAKPOINT`, SCSS `$narrow`/`$wide`). Between 600 and 900 px the 390-px phone composition filled
  only the left half of the screen. The camera table already works with fingers (drag pans, pinch zooms, long
  press lifts an object). Under 720 px the hand-made phone composition stays as it was.
- **The messy table takes a shape close to the screen's**, a little wider (×1.15), instead of a fixed 2150 px
  strip. `layoutMessy` tries table widths on a 320-px step and keeps the one whose packed shape is nearest the
  screen's ratio. Clusters are packed bottom-left (skyline), in their order: the first stays top left, a short
  cluster fills the gap next to a tall one. Every other cluster sits 46 px lower, so it never reads as a grid.
- **Resizing is a glide.** The layout waits until the window stops changing (160 ms), then the objects glide to
  their new spots with the Tidy up curve (no glide with reduced motion). If the visitor had moved around, the
  camera stays on the same point of the table; otherwise it goes back to the opening view.

**Why.** Before, a dozen clusters stacked one per row: a table 6000 px tall and 2150 wide, so "See all" showed it
at 12% on a 1440×900 screen, and wide screens stayed mostly empty. Now 29–31% at 1440, 37% at 1920, 60% at
3440 (portfolio home: 21% → 41% at 1440).

**Trade-off.** A table shaped by the screen reshuffles a few times while a window is dragged wider (about 8
times from 900 to 2560 px, before: 4). Fixed gaps between clusters and a single step of extra air (≥ 1800 px)
keep it from reshuffling for nothing, and each reshuffle is a glide, not a jump.

## 2026-11-13 · Zones: work, life, contacts

**Decision.** The messy table is split into three zones (`zones` in `#table-config`): how Darwin works (who, work,
path, lab, tools), off the clock (photos, trips, Caramella, records, games, books), and contacts. Each zone is packed
on its own, then the zones are packed as blocks with a gap about three times the gap between clusters
(`ZONE_GAP_X/Y`), so the areas read apart; the work zone opens the table top left. Tidy up follows the same order.
Three objects moved to their theme: the colleague's quote joins the path (it is proof of work), the Trips card joins
the passport, the drum-and-bass sticker joins the records.

**Why.** With 13 clusters at the same distance, work and hobbies read as one pile, and hobbies outnumber work
(38 objects against 27). Darwin asked for two versions to compare: zones only, and zones plus cuts.

## 2026-11-13 · Nine areas on a grid (version A, refined)

**Decision (Darwin chose version A, then asked for macro areas, more space between them, a 3×3 grid on large
screens).** The zones become nine areas, read row by row: who · work (projects, path, quotes) · lab and tools /
photos · trips · Caramella / music and games · books · contacts and profiles. Each area is packed on its own as a
landscape cell (it never reshuffles inside when the window changes), then the areas sit on a grid with 320 × 300 px
between them: 3 columns from 1200 px, below that 1–3 columns, whichever fits the screen's shape. Phones keep the
hand-made composition.

**Also.** Two more colleague quotes join the work area, from other roles than Nikola's: Franco Dall'Ongaro
(software engineer, the designer's eye) and Francesca Tosi (product manager, the solutions), in the English
translations prepared in `storytelling/evidence/colleague-feedback.md`, where their permission is recorded. The
area titles in chalk are bigger (3.4rem) and thicker (a stroke in the chalk colour), and sit higher above their
area, so they read from afar.

**Refined the same day (Darwin).** Inside each area the objects sit as a compact block (two above, two below), not
in a long row: Caramella's card and polaroids, the records and headphones, the four game cases. Books and games now
share an area ("off the clock"), music has its own. In the work area the career path comes first, a little larger
(1.45rem on the table, unchanged on phones), with the three quotes under it, then the project screens. Every quote
keeps its last two words together (`&nbsp;`), so no word is left alone on a line, also in Firefox.

## 2026-11-13 · Phone: a grid, the middle column first

**Decision (Darwin: "on mobile the objects are too close; the middle column matters most").** On phones the
messy table becomes a grid of three screen-wide columns (`"phone"` in `#table-config`, band by band). The middle
column, the one that opens, reads like a page with no gaps: who and the career path, the portfolio folder, the
film strip and the photo post-it, the contacts. The side columns, a swipe away, hold what goes with each band, level
with it: the project sheets left of the folder and the colleague quotes right of it; lab and tools beside the photos,
with the loose prints on the other side; trips and Caramella beside the contacts; music, books and games below.
Inside a cell objects flow in reading order with more air (28 / 40 / 110 px instead of 20 / 28 / 84).
`data-phone-area` puts an object in a different area than its cluster (sheets, quotes, prints).

**Replaces** the hand-made composition on /me (`data-phone` stays in the markup and still drives the portfolio,
which declares no grid). Darwin can still move objects by hand; a new object needs no coordinates any more.

## 2026-11-13 · Preloader and entrance

**Decision (Darwin).** The preloader waits for the fonts and every image on the table, loaded and decoded (it used to
wait at most 2.6 s, for some of them), so nothing jumps; on a slow line it opens anyway after 6 s. While it waits:
"Darwin Vegher", a chalk line filled by the real progress, and a phrase that changes every second like Claude Code
while it works, with its pulsing star (✻ ✽ ✶…). The phrases are the page's (`data-phrases`), so the portfolio can
have its own; they are drafts to review. Then the entrance: the cloth is pulled away from the top-left corner, so
the lines of the mat appear as it goes, and the objects in view land one after the other in reading order (45 ms
apart, at most 1.3 s). Quick on a second page of the same visit; with reduced motion the phrase stays still and
there is no pull and no stagger.

**Refined (Darwin: "a bit longer than needed, so the animation shows; optimise the fonts").** At least 3.4 s from
the opening of the page (about four phrases), a phrase every 0.85 s, the star breathes and turns, the progress line
fills with time or loading, whichever is slower. Fonts: no system fallback in the preloader (it would change face
mid-animation); instead its two fonts are preloaded first and use `font-display: block`, and Have Heart is now
WOFF2 (309 → 168 KB; not subset: its licence is still to be checked). The words no longer wait for the scripts:
on 4G they show at 0.7 s instead of 1.8 s.

## 2026-11-13 · The table's cursor stays in the viewer and the dialogs

**Decision (Darwin).** The table's cursor no longer gives way to the system one when a photo or a dialog opens. It
moves into the open `<dialog>` (the top layer would hide it otherwise) and says what a click does there: on the
picture the magnifier "zoom in" (zoomed: the hand, the fist while dragging), on the veil the open hand "close", on
the paper of the form the open hand. Bars, buttons and text fields keep the system cursor, as the table's own bar
does: they are interface, and a text field needs its I-beam.

**Revised the same day (Darwin moved the middle column by hand, then: "the other areas grouped at the sides, not too
close to the middle").** The middle column is Darwin's own composition (`data-phone` on its items), more compact
than the computed one (it ends at about 3950 px instead of 4800), with stickers and the pencil tucked at its edges.
Beside it each area is a compact group shaped like on the desktop (its `data-at`), 200 px from the middle, level with
its row; a side holding two areas stacks them. On phones "See all" can now zoom out to 12% (was 20%), so the
wider table fits.
Then (Darwin): music to the left of "who", books and games to its right, so they no longer lengthen the page (about
4500 px tall instead of 5200); 240 px between two groups on the same side, so each reads as a group of its own.

## Parked · Composition mode (idea, 13/11/2026)

Not built. A mode for Darwin only (`?compose` in the address): Shift+click or a drawn rectangle selects several
objects, dragging one moves them all, and a "Copy positions" button copies `data-phone` / `data-at` of every object,
to paste in a session. It would let him compose from a real phone, and lose nothing on a reload. Alt+click was
ruled out: on a Mac it downloads the target of a link, and most objects are links.

## 2026-11-13 · Keyboard shortcuts, and a card that lists them

**Decision (Darwin).** ⌘/Ctrl + and − zoom the table like the bar's buttons, not the page; ⌘/Ctrl 0 is See all.
Plain keys join T, + − 0 and the arrows: B changes the surface, S the sound, ? opens a card with every shortcut and
the mouse and finger gestures ("⌘ + scroll or pinch: zoom"), for those who would never guess them. The bar's
buttons show their key on hover and announce it (`aria-keyshortcuts`). Every shortcut presses the bar's own button.

**Not used:** ⌘T and ⌘M, which Darwin first suggested: the browser opens a tab and the system minimises the
window, and no page can stop them. ⌘B would take away the bookmarks of Firefox and Safari. Hence plain letters.

## 2026-11-13 · Chalk grain as a mask, not a live filter (Safari)

**Decision.** The chalk grain is a still texture of speckles (a 96 px PNG inside the CSS, tiled at 64 px) used as a
mask on writing and drawings, instead of the SVG filter `#chalk` (noise plus a slight wobble).

**Why.** Measured in Safari 27 on Darwin's Mac, 3840 px window: with the filter the table moved at 0–2 fps (frames
of several seconds); without it, about 50 fps. Safari recomputed the filter on every chalk mark at every frame;
Chrome and Firefox cache it. A mask is composited and costs almost nothing everywhere. The wobble of the edges is
gone: the script is hand-written already. The texture lives in the CSS (not in Img/) so the portfolio, which gets
only the compiled CSS, has it too.
Measured again in Safari after the change: entrance 0 → 56 fps, moving 0 → 50 fps, zooming 2 → 21 fps. Zooming
was still slow because Safari redraws a mask at every new scale (50 fps zooming without the grain), so the grain
also goes while the scale changes and comes back 0.2 s after the zoom rests (`is-zooming`, board.ts). Moving at the
same scale keeps it.

## 2026-11-16 · Area grid without holes, and an opening frame chosen by hand (for the portfolio)

**Decision.** On large screens the areas take up to 3 columns, as many as leave the fewest empty cells: nine areas
stay 3×3 (/me unchanged), four become 2×2 instead of three in a row and one below. And a new, optional mark:
objects with `data-opening` set the opening view on a computer, which frames all of them (from the top left,
between 50% and 100%, with the usual margin on the left and only 24 px to the right and below, since the table
goes on past the edge and the bar is narrow and centred). /me has none, so it still opens at 100%, as before.

**Why.** Darwin asked the portfolio to get /me's roomy areas, in four blocks on a 2×2 grid, and to show projects
as soon as it loads, at least the starred folders. With areas far apart, the opening at 100% showed only the intro;
Darwin then composed the opening by hand (intro on top, the three starred folders below, the centre one higher so
the bar sits under it), and wants it at 100% where it fits: 100% from about 1710×920, 87% at 1440×900.

## 2026-11-25 · Home details: records, a card about the table, the design repository

**Decision.**
- The two black records (Jamie xx, Tame Impala) are drawn in CSS to look like Cosmo's real
  disc (fine grooves, gaps between tracks, a smooth ring around the label, two soft
  reflections), with a label cut from the album cover: each record keeps its album's colours.
  No new image files.
- The Forma card is gone ("the app I train with at home" did not say what it was). In its
  place, in the lab, a card about the table itself: the project visitors already have in
  front of them, and the one that shows the frontend side.
- The design repository sheet opens the public Notion board in a new tab (it used to open a
  screenshot in the viewer); the large screenshot it used is removed, the thumbnail stays.
- The table card links to the public repo (`darw5n/me`), with the arrow next to its title:
  the card says how the site is made, the link lets the curious check.
- Football sticker and controller redrawn (a real ball pattern with some volume; the
  DualSense with its real parts: black core, light bars, create/options, mute).
- The opening view on a computer had an empty lower left: the chalk line, the pencil, the
  bulb and "Open to new roles" sat to the right and further down. Darwin recomposed it by
  hand: the intro top left, the portrait lower on the right with the "Now" post-it stuck on
  its corner, the chalk line under the intro, the bulb after it, the pencil at the bottom,
  the green sticker under the post-it. The post-it and the bulb are `data-on-top`: they
  touch other objects on purpose, and the layout would otherwise push them apart. The first
  screen holds above the bar at 1440×900 (100%) and in a small window (75%).
