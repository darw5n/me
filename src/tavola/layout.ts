/**
 * Layout of the objects on the table. Pure functions: no DOM, so they run in
 * unit tests under Node.
 *
 * Three arrangements:
 * - messy (desktop): objects are grouped in clusters; clusters are packed in rows
 *   as wide as the table allows, so a large window gets more air and a small one
 *   wraps.
 * - column (phone): objects flow in reading order inside the screen width, like a
 *   page that only scrolls vertically.
 * - composed (phone, messy): positions laid out by hand on a 390 px screen,
 *   scaled to the screen.
 * - tidy (both): a real grid, one row of columns per group, with a chalk label.
 *
 * Every arrangement ends with `relax`, which pushes objects apart when they touch.
 * It is monotone (earlier objects stay, later ones move only right or down), so it
 * always terminates and never jitters.
 */

import { clamp, rotatedBox, union } from "./geometry.js";
import type { LayoutItem, LayoutResult, Placement, Placements, Point, Rect, Size } from "./types.js";

/** Minimum distance between two objects, in world px. */
const GAP_LARGE = 34;
const GAP_SMALL = 12;

/**
 * Breakpoint under which the table becomes the hand-made phone composition. Shared with
 * the SCSS ($narrow). From here up, tablets and landscape phones get the camera table,
 * which works with fingers too (13/11/2026: 900 left half of a tablet empty).
 */
export const NARROW_BREAKPOINT = 720;

interface Box extends Rect {
  item: LayoutItem;
}

const boxOf = (item: LayoutItem, at: Point, scale = 1): Box => {
  const r = rotatedBox(item.size, item.rotation);
  return { item, x: at.x * scale, y: at.y * scale, w: r.w, h: r.h };
};

/**
 * Pushes overlapping boxes apart. Objects already settled never move again and
 * a moving object only goes right or down, along the shorter escape. With
 * `downOnly` (the phone column) it never goes sideways, so it stays on screen.
 */
export const relax = (boxes: Box[], large = GAP_LARGE, small = GAP_SMALL, downOnly = false): void => {
  for (let j = 1; j < boxes.length; j++) {
    const b = boxes[j]!;
    if (b.item.onTop) continue; // lies on other objects on purpose
    let hit = true;
    for (let guard = 0; hit && guard < 60; guard++) {
      hit = false;
      for (let i = 0; i < j; i++) {
        const a = boxes[i]!;
        if (a.item.onTop) continue;
        const gap = a.item.small || b.item.small ? small : large;
        const pushRight = a.x + a.w + gap - b.x;
        const pushDown = a.y + a.h + gap - b.y;
        const apart = pushRight <= 0 || pushDown <= 0 || b.x + b.w + gap <= a.x || b.y + b.h + gap <= a.y;
        if (apart) continue;
        hit = true;
        if (!downOnly && pushRight < pushDown) b.x += pushRight;
        else b.y += pushDown;
      }
    }
  }
};

/**
 * Placement of an un-rotated element whose rotated box has its top-left at `box`.
 * Rotation happens around the centre, so the element starts a little inside.
 */
const placementFor = (box: Box, rotation: number): Placement => ({
  x: box.x + (box.w - box.item.size.w) / 2,
  y: box.y + (box.h - box.item.size.h) / 2,
  rotation,
});

interface Cluster {
  boxes: Box[];
  bounds: Rect;
}

const buildCluster = (items: LayoutItem[], air: number): Cluster => {
  const boxes = items.map((item) => boxOf(item, item.rel, air));
  relax(boxes);
  return { boxes, bounds: union(boxes) };
};

export interface MessyOptions {
  viewportWidth: number;
  /** Height of the window: the table takes a shape close to the screen's. */
  viewportHeight?: number;
  /** Order in which clusters are laid out, left to right, top to bottom. */
  clusterOrder: string[];
  /**
   * Zones: clusters on the same theme, kept together and set apart from the other zones
   * by a wider gap. The first zone opens the table top left. Clusters missing from every
   * zone form one last zone. Without zones, the whole table is one zone.
   */
  zones?: string[][] | undefined;
}

