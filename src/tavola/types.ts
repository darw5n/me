/**
 * Shared types of the table engine.
 *
 * Coordinate systems:
 * - "world" coordinates are CSS pixels on the table at zoom 1. Items, the table
 *   rectangle and the camera all live here.
 * - "screen" coordinates are CSS pixels in the viewport.
 * The camera maps world → screen: screen = world * zoom + (camera.x, camera.y).
 */

export interface Point {
  x: number;
  y: number;
}

export interface Size {
  w: number;
  h: number;
}

export interface Rect extends Point, Size {}

/** How the table should be arranged: scattered as on a real desk, or in a tidy grid. */
export type Arrangement = "messy" | "tidy";

/**
 * Everything the layout needs to know about one object on the table.
 * It is deliberately free of DOM references so that the layout can be unit tested.
 */
export interface LayoutItem {
  id: string;
  /** Cluster the item belongs to when the table is messy. */
  cluster: string;
  /** Group the item belongs to under "Tidy up" (defaults to the cluster). */
  group: string;
  /** Position inside the cluster, relative to the cluster origin, in world px. */
  rel: Point;
  /** Rendered size of the un-rotated element, in world px. */
  size: Size;
  /** Rotation in degrees when the table is messy. */
  rotation: number;
  /** How many grid columns the item spans under "Tidy up". */
  span: number;
  /** Small things (stickers, chalk marks) may sit closer to their neighbours. */
  small: boolean;
  /** Decorations fade out under "Tidy up" and are skipped by its grid. */
  decoration: boolean;
}

/** Position assigned to an item by a layout pass (top-left of the un-rotated element). */
export interface Placement extends Point {
  rotation: number;
}

export type Placements = Map<string, Placement>;

export interface LayoutResult {
  placements: Placements;
  /** Bounding box of everything that was placed, in world px. */
  bounds: Rect;
  /** Positions of the chalk group labels (Tidy up only). */
  labels: Map<string, Point>;
  /** Zoom at which this arrangement should open. */
  zoom: number;
}

export interface Camera {
  x: number;
  y: number;
  zoom: number;
}

/** A material decides how an object reacts to hover, press and drag. */
export type Material =
  | "paper"
  | "print"
  | "postit"
  | "folder"
  | "strip"
  | "film"
  | "slide"
  | "card"
  | "sticker"
  | "chalk"
  | "patch"
  | "tag"
  | "label"
  | "ticket"
  | "stamp"
  | "prop";
