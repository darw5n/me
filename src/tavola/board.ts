/**
 * The board: owns the objects, the arrangement and the camera, and decides what
 * happens when the visitor moves, tidies or opens something.
 *
 * Two shapes, chosen by window width (NARROW_BREAKPOINT):
 * - desktop: a fixed viewport over an infinite table; pan and zoom;
 * - phone: the table scrolls inside `.view`. When messy it is several screens
 *   wide, with the composition Darwin laid out by hand (data-phone), and grows
 *   when an object is carried to an edge; tidy, it is one column as wide as the screen.
 */

import { PENCIL_ENABLED } from "./actions.js";
import { CameraController } from "./camera.js";
import { clamp, easeInOut, union, viewportSize } from "./geometry.js";
import {
  measure, positionOf, readItems, rectOf, render, setWidth, toLayoutItem, type TableItem,
} from "./items.js";
import {
  NARROW_BREAKPOINT, PHONE_BASE_WIDTH, layoutComposed, layoutMessy, layoutTidy, phoneScale, phoneTable,
  phoneTidyFit, tidyGrid, tidyWidth,
} from "./layout.js";
import { attachPhoneZoom, type PhoneZoom } from "./phone-zoom.js";
import { attachFilmHover, createRings, reactToTap, type Rings } from "./reactions.js";
import type { Sound } from "./sound.js";
import type { Arrangement, LayoutResult, Point, Rect } from "./types.js";

export interface BoardConfig {
  /** Clusters in layout order when the table is messy. */
  clusters: string[];
  /** Groups under "Tidy up", with their chalk label, in order. */
  groups: [id: string, label: string][];
}

export interface BoardElements {
  view: HTMLElement;
  world: HTMLElement;
}

export interface BoardCallbacks {
  onArrangement?: (mode: Arrangement) => void;
  onZoom?: (zoom: number) => void;
  /** "See all" is showing everything (true) or the visitor moved away from it. */
  onOverview?: (on: boolean) => void;
}

/** Screen padding kept around the content by "See all". */
const SEE_ALL_PADDING = { x: 40, top: 58, bottom: 76 };
/** Column padding on a phone. */
const PHONE_PADDING = 20;
/** Scale range for objects fitted to the Tidy up grid. */
const TIDY_SCALE_MIN = 0.72;
const TIDY_SCALE_MAX = 1.3;
/** Duration of the Tidy up / Mess it up glide, shared with the SCSS (--tidy-duration). */
const TIDY_MS = 950;
/** Zoom the camera flies to when entering a folder. */
const ENTER_ZOOM = 3.4;

export class Board {
  readonly items: TableItem[];
  mode: Arrangement = "messy";
  narrow = false;
  private readonly camera: CameraController;
  private readonly rings: Rings;
  private readonly phoneZoom: PhoneZoom;
  private readonly labels = new Map<string, HTMLElement>();
  private homeZoom = 1;
  /** Window size at the last layout: a resize keeps the same point of the table in view. */
  private lastSize = viewportSize();
  private zCounter = 40;
  private animationEnd = 0;
  /** Once the visitor has panned or dragged, a relayout keeps the camera still. */
  private touched = false;
  /** Desktop: the camera frames everything after "See all", until the visitor moves. */
  private overview = false;
  /** Phone: x where the centre column starts, to scroll back to it after a resize. */
  private phoneSide = -1;
  /** Phone: screens added on the left because an object was carried there. */
  private phoneExtraScreens = 0;