/** Gap between zones: about three times the gap between clusters, so areas read apart. */
const ZONE_GAP_X = 300;
const ZONE_GAP_Y = 280;

/** Zoom at which the messy table opens: the widest cluster fits the window. */
export const homeZoom = (clusters: Cluster[], viewportWidth: number, margin: number): number => {
  const widest = Math.max(1, ...clusters.map((c) => c.bounds.w));
  return clamp((viewportWidth - margin * 2) / widest, 0.62, 1);
};

interface Spot {
  x: number;
  y: number;
}

/**
 * Skyline packing (bottom-left): clusters are placed in their order, each one where
 * the skyline is lowest for its width (ties: further left). The first cluster lands top
 * left and reading order mostly holds, but a short cluster fills the gap next to a tall
 * one instead of starting a new row. Every other cluster sits a little lower, so the
 * table never reads as a grid.
 */
const packSkyline = (clusters: Cluster[], width: number, gapX: number, gapY: number, stagger = 46): Spot[] => {
  // The skyline: x positions where its height changes, and the height from each on
  let edges: { x: number; y: number }[] = [{ x: 0, y: 0 }];
  const heightOver = (x0: number, x1: number): number => {
    let h = 0;
    for (let i = 0; i < edges.length; i++) {
      const a = edges[i]!.x, b = i + 1 < edges.length ? edges[i + 1]!.x : Infinity;
      if (b > x0 && a < x1) h = Math.max(h, edges[i]!.y);
    }
    return h;
  };
  const raise = (x0: number, x1: number, y: number): void => {
    const after = heightOver(x1, x1 + 0.01);
    const kept = edges.filter((e) => e.x < x0 || e.x > x1);
    kept.push({ x: x0, y }, { x: x1, y: after });
    kept.sort((p, q) => p.x - q.x);
    // Drop the edges that do not change the height
    edges = kept.filter((e, i) => i === 0 || e.y !== kept[i - 1]!.y);
  };
  return clusters.map((c, i) => {
    const w = c.bounds.w + gapX;
    const h = c.bounds.h + gapY + (i % 2 ? stagger : 0);
    let best: Spot | null = null;
    for (const e of edges) {
      const x = Math.min(e.x, Math.max(0, width - c.bounds.w));
      const y = heightOver(x, x + w);
      if (!best || y < best.y - 0.5 || (Math.abs(y - best.y) <= 0.5 && x < best.x)) best = { x, y };
    }
    raise(best!.x, best!.x + w, best!.y + h);
    return { x: best!.x, y: best!.y + (i % 2 ? stagger : 0) };
  });
};

/** Candidate table widths step by this much, so a small resize keeps the same table. */
const WIDTH_STEP = 320;

