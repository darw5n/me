/**
 * The camera: pan and zoom over the world element.
 *
 * screen = world * zoom + (x, y)
 *
 * The table is infinite (decided with Darwin, 10/11/2026): the camera goes where
 * the visitor takes it, and "See all" brings everything back into view.
 */

import { clamp, easeOut, lerp, viewportSize } from "./geometry.js";
import type { Camera, Point, Rect, Size } from "./types.js";

export interface CameraOptions {
  /** Element that receives the transform. */
  world: HTMLElement;
  /** Called after every change, e.g. to move the surface pattern along. */
  onChange?: (camera: Camera) => void;
  reducedMotion: boolean;
}

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 2.5;

export class CameraController {
  readonly state: Camera = { x: 0, y: 0, zoom: 1 };
  private frame = 0;
  private readonly world: HTMLElement;
  private readonly onChange: ((camera: Camera) => void) | undefined;
  private readonly reducedMotion: boolean;

  constructor(opts: CameraOptions) {
    this.world = opts.world;
    this.onChange = opts.onChange;
    this.reducedMotion = opts.reducedMotion;
  }

  get viewport(): Size {
    return viewportSize();
  }

  /** Part of the world currently visible, in world px. */
  visibleRect(): Rect {
    const { x, y, zoom } = this.state;
    const v = this.viewport;
    return { x: -x / zoom, y: -y / zoom, w: v.w / zoom, h: v.h / zoom };
  }

  screenToWorld(p: Point): Point {
    return { x: (p.x - this.state.x) / this.state.zoom, y: (p.y - this.state.y) / this.state.zoom };
  }

  private commit(): void {
    const { x, y, zoom } = this.state;
    this.world.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) scale(${zoom.toFixed(4)})`;
    this.onChange?.(this.state);
  }

  /** Jumps to a position. */
  set(x: number, y: number, zoom = this.state.zoom): void {
    this.stop();
    this.state.x = x;
    this.state.y = y;
    this.state.zoom = clamp(zoom, MIN_ZOOM, MAX_ZOOM);
    this.commit();
  }

  /** Pans by a screen delta. */
  panBy(dx: number, dy: number): void {
    this.stop();
    this.state.x += dx;
    this.state.y += dy;
    this.commit();
  }

  /** Zooms around a screen point, so what is under the pointer stays there. */
  zoomAt(screen: Point, zoom: number): void {
    this.stop();
    const z = clamp(zoom, MIN_ZOOM, MAX_ZOOM);
    const { x, y, zoom: k } = this.state;
    this.state.x = screen.x - ((screen.x - x) * z) / k;
    this.state.y = screen.y - ((screen.y - y) * z) / k;
    this.state.zoom = z;
    this.commit();
  }

  /** Animated flight. Instant under reduced motion. */
  flyTo(x: number, y: number, zoom: number, ms = 620): Promise<void> {
    this.stop();
    const to = { x, y, zoom: clamp(zoom, MIN_ZOOM, MAX_ZOOM) };
    if (this.reducedMotion || ms <= 0) {
      Object.assign(this.state, to);
      this.commit();
      return Promise.resolve();
    }
    const from = { ...this.state };
    const t0 = performance.now();
    return new Promise((resolve) => {
      const step = (t: number): void => {
        const p = easeOut(Math.min(1, (t - t0) / ms));
        this.state.x = lerp(from.x, to.x, p);
        this.state.y = lerp(from.y, to.y, p);
        this.state.zoom = lerp(from.zoom, to.zoom, p);
        this.commit();
        if (p < 1) this.frame = requestAnimationFrame(step);
        else {
          this.frame = 0;
          resolve();
        }
      };
      this.frame = requestAnimationFrame(step);
    });
  }

  /** Frames a world rectangle with a screen padding on each side. */
  fitRect(rect: Rect, padding: { x: number; top: number; bottom: number }, ms = 620, maxZoom = 1): Promise<void> {
    const v = this.viewport;
    const zoom = Math.min(maxZoom, (v.w - padding.x * 2) / rect.w, (v.h - padding.top - padding.bottom) / rect.h);
    const x = (v.w - rect.w * zoom) / 2 - rect.x * zoom;
    const y = padding.top + (v.h - padding.top - padding.bottom - rect.h * zoom) / 2 - rect.y * zoom;
    return this.flyTo(x, y, zoom, ms);
  }

  /** Puts a world point at the centre of the screen. */
  centreOn(p: Point, zoom = this.state.zoom, ms = 420): Promise<void> {
    const v = this.viewport;
    return this.flyTo(v.w / 2 - p.x * zoom, v.h / 2 - p.y * zoom, zoom, ms);
  }

  stop(): void {
    if (this.frame) cancelAnimationFrame(this.frame);
    this.frame = 0;
  }
}