  constructor(
    private readonly el: BoardElements,
    private readonly config: BoardConfig,
    private readonly sound: Sound,
    private readonly reducedMotion: boolean,
    private readonly callbacks: BoardCallbacks = {},
  ) {
    this.items = readItems(el.world);
    this.items.forEach((item, i) => item.el.style.setProperty("--i", String(i)));
    this.camera = new CameraController({
      world: el.world,
      reducedMotion,
      onChange: (c) => {
        // The surface pattern on the view follows the camera, so the table feels endless.
        el.view.style.setProperty("--cam-x", `${c.x.toFixed(2)}px`);
        el.view.style.setProperty("--cam-y", `${c.y.toFixed(2)}px`);
        el.view.style.setProperty("--k", c.zoom.toFixed(4));
        callbacks.onZoom?.(c.zoom);
        // A pan or zoom by the visitor (not our own flight) leaves the overview.
        if (this.overview && !this.camera.flying) this.setOverview(false);
      },
    });
    this.rings = createRings(sound);
    // Phone: any zoom other than 100% (pinch or "See all") offers "Zoom back in"
    this.phoneZoom = attachPhoneZoom(
      el.view,
      el.world,
      () => this.narrow && !el.world.querySelector(".item.is-dragging"),
      (zoom) => this.setOverview(zoom !== 1),
    );
    attachFilmHover(el.world);
    for (const [id, label] of config.groups) {
      const p = document.createElement("p");
      p.className = "group-label chalk";
      p.textContent = label;
      // Written by hand under Tidy up: after the objects land, one label after the
      // other, longer words take longer (see .group-label)
      p.style.setProperty("--delay", `${TIDY_MS / 1000 * 0.7 + this.labels.size * 0.16}s`);
      p.style.setProperty("--write-ms", `${clamp(label.length * 75, 450, 1300)}ms`);
      el.world.append(p);
      this.labels.set(id, p);
    }
    this.watchFocus();
    this.watchLinks();
  }

  /** Scale of the table on screen: the camera's zoom, or the pinch zoom on a phone. */
  get tableZoom(): number {
    return this.narrow ? this.phoneZoom.zoom : this.camera.state.zoom;
  }

  /** The camera, when it is in charge (not on a phone). */
  get activeCamera(): CameraController | null {
    return this.narrow ? null : this.camera;
  }

  /** Everything on the table, where it currently lies (drag offsets included). */
  contentRect(): Rect {
    return union(this.items.filter((i) => !i.el.classList.contains("is-away")).map((i) => rectOf(i, this.mode)));
  }

  /** Lays everything out again for the current window and arrangement. */
  relayout(): void {
    this.narrow = viewportSize().w < NARROW_BREAKPOINT;
    document.documentElement.classList.toggle("is-narrow", this.narrow);
    const result = this.runLayout();
    for (const item of this.items) {
      const p = result.placements.get(item.id);
      if (p) item.home = p;
      // Decorations fade out under Tidy up instead of vanishing; `inert` takes them
      // out of the tab order and of the accessibility tree meanwhile.
      const away = this.mode === "tidy" && item.decoration;
      item.el.classList.toggle("is-away", away);
      item.el.inert = away;
      render(item, this.mode);
    }
    for (const [id, label] of this.labels) {
      const p = result.labels.get(id);
      label.hidden = !p;
      if (p) {
        label.style.setProperty("--x", `${p.x}px`);
        label.style.setProperty("--y", `${p.y}px`);
      }
    }
    this.homeZoom = result.zoom;
    if (this.narrow) {
      this.el.world.style.transform = "";
      this.el.view.style.removeProperty("--cam-x");
      this.el.view.style.removeProperty("--cam-y");
      this.el.view.style.removeProperty("--k");
      const vw = viewportSize().w;
      const table = this.table();
      const content = this.contentRect();
      // Room to the right of the rightmost object, so the table keeps going
      this.el.world.style.width = `${Math.round(Math.max(table.width, content.x + content.w + vw))}px`;
      this.el.world.style.height = `${Math.round(content.y + content.h + 96)}px`;
      // First layout or a new screen width: the visitor starts on the centre column.
      if (table.side !== this.phoneSide) {
        this.phoneSide = table.side;
        this.phoneZoom.reset();
        this.el.view.scrollLeft = table.side;
      }
    } else {
      this.phoneSide = -1;
      this.phoneZoom.reset();
      this.el.world.style.width = "";
      this.el.world.style.height = "";
    }
    this.rings.refresh(this.el.world);
  }

