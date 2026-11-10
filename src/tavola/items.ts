/**
 * The objects on the table, read from the DOM.
 *
 * Markup contract (one element per object):
 *   <div class="item" data-cluster="about" data-at="660,-10" data-width="250"
 *        data-rotate="2.6" data-span="2" data-group="pack" data-small data-decoration
 *        data-material="print">
 *     <div class="item__body"> …the material… </div>
 *   </div>
 *
 * - data-cluster   where the object sits when the table is messy (required)
 * - data-at        position inside the cluster, "x,y" in px (default "0,0")
 * - data-width     width in px on a desktop (required)
 * - data-rotate    rotation in degrees when messy (default 0)
 * - data-span      columns taken under "Tidy up" (default 1)
 * - data-group     group under "Tidy up" (default: the cluster)
 * - data-small     sticker-sized: may sit closer to neighbours, lines up in a row when tidy
 * - data-decoration chalk marks etc.: fade out when tidy, skipped by its grid
 * - data-material  how the object reacts (see types.ts)
 *
 * The outer element is never rotated: the layout positions it with --x/--y and the
 * inner body rotates with --rot. So `offsetWidth/Height` of the outer element is
 * the un-rotated size the layout needs.
 */

import type { Arrangement, LayoutItem, Material, Placement, Point, Rect, Size } from "./types.js";

export interface TableItem {
  el: HTMLElement;
  body: HTMLElement;
  id: string;
  cluster: string;
  group: string;
  rel: Point;
  baseWidth: number;
  rotation: number;
  span: number;
  small: boolean;
  decoration: boolean;
  material: Material;
  /** Where the layout put the object, for the current arrangement. */
  home: Placement;
  /** How far the visitor dragged it away from home, per arrangement. */
  offset: Record<Arrangement, Point>;
}

const numberList = (value: string | undefined, fallback: number[]): number[] => {
  if (!value) return fallback;
  const parsed = value.split(",").map((v) => Number(v.trim()));
  return parsed.every((n) => Number.isFinite(n)) ? parsed : fallback;
};

const number = (value: string | undefined, fallback: number): number => {
  const n = Number(value);
  return value !== undefined && Number.isFinite(n) ? n : fallback;
};

const MATERIALS: ReadonlySet<string> = new Set([
  "paper", "print", "postit", "folder", "strip", "film", "slide", "card", "sticker", "chalk",
  "patch", "tag", "label", "ticket", "stamp", "prop",
]);

const materialOf = (el: HTMLElement): Material => {
  const m = el.dataset["material"];
  return m && MATERIALS.has(m) ? (m as Material) : "paper";
};

/** Reads every `.item` inside `root`, in DOM order (which is the reading order). */
export const readItems = (root: ParentNode): TableItem[] =>
  [...root.querySelectorAll<HTMLElement>(".item")].map((el, index) => {
    const d = el.dataset;
    const cluster = d["cluster"] ?? "misc";
    const [x = 0, y = 0] = numberList(d["at"], [0, 0]);
    const body = el.querySelector<HTMLElement>(":scope > .item__body") ?? el;
    const id = el.id || `item-${index + 1}`;
    el.id = id;
    return {
      el,
      body,
      id,
      cluster,
      group: d["group"] ?? cluster,
      rel: { x, y },
      baseWidth: number(d["width"], 300),
      rotation: number(d["rotate"], 0),
      span: Math.max(1, Math.round(number(d["span"], 1))),
      small: "small" in d,
      decoration: "decoration" in d,
      material: materialOf(el),
      home: { x: 0, y: 0, rotation: 0 },
      offset: { messy: { x: 0, y: 0 }, tidy: { x: 0, y: 0 } },
    };
  });

/** Size of the un-rotated element as currently rendered. Forces layout: call it in batches. */
export const measure = (item: TableItem): Size => ({ w: item.el.offsetWidth, h: item.el.offsetHeight });

export const setWidth = (item: TableItem, width: number): void => {
  item.el.style.width = `${Math.round(width)}px`;
};

/** The layout only sees plain data, so it stays testable. */
export const toLayoutItem = (item: TableItem, size: Size): LayoutItem => ({
  id: item.id,
  cluster: item.cluster,
  group: item.group,
  rel: item.rel,
  size,
  rotation: item.rotation,
  span: item.span,
  small: item.small,
  decoration: item.decoration,
});

/** Position actually shown: home plus the visitor's drag offset. */
export const positionOf = (item: TableItem, mode: Arrangement): Point => ({
  x: item.home.x + item.offset[mode].x,
  y: item.home.y + item.offset[mode].y,
});

export const rectOf = (item: TableItem, mode: Arrangement): Rect => {
  const p = positionOf(item, mode);
  return { x: p.x, y: p.y, w: item.el.offsetWidth, h: item.el.offsetHeight };
};

/** Writes position and rotation to the element through CSS custom properties. */
export const render = (item: TableItem, mode: Arrangement): void => {
  const p = positionOf(item, mode);
  item.el.style.setProperty("--x", `${p.x.toFixed(2)}px`);
  item.el.style.setProperty("--y", `${p.y.toFixed(2)}px`);
  item.el.style.setProperty("--rot", `${item.home.rotation}deg`);
};

/** Finds the item that owns a DOM node, if any. */
export const itemAt = (items: TableItem[], node: EventTarget | null): TableItem | undefined => {
  if (!(node instanceof Element)) return undefined;
  const el = node.closest<HTMLElement>(".item");
  return el ? items.find((i) => i.el === el) : undefined;
};
