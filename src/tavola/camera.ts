/**
 * The camera: pan and zoom over the world element.
 *
 * screen = world * zoom + (x, y)
 *
 * The table is finite. The camera is allowed to see only the table: `bounds`
 * is the table rectangle in world px. While the visitor drags past an edge the
 * camera gives way a little (rubber band) and `settle()` brings it back.
 */

import { clamp, easeOut, lerp } from "./geometry.js";
import type { Camera, Point, Rect, Size } from "./types.js";

export interface CameraOptions {
  /** Element that receives the transform. */
  world: HTMLElement;
  /** Called after every change, e.g. to refresh the minimap. */
  onChange?: (camera: Camera) => void;
  reducedMotion: boolean;
}

const MAX_ZOOM = 2.5;
/** How much of an over-pan is shown: 0 = hard wall, 1 = no limit. */
const RUBBER = 0.35;

export class CameraController {
  readonly state: Camera = { x: 0, y: 0, zoom: 1 };
  private bounds: Rect | null = null;
  private minZoom = 0.1;
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
    return { w: window.innerWidth, h: window.innerHeight };
  }

  /** The table the camera may look at. The minimum zoom lets the whole table fit. */
  setBounds(rect: Rect): void {
    this.bounds = rect;
    const v = this.viewport;
    this.minZoom = Math.min(1, Math.min(v.w / rect.w, v.h / rect.h) * 0.9);
  }

  getBounds(): Rect | null {
    return this.bounds;
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

  /** Camera position clamped so that the viewport stays on the table. */
  private clamped(x: number, y: number, zoom: number): Point {
    const b = this.bounds;
    if (!b) return { x, y };
    const v = this.viewport;
    const axis = (pos: number, start: number, length: number, view: number): number => {
      const scaled = length * zoom;
      // A table smaller than the window is centred instead.
      if (scaled <= view) return (view - scaled) / 2 - start * zoom;
      return clamp(pos, view - (start + length) * zoom, -start * zoom);
    };
    return { x: axis(x, b.x, b.w, v.w), y: axis(y, b.y, b.h, v.h) };
  }

  private commit(): void {
    const { x, y, zoom } = this.state;
    this.world.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) scale(${zoom.toFixed(4)})`;
    this.onChange?.(this.state);
  }

  /** Jumps to a position; the camera is kept on the table. */
  set(x: number, y: number, zoom = this.state.zoom): void {
    this.stop();
    const z = clamp(zoom, this.minZoom, MAX_ZOOM);
    const p = this.clamped(x, y, z);
    this.state.x = p.x;
    this.state.y = p.y;
    this.state.zoom = z;
    this.commit();
  }

  /**
   * Pans by a screen delta. With `soft` the camera may leave the table a little,
   * with resistance, so a drag past the edge feels like a rubber band.
   */
  panBy(dx: number, dy: number, soft = false): void {
    this.stop();
    const target = { x: this.state.x + dx, y: this.state.y + dy };
    const inside = this.clamped(target.x, target.y, this.state.zoom);
    if (soft) {
      this.state.x = inside.x + (target.x - inside.x) * RUBBER;
      this.state.y = inside.y + (target.y - inside.y) * RUBBER;
    } else {
      this.state.x = inside.x;
      this.state.y = inside.y;
    }
    this.commit();
  }

  /** Zooms around a screen point, so what is under the pointer stays there. */
  zoomAt(screen: Point, zoom: number): void {
    this.stop();
    const z = clamp(zoom, this.minZoom, MAX_ZOOM);
    const { x, y, zoom: k } = this.state;
    const nx = screen.x - ((screen.x - x) * z) / k;
    const ny = screen.y - ((screen.y - y) * z) / k;
    const p = this.clamped(nx, ny, z);
    this.state.x = p.x;
    this.state.y = p.y;
    this.state.zoom = z;
    this.commit();
  }

  /** Animated flight. Honoured instantly under reduced motion. */
  flyTo(x: number, y: number, zoom: number, ms = 620): Promise<void> {
    this.stop();
    const z = clamp(zoom, this.minZoom, MAX_ZOOM);
    const to = { ...this.clamped(x, y, z), zoom: z };
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

  /** After a soft pan: glides back onto the table if the camera left it. */
  settle(): void {
    const p = this.clamped(this.state.x, this.state.y, this.state.zoom);
    if (Math.abs(p.x - this.state.x) < 0.5 && Math.abs(p.y - this.state.y) < 0.5) return;
    void this.flyTo(p.x, p.y, this.state.zoom, 380);
  }

  /** Frames a world rectangle with a screen padding on each side. */
  fitRect(rect: Rect, padding: { x: number; top: number; bottom: number }, ms = 620, maxZoom = 1): Promise<void> {
    const v = this.viewport;
    const zoom = Math.min(maxZoom, (v.w - padding.x * 2) / rect.w, (v.h - padding.top - padding.bottom) / rect.h);
    const x = (v.w - rect.w * zoom) / 2 - rect.x * zoom;
    const y = padding.top + (v.h - padding.top - padding.bottom - rect.h * zoom) / 2 - rect.y * zoom;
    return this.flyTo(x, y, zoom, ms);
  }

  /** Puts a world point at the centre of the screen, keeping the zoom. */
  centreOn(p: Point, zoom = this.state.zoom, ms = 420): Promise<void> {
    const v = this.viewport;
    return this.flyTo(v.w / 2 - p.x * zoom, v.h / 2 - p.y * zoom, zoom, ms);
  }

  stop(): void {
    if (this.frame) cancelAnimationFrame(this.frame);
    this.frame = 0;
  }
}
