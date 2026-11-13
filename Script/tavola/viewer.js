/**
 * Viewer for photos and screens, the same as the portfolio's (Darwin, 13/11/2026).
 * Opens for `a[data-view]` (href = the full image, data-caption = the words under it,
 * data-alt = optional alt text). The arrows walk through every picture on the table,
 * in reading order, so the bar never shrinks to a lonely Close.
 *
 * - The stage is the whole screen: the picture sits fitted above the caption and the
 *   bar; a click or tap zooms in there (and back), the wheel and two fingers zoom, a
 *   drag moves a zoomed picture. A click off the picture closes.
 * - The caption is a strip of tape just above the bar.
 * - The veil behind takes the colour of the picture on show and changes with it
 *   (--veil); a picture with no colour keeps the mat's.
 */
/* The veil's colour from the picture. Not a plain average: a screenshot is mostly white,
   and a pale veil would swallow it. Each pixel counts by how coloured it is; the hue is
   then kept dark and soft, so the picture stands out and the caption stays readable.
   No colour at all (white and grey) gives null: the veil stays the mat's. */
export const veilOf = (img) => {
    try {
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = 32;
        const g = canvas.getContext("2d", { willReadFrequently: true });
        if (!g)
            return null;
        g.drawImage(img, 0, 0, 32, 32);
        const d = g.getImageData(0, 0, 32, 32).data;
        let r = 0, gr = 0, b = 0, w = 0;
        for (let i = 0; i < d.length; i += 4) {
            const R = d[i], G = d[i + 1], B = d[i + 2];
            const weight = (Math.max(R, G, B) - Math.min(R, G, B)) / 255; // chroma
            r += R * weight;
            gr += G * weight;
            b += B * weight;
            w += weight;
        }
        if (w < 20)
            return null;
        const [R, G, B] = [r / w / 255, gr / w / 255, b / w / 255];
        const max = Math.max(R, G, B), min = Math.min(R, G, B), dl = max - min;
        let h = 0;
        if (dl)
            h = max === R ? ((G - B) / dl) % 6 : max === G ? (B - R) / dl + 2 : (R - G) / dl + 4;
        const sat = dl ? dl / (1 - Math.abs(max + min - 1)) : 0;
        return `hsl(${Math.round(h * 60 + 360) % 360} ${Math.round(Math.min(32, sat * 100))}% 22%)`;
    }
    catch {
        return null; // a picture from another site can't be read: keep the mat
    }
};
export const installViewer = (root, sound) => {
    const box = document.createElement("dialog");
    box.className = "viewer";
    box.setAttribute("aria-label", "Photo viewer");
    box.innerHTML = `
    <div class="viewer__stage"><img class="viewer__image" alt="" draggable="false"></div>
    <p class="strip viewer__caption"></p>
    <div class="controls viewer__bar" role="toolbar" aria-label="Photo controls">
      <span class="controls__steps viewer__steps" role="group" aria-label="Photos">
        <button type="button" class="viewer__prev" aria-label="Previous photo">‹</button>
        <output class="viewer__count" aria-live="polite"></output>
        <button type="button" class="viewer__next" aria-label="Next photo">›</button>
      </span>
      <button type="button" class="controls__primary viewer__close">Close</button>
    </div>`;
    document.body.append(box);
    const $ = (s) => box.querySelector(s);
    const stage = $(".viewer__stage");
    const img = $(".viewer__image");
    const caption = $(".viewer__caption");
    const steps = $(".viewer__steps");
    const count = $(".viewer__count");
    const close = $(".viewer__close");
    // The fitted picture keeps clear of the caption, whatever its height
    new ResizeObserver(() => box.style.setProperty("--cap-h", `${caption.offsetHeight}px`)).observe(caption);
    let group = [];
    let index = 0;
    let opener = null;
    // ---- Zoom and move: translate + scale around the picture's own centre --------------
    let s = 1, tx = 0, ty = 0;
    const maxScale = () => Math.max(3, (img.naturalWidth / (img.offsetWidth || 1)) * 2);
    // One axis: picture size L at this scale, screen size V, laid-out centre c
    const limit = (t, L, V, c) => {
        const lo = Math.min(L / 2, V - L / 2) - c;
        const hi = Math.max(L / 2, V - L / 2) - c;
        return Math.min(hi, Math.max(lo, t));
    };
    const centre = () => [img.offsetLeft + img.offsetWidth / 2, img.offsetTop + img.offsetHeight / 2];
    const apply = () => {
        const [cx, cy] = centre();
        tx = limit(tx, img.offsetWidth * s, stage.clientWidth, cx);
        ty = limit(ty, img.offsetHeight * s, stage.clientHeight, cy);
        img.style.transform = `translate(${tx}px, ${ty}px) scale(${s})`;
        box.classList.toggle("is-zoomed", s > 1.01);
    };
    // Zoom to `next`, keeping the point under (x, y) still
    const zoomAt = (next, x, y) => {
        next = Math.min(maxScale(), Math.max(1, next));
        const r = stage.getBoundingClientRect();
        const [cx, cy] = centre();
        const px = x - r.left - cx, py = y - r.top - cy;
        tx = px - (px - tx) * (next / s);
        ty = py - (py - ty) * (next / s);
        s = next;
        apply();
    };
    const zoomCentre = (k) => {
        const r = stage.getBoundingClientRect();
        zoomAt(s * k, r.left + r.width / 2, r.top + r.height / 2);
    };
    const reset = () => {
        s = 1;
        tx = 0;
        ty = 0;
        apply();
    };
    // Wheel, and a trackpad pinch (it arrives as ctrl + wheel)
    stage.addEventListener("wheel", (e) => {
        e.preventDefault();
        zoomAt(s * Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.002)), e.clientX, e.clientY);
    }, { passive: false });
    // Fingers and mouse: one pointer drags, two pinch
    const pts = new Map();
    let moved = false;
    let pinch = null;
    const spread = () => {
        const [a, b] = [...pts.values()];
        return [a, b];
    };
    stage.addEventListener("pointerdown", (e) => {
        if (e.button !== 0)
            return;
        try {
            stage.setPointerCapture(e.pointerId);
        }
        catch { /* not a live pointer */ }
        pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
        moved = false;
        if (pts.size === 2) {
            const [a, b] = spread();
            pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), s };
        }
    });
    stage.addEventListener("pointermove", (e) => {
        const p = pts.get(e.pointerId);
        if (!p)
            return;
        const dx = e.clientX - p.x, dy = e.clientY - p.y;
        if (Math.abs(dx) + Math.abs(dy) > 3)
            moved = true;
        p.x = e.clientX;
        p.y = e.clientY;
        if (pts.size === 2 && pinch) {
            const [a, b] = spread();
            tx += dx / 2;
            ty += dy / 2; // the midpoint moves too
            zoomAt(pinch.s * (Math.hypot(a.x - b.x, a.y - b.y) / pinch.d), (a.x + b.x) / 2, (a.y + b.y) / 2);
        }
        else if (pts.size === 1 && s > 1) {
            tx += dx;
            ty += dy;
            apply();
        }
    });
    // Not e.target: with pointer capture every event lands on the stage
    const onPicture = (x, y) => {
        const r = img.getBoundingClientRect();
        return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
    };
    stage.addEventListener("pointerup", (e) => {
        if (!pts.delete(e.pointerId))
            return;
        if (pts.size < 2)
            pinch = null;
        if (pts.size || moved)
            return;
        // A tap: on the picture it zooms in there (or back to fit); off it, it closes
        if (onPicture(e.clientX, e.clientY)) {
            if (s > 1.01)
                reset();
            else
                zoomAt(2.5, e.clientX, e.clientY);
        }
        else if (s <= 1.01) {
            box.close();
        }
    });
    stage.addEventListener("pointercancel", (e) => {
        pts.delete(e.pointerId);
        pinch = null;
    });
    // ---- Showing a picture ----------------------------------------------------------------
    const show = (i) => {
        index = (i + group.length) % group.length;
        const link = group[index];
        s = 1;
        tx = 0;
        ty = 0;
        img.style.transform = "";
        box.classList.remove("is-zoomed");
        img.onload = () => {
            const veil = veilOf(img);
            if (veil)
                box.style.setProperty("--veil", veil);
            else
                box.style.removeProperty("--veil");
        };
        img.src = link.href;
        img.alt = link.dataset["alt"] ?? link.querySelector("img")?.alt ?? "";
        caption.textContent = link.dataset["caption"] ?? "";
        steps.hidden = group.length < 2;
        box.classList.toggle("is-solo", group.length < 2);
        count.textContent = `${index + 1} / ${group.length}`;
    };
    const open = (link) => {
        // Every picture on the table, in reading order (the DOM order is the reading order)
        group = [...root.querySelectorAll("a[data-view]")];
        if (!group.includes(link))
            group = [link];
        opener = link;
        show(group.indexOf(link));
        box.showModal();
        close.focus();
        // The viewer's bar takes the place of the table's: hide that one meanwhile
        document.documentElement.classList.add("has-dialog");
        sound.play("lift");
    };
    root.addEventListener("click", (e) => {
        if (e.defaultPrevented)
            return;
        const link = e.target?.closest("a[data-view]");
        if (!link)
            return;
        e.preventDefault();
        open(link);
    });
    $(".viewer__prev").addEventListener("click", () => show(index - 1));
    $(".viewer__next").addEventListener("click", () => show(index + 1));
    close.addEventListener("click", () => box.close());
    box.addEventListener("keydown", (e) => {
        if (e.key === "ArrowLeft") {
            e.preventDefault();
            show(index - 1);
        }
        if (e.key === "ArrowRight") {
            e.preventDefault();
            show(index + 1);
        }
        if (e.key === "+" || e.key === "=")
            zoomCentre(1.5);
        if (e.key === "-")
            zoomCentre(1 / 1.5);
        if (e.key === "0")
            reset();
    });
    window.addEventListener("resize", () => {
        if (box.open)
            apply();
    });
    box.addEventListener("close", () => {
        document.documentElement.classList.remove("has-dialog");
        sound.play("press");
        img.removeAttribute("src");
        // Back to the picture seen last, so the camera lands where the visitor left off
        (group[index] ?? opener)?.focus();
    });
};
