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
 * - tidy (both): a real grid, one row of columns per group, with a chalk label.
 *
 * Every arrangement ends with `relax`, which pushes objects apart when they touch.
 * It is monotone (earlier objects stay, later ones move only right or down), so it
 * always terminates and never jitters.
 */
import { clamp, rotatedBox, union } from "./geometry.js";
/** Minimum distance between two objects, in world px. */
const GAP_LARGE = 34;
const GAP_SMALL = 12;
/** Width the messy table never goes below, so "See all" keeps a landscape shape. */
const MIN_MESSY_WIDTH = 2150;
/** Breakpoint under which the table becomes a vertical column. Shared with the SCSS. */
export const NARROW_BREAKPOINT = 900;
const boxOf = (item, at, scale = 1) => {
    const r = rotatedBox(item.size, item.rotation);
    return { item, x: at.x * scale, y: at.y * scale, w: r.w, h: r.h };
};
/**
 * Pushes overlapping boxes apart. Objects already settled never move again and
 * a moving object only goes right or down, along the shorter escape. With
 * `downOnly` (the phone column) it never goes sideways, so it stays on screen.
 */
export const relax = (boxes, large = GAP_LARGE, small = GAP_SMALL, downOnly = false) => {
    for (let j = 1; j < boxes.length; j++) {
        const b = boxes[j];
        let hit = true;
        for (let guard = 0; hit && guard < 60; guard++) {
            hit = false;
            for (let i = 0; i < j; i++) {
                const a = boxes[i];
                const gap = a.item.small || b.item.small ? small : large;
                const pushRight = a.x + a.w + gap - b.x;
                const pushDown = a.y + a.h + gap - b.y;
                const apart = pushRight <= 0 || pushDown <= 0 || b.x + b.w + gap <= a.x || b.y + b.h + gap <= a.y;
                if (apart)
                    continue;
                hit = true;
                if (!downOnly && pushRight < pushDown)
                    b.x += pushRight;
                else
                    b.y += pushDown;
            }
        }
    }
};
/**
 * Placement of an un-rotated element whose rotated box has its top-left at `box`.
 * Rotation happens around the centre, so the element starts a little inside.
 */
const placementFor = (box, rotation) => ({
    x: box.x + (box.w - box.item.size.w) / 2,
    y: box.y + (box.h - box.item.size.h) / 2,
    rotation,
});
const buildCluster = (items, air) => {
    const boxes = items.map((item) => boxOf(item, item.rel, air));
    relax(boxes);
    return { boxes, bounds: union(boxes) };
};
/** Zoom at which the messy table opens: the widest cluster fits the window. */
export const homeZoom = (clusters, viewportWidth, margin) => {
    const widest = Math.max(1, ...clusters.map((c) => c.bounds.w));
    return clamp((viewportWidth - margin * 2) / widest, 0.62, 1);
};
export const layoutMessy = (items, opts) => {
    const { viewportWidth } = opts;
    const margin = clamp(viewportWidth * 0.04, 36, 96);
    // A larger window gets slightly more air between objects.
    const air = clamp(viewportWidth / 1600, 1, 1.12);
    const clusters = opts.clusterOrder
        .map((key) => buildCluster(items.filter((i) => i.cluster === key), air))
        .filter((c) => c.boxes.length > 0);
    const zoom = homeZoom(clusters, viewportWidth, margin);
    // The table is wider than a small window: the first row fits, the rest peeks
    // out on the right and invites a drag.
    const fitWidth = (viewportWidth - margin * 2) / zoom;
    const tableWidth = Math.max(fitWidth, MIN_MESSY_WIDTH);
    const gapX = clamp(tableWidth * 0.045, 56, 150);
    const gapY = clamp(tableWidth * 0.065, 70, 150);
    const x0 = margin / zoom;
    // Shelf packing: clusters fill a row until it is full, then wrap.
    const rows = [];
    for (const c of clusters) {
        const row = rows[rows.length - 1];
        if (row && row.width + gapX + c.bounds.w <= tableWidth) {
            row.clusters.push(c);
            row.width += gapX + c.bounds.w;
        }
        else {
            rows.push({ clusters: [c], width: c.bounds.w });
        }
    }
    const placements = new Map();
    const placed = [];
    let y = 70 / zoom;
    rows.forEach((row, rowIndex) => {
        const free = tableWidth - row.width;
        const n = row.clusters.length;
        // Leftover space goes between clusters. A lone cluster on an odd row is
        // shifted, so the left edge does not read as a grid.
        const extra = n > 1 ? Math.min(free / (n - 1), 180) : 0;
        let x = x0 + (n === 1 && rowIndex % 2 ? Math.min(free * 0.55, fitWidth * 0.25) : 0);
        let rowHeight = 0;
        row.clusters.forEach((c, i) => {
            const dy = n > 1 && i % 2 ? 46 : 0;
            for (const box of c.boxes) {
                const shifted = { ...box, x: x + (box.x - c.bounds.x), y: y + dy + (box.y - c.bounds.y) };
                placements.set(box.item.id, placementFor(shifted, box.item.rotation));
                placed.push(shifted);
            }
            x += c.bounds.w + gapX + extra;
            rowHeight = Math.max(rowHeight, c.bounds.h + dy);
        });
        y += rowHeight + gapY;
    });
    return { placements, bounds: union(placed), labels: new Map(), zoom };
};
/**
 * Phone arrangement: objects flow in reading order. Items narrower than the
 * column share a row; the rest stack. Rotation is softened so text stays readable.
 */