  private runLayout(): LayoutResult {
    const vw = viewportSize().w;
    // Same widths in every arrangement of a given screen: text never re-wraps when
    // the visitor tidies up, so the objects can glide without jumps.
    // Phone: widths of the 390 px screen the composition was drawn on; other screens
    // scale the objects instead, so text wraps the same everywhere.
    const column = PHONE_BASE_WIDTH - PHONE_PADDING * 2;
    for (const item of this.items) {
      item.scale = 1;
      setWidth(item, this.narrow ? Math.min(item.small ? item.baseWidth * 0.8 : item.baseWidth, column) : item.baseWidth);
    }
    let sized = this.items.map((item) => toLayoutItem(item, measure(item)));

    if (this.mode === "tidy") {
      // Fit each object to its grid column with a uniform scale, kept within a range
      // where text stays comfortable to read.
      const grid = tidyGrid(vw, PHONE_PADDING);
      const scaled = sized.map((li, i) => {
        const item = this.items[i]!;
        let span = li.span;
        if (!this.narrow) {
          item.scale = clamp(tidyWidth(li, grid, li.size.w) / li.size.w, TIDY_SCALE_MIN, TIDY_SCALE_MAX);
        } else if (!li.small) {
          // Phone: half a row or the whole row (see phoneTidyFit)
          const fit = phoneTidyFit(li.size.w, grid);
          span = fit.span;
          item.scale = fit.scale;
        }
        return { ...li, span, size: { w: li.size.w * item.scale, h: li.size.h * item.scale } };
      });
      const tidy = layoutTidy(scaled, { viewportWidth: vw, groupOrder: this.config.groups.map(([id]) => id) });
      return this.narrow ? shiftX(tidy, this.table().side) : tidy;
    }
    if (this.narrow) {
      const k = phoneScale(vw);
      sized = sized.map((li, i) => {
        this.items[i]!.scale = k;
        return { ...li, size: { w: li.size.w * k, h: li.size.h * k } };
      });
      return layoutComposed(sized, { viewportWidth: vw, side: this.table().side, padding: PHONE_PADDING });
    }
    return layoutMessy(sized, { viewportWidth: vw, viewportHeight: viewportSize().h, clusterOrder: this.config.clusters });
  }

  /** Opening view of the current arrangement. */
  home(ms = 0, ease?: (t: number) => number): void {
    if (this.narrow) return;
    void this.camera.flyTo(0, 0, this.mode === "tidy" ? 1 : this.homeZoom, ms, ease);
  }

  seeAll(): void {
    if (this.narrow) {
      this.phoneSeeAll();
      return;
    }
    // Second press: back to the opening view
    if (this.overview) {
      this.setOverview(false);
      this.home(620);
      return;
    }
    // Flight first: an instant one (reduced motion) must not count as the visitor moving.
    void this.camera.fitRect(this.contentRect(), SEE_ALL_PADDING);
    this.setOverview(true);
  }

  private setOverview(on: boolean): void {
    if (on === this.overview) return;
    this.overview = on;
    this.callbacks.onOverview?.(on);
  }

  zoomBy(factor: number): void {
    const camera = this.activeCamera;
    if (!camera) return;
    const v = viewportSize();
    camera.zoomAt({ x: v.w / 2, y: v.h / 2 }, camera.state.zoom * factor);
  }

  setArrangement(mode: Arrangement): void {
    if (mode === this.mode) return;
    this.mode = mode;
    this.setOverview(false);
    const { world } = this.el;
    clearTimeout(this.animationEnd);
    world.classList.add("is-animating");
    world.classList.toggle("is-tidy", mode === "tidy");
    this.el.view.classList.toggle("is-tidy", mode === "tidy");
    this.relayout();
    this.sound.play(mode === "tidy" ? "tidy" : "mess");
    // The class keeps the long, eased transitions until the last object has landed
    // (duration + stagger), then the quick reactions to hover and drag come back.
    this.animationEnd = window.setTimeout(() => world.classList.remove("is-animating"), TIDY_MS + this.items.length * 8 + 100);
    // The camera travels with the objects: same duration, same in-out shape.
    this.home(this.reducedMotion ? 0 : TIDY_MS, easeInOut);
    if (this.narrow) this.scrollPhoneHome();
    this.callbacks.onArrangement?.(mode);
    document.body.classList.add("has-moved");
  }

  toggleTidy(): void {
    this.setArrangement(this.mode === "tidy" ? "messy" : "tidy");
  }

