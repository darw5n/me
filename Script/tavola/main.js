/**
 * Entry point: reads the page, builds the board, wires input, controls,
 * cursor, viewer and preloader.
 *
 * Expected markup (see index.html):
 *   <script type="application/json" id="table-config">{ "clusters": [...], "groups": [[id, label], ...], "zones": [[cluster, ...], ...] }</script>
 *   <div id="view"><div id="world"><main class="items">…</main></div></div>
 *   toolbar buttons: #tidy #see-all #zoom-in #zoom-out #zoom-level #surface #sound
 *   optional: #preloader
 */
import { applySurface, currentSurface } from "./backgrounds.js";
import { Board } from "./board.js";
import { attachControls } from "./controls.js";
import { installCursor } from "./cursor.js";
import { installEmailLinks } from "./email.js";
import { viewportSize } from "./geometry.js";
import { attachInput } from "./input.js";
import { runPreloader } from "./preloader.js";
import { createSound } from "./sound.js";
import { installRequest } from "./request.js";
import { installViewer } from "./viewer.js";
const readConfig = () => {
    const fallback = { clusters: [], groups: [] };
    const script = document.getElementById("table-config");
    if (!script?.textContent)
        return fallback;
    try {
        const parsed = JSON.parse(script.textContent);
        return {
            clusters: Array.isArray(parsed.clusters) ? parsed.clusters : [],
            groups: Array.isArray(parsed.groups) ? parsed.groups : [],
            zones: Array.isArray(parsed.zones) ? parsed.zones : undefined,
            phone: Array.isArray(parsed.phone) ? parsed.phone : undefined,
        };
    }
    catch {
        return fallback;
    }
};
const boot = () => {
    const view = document.getElementById("view");
    const world = document.getElementById("world");
    if (!view || !world)
        return;
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    applySurface(currentSurface().id);
    const sound = createSound();
    let controlsRef = null;
    const board = new Board({ view, world }, readConfig(), sound, reducedMotion, {
        onArrangement: (mode) => controlsRef?.setTidy(mode === "tidy"),
        onZoom: (zoom) => controlsRef?.setZoom(zoom),
        onOverview: (on) => controlsRef?.setOverview(on),
    });
    controlsRef = attachControls({
        sound,
        toggleTidy: () => board.toggleTidy(),
        seeAll: () => board.seeAll(),
        zoomBy: (factor) => board.zoomBy(factor),
    });
    attachInput({
        view,
        items: board.items,
        get camera() {
            return board.activeCamera;
        },
        tableZoom: () => board.tableZoom,
        sound,
        reducedMotion,
        moveItem: (item, delta) => board.moveItem(item, delta),
        beginDrag: (item) => board.beginDrag(item),
        endDrag: (item, moved) => board.endDrag(item, moved),
        tapItem: (item, target) => board.tapItem(item, target),
        seeAll: () => board.seeAll(),
        toggleTidy: () => board.toggleTidy(),
    });
    view.addEventListener("pointerdown", () => board.markTouched(), { once: true });
    installCursor({ view });
    installViewer(world, sound);
    installEmailLinks(document);
    installRequest(document, sound);
    board.relayout();
    board.home(0);
    // Sizes depend on fonts and images: settle once they are in.
    const images = [...world.querySelectorAll("img")];
    void document.fonts?.ready.then(() => board.settle());
    addEventListener("load", () => board.settle());
    void runPreloader({ overlay: document.getElementById("preloader"), images, items: [...world.querySelectorAll(".item")], reducedMotion }).then(() => board.settle());
    // A resize lays the table out again once the window has stopped changing, so the
    // objects glide to their new spots once instead of restarting on every frame
    let frame = 0;
    const sizeKey = () => {
        const v = viewportSize();
        return `${v.w}x${v.h}`;
    };
    let lastSize = sizeKey();
    addEventListener("resize", () => {
        const size = sizeKey();
        if (size === lastSize)
            return;
        lastSize = size;
        clearTimeout(frame);
        frame = window.setTimeout(() => board.resized(), 160);
    });
};
if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", boot);
else
    boot();
