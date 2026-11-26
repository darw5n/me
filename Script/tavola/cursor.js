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
 * | sticker, prop, chalk          | open hand, a little bigger (move only) |
 * | button down / dragging        | closed hand                    |
 * | photo viewer: on the picture  | magnifier "zoom in"; zoomed: hand, fist while dragging |
 * | dialogs: the veil, off a photo | open hand "close" (a click there closes)              |
 * | dialogs: the paper of a form  | open hand                      |
 * | bars, buttons, text fields    | the system cursor (they are interface, not table)     |
 *
 * An open <dialog> sits in the top layer, over everything in the page: the cursor moves
 * into it while it is open, or it would pass underneath (13/11/2026, Darwin: the table's
 * cursor stays with photos and dialogs too).
 *
 * The label of a link comes from data-cursor="…".
 */
import { clickActionOf } from "./actions.js";
// The drawings share one style (Darwin, 26/11/2026): a thin ink line, a chalk halo
// outside it so it reads on the dark mats, chalk inside so it reads on paper and on
// yellow, and the yellow accents of the site. Fixed colours: they do not follow the
// surface (on kraft the chalk is dark, and a yellow hand vanished on a yellow post-it).
const INK = "#111";
const CHALK = "#f4f1e4";
const YELLOW = "#ffe24d";
const LINE = 1.7;
const HALO = LINE + 2.8;
/*
 * The two hands are Clarity's "cursor-hand-open-line" and "cursor-hand-grab-line"
 * (github.com/vmware/clarity-assets), filled and haloed here.
 * Copyright (c) 2018 VMware, Inc. MIT License.
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this
 * software and associated documentation files (the "Software"), to deal in the Software
 * without restriction, including without limitation the rights to use, copy, modify,
 * merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to the following
 * conditions: The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software. THE SOFTWARE IS PROVIDED "AS IS",
 * WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
 * WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
 * NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR
 * OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT
 * OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
const HAND_OPEN = "M31.46 8.57A3.11 3.11 0 0 0 27 5.75a3.19 3.19 0 0 0-4.66-2.64a3.29 3.29 0 0 0-6.42-.76a3.23 3.23 0 0 0-1.66-.46A3.27 3.27 0 0 0 11 5.18v12.66c-1.28-1.6-2.53-3.18-2.72-3.45a3.19 3.19 0 0 0-2.72-1.49a3.37 3.37 0 0 0-3.47 3.48C2.18 18.18 5.66 24.54 8 28c3.54 5.24 6.92 6 7.07 6h10.52a.92.92 0 0 0 .55-.19a13.13 13.13 0 0 0 3.75-6.13c1-3.09 1.53-7.53 1.58-13.56Zm-3.28 18.55a12.46 12.46 0 0 1-2.94 5.08h-9.91c-.47-.14-3.07-1.1-5.87-5.25s-5.52-9.68-5.57-10.66a1.5 1.5 0 0 1 .45-1.13a1.52 1.52 0 0 1 1.14-.46a1.43 1.43 0 0 1 1.32.71c.29.43 2.36 3 3.57 4.53l2.43-1.64V5.18a1.48 1.48 0 1 1 2.95 0v11.14h1.8v-13a1.51 1.51 0 0 1 3 0v13.13h1.8V6a1.43 1.43 0 1 1 2.85 0v11.44H27v-8.9a1.33 1.33 0 0 1 2.65 0v5.55c-.03 5.91-.51 10.12-1.47 13.03";
const HAND_GRAB = "M28.09 9.74a4 4 0 0 0-1.16.19c-.19-1.24-1.55-2.18-3.27-2.18a4 4 0 0 0-1.53.25A3.37 3.37 0 0 0 19 6.3a3.45 3.45 0 0 0-2.87 1.32a3.65 3.65 0 0 0-1.89-.51A3.05 3.05 0 0 0 11 9.89v.91c-1.06.4-4.11 1.8-4.91 4.84s.34 8 2.69 11.78a25.2 25.2 0 0 0 5.9 6.41a.9.9 0 0 0 .53.17h10.34a.92.92 0 0 0 .55-.19a13.13 13.13 0 0 0 3.75-6.13A25.8 25.8 0 0 0 31.41 18v-5.5a3.08 3.08 0 0 0-3.32-2.76M29.61 18a24 24 0 0 1-1.47 9.15a12.46 12.46 0 0 1-2.94 5.05h-9.73a23.8 23.8 0 0 1-5.2-5.72c-2.37-3.86-3-8.23-2.48-10.39A5.7 5.7 0 0 1 11 12.76v7.65a.9.9 0 0 0 1.8 0V9.89c0-.47.59-1 1.46-1s1.49.52 1.49 1v5.72h1.8v-6.8c0-.28.58-.71 1.46-.71s1.53.48 1.53.75v6.89h1.8V10l.17-.12a2.1 2.1 0 0 1 1.18-.32c.93 0 1.5.44 1.5.68v6.5H27v-4.87a1.9 1.9 0 0 1 1.12-.33c.86 0 1.52.51 1.52.94Z";
/** A Clarity line drawing: chalk halo, chalk silhouette (its first subpath), the ink line. */
const hand = (d, cls) => {
    const silhouette = d.split(/(?=[Mm])/)[0] ?? d;
    return `<svg class="cursor__${cls}" viewBox="0 0 36 36" aria-hidden="true"><path d="${d}" fill="none" stroke="${CHALK}" stroke-width="2.6" stroke-linejoin="round"/><path d="${silhouette}" fill="${CHALK}"/><path d="${d}" fill="${INK}"/></svg>`;
};
const PENCIL = `<svg class="cursor__pen" viewBox="0 0 40 40" aria-hidden="true"><g stroke="#fff" stroke-width="3" stroke-linejoin="round" fill="#fff"><path d="M2 2 11 6 33 28 28 33 6 11Z"/><path d="M33 28l5 5-5 5-5-5Z"/></g><path d="M2 2 11 6 6 11Z" fill="#7f1d0d"/><path d="M11 6 33 28 28 33 6 11Z" fill="#e2361b"/><path d="M15 10l-5 5M21 16l-5 5M27 22l-5 5" stroke="#7f1d0d" stroke-width="1.2" fill="none"/><path d="M33 28l5 5-5 5-5-5Z" fill="#f4f1e4" stroke="#7f1d0d" stroke-width="1"/></svg>`;
// A magnifier: the hot spot is the centre of the lens
const LENS = `<svg class="cursor__lens" viewBox="0 0 40 40" aria-hidden="true"><path d="M24 24l10.5 10.5" stroke="${CHALK}" stroke-width="${6 + HALO}" stroke-linecap="round"/><circle cx="15" cy="15" r="11.5" fill="${CHALK}" stroke="${CHALK}" stroke-width="${HALO}"/><path d="M24 24l10.5 10.5" stroke="${INK}" stroke-width="${6 + LINE}" stroke-linecap="round"/><path d="M24 24l10.5 10.5" stroke="${CHALK}" stroke-width="6" stroke-linecap="round"/><circle cx="15" cy="15" r="11.5" fill="${CHALK}" stroke="${INK}" stroke-width="${LINE}"/><circle cx="15" cy="15" r="9.2" fill="rgba(255,255,255,.35)" stroke="${YELLOW}" stroke-width="2.6"/><circle cx="15" cy="15" r="7.9" fill="none" stroke="${INK}" stroke-width="${LINE * 0.8}"/><path d="M11 11.5a5 5 0 0 1 4-3" fill="none" stroke="${INK}" stroke-width="1.2" stroke-linecap="round"/></svg>`;
// An arrow out of a yellow disc: "this takes you somewhere"
const GO = `<svg class="cursor__go" viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="14" fill="${CHALK}" stroke="${CHALK}" stroke-width="${HALO}"/><circle cx="18" cy="18" r="14" fill="${YELLOW}" stroke="${INK}" stroke-width="${LINE}"/><path d="M12.5 23.5 23.5 12.5M15.5 12.5h8v8" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
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
        hand(HAND_OPEN, "open") +
            hand(HAND_GRAB, "fist") +
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
    // Inside an open dialog: what a click does there (null: the system cursor)
    const inDialog = (dialog, target) => {
        if (target.closest(".controls, button, a, input, textarea, select, label, summary"))
            return null;
        const stage = dialog.querySelector(".viewer__stage");
        if (stage) {
            const img = stage.querySelector("img");
            const r = img?.getBoundingClientRect();
            const onPicture = !!r && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
            const zoomed = dialog.classList.contains("is-zoomed");
            if (down)
                return ["fist", ""];
            if (onPicture)
                return zoomed ? ["hand", ""] : ["lens", "zoom in"];
            return zoomed ? ["hand", ""] : ["hand", "close"];
        }
        // A form on paper: the paper is the dialog's own box, the rest is the veil
        if (target === dialog) {
            const r = dialog.getBoundingClientRect();
            const onPaper = x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
            return onPaper ? ["hand", ""] : ["hand", "close"];
        }
        return ["hand", ""];
    };
    const paint = (target) => {
        // The cursor lives where it can be seen: in the open dialog, else in the page
        const dialog = document.querySelector("dialog[open]");
        const host = dialog ?? document.body;
        if (el.parentNode !== host)
            host.append(el);
        if (!(target instanceof Element)) {
            root.classList.remove("has-cursor");
            return;
        }
        if (dialog) {
            const state = inDialog(dialog, target);
            root.classList.toggle("has-cursor", state !== null);
            if (state)
                show(...state);
            return;
        }
        // The bottom bar and the corner are interface, not table: the system cursor
        if (target.closest(".controls, .corner")) {
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
        down = view.contains(e.target) || !!e.target?.closest?.(".viewer__stage");
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
