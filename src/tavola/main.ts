/**
 * Entry point: reads the page, builds the board, wires input, controls,
 * cursor, viewer and preloader.
 *
 * Expected markup (see index.html):
 *   <script type="application/json" id="table-config">{ "clusters": [...], "groups": [[id, label], ...] }</script>
 *   <div id="view"><div id="world"><div id="table"></div><main class="items">…</main></div></div>
 *   toolbar buttons: #tidy #see-all #zoom-in #zoom-out #zoom-level #surface #sound
 *   optional: #minimap, #preloader
 */

import { applySurface, currentSurface } from "./backgrounds.js";
import { Board, type BoardConfig } from "./board.js";
import { attachControls } from "./controls.js";
import { installCursor } from "./cursor.js";
import { installEmailLinks } from "./email.js";
import { attachInput } from "./input.js";
import { runPreloader } from "./preloader.js";
import { createSound } from "./sound.js";
import { installViewer } from "./viewer.js";

const readConfig = (): BoardConfig => {
  const fallback: BoardConfig = { clusters: [], groups: [] };
  const script = document.getElementById("table-config");
  if (!script?.textContent) return fallback;
  try {
    const parsed = JSON.parse(script.textContent) as Partial<BoardConfig>;
    return {
      clusters: Array.isArray(parsed.clusters) ? parsed.clusters : [],
      groups: Array.isArray(parsed.groups) ? parsed.groups : [],
    };
  } catch {
    return fallback;
  }
};

const boot = (): void => {
  const view = document.getElementById("view");
  const world = document.getElementById("world");
  const table = document.getElementById("table");
  if (!view || !world || !table) return;

  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  applySurface(currentSurface().id);
  const sound = createSound();

  let controlsRef: ReturnType<typeof attachControls> | null = null;
  const board = new Board({ view, world, table, minimap: document.getElementById("minimap") }, readConfig(), sound, reducedMotion, {
    onArrangement: (mode) => controlsRef?.setTidy(mode === "tidy"),
    onZoom: (zoom) => controlsRef?.setZoom(zoom),
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

  board.relayout();
  board.home(0);

  // Sizes depend on fonts and images: settle once they are in.
  const images = [...world.querySelectorAll<HTMLImageElement>("img")];
  void document.fonts?.ready.then(() => board.settle());
  addEventListener("load", () => board.settle());
  void runPreloader({ overlay: document.getElementById("preloader"), images, reducedMotion }).then(() => board.settle());

  let frame = 0;
  let lastSize = `${innerWidth}x${innerHeight}`;
  addEventListener("resize", () => {
    const size = `${innerWidth}x${innerHeight}`;
    if (size === lastSize) return;
    lastSize = size;
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => board.resized());
  });
};

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
else boot();