export const layoutMessy = (items: LayoutItem[], opts: MessyOptions): LayoutResult => {
  const { viewportWidth } = opts;
  const viewportHeight = opts.viewportHeight ?? viewportWidth / 1.6;
  const margin = clamp(viewportWidth * 0.04, 36, 96);
  // A large window gets a little more air between objects: one step, not a slope, so
  // clusters keep their size (and their spots) while the window is resized
  const air = viewportWidth >= 1800 ? 1.1 : 1;

  const keys = opts.clusterOrder.filter((key) => items.some((i) => i.cluster === key));
  const clusters = keys.map((key) => buildCluster(items.filter((i) => i.cluster === key), air));
  // Zones as lists of indexes into `clusters`, in table order
  const zoned = new Set<string>();
  const zones = (opts.zones ?? [])
    .map((zone) => zone.filter((key) => keys.includes(key) && !zoned.has(key) && zoned.add(key)))
    .filter((zone) => zone.length > 0);
  const rest = keys.filter((key) => !zoned.has(key));
  if (rest.length) zones.push(rest);
  const zoneIndexes = zones.map((zone) => zone.map((key) => keys.indexOf(key)));

  const zoom = homeZoom(clusters, viewportWidth, margin);
  // The table is at least as wide as the opening screen, so the first clusters fill it
  const fitWidth = (viewportWidth - margin * 2) / zoom;
  const widest = Math.max(...clusters.map((c) => c.bounds.w));
  // Fixed gaps between clusters: if they grew with the window, a cluster could fit a
  // gap at one width and not at the next, and the table would reshuffle while resizing
  const gapX = 96;
  const gapY = 104;

  // The table takes the shape closest to the screen's (a little wider: the opening
  // screen shows its top left and the rest invites a drag). Widths are tried on a fixed
  // step, so resizing by a few pixels never reshuffles the clusters.
  const target = (viewportWidth / viewportHeight) * 1.15;
  const from = Math.ceil(Math.max(fitWidth, widest) / WIDTH_STEP) * WIDTH_STEP;
  let pick: { spots: Spot[]; width: number; score: number } | null = null;
  // Each zone is packed on its own, then the zones are packed as blocks, wider apart
  const packZones = (width: number): Spot[] => {
    const spots: Spot[] = Array<Spot>(clusters.length);
    const local = zoneIndexes.map((idx) => packSkyline(idx.map((i) => clusters[i]!), width, gapX, gapY));
    const blocks: Cluster[] = local.map((zs, z) => {
      const idx = zoneIndexes[z]!;
      const w = Math.max(...zs.map((p, k) => p.x + clusters[idx[k]!]!.bounds.w));
      const h = Math.max(...zs.map((p, k) => p.y + clusters[idx[k]!]!.bounds.h));
      return { boxes: [], bounds: { x: 0, y: 0, w, h } };
    });
    const at = packSkyline(blocks, width, ZONE_GAP_X, ZONE_GAP_Y, 0);
    local.forEach((zs, z) => zs.forEach((p, k) => {
      spots[zoneIndexes[z]![k]!] = { x: at[z]!.x + p.x, y: at[z]!.y + p.y };
    }));
    return spots;
  };
  for (let width = from; width <= from + WIDTH_STEP * 24; width += WIDTH_STEP) {
    const spots = packZones(width);
    const right = Math.max(...spots.map((p, i) => p.x + clusters[i]!.bounds.w));
    const bottom = Math.max(...spots.map((p, i) => p.y + clusters[i]!.bounds.h));
    const score = Math.abs(Math.log(right / bottom / target));
    if (!pick || score < pick.score - 0.01) pick = { spots, width, score };
  }

  const placements: Placements = new Map();
  const placed: Rect[] = [];
  const x0 = margin / zoom;
  const y0 = 70 / zoom;
  clusters.forEach((c, i) => {
    const spot = pick!.spots[i]!;
    for (const box of c.boxes) {
      const shifted: Box = { ...box, x: x0 + spot.x + (box.x - c.bounds.x), y: y0 + spot.y + (box.y - c.bounds.y) };
      placements.set(box.item.id, placementFor(shifted, box.item.rotation));
      placed.push(shifted);
    }
  });

  return { placements, bounds: union(placed), labels: new Map(), zoom };
};

export interface ColumnOptions {
  viewportWidth: number;
  /** Horizontal padding of the column. */
  padding?: number;
  /** Where the first row starts, below the fixed corners. */
  top?: number;
}

/** Phone spacing: between objects side by side, between rows, between groups (about 3x). */
const COLUMN_GAP = 20;
const ROW_GAP = 28;
const SECTION_GAP = 84;

/**
 * Phone arrangement: objects flow in reading order. Items narrower than the
 * column share a row; the rest stack; a new group starts on a new row, further
 * down. Rotation is softened so text stays readable.
 */
