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
- On phones (< 900 px) the table is as wide as the screen and the page scrolls vertically.
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