  /**
   * Moves an object by a world delta. On a phone, tidy, it stays inside the column;
   * messy, it goes anywhere, and the table grows when it nears the left edge (the
   * right and the bottom grow by themselves, see relayout).
   */
  moveItem(item: TableItem, delta: Point): void {
    const offset = item.offset[this.mode];
    offset.x += delta.x;
    offset.y += delta.y;
    if (this.narrow) {
      const vw = viewportSize().w;
      const { side } = this.table();
      if (this.mode === "tidy") {
        const p = positionOf(item, this.mode);
        const maxX = side + vw - PHONE_PADDING - rectOf(item, this.mode).w;
        offset.x += Math.min(0, maxX - p.x) + Math.max(0, side + PHONE_PADDING - p.x);
      } else if (positionOf(item, this.mode).x < vw / 2) {
        this.growPhoneLeft();
      }
      offset.y += Math.max(0, 8 - positionOf(item, this.mode).y);
    }
    render(item, this.mode);
    this.touched = true;
    document.body.classList.add("has-moved");
  }

  beginDrag(item: TableItem): void {
    item.el.style.setProperty("--z", String(++this.zCounter));
  }

  endDrag(_item: TableItem, moved: boolean): void {
    if (moved) this.touched = true;
  }

  tapItem(item: TableItem, target: Element): void {
    reactToTap(item, target, this.rings, this.sound);
  }

  /** Called when the visitor panned: remembers it so a relayout does not reset the view. */
  markTouched(): void {
    this.touched = true;
    document.body.classList.add("has-moved");
  }

  /** Fonts and images change sizes: lay out again, keep the view if the visitor already moved. */
  settle(): void {
    this.relayout();
    if (!this.touched) this.home(0);
  }

  /**
   * Window resized (called once the resize has stopped): same arrangement, fresh layout.
   * On the camera table the objects glide to their new spots, like Tidy up; the camera
   * goes back to the opening view, unless the visitor had moved around: then it keeps
   * centred on the same point of the table. Crossing the phone breakpoint is a swap.
   */
  resized(): void {
    const wasNarrow = this.narrow;
    const camera = this.camera.state;
    const before = viewportSize();
    // The point of the table at the centre of the screen, before the resize
    const centre = { x: (this.lastSize.w / 2 - camera.x) / camera.zoom, y: (this.lastSize.h / 2 - camera.y) / camera.zoom };
    this.lastSize = before;
    this.setOverview(false);
    this.phoneExtraScreens = 0;
    const glide = !wasNarrow && before.w >= NARROW_BREAKPOINT && !this.reducedMotion;
    const { world } = this.el;
    if (glide) {
      clearTimeout(this.animationEnd);
      world.classList.add("is-animating");
    }
    this.relayout();
    if (glide) {
      this.animationEnd = window.setTimeout(() => world.classList.remove("is-animating"), TIDY_MS + this.items.length * 8 + 100);
    }
    if (this.touched && !this.narrow && !wasNarrow) void this.camera.centreOn(centre, camera.zoom, glide ? TIDY_MS : 0);
    else this.home(glide ? TIDY_MS : 0, easeInOut);
  }

  /** Phone table for the current screen and growth. */
  private table(): ReturnType<typeof phoneTable> {
    return phoneTable(viewportSize().w, this.phoneExtraScreens);
  }

  /**
   * Phone: two more screens of table on the left. Everything moves right by the
   * same amount and the scroll follows, so nothing seems to move.
   */
  private growPhoneLeft(): void {
    const before = this.table().side;
    this.phoneExtraScreens += 2;
    const grown = this.table().side - before;
    this.phoneSide += grown; // a new side, not a new screen: keep the scroll
    this.relayout();
    this.el.view.scrollLeft += grown * this.phoneZoom.zoom;
  }

