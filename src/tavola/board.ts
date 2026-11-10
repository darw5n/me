/**
 * The board: owns the objects, the arrangement, the table size and the camera,
 * and decides what happens when the visitor moves, tidies or opens something.
 *
 * Two shapes, chosen by window width (NARROW_BREAKPOINT):
 * - desktop: a fixed viewport over a finite, very large table; pan and zoom;
 * - phone: the table is as wide as the screen, the page scrolls vertically.
 */

import { CameraController } from "./camera.js";
import { inflate, union } from "./geometry.js";
import {
  measure, positionOf, readItems, rectOf, render, setWidth, toLayoutItem, type TableItem,
} from "./items.js";
import {
  NARROW_BREAKPOINT, layoutColumn, layoutMessy, layoutTidy, tidyGrid, tidyWidth,
} from "./layout.js";
import { createMinimap, type Minimap } from "./minimap.js";
import { attachFilmHover, createRings, reactToTap, type Rings } from "./reactions.js";
import type { Sound } from "./sound.js";
import { grownToInclude, renderTable, tableFor } from "./table.js";
import type { Arrangement, LayoutResult, Point, Rect, Size } from "./types.js";

export interface BoardConfig {
  /** Clusters in layout order when the table is messy. */
  clusters: string[];
  /** Groups under "Tidy up", with their chalk label, in order. */
  groups: [id: string, label: string][];
}

export interface BoardElements {
  view: HTMLElement;
  world: HTMLElement;
  table: HTMLElement;
  minimap: HTMLElement | null;
}

export interface BoardCallbacks {
  onArrangement?: (mode: Arrangement) => void;
  onZoom?: (zoom: number) => void;
}

/** Screen padding kept around the content by "See all". */
const SEE_ALL_PADDING = { x: 40, top: 58, bottom: 76 };
/** Column padding on a phone, and where the column starts (below the fixed corners). */
const PHONE_PADDING = 16;
const PHONE_TOP = 72;
/** Zoom the camera flies to when entering a folder. */
const ENTER_ZOOM = 3.4;

