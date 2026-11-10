/**
 * Small geometry helpers shared by the layout, the camera and the board.
 * All functions are pure.
 */

import type { Point, Rect, Size } from "./types.js";

/**
 * Size of the visible page, without scrollbars. Not `innerWidth`: on phones the
 * layout viewport grows when something pokes out, and a layout based on it would
 * then grow the page further, a loop.
 */
export const viewportSize = (): Size => ({
  w: document.documentElement.clientWidth,
  h: document.documentElement.clientHeight,
});

export const clamp =(value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export const lerp = (from: number, to: number, t: number): number => from + (to - from) * t;

/** Ease-out cubic, the default camera flight. */
export const easeOut = (t: number): number => 1 - (1 - t) ** 3;

/** Ease-in-out cubic: slow start, slow landing. Used when the camera travels with Tidy up. */
export const easeInOut = (t: number): number => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);

export const degToRad = (deg: number): number => (deg * Math.PI) / 180;

/**
 * Size of the axis-aligned box that contains an element of `size`
 * rotated by `rotation` degrees around its centre.
 */
export const rotatedBox = (size: Size, rotation: number): Size => {
  const a = Math.abs(degToRad(rotation));
  return {
    w: size.w * Math.cos(a) + size.h * Math.sin(a),
    h: size.w * Math.sin(a) + size.h * Math.cos(a),
  };
};

/** Smallest rectangle containing all the given rectangles. */
export const union = (rects: Iterable<Rect>): Rect => {
  let left = Infinity;
  let top = Infinity;
  let right = -Infinity;
  let bottom = -Infinity;
  for (const r of rects) {
    left = Math.min(left, r.x);
    top = Math.min(top, r.y);
    right = Math.max(right, r.x + r.w);
    bottom = Math.max(bottom, r.y + r.h);
  }
  if (left === Infinity) return { x: 0, y: 0, w: 0, h: 0 };
  return { x: left, y: top, w: right - left, h: bottom - top };
};

export const centre = (r: Rect): Point => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 });

/** Grow a rectangle by the same margin on every side. */
export const inflate = (r: Rect, margin: number): Rect => ({
  x: r.x - margin,
  y: r.y - margin,
  w: r.w + margin * 2,
  h: r.h + margin * 2,
});

/** True when two rectangles are closer than `gap` on both axes. */
export const overlapsWithGap = (a: Rect, b: Rect, gap: number): boolean =>
  a.x < b.x + b.w + gap && b.x < a.x + a.w + gap && a.y < b.y + b.h + gap && b.y < a.y + a.h + gap;
