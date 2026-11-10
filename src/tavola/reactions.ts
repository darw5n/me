/**
 * How objects answer a tap: the red pencil ring, the sticker bounce.
 *
 * The ring is an SVG path drawn in real pixels around the object's body and
 * revealed with a dash offset, so it looks hand-drawn. It is redrawn when the
 * object changes size (Tidy up, resize).
 */

import type { TableItem } from "./items.js";
import type { Sound } from "./sound.js";

const SVG_NS = "http://www.w3.org/2000/svg";

/** A slightly wobbly ellipse in a 100×100 box, as control points. */
const RING_POINTS: number[][] = [
  [52, 3],
  [22, 2, 5, 10, 4, 40],
  [3, 68, 6, 96, 34, 97],
  [58, 98, 92, 99, 96, 67],
  [99, 40, 98, 5, 66, 3],
  [54, 2, 40, 4, 32, 9],
];

const ringPath = (w: number, h: number): string => {
  const scale = (v: number, i: number): string => ((v * (i % 2 ? h : w)) / 100).toFixed(1);
  const [start = [], ...curves] = RING_POINTS;
  return `M${start.map(scale).join(" ")}` + curves.map((c) => `C${c.map(scale).join(" ")}`).join("");
};

/** Ensures a ring SVG exists inside `host` and fits its current size. */
const ringIn = (host: HTMLElement): SVGSVGElement => {
  let svg = host.querySelector<SVGSVGElement>(":scope > .ring");
  if (!svg) {
    svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("class", "ring");
    svg.setAttribute("aria-hidden", "true");
    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("pathLength", "1");
    svg.append(path);
    host.append(svg);
    if (getComputedStyle(host).position === "static") host.style.position = "relative";
  }
  const w = host.offsetWidth * 1.1;
  const h = host.offsetHeight * 1.12;
  svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
  svg.querySelector("path")?.setAttribute("d", ringPath(w, h));
  return svg;
};

export interface Rings {
  /** Draws or erases the ring around `host`. Returns the new state. */
  toggle(host: HTMLElement, force?: boolean): boolean;
  /** Redraws every ring on the table after sizes changed. */
  refresh(root: ParentNode): void;
}

export const createRings = (sound: Sound): Rings => ({
  toggle(host, force) {
    const had = host.querySelector(":scope > .ring.is-on") !== null;
    const svg = ringIn(host);
    svg.getBoundingClientRect(); // flush, so the stroke animates from zero on first draw
    const on = force ?? !had;
    svg.classList.toggle("is-on", on);
    sound.play(on ? "press" : "lift");
    return on;
  },
  refresh(root) {
    root.querySelectorAll<SVGSVGElement>(".ring").forEach((svg) => {
      const host = svg.parentElement;
      if (host) ringIn(host);
    });
  },
});

/**
 * A tap on an object. Stickers bounce; links to other pages are left alone;
 * everything else gets the ring (a link keeps it, so a returning visitor sees
 * what they already opened).
 */
export const reactToTap = (item: TableItem, target: Element, rings: Rings, sound: Sound): void => {
  if (item.material === "sticker") {
    item.body.classList.remove("is-popping");
    void item.body.offsetWidth; // restart the animation
    item.body.classList.add("is-popping");
    sound.play("press");
    return;
  }
  if (target.closest("a[data-open], .labels")) return;
  const frame = target.closest<HTMLElement>(".film a");
  if (frame) {
    frame.dataset["kept"] = "1";
    rings.toggle(frame, true);
    return;
  }
  const link = target.closest("a, button");
  rings.toggle(item.body, link ? true : undefined);
};

/** On a film strip the ring follows the mouse, and stays where the visitor clicked. */
export const attachFilmHover = (root: ParentNode, rings: Rings): void => {
  root.querySelectorAll<HTMLElement>(".film a").forEach((frame) => {
    frame.addEventListener("pointerenter", (e) => {
      if (e.pointerType !== "mouse") return;
      const svg = ringIn(frame);
      svg.getBoundingClientRect();
      svg.classList.add("is-on");
    });
    frame.addEventListener("pointerleave", () => {
      if (!frame.dataset["kept"]) frame.querySelector(".ring")?.classList.remove("is-on");
    });
  });
};
