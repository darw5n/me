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

