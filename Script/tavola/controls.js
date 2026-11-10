/**
 * The toolbar under the thumb and the two corners: Tidy up, See all, zoom,
 * surface, sound. Pure wiring; the behaviour lives in the board.
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
    const paintSurface = (s) => {
        if (!surface)
            return;
        surface.textContent = s.label;
        surface.setAttribute("aria-label", `Table surface: ${s.label}. Change it`);
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
        sound.textContent = host.sound.on ? "Sound on" : "Sound off";
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
            tidy.textContent = on ? "Mess it up" : "Tidy up";
            tidy.setAttribute("aria-pressed", String(on));
        },
        setZoom(zoom) {
            if (zoomLevel)
                zoomLevel.textContent = `${Math.round(zoom * 100)}%`;
        },
    };
};
