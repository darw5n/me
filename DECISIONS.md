# Decisions

Log of design and architecture decisions that are not obvious from the code. Newest last.

## 2026-11-10 · The site becomes a table

**Decision.** /me is rebuilt as "the table": a finite surface with real objects (notes held
with tape, prints, post-its, folders, tape strips, chalk, stickers) that the visitor can move
and tidy up. The portfolio will share the same engine.

**Why.** Ten rounds of prototypes (storytelling map, ticket "Direzione visiva di /me e
portfolio") converged on this direction. An originality check found the "desk with
draggable objects" genre crowded, but project status stamps, chalk, the pencil ring, Tidy
up, the three-state cursor and the minimap were not found elsewhere: those are the parts to
push.

**Rules agreed with Darwin.**
- The table is finite, but always much larger than the window and the content (at least
  3 windows each way, never less than the content plus a window of margin per side), so the
  edge is rarely met; past it the camera gives way and springs back. It grows when an
  object is carried near an edge.
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