export const layoutColumn = (items, opts) => {
    const padding = opts.padding ?? 16;
    const width = opts.viewportWidth - padding * 2;
    const gap = 14;
    const rowGap = 22;
    const boxes = [];
    let x = padding;
    let y = opts.top ?? 24;
    let rowHeight = 0;
    for (const item of items) {
        let softened = { ...item, rotation: item.rotation * 0.6 };
        let r = rotatedBox(softened.size, softened.rotation);
        // An object as wide as the column lies straight: rotated, it would poke out.
        if (r.w > width) {
            softened = { ...softened, rotation: 0 };
            r = rotatedBox(softened.size, 0);
        }
        if (x > padding && x + r.w > padding + width + 0.5) {
            x = padding;
            y += rowHeight + rowGap;
            rowHeight = 0;
        }
        const box = { item: softened, x, y, w: r.w, h: r.h };
        boxes.push(box);
        x += r.w + gap;
        rowHeight = Math.max(rowHeight, r.h);
    }
    relax(boxes, 18, 8, true);
    const placements = new Map();
    for (const box of boxes)
        placements.set(box.item.id, placementFor(box, box.item.rotation));
    return { placements, bounds: union(boxes), labels: new Map(), zoom: 1 };
};
/** Grid used by "Tidy up"; also tells the DOM which widths to apply before measuring. */
export const tidyGrid = (viewportWidth) => {
    const narrow = viewportWidth < NARROW_BREAKPOINT;
    const width = narrow ? viewportWidth - 32 : Math.max(1000, viewportWidth - 120);
    const gap = narrow ? 14 : 26;
    const columns = narrow ? 1 : clamp(Math.round(width / 330), 3, 8);
    return { columns, gap, x0: narrow ? 16 : 60, width, columnWidth: (width - gap * (columns - 1)) / columns };
};
/** Width an item takes under "Tidy up". Stickers keep their natural width. */
export const tidyWidth = (item, grid, naturalWidth) => {
    // Stickers keep their size; on a phone (one column) everything keeps its width.
    if (item.small || grid.columns === 1)
        return Math.min(grid.width, naturalWidth);
    const span = Math.min(grid.columns, item.span);
    return grid.columnWidth * span + grid.gap * (span - 1);
};
/**
 * "Tidy up": each group gets a chalk label and its own rows; big items fill the
 * shortest column (like a masonry wall), stickers line up in a row below.
 */
export const layoutTidy = (items, opts) => {
    const grid = tidyGrid(opts.viewportWidth);
    const narrow = grid.columns === 1;
    const placements = new Map();
    const labels = new Map();
    const placed = [];
    const groups = [...opts.groupOrder];
    for (const item of items)
        if (!groups.includes(item.group))
            groups.push(item.group);
    let y = narrow ? 66 : 70;
    for (const group of groups) {
        const members = items.filter((i) => i.group === group && !i.decoration);
        if (members.length === 0)
            continue;
        labels.set(group, { x: grid.x0, y });
        y += narrow ? 54 : 68; // room for the chalk label
        const heights = Array(grid.columns).fill(y);
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
            const at = { x: grid.x0 + col * (grid.columnWidth + grid.gap), y: best, ...item.size };
            placements.set(item.id, { x: at.x, y: at.y, rotation: 0 });
            placed.push(at);
            for (let k = col; k < col + span; k++)
                heights[k] = best + item.size.h + grid.gap;
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
        y += narrow ? 26 : 44;
    }
    return { placements, bounds: union(placed), labels, zoom: 1 };
};
/** Bounding box of placed items given their placements and sizes. */
export const boundsOf = (items, placements) => union(items.flatMap((item) => {
    const p = placements.get(item.id);
    return p ? [{ x: p.x, y: p.y, w: item.size.w, h: item.size.h }] : [];
}));
