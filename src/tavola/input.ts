/**
 * Pointer, wheel and keyboard input for the table.
 *
 * Desktop (camera present):
 * - mouse on an object: drag it (a click without movement is still a click);
 * - mouse on the table: pan (the table is infinite);
 * - finger on the table: pan; finger held on an object (380 ms): lift and drag;
 * - two fingers: pinch to zoom; wheel / trackpad: pan, with Ctrl or Cmd: zoom;
 * - keys: arrows pan, + and − zoom, 0 shows everything, T tidies up.
 *
 * Phone (no camera): the table scrolls natively; a finger held on an object lifts
 * it, and while it is lifted the table does not scroll. Two fingers zoom the
 * table (phone-zoom.ts).
 */

import type { CameraController } from "./camera.js";
import { viewportSize } from "./geometry.js";
import { itemAt, type TableItem } from "./items.js";
import type { Sound } from "./sound.js";
import type { Point } from "./types.js";

export interface InputHost {
  /** Element that receives pointer events: the fixed viewport, or the table on a phone. */
  view: HTMLElement;
  items: TableItem[];
  camera: CameraController | null;
  /** Scale of the table on screen, to turn finger movement into table movement. */
  tableZoom(): number;
  sound: Sound;
  reducedMotion: boolean;
  /** Moves an object by a world delta. */
  moveItem(item: TableItem, delta: Point): void;
  beginDrag(item: TableItem): void;
  endDrag(item: TableItem, moved: boolean): void;
  /** A click on an object that was not a drag. */
  tapItem(item: TableItem, target: Element): void;
  seeAll(): void;
  toggleTidy(): void;
}

const LONG_PRESS_MS = 380;
const DRAG_THRESHOLD = 5;

// Deltas are computed from the last known position: `movementX` is unreliable
// (it is always 0 for touch on iOS Safari).
type Action =
  | { kind: "pan"; start: Point; last: Point }
  | { kind: "drag"; item: TableItem; start: Point; last: Point; live: boolean };

