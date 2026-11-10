/**
 * The board: owns the objects, the arrangement and the camera, and decides what
 * happens when the visitor moves, tidies or opens something.
 *
 * Two shapes, chosen by window width (NARROW_BREAKPOINT):
 * - desktop: a fixed viewport over an infinite table; pan and zoom;
 * - phone: the table is as wide as the screen, the page scrolls vertically.
 */

import { PENCIL_ENABLED } from "./actions.js";
import { CameraController } from "./camera.js";
import { clamp, easeInOut, union, viewportSize } from "./geometry.js";
import {
  measure, positionOf, readItems, rectOf, render, setWidth, toLayoutItem, type TableItem,
} from "./items.js";
import {
  NARROW_BREAKPOINT, layoutColumn, layoutMessy, layoutTidy, tidyGrid, tidyWidth,
} from "./layout.js";
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
}

/** Screen padding kept around the content by "See all". */
const SEE_ALL_PADDING = { x: 40, top: 58, bottom: 76 };
/** Column padding on a phone, and where the column starts (below the fixed corner). */
const PHONE_PADDING = 16;
const PHONE_TOP = 72;
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
  private readonly labels = new Map<string, HTMLElement>();
  private homeZoom = 1;
  private zCounter = 40;
  private animationEnd = 0;
  /** Once the visitor has panned or dragged, a relayout keeps the camera still. */
  private touched = false;

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
      },
    });
    this.rings = createRings(sound);
    attachFilmHover(el.world);
    for (const [id, label] of config.groups) {
      const p = document.createElement("p");
      p.className = "group-label chalk";
      p.textContent = label;
      el.world.append(p);
      this.labels.set(id, p);
    }
    this.watchFocus();
    this.watchLinks();
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
      const content = this.contentRect();
      this.el.world.style.height = `${Math.round(content.y + content.h + 96)}px`;
    } else {
      this.el.world.style.height = "";
    }
    this.rings.refresh(this.el.world);
  }

  private runLayout(): LayoutResult {
    const vw = viewportSize().w;
    // Same widths in every arrangement of a given screen: text never re-wraps when
    // the visitor tidies up, so the objects can glide without jumps.
    const column = vw - PHONE_PADDING * 2;
    for (const item of this.items) {
      item.scale = 1;
      setWidth(item, this.narrow ? Math.min(item.small ? item.baseWidth * 0.8 : item.baseWidth, column) : item.baseWidth);
    }
    const sized = this.items.map((item) => toLayoutItem(item, measure(item)));

    if (this.mode === "tidy") {
      // Fit each object to its grid column with a uniform scale, kept within a range
      // where text stays comfortable to read.
      const grid = tidyGrid(vw);
      const scaled = sized.map((li, i) => {
        const item = this.items[i]!;
        if (!this.narrow) item.scale = clamp(tidyWidth(li, grid, li.size.w) / li.size.w, TIDY_SCALE_MIN, TIDY_SCALE_MAX);
        return { ...li, size: { w: li.size.w * item.scale, h: li.size.h * item.scale } };
      });
      return layoutTidy(scaled, { viewportWidth: vw, groupOrder: this.config.groups.map(([id]) => id) });
    }
    if (this.narrow) return layoutColumn(sized, { viewportWidth: vw, padding: PHONE_PADDING, top: PHONE_TOP });
    return layoutMessy(sized, { viewportWidth: vw, clusterOrder: this.config.clusters });
  }

  /** Opening view of the current arrangement. */
  home(ms = 0, ease?: (t: number) => number): void {
    if (this.narrow) return;
    void this.camera.flyTo(0, 0, this.mode === "tidy" ? 1 : this.homeZoom, ms, ease);
  }

  seeAll(): void {
    if (this.narrow) {
      window.scrollTo({ top: 0, behavior: this.reducedMotion ? "auto" : "smooth" });
      return;
    }
    void this.camera.fitRect(this.contentRect(), SEE_ALL_PADDING);
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
    const { world } = this.el;
    clearTimeout(this.animationEnd);
    world.classList.add("is-animating");
    world.classList.toggle("is-tidy", mode === "tidy");
    this.relayout();
    this.sound.play(mode === "tidy" ? "tidy" : "mess");
    // The class keeps the long, eased transitions until the last object has landed
    // (duration + stagger), then the quick reactions to hover and drag come back.
    this.animationEnd = window.setTimeout(() => world.classList.remove("is-animating"), TIDY_MS + this.items.length * 8 + 100);
    // The camera travels with the objects: same duration, same in-out shape.
    this.home(this.reducedMotion ? 0 : TIDY_MS, easeInOut);
    if (this.narrow) window.scrollTo({ top: 0, behavior: this.reducedMotion ? "auto" : "smooth" });
    this.callbacks.onArrangement?.(mode);
    document.body.classList.add("has-moved");
  }

  toggleTidy(): void {
    this.setArrangement(this.mode === "tidy" ? "messy" : "tidy");
  }

  /** Moves an object by a world delta. On a phone it stays inside the column. */
  moveItem(item: TableItem, delta: Point): void {
    const offset = item.offset[this.mode];
    offset.x += delta.x;
    offset.y += delta.y;
    if (this.narrow) {
      const p = positionOf(item, this.mode);
      const maxX = viewportSize().w - PHONE_PADDING - rectOf(item, this.mode).w;
      offset.x += Math.min(0, maxX - p.x) + Math.max(0, PHONE_PADDING - p.x);
      offset.y += Math.max(0, 8 - p.y);
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

  /** Window resized: same arrangement, fresh layout, opening view. */
  resized(): void {
    this.relayout();
    this.home(0);
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
    if (this.narrow) item.el.scrollIntoView({ behavior: this.reducedMotion ? "auto" : "smooth", block: "center" });
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