export const layoutColumn = (items: LayoutItem[], opts: ColumnOptions): LayoutResult => {
  const padding = opts.padding ?? 16;
  const width = opts.viewportWidth - padding * 2;
  const boxes: Box[] = [];
  let x = padding;
  let y = opts.top ?? 24;
  let rowHeight = 0;
  let cluster: string | null = null;
  for (const item of items) {
    let softened: LayoutItem = { ...item, rotation: item.rotation * 0.6 };
    let r = rotatedBox(softened.size, softened.rotation);
    // An object as wide as the column lies straight: rotated, it would poke out.
    if (r.w > width) {
      softened = { ...softened, rotation: 0 };
      r = rotatedBox(softened.size, 0);
    }
    const newGroup = cluster !== null && item.cluster !== cluster;
    cluster = item.cluster;
    if (x > padding && (newGroup || x + r.w > padding + width + 0.5)) {
      x = padding;
      y += rowHeight + (newGroup ? SECTION_GAP : ROW_GAP);
      rowHeight = 0;
    }
    const box: Box = { item: softened, x, y, w: r.w, h: r.h };
    boxes.push(box);
    x += r.w + COLUMN_GAP;
    rowHeight = Math.max(rowHeight, r.h);
  }
  relax(boxes, ROW_GAP - 4, 10, true);
  const placements: Placements = new Map();
  for (const box of boxes) placements.set(box.item.id, placementFor(box, box.item.rotation));
  return { placements, bounds: union(boxes), labels: new Map(), zoom: 1 };
};

/** Screen width the phone composition is drawn for (data-phone). */
export const PHONE_BASE_WIDTH = 390;
/** Screens of free table on each side of the opening screen, before it grows. */
export const PHONE_SIDE_SCREENS = 3;

/** Geometry of the phone table: free table, the opening screen, free table. */
export interface PhoneTable {
  /** Width of the table left of the opening screen; the screen starts at x = side. */
  side: number;
  /** Width of the whole table. */
  width: number;
}

/** `extraScreens` widens the left side: the table grows when an object is carried there. */
export const phoneTable = (viewportWidth: number, extraScreens = 0): PhoneTable => {
  const side = Math.round(viewportWidth * (PHONE_SIDE_SCREENS + extraScreens));
  return { side, width: side + viewportWidth + Math.round(viewportWidth * PHONE_SIDE_SCREENS) };
};

/** How much the phone composition is scaled on a screen of this width. */
export const phoneScale = (viewportWidth: number): number => clamp(viewportWidth / PHONE_BASE_WIDTH, 0.8, 1.15);

export interface ComposedOptions {
  viewportWidth: number;
  /** x of the opening screen on the table (PhoneTable.side). */
  side: number;
  padding?: number;
}

/**
 * Phone, messy: the composition Darwin laid out by hand on a 390 px screen
 * (`phoneAt`), scaled as a whole to the screen, so distances and overlaps stay as
 * he chose them. Rotation is softened as in the column. Items without a position
 * flow in a column below the rest.
 */
export const layoutComposed = (items: LayoutItem[], opts: ComposedOptions): LayoutResult => {
  const k = phoneScale(opts.viewportWidth);
  const placements: Placements = new Map();
  const loose: LayoutItem[] = [];
  let bottom = 0;
  for (const item of items) {
    if (!item.phoneAt) {
      loose.push(item);
      continue;
    }
    const y = item.phoneAt.y * k;
    placements.set(item.id, { x: opts.side + item.phoneAt.x * k, y, rotation: item.rotation * 0.6 });
    bottom = Math.max(bottom, y + item.size.h);
  }
  if (loose.length) {
    const flow = layoutColumn(loose, { viewportWidth: opts.viewportWidth, padding: opts.padding ?? 20, top: bottom + SECTION_GAP });
    for (const [id, p] of flow.placements) placements.set(id, { ...p, x: p.x + opts.side });
  }
  return { placements, bounds: boundsOf(items, placements), labels: new Map(), zoom: 1 };
};

export interface TidyGrid {
  columns: number;
  columnWidth: number;
  gap: number;
  x0: number;
  width: number;
}

/** Grid used by "Tidy up"; also tells the DOM which widths to apply before measuring. */
export const tidyGrid = (viewportWidth: number, phonePadding = 20): TidyGrid => {
  const narrow = viewportWidth < NARROW_BREAKPOINT;
  const width = narrow ? viewportWidth - phonePadding * 2 : Math.max(1000, viewportWidth - 120);
  const gap = narrow ? 24 : 26;
  // Phone: two columns, so narrow things (prints, slides, links) sit side by side
  const columns = narrow ? 2 : clamp(Math.round(width / 330), 3, 8);
  return { columns, gap, x0: narrow ? phonePadding : 60, width, columnWidth: (width - gap * (columns - 1)) / columns };
};

