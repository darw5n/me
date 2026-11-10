/**
 * The minimap: every object as a pale block, the visible part of the table as
 * a yellow frame. A click flies the camera there.
 */

import type { CameraController } from "./camera.js";
import { rectOf, type TableItem } from "./items.js";
import type { Arrangement, Point, Rect } from "./types.js";

export interface MinimapOptions {
  el: HTMLElement;
  items: TableItem[];
  camera: CameraController;
  arrangement(): Arrangement;
  /** Rectangle the map shows: the content with some air, not the whole table. */
  frame(): Rect;
}

export interface Minimap {
  update(): void;
}

export const createMinimap = (opts: MinimapOptions): Minimap => {
  const { el, items, camera } = opts;
  let scale = 1;
  let origin: Point = { x: 0, y: 0 };

  const blocks = items.map(() => {
    const b = document.createElement("i");
    el.append(b);
    return b;
  });
  const window_ = document.createElement("b");
  el.append(window_);

  const update = (): void => {
    if (!el.offsetWidth) return;
    const frame = opts.frame();
    scale = Math.min(el.clientWidth / frame.w, el.clientHeight / frame.h);
    origin = { x: frame.x, y: frame.y };
    const mode = opts.arrangement();
    items.forEach((item, i) => {
      const r = rectOf(item, mode);
      const b = blocks[i]!;
      b.style.cssText = `left:${(r.x - origin.x) * scale}px;top:${(r.y - origin.y) * scale}px;width:${r.w * scale}px;height:${r.h * scale}px`;
    });
    const v = camera.visibleRect();
    window_.style.cssText = `left:${(v.x - origin.x) * scale}px;top:${(v.y - origin.y) * scale}px;width:${v.w * scale}px;height:${v.h * scale}px`;
  };

  el.addEventListener("click", (e) => {
    const r = el.getBoundingClientRect();
    const world = { x: (e.clientX - r.left) / scale + origin.x, y: (e.clientY - r.top) / scale + origin.y };
    void camera.centreOn(world);
  });

  return { update };
};