  /**
   * Phone. Zoomed (pinch or overview): back to 100% at the height of the spot in
   * the middle of the screen, lined up with the opening screen. At 100%: the whole table across the screen, keeping the spot in
   * the middle at the same height. Tidy, the column already fits across: to the top.
   */
  private phoneSeeAll(): void {
    const { view } = this.el;
    const zoom = this.phoneZoom.zoom;
    const ms = this.reducedMotion ? 0 : 620;
    const centre = { x: view.clientWidth / 2, y: view.clientHeight / 2 };
    const anchor = { x: (view.scrollLeft + centre.x) / zoom, y: (view.scrollTop + centre.y) / zoom };
    if (zoom !== 1) {
      // Back to 100% at the height of the spot in the middle, lined up with the
      // opening screen again (horizontally where the visitor started)
      this.phoneZoom.animateTo(1, anchor, { x: anchor.x - this.table().side, y: centre.y }, ms);
      return;
    }
    const margin = 12;
    const content = this.contentRect();
    const fit = Math.max(0.2, (view.clientWidth - margin * 2) / content.w);
    if (fit > 0.9) {
      this.scrollPhoneHome();
      return;
    }
    this.phoneZoom.animateTo(fit, anchor, { x: (anchor.x - content.x) * fit + margin, y: centre.y }, ms);
  }

  /** Phone: back to the top of the centre column, at 100%. */
  private scrollPhoneHome(): void {
    this.phoneZoom.reset();
    this.el.view.scrollTo({
      left: this.table().side * this.phoneZoom.zoom,
      top: 0,
      behavior: this.reducedMotion ? "auto" : "smooth",
    });
  }

  private centreOnItem(item: TableItem, zoom = this.camera.state.zoom, ms = 420): Promise<void> {
    const p = positionOf(item, this.mode);
    const r = rectOf(item, this.mode);
    return this.camera.centreOn({ x: p.x + r.w / 2, y: p.y + r.h / 2 }, zoom, ms);
  }

  /** Keyboard users: the camera follows the focus, so nothing stays off screen. */
  private watchFocus(): void {
    this.el.world.addEventListener("focusin", (e) => {
      if (this.narrow) return;
      const el = (e.target as Element | null)?.closest<HTMLElement>(".item");
      if (!el) return;
      const r = el.getBoundingClientRect();
      const v = viewportSize();
      const inside = r.left >= 20 && r.top >= 60 && r.right <= v.w - 20 && r.bottom <= v.h - 80;
      if (inside) return;
      const item = this.items.find((i) => i.el === el);
      if (item) void this.centreOnItem(item, this.camera.state.zoom, 360);
    });
  }

  /** A link to `#id` of another object: the camera goes there and rings it. */
  private jumpTo(id: string): boolean {
    const item = this.items.find((i) => i.id === id);
    if (!item) return false;
    if (PENCIL_ENABLED) this.rings.toggle(item.body, true);
    if (this.narrow) item.el.scrollIntoView({ behavior: this.reducedMotion ? "auto" : "smooth", block: "center", inline: "center" });
    else void this.centreOnItem(item, Math.max(1, this.camera.state.zoom), 520);
    return true;
  }

  /** Folders (`a[data-open]`): the camera dives in, a curtain falls, then the page changes. */
  private watchLinks(): void {
    this.el.world.addEventListener("click", (e) => {
      const target = e.target as Element | null;
      const anchor = target?.closest<HTMLAnchorElement>('a[href^="#"]');
      if (anchor && !e.defaultPrevented && this.jumpTo(anchor.getAttribute("href")!.slice(1))) {
        e.preventDefault();
        return;
      }
      const link = target?.closest<HTMLAnchorElement>("a[data-open]");
      if (!link || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      const href = link.href;
      const go = (): void => {
        location.href = href;
      };
      this.sound.play("nav");
      if (this.reducedMotion) {
        go();
        return;
      }
      document.body.classList.add("is-leaving");
      const item = this.items.find((i) => i.el.contains(link));
      if (!this.narrow && item) void this.centreOnItem(item, ENTER_ZOOM, 520);
      setTimeout(go, 560);
    });
    addEventListener("pageshow", (e) => {
      if (e.persisted) {
        document.body.classList.remove("is-leaving");
        this.home(0);
      }
    });
  }
}

/** The same layout moved right by `dx` (phone: the opening screen sits after the free table on its left). */
const shiftX = (result: LayoutResult, dx: number): LayoutResult => {
  const placements: LayoutResult["placements"] = new Map();
  for (const [id, p] of result.placements) placements.set(id, { ...p, x: p.x + dx });
  const labels = new Map<string, Point>();
  for (const [id, p] of result.labels) labels.set(id, { x: p.x + dx, y: p.y });
  return { ...result, placements, labels, bounds: { ...result.bounds, x: result.bounds.x + dx } };
};
