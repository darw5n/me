/**
 * The table itself: a finite surface, always much larger than what is on it,
 * so there is room to wander and to move things around.
 *
 * Rules (decided with Darwin, 10/11/2026):
 * - at least `MIN_VIEWPORTS` windows wide and tall, measured at the opening zoom;
 * - never less than the content plus a full window of margin on every side;
 * - it grows when an object is carried close to an edge.
 */

import { inflate, union } from "./geometry.js";
import type { Rect, Size } from "./types.js";

const MIN_VIEWPORTS = 3;

/**
 * Table rectangle for a given content box. The content is centred, so the
 * opening view has the same breathing room on every side.
 */
export const tableFor = (content: Rect, viewport: Size, zoom: number): Rect => {
  const view = { w: viewport.w / zoom, h: viewport.h / zoom };
  const w = Math.max(content.w + view.w * 2, view.w * MIN_VIEWPORTS);
  const h = Math.max(content.h + view.h * 2, view.h * MIN_VIEWPORTS);
  return {
    x: content.x + content.w / 2 - w / 2,
    y: content.y + content.h / 2 - h / 2,
    w,
    h,
  };
};

/**
 * Extends the table so that `rect` (an object being dragged) keeps `margin` px
 * of table around it. Returns the same rectangle when nothing changes.
 */
export const grownToInclude = (table: Rect, rect: Rect, margin: number): Rect => {
  const needed = inflate(rect, margin);
  const grown = union([table, needed]);
  const same = grown.x === table.x && grown.y === table.y && grown.w === table.w && grown.h === table.h;
  return same ? table : grown;
};

/** Writes the table rectangle to its element, in world px. */
export const renderTable = (el: HTMLElement, rect: Rect): void => {
  el.style.setProperty("--table-x", `${Math.round(rect.x)}px`);
  el.style.setProperty("--table-y", `${Math.round(rect.y)}px`);
  el.style.setProperty("--table-w", `${Math.round(rect.w)}px`);
  el.style.setProperty("--table-h", `${Math.round(rect.h)}px`);
};