export const attachInput = (host: InputHost): (() => void) => {
  const { view } = host;
  const pointers = new Map<number, Point>();
  let action: Action | null = null;
  let moved = false;
  let pressed: TableItem | null = null;
  let pressStart: Point = { x: 0, y: 0 };
  let longPress = 0;
  let pinch: { distance: number; zoom: number } | null = null;
  let tiltReset = 0;

  const zoomOf = (): number => host.tableZoom();

  const liftItem = (item: TableItem, start: Point): void => {
    action = { kind: "drag", item, start, last: { ...start }, live: true };
    item.el.classList.add("is-dragging");
    host.beginDrag(item);
    host.sound.play("lift");
    if ("vibrate" in navigator) navigator.vibrate?.(12);
  };

  const clearPress = (): void => {
    clearTimeout(longPress);
    pressed?.el.classList.remove("is-pressed");
    pressed = null;
  };

  const onDown = (e: PointerEvent): void => {
    if (e.button !== 0) return;
    host.camera?.stop();
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    moved = false;

    // A second finger means a pinch, unless an object is already lifted. On a phone
    // the pinch itself is handled by phone-zoom.ts; here it only cancels the press.
    if (pointers.size >= 2 && !(action?.kind === "drag" && action.live)) {
      if (host.camera) {
        const [a, b] = [...pointers.values()] as [Point, Point];
        pinch = { distance: Math.hypot(a.x - b.x, a.y - b.y), zoom: host.camera.state.zoom };
      }
      clearPress();
      action = null;
      return;
    }

    const item = itemAt(host.items, e.target);
    const start = { x: e.clientX, y: e.clientY };
    if (item) {
      pressed = item;
      pressStart = start;
      item.el.classList.add("is-pressed");
    }

    if (item && e.pointerType === "mouse") {
      // The drag becomes live only after the pointer travels a few pixels, so a
      // plain click still reaches the link inside.
      action = { kind: "drag", item, start, last: { ...start }, live: false };
      host.beginDrag(item);
      return;
    }

    if (host.camera) action = { kind: "pan", start, last: { ...start } };
    else action = null;

    if (item) {
      longPress = window.setTimeout(() => {
        if (!moved) liftItem(item, start);
      }, LONG_PRESS_MS);
    }
  };

  const onMove = (e: PointerEvent): void => {
    if (pointers.has(e.pointerId)) pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pinch && pointers.size === 2 && host.camera) {
      const [a, b] = [...pointers.values()] as [Point, Point];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      host.camera.zoomAt({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, (pinch.zoom * distance) / pinch.distance);
      return;
    }
    // Phone, before the long press: a finger that travels is a scroll, not a lift.
    // Browsers usually send pointercancel when they start scrolling; this covers the
    // ones that do not, so a scroll can never turn into a lift.
    if (!action) {
      const origin = pressed && pointers.size === 1 ? pressStart : null;
      if (origin && Math.hypot(e.clientX - origin.x, e.clientY - origin.y) >= DRAG_THRESHOLD) clearPress();
      return;
    }

    const dx = e.clientX - action.start.x;
    const dy = e.clientY - action.start.y;
    if (!moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;

    if (!moved) {
      moved = true;
      clearTimeout(longPress);
      pressed?.el.classList.remove("is-pressed");
      // From now on the pointer belongs to the table, even outside the window.
      // Not earlier: a captured click would no longer reach the link under it.
      try {
        view.setPointerCapture(e.pointerId);
      } catch {
        /* the pointer is already gone */
      }
      if (action.kind === "drag") {
        if (!action.live) {
          action.live = true;
          action.item.el.classList.add("is-dragging");
          host.sound.play("lift");
        }
      } else {
        view.classList.add("is-panning");
      }
    }

    const stepX = e.clientX - action.last.x;
    const stepY = e.clientY - action.last.y;
    action.last = { x: e.clientX, y: e.clientY };

    if (action.kind === "pan") {
      host.camera?.panBy(stepX, stepY);
      return;
    }

    const zoom = zoomOf();
    host.moveItem(action.item, { x: stepX / zoom, y: stepY / zoom });

    // The object leans into the direction it is carried.
    if (!host.reducedMotion) {
      const speed = stepX;
      const body = action.item.body;
      body.style.setProperty("--tilt", `${Math.max(-7, Math.min(7, speed * 0.5))}deg`);
      clearTimeout(tiltReset);
      tiltReset = window.setTimeout(() => body.style.setProperty("--tilt", "0deg"), 90);
    }
  };

  const onUp = (e: PointerEvent): void => {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinch = null;
    clearPress();
    if (action?.kind === "drag") {
      const { item } = action;
      item.el.classList.remove("is-dragging");
      item.body.style.setProperty("--tilt", "0deg");
      host.endDrag(item, moved);
      if (moved) host.sound.play("press");
    }
    view.classList.remove("is-panning");
    action = null;
  };

  // A click that ends a drag must not follow the link underneath.
  const onClickCapture = (e: MouseEvent): void => {
    if (!moved) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    moved = false;
  };

  const onClick = (e: MouseEvent): void => {
    const item = itemAt(host.items, e.target);
    if (item && e.target instanceof Element) host.tapItem(item, e.target);
  };

  // While an object is lifted on a phone the page must not scroll under it.
  const onTouchMove = (e: TouchEvent): void => {
    if (action?.kind === "drag" && action.live) e.preventDefault();
  };

  const onWheel = (e: WheelEvent): void => {
    const camera = host.camera;
    if (!camera) return;
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      camera.zoomAt({ x: e.clientX, y: e.clientY }, camera.state.zoom * Math.exp(-e.deltaY * 0.01));
    } else {
      camera.panBy(-e.deltaX, -e.deltaY);
    }
  };

  const onKey = (e: KeyboardEvent): void => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const target = e.target as HTMLElement | null;
    if (target?.closest("dialog, input, textarea, select, [contenteditable]")) return;
    const camera = host.camera;
    const step = 90;
    const v = viewportSize();
    const centre = { x: v.w / 2, y: v.h / 2 };
    switch (e.key) {
      case "ArrowLeft": camera?.panBy(step, 0); break;
      case "ArrowRight": camera?.panBy(-step, 0); break;
      case "ArrowUp": camera?.panBy(0, step); break;
      case "ArrowDown": camera?.panBy(0, -step); break;
      case "+": case "=": camera?.zoomAt(centre, camera.state.zoom * 1.2); break;
      case "-": camera?.zoomAt(centre, camera.state.zoom / 1.2); break;
      case "0": host.seeAll(); break;
      case "t": case "T": host.toggleTidy(); break;
      default: return;
    }
    if (camera || e.key === "t" || e.key === "T") e.preventDefault();
  };

  // Links and images on the table must not start the browser's own drag (the one
  // that carries a URL to the address bar): it would cancel ours with pointercancel.
  view.querySelectorAll<HTMLElement>("a, img").forEach((el) => {
    el.draggable = false;
  });
  const onNativeDrag = (e: DragEvent): void => e.preventDefault();
  view.addEventListener("dragstart", onNativeDrag);

  view.addEventListener("pointerdown", onDown);
  addEventListener("pointermove", onMove);
  addEventListener("pointerup", onUp);
  addEventListener("pointercancel", onUp);
  view.addEventListener("click", onClickCapture, true);
  view.addEventListener("click", onClick);
  view.addEventListener("touchmove", onTouchMove, { passive: false });
  view.addEventListener("wheel", onWheel, { passive: false });
  addEventListener("keydown", onKey);

  return () => {
    view.removeEventListener("dragstart", onNativeDrag);
    view.removeEventListener("pointerdown", onDown);
    removeEventListener("pointermove", onMove);
    removeEventListener("pointerup", onUp);
    removeEventListener("pointercancel", onUp);
    view.removeEventListener("click", onClickCapture, true);
    view.removeEventListener("click", onClick);
    view.removeEventListener("touchmove", onTouchMove);
    view.removeEventListener("wheel", onWheel);
    removeEventListener("keydown", onKey);
  };
};
