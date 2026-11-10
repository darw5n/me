/**
 * The floating bar under the thumb: Tidy up, See all, zoom, surface, sound.
 * Every command of the table lives here. Pure wiring; the behaviour is in the board.
 */

import { currentSurface, nextSurface, type Surface } from "./backgrounds.js";
import type { Sound } from "./sound.js";

export interface ControlsHost {
  toggleTidy(): void;
  seeAll(): void;
  zoomBy(factor: number): void;
  sound: Sound;
}

export interface Controls {
  setTidy(on: boolean): void;
  setZoom(zoom: number): void;
}

const byId = <T extends HTMLElement>(id: string): T | null => document.getElementById(id) as T | null;

export const attachControls = (host: ControlsHost): Controls => {
  const tidy = byId<HTMLButtonElement>("tidy");
  const seeAll = byId<HTMLButtonElement>("see-all");
  const zoomIn = byId<HTMLButtonElement>("zoom-in");
  const zoomOut = byId<HTMLButtonElement>("zoom-out");
  const zoomLevel = byId<HTMLOutputElement>("zoom-level");
  const surface = byId<HTMLButtonElement>("surface");
  const sound = byId<HTMLButtonElement>("sound");

  tidy?.addEventListener("click", () => host.toggleTidy());
  seeAll?.addEventListener("click", () => {
    host.seeAll();
    host.sound.play("toggle");
  });
  zoomIn?.addEventListener("click", () => host.zoomBy(1.25));
  zoomOut?.addEventListener("click", () => host.zoomBy(1 / 1.25));

  // The surface button is a disc showing the current pattern; a click moves to the next one.
  const paintSurface = (s: Surface): void => {
    surface?.setAttribute("aria-label", `Table surface: ${s.label}. Change it`);
  };
  paintSurface(currentSurface());
  surface?.addEventListener("click", () => {
    paintSurface(nextSurface());
    host.sound.play("toggle");
  });

  const paintSound = (): void => {
    if (!sound) return;
    sound.setAttribute("aria-pressed", String(host.sound.on));
    sound.setAttribute("aria-label", host.sound.on ? "Sound on. Turn it off" : "Sound off. Turn it on");
    sound.classList.toggle("is-on", host.sound.on);
  };
  paintSound();
  sound?.addEventListener("click", () => {
    host.sound.toggle();
    paintSound();
  });

  return {
    setTidy(on) {
      if (!tidy) return;
      tidy.textContent = on ? "Mess it up" : "Tidy up";
      tidy.setAttribute("aria-pressed", String(on));
    },
    setZoom(zoom) {
      if (zoomLevel) zoomLevel.textContent = `${Math.round(zoom * 100)}%`;
    },
  };
};
