/**
 * The table's own cursor, for mouse users only. It announces what a click does
 * (actions.ts), and turns into a closed hand as soon as the button goes down,
 * so every object teaches that it can be carried.
 *
 * | where                         | cursor                         |
 * |-------------------------------|--------------------------------|
 * | empty table                   | open hand (pan)                |
 * | note, post-it, card           | pencil (click draws the ring)  |
 * | photo, screen                 | magnifier (click looks closer) |
 * | other site, email, folder     | arrow ↗ + taped label          |
 * | sticker, prop, chalk          | yellow open hand (move only)   |
 * | button down / dragging        | closed hand                    |
 * | bottom bar, dialogs           | the system cursor              |
 *
 * The label of a link comes from data-cursor="…".
 */
import { clickActionOf } from "./actions.js";
const hand = (fingers, thumb, palm, cls) => {
    const shapes = fingers.map(([x = 0, y = 0, h = 0]) => `<rect x="${x}" y="${y}" width="4.2" height="${h}" rx="2.1"/>`).join("") +
        `<rect x="${thumb[0]}" y="${thumb[1]}" width="4.4" height="${thumb[2]}" rx="2.2" transform="rotate(${thumb[3]} ${(thumb[0] ?? 0) + 2} ${(thumb[1] ?? 0) + (thumb[2] ?? 0) / 2})"/>` +
        `<rect x="${palm[0]}" y="${palm[1]}" width="${palm[2]}" height="${palm[3]}" rx="6"/>`;
    return `<svg class="cursor__${cls}" viewBox="0 0 32 32" aria-hidden="true"><g fill="#111" stroke="#111" stroke-width="3" stroke-linejoin="round">${shapes}</g><g fill="currentColor">${shapes}</g></svg>`;
};
const PENCIL = `<svg class="cursor__pen" viewBox="0 0 40 40" aria-hidden="true"><g stroke="#fff" stroke-width="3" stroke-linejoin="round" fill="#fff"><path d="M2 2 11 6 33 28 28 33 6 11Z"/><path d="M33 28l5 5-5 5-5-5Z"/></g><path d="M2 2 11 6 6 11Z" fill="#7f1d0d"/><path d="M11 6 33 28 28 33 6 11Z" fill="#e2361b"/><path d="M15 10l-5 5M21 16l-5 5M27 22l-5 5" stroke="#7f1d0d" stroke-width="1.2" fill="none"/><path d="M33 28l5 5-5 5-5-5Z" fill="#f4f1e4" stroke="#7f1d0d" stroke-width="1"/></svg>`;
// A magnifier: the hot spot is the centre of the lens
const LENS = `<svg class="cursor__lens" viewBox="0 0 40 40" aria-hidden="true"><path d="M24 24l11 11" stroke="#111" stroke-width="8" stroke-linecap="round"/><path d="M24 24l11 11" stroke="#f4f1e4" stroke-width="4.5" stroke-linecap="round"/><circle cx="15" cy="15" r="11" fill="rgba(255,255,255,.25)" stroke="#111" stroke-width="5"/><circle cx="15" cy="15" r="11" fill="none" stroke="#ffe24d" stroke-width="2.6"/><path d="M10 11a6 6 0 0 1 5-4" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>`;
// An arrow out of a yellow disc: "this takes you somewhere"
const GO = `<svg class="cursor__go" viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="15" fill="#ffe24d" stroke="#111" stroke-width="2.5"/><path d="M12 24 24 12M15 12h9v9" fill="none" stroke="#111" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const DEFAULT_WORDS = { view: "look closer" };
export const installCursor = ({ view }) => {
    if (!view || !matchMedia("(hover: hover) and (pointer: fine)").matches)
        return;
    const root = document.documentElement;
    const el = document.createElement("div");
    el.className = "cursor";
    el.setAttribute("aria-hidden", "true");
    el.dataset["state"] = "hand";
    el.innerHTML =
        hand([[8.6, 7, 14], [12.9, 3.4, 16], [17.2, 4.2, 16], [21.5, 7.4, 13]], [3.4, 13, 11, -34], [8.6, 13, 17.1, 15], "open") +
            hand([[8.6, 11, 9], [12.9, 10, 10], [17.2, 10, 10], [21.5, 11, 9]], [5.6, 15, 8, -22], [8.6, 14, 17.1, 13], "fist") +
            PENCIL +
            LENS +
            GO +
            `<b class="cursor__label"></b>`;
    document.body.append(el);
    const label = el.querySelector(".cursor__label");
    let down = false;
    const show = (state, words = "") => {
        el.dataset["state"] = state;
        label.classList.toggle("is-on", words !== "");
        if (words)
            label.textContent = words;
    };
    const paint = (target) => {
        // Interface and dialogs keep the system cursor: they are not on the table.
        if (!(target instanceof Element) || document.querySelector("dialog[open]") || target.closest(".controls, .corner")) {
            root.classList.remove("has-cursor");
            return;
        }
        root.classList.add("has-cursor");
        if (down || document.querySelector(".item.is-dragging") || view.classList.contains("is-panning")) {
            show("fist");
            return;
        }
        const link = target.closest("a, button");
        switch (clickActionOf(target)) {
            case "ring":
                show("pen");
                return;
            case "view":
                show("lens", link?.dataset["cursor"] ?? DEFAULT_WORDS["view"]);
                return;
            case "leave":
                show("go", link?.dataset["cursor"] ?? "open");
                return;
            case "move":
                show("grab");
                return;
            default:
                show("hand");
        }
    };
    let x = -99;
    let y = -99;
    let target = null;
    let frame = 0;
    const draw = () => {
        frame = 0;
        el.style.transform = `translate(${x}px, ${y}px)`;
        paint(target);
        label.style.transform = `translateX(${x > innerWidth - 220 ? "-190px" : "0"}) rotate(-2deg)`;
    };
    const schedule = () => {
        if (!frame)
            frame = requestAnimationFrame(draw);
    };
    addEventListener("pointermove", (e) => {
        if (e.pointerType !== "mouse") {
            root.classList.remove("has-cursor");
            return;
        }
        x = e.clientX;
        y = e.clientY;
        target = e.target;
        schedule();
    }, { passive: true });
    // The hand closes as soon as the button goes down, before any movement.
    addEventListener("pointerdown", (e) => {
        if (e.pointerType !== "mouse" || e.button !== 0)
            return;
        down = view.contains(e.target);
        target = e.target;
        schedule();
    });
    addEventListener("pointerup", (e) => {
        down = false;
        target = e.target;
        schedule();
    });
    root.addEventListener("pointerleave", () => root.classList.remove("has-cursor"));
    addEventListener("click", () => setTimeout(() => paint(target), 40));
};
