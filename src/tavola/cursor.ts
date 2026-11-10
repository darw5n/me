/**
 * The table's own cursor, for mouse users only.
 *
 * - open hand on the table, yellow hand on an object;
 * - fist while panning or carrying something;
 * - red pencil on links, with a taped label saying what will happen
 *   (data-cursor="…" on the link, or a default by kind of link).
 *
 * The real cursor is hidden through a class on <html>; a dialog brings it back.
 */

const hand = (fingers: number[][], thumb: number[], palm: number[], cls: string): string => {
  const shapes =
    fingers.map(([x = 0, y = 0, h = 0]) => `<rect x="${x}" y="${y}" width="4.2" height="${h}" rx="2.1"/>`).join("") +
    `<rect x="${thumb[0]}" y="${thumb[1]}" width="4.4" height="${thumb[2]}" rx="2.2" transform="rotate(${thumb[3]} ${(thumb[0] ?? 0) + 2} ${(thumb[1] ?? 0) + (thumb[2] ?? 0) / 2})"/>` +
    `<rect x="${palm[0]}" y="${palm[1]}" width="${palm[2]}" height="${palm[3]}" rx="6"/>`;
  return `<svg class="cursor__${cls}" viewBox="0 0 32 32" aria-hidden="true"><g fill="#111" stroke="#111" stroke-width="3" stroke-linejoin="round">${shapes}</g><g fill="currentColor">${shapes}</g></svg>`;
};

const PENCIL = `<svg class="cursor__pen" viewBox="0 0 40 40" aria-hidden="true"><g stroke="#fff" stroke-width="3" stroke-linejoin="round" fill="#fff"><path d="M2 2 11 6 33 28 28 33 6 11Z"/><path d="M33 28l5 5-5 5-5-5Z"/></g><path d="M2 2 11 6 6 11Z" fill="#7f1d0d"/><path d="M11 6 33 28 28 33 6 11Z" fill="#e2361b"/><path d="M15 10l-5 5M21 16l-5 5M27 22l-5 5" stroke="#7f1d0d" stroke-width="1.2" fill="none"/><path d="M33 28l5 5-5 5-5-5Z" fill="#f4f1e4" stroke="#7f1d0d" stroke-width="1"/></svg>`;

type CursorState = "hand" | "object" | "fist" | "pen";

export interface CursorOptions {
  /** The pannable viewport; null on a phone, where the cursor does not exist. */
  view: HTMLElement | null;
}

export const installCursor = ({ view }: CursorOptions): void => {
  if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;

  const root = document.documentElement;
  const el = document.createElement("div");
  el.className = "cursor";
  el.setAttribute("aria-hidden", "true");
  el.dataset["state"] = view ? "hand" : "pen";
  el.innerHTML =
    hand([[8.6, 7, 14], [12.9, 3.4, 16], [17.2, 4.2, 16], [21.5, 7.4, 13]], [3.4, 13, 11, -34], [8.6, 13, 17.1, 15], "open") +
    hand([[8.6, 11, 9], [12.9, 10, 10], [17.2, 10, 10], [21.5, 11, 9]], [5.6, 15, 8, -22], [8.6, 14, 17.1, 13], "fist") +
    PENCIL +
    `<b class="cursor__label"></b>`;
  document.body.append(el);
  const label = el.querySelector<HTMLElement>(".cursor__label")!;

  const say = (text: string): void => {
    label.classList.toggle("is-on", text !== "");
    if (text) label.textContent = text;
  };

  const wordFor = (link: HTMLElement): string =>
    link.dataset["cursor"] ??
    (link.dataset["open"] !== undefined ? "open the folder" : link.dataset["view"] !== undefined ? "look closer" : "");

  const setState = (state: CursorState): void => {
    el.dataset["state"] = state;
  };

  const paint = (target: EventTarget | null): void => {
    if (document.querySelector("dialog[open]") || !(target instanceof Element)) {
      root.classList.remove("has-cursor");
      return;
    }
    root.classList.add("has-cursor");
    if (document.querySelector(".item.is-dragging") || view?.classList.contains("is-panning")) {
      setState("fist");
      say("");
      return;
    }
    const link = target.closest<HTMLElement>("a, button, [role=button], label, input, select");
    if (link) {
      setState("pen");
      say(link.closest(".controls, .corner, .viewer") ? "" : wordFor(link));
      return;
    }
    say("");
    if (!view || target.closest(".minimap")) {
      setState("pen");
      return;
    }
    setState(target.closest(".item") ? "object" : "hand");
  };

  let x = -99;
  let y = -99;
  let target: EventTarget | null = null;
  let frame = 0;
  const draw = (): void => {
    frame = 0;
    el.style.transform = `translate(${x}px, ${y}px)`;
    paint(target);
    label.style.transform = `translateX(${x > innerWidth - 220 ? "-190px" : "0"}) rotate(-2deg)`;
  };
  const schedule = (): void => {
    if (!frame) frame = requestAnimationFrame(draw);
  };

  addEventListener(
    "pointermove",
    (e) => {
      if (e.pointerType !== "mouse") {
        root.classList.remove("has-cursor");
        return;
      }
      x = e.clientX;
      y = e.clientY;
      target = e.target;
      schedule();
    },
    { passive: true },
  );
  addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse") el.classList.add("is-down");
  });
  addEventListener("pointerup", (e) => {
    el.classList.remove("is-down");
    target = e.target;
    schedule();
  });
  root.addEventListener("pointerleave", () => root.classList.remove("has-cursor"));
  addEventListener("click", () => setTimeout(() => paint(target), 40));
};