/** Smallest scale an object may take to share a phone row under Tidy up. */
const PHONE_HALF_MIN_SCALE = 0.64;

/**
 * Phone, Tidy up: an object that still reads well at half the column takes one
 * of the two columns (scaled down if needed); anything wider takes the full row.
 */
export const phoneTidyFit = (naturalWidth: number, grid: TidyGrid): { span: number; scale: number } => {
  const half = grid.columnWidth;
  if (naturalWidth * PHONE_HALF_MIN_SCALE <= half) return { span: 1, scale: Math.min(1, half / naturalWidth) };
  return { span: grid.columns, scale: Math.min(1, grid.width / naturalWidth) };
};

/** Width an item takes under "Tidy up". Stickers keep their natural width. */
export const tidyWidth = (item: LayoutItem, grid: TidyGrid, naturalWidth: number): number => {
  // Stickers keep their size.
  if (item.small) return Math.min(grid.width, naturalWidth);
  const span = Math.min(grid.columns, item.span);
  return grid.columnWidth * span + grid.gap * (span - 1);
};

export interface TidyOptions {
  viewportWidth: number;
  /** Groups in display order. Items whose group is missing go last. */
  groupOrder: string[];
}

/**
 * "Tidy up": each group gets a chalk label and its own rows; big items fill the
 * shortest column (like a masonry wall), stickers line up in a row below.
 */
export const layoutTidy = (items: LayoutItem[], opts: TidyOptions): LayoutResult => {
  const grid = tidyGrid(opts.viewportWidth);
  const narrow = opts.viewportWidth < NARROW_BREAKPOINT;
  const placements: Placements = new Map();
  const labels = new Map<string, Point>();
  const placed: Rect[] = [];
  const groups = [...opts.groupOrder];
  for (const item of items) if (!groups.includes(item.group)) groups.push(item.group);

  let y = narrow ? 66 : 70;
  for (const group of groups) {
    const members = items.filter((i) => i.group === group && !i.decoration);
    if (members.length === 0) continue;
    labels.set(group, { x: grid.x0, y });
    y += narrow ? 62 : 68; // room for the chalk label

    const heights = Array<number>(grid.columns).fill(y);
    for (const item of members.filter((i) => !i.small)) {
      const span = Math.min(grid.columns, item.span);
      // Shortest column that can hold the span.
      let col = 0;
      let best = Infinity;
      for (let k = 0; k <= grid.columns - span; k++) {
        const top = Math.max(...heights.slice(k, k + span));
        if (top < best - 0.5) {
          best = top;
          col = k;
        }
      }
      const at: Rect = { x: grid.x0 + col * (grid.columnWidth + grid.gap), y: best, ...item.size };
      placements.set(item.id, { x: at.x, y: at.y, rotation: 0 });
      placed.push(at);
      for (let k = col; k < col + span; k++) heights[k] = best + item.size.h + grid.gap;
    }
    y = Math.max(...heights);

    const stickers = members.filter((i) => i.small);
    if (stickers.length) {
      let x = grid.x0;
      let rowHeight = 0;
      for (const item of stickers) {
        if (x > grid.x0 && x + item.size.w > grid.x0 + grid.width) {
          x = grid.x0;
          y += rowHeight + grid.gap;
          rowHeight = 0;
        }
        placements.set(item.id, { x, y, rotation: 0 });
        placed.push({ x, y, ...item.size });
        x += item.size.w + grid.gap;
        rowHeight = Math.max(rowHeight, item.size.h);
      }
      y += rowHeight + grid.gap;
    }
    y += narrow ? 76 : 44;
  }
  return { placements, bounds: union(placed), labels, zoom: 1 };
};

/** Bounding box of placed items given their placements and sizes. */
export const boundsOf = (items: LayoutItem[], placements: Placements): Rect =>
  union(
    items.flatMap((item) => {
      const p = placements.get(item.id);
      return p ? [{ x: p.x, y: p.y, w: item.size.w, h: item.size.h }] : [];
    }),
  );

export type { Size };