export class Board {
  readonly items: TableItem[];
  mode: Arrangement = "messy";
  narrow = false;
  private readonly camera: CameraController;
  private readonly minimap: Minimap | null;
  private readonly rings: Rings;
  private readonly labels = new Map<string, HTMLElement>();
  private table: Rect = { x: 0, y: 0, w: 0, h: 0 };
  private content: Rect = { x: 0, y: 0, w: 0, h: 0 };
  private homeZoom = 1;
  private zCounter = 40;
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
        callbacks.onZoom?.(c.zoom);
        this.minimap?.update();
      },
    });
    this.rings = createRings(sound);
    attachFilmHover(el.world, this.rings);
    for (const [id, label] of config.groups) {
      const p = document.createElement("p");
      p.className = "group-label chalk";
      p.textContent = label;
      el.world.append(p);
      this.labels.set(id, p);
    }
    this.minimap = el.minimap
      ? createMinimap({
          el: el.minimap,
          items: this.items,
          camera: this.camera,
          arrangement: () => this.mode,
          frame: () => inflate(this.contentRect(), 240),
        })
      : null;
    this.watchFocus();
    this.watchLinks();
  }

  /** The camera, when it is in charge (not on a phone). */
  get activeCamera(): CameraController | null {
    return this.narrow ? null : this.camera;
  }

  get viewport(): Size {
    return { w: window.innerWidth, h: window.innerHeight };
  }

  /** Everything on the table, where it currently lies (drag offsets included). */
  contentRect(): Rect {
    return union(this.items.map((i) => rectOf(i, this.mode)));
  }

  /** Lays everything out again for the current window and arrangement. */
  relayout(): void {
    this.narrow = window.innerWidth < NARROW_BREAKPOINT;
    document.documentElement.classList.toggle("is-narrow", this.narrow);
    const result = this.runLayout();
    for (const item of this.items) {
      const p = result.placements.get(item.id);
      if (p) item.home = p;
      item.el.hidden = this.mode === "tidy" && item.decoration;
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
    this.content = this.contentRect();
    this.updateTable();
    this.rings.refresh(this.el.world);
    this.minimap?.update();
  }

  private runLayout(): LayoutResult {
    const vw = window.innerWidth;
    if (this.mode === "tidy") {
      const grid = tidyGrid(vw);
      for (const item of this.items) setWidth(item, tidyWidth(toLayoutItem(item, { w: 0, h: 0 }), grid, item.baseWidth));
      const sized = this.items.map((item) => toLayoutItem(item, measure(item)));
      return layoutTidy(sized, { viewportWidth: vw, groupOrder: this.config.groups.map(([id]) => id) });
    }
    if (this.narrow) {
      const column = vw - PHONE_PADDING * 2;
      for (const item of this.items) setWidth(item, Math.min(item.small ? item.baseWidth * 0.8 : item.baseWidth, column));
      const sized = this.items.map((item) => toLayoutItem(item, measure(item)));
      return layoutColumn(sized, { viewportWidth: vw, padding: PHONE_PADDING, top: PHONE_TOP });
    }
    for (const item of this.items) setWidth(item, item.baseWidth);
    const sized = this.items.map((item) => toLayoutItem(item, measure(item)));
    return layoutMessy(sized, { viewportWidth: vw, clusterOrder: this.config.clusters });
  }

  /** Sizes the table around the content and tells the camera where it may go. */
  private updateTable(): void {
    if (this.narrow) {
      this.el.world.style.transform = "";
      this.table = { x: 0, y: 0, w: window.innerWidth, h: this.content.y + this.content.h + 80 };
      this.el.world.style.height = `${Math.round(this.table.h)}px`;
    } else {
      this.el.world.style.height = "";
      const zoom = this.mode === "tidy" ? 1 : this.homeZoom;
      this.table = tableFor(this.content, this.viewport, zoom);
      this.camera.setBounds(this.table);
    }
    renderTable(this.el.table, this.table);
  }

  /** Opening view of the current arrangement. */
  home(ms = 0): void {
    if (this.narrow) return;
    void this.camera.flyTo(0, 0, this.mode === "tidy" ? 1 : this.homeZoom, ms);
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
    camera.zoomAt({ x: window.innerWidth / 2, y: window.innerHeight / 2 }, camera.state.zoom * factor);
  }

  setArrangement(mode: Arrangement): void {
    if (mode === this.mode) return;
    this.mode = mode;
    const { world } = this.el;
    world.classList.add("is-animating");
    world.classList.toggle("is-tidy", mode === "tidy");
    this.relayout();
    this.sound.play(mode === "tidy" ? "open" : "lift");
    setTimeout(() => world.classList.remove("is-animating"), 900);
    this.home(this.reducedMotion ? 0 : 620);
    if (this.narrow) window.scrollTo({ top: 0 });
    this.callbacks.onArrangement?.(mode);
    document.body.classList.add("has-moved");
  }

  toggleTidy(): void {
    this.setArrangement(this.mode === "tidy" ? "messy" : "tidy");
  }

  /** Moves an object by a world delta; the table grows if it gets close to an edge. */
  moveItem(item: TableItem, delta: Point): void {
    const offset = item.offset[this.mode];
    offset.x += delta.x;
    offset.y += delta.y;
    if (this.narrow) {
      // On a phone the object stays inside the column.
      const p = positionOf(item, this.mode);
      const maxX = window.innerWidth - PHONE_PADDING - item.el.offsetWidth;
      offset.x += Math.min(0, maxX - p.x) + Math.max(0, PHONE_PADDING - p.x);
      offset.y += Math.max(0, 8 - p.y);
    }
    render(item, this.mode);
    this.touched = true;
    document.body.classList.add("has-moved");
    if (!this.narrow) {
      const margin = Math.max(this.viewport.w, this.viewport.h) / this.camera.state.zoom / 2;
      const grown = grownToInclude(this.table, rectOf(item, this.mode), margin);
      if (grown !== this.table) {
        this.table = grown;
        this.camera.setBounds(grown);
        renderTable(this.el.table, grown);
      }
    }
    this.minimap?.update();
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

  /** Keyboard users: the camera follows the focus, so nothing stays off screen. */
  private watchFocus(): void {
    this.el.world.addEventListener("focusin", (e) => {
      if (this.narrow) return;
      const el = (e.target as Element | null)?.closest<HTMLElement>(".item");
      if (!el) return;
      const r = el.getBoundingClientRect();
      const inside = r.left >= 20 && r.top >= 60 && r.right <= innerWidth - 20 && r.bottom <= innerHeight - 80;
      if (inside) return;
      const item = this.items.find((i) => i.el === el);
      if (!item) return;
      const p = positionOf(item, this.mode);
      void this.camera.centreOn({ x: p.x + el.offsetWidth / 2, y: p.y + el.offsetHeight / 2 }, this.camera.state.zoom, 360);
    });
  }

  /** A link to `#id` of another object: the camera goes there and rings it. */
  private jumpTo(id: string): boolean {
    const item = this.items.find((i) => i.id === id);
    if (!item) return false;
    this.rings.toggle(item.body, true);
    if (this.narrow) {
      item.el.scrollIntoView({ behavior: this.reducedMotion ? "auto" : "smooth", block: "center" });
      return true;
    }
    const p = positionOf(item, this.mode);
    void this.camera.centreOn({ x: p.x + item.el.offsetWidth / 2, y: p.y + item.el.offsetHeight / 2 }, Math.max(1, this.camera.state.zoom), 520);
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
      if (!this.narrow && item) {
        const p = positionOf(item, this.mode);
        void this.camera.centreOn(
          { x: p.x + item.el.offsetWidth / 2, y: p.y + item.el.offsetHeight / 2 },
          ENTER_ZOOM,
          520,
        );
      }
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
