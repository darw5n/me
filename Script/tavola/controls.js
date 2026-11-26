/**
 * The floating bar under the thumb: Tidy up, See all, zoom, surface, sound.
 * Every command of the table lives here. Pure wiring; the behaviour is in the board.
 */
import { currentSurface, nextSurface } from "./backgrounds.js";
const byId = (id) => document.getElementById(id);
export const attachControls = (host) => {
    const tidy = byId("tidy");
    const seeAll = byId("see-all");
    const zoomIn = byId("zoom-in");
    const zoomOut = byId("zoom-out");
    const zoomLevel = byId("zoom-level");
    const surface = byId("surface");
    const sound = byId("sound");
    tidy?.addEventListener("click", () => host.toggleTidy());
    seeAll?.addEventListener("click", () => {
        host.seeAll();
        host.sound.play("toggle");
    });
    zoomIn?.addEventListener("click", () => host.zoomBy(1.25));
    zoomOut?.addEventListener("click", () => host.zoomBy(1 / 1.25));
    // The surface button is a disc showing the current pattern; a click moves to the next one.
    const paintSurface = (s) => {
        surface?.setAttribute("aria-label", `Table surface: ${s.label}. Change it`);
    };
    paintSurface(currentSurface());
    surface?.addEventListener("click", () => {
        paintSurface(nextSurface());
        host.sound.play("toggle");
    });
    const paintSound = () => {
        if (!sound)
            return;
        sound.setAttribute("aria-pressed", String(host.sound.on));
        // The name stays "Sound": aria-pressed alone says whether it is on
        sound.classList.toggle("is-on", host.sound.on);
    };
    paintSound();
    sound?.addEventListener("click", () => {
        host.sound.toggle();
        paintSound();
    });
    return {
        setTidy(on) {
            if (!tidy)
                return;
            // The visible label swaps (the hidden one is out of the accessibility tree), so
            // the button says what the next click does; no aria-pressed on top of that.
            tidy.dataset["state"] = on ? "tidy" : "messy";
        },
        setOverview(on) {
            if (seeAll)
                seeAll.dataset["state"] = on ? "back" : "all";
        },
        setZoom(zoom) {
            if (zoomLevel)
                zoomLevel.textContent = `${Math.round(zoom * 100)}%`;
        },
    };
};
