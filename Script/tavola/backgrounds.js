/**
 * The table surface. Each preset is a `data-surface` value on <html>; the SCSS
 * decides colours and pattern, and the chalk colour follows, so text stays
 * readable on every surface. The choice is remembered.
 */
const STORAGE_KEY = "tavola-surface";
export const SURFACES = [
    { id: "felt", label: "Green felt" },
    { id: "slate", label: "Slate" },
    { id: "kraft", label: "Kraft paper" },
    { id: "plum", label: "Plum" },
];
const read = () => {
    try {
        return localStorage.getItem(STORAGE_KEY) ?? SURFACES[0].id;
    }
    catch {
        return SURFACES[0].id;
    }
};
export const applySurface = (id) => {
    const surface = SURFACES.find((s) => s.id === id) ?? SURFACES[0];
    document.documentElement.dataset["surface"] = surface.id;
    // The browser's own bar (Safari, Chrome on Android) takes the colour of the table
    const mat = getComputedStyle(document.documentElement).getPropertyValue("--mat").trim();
    if (mat)
        document.querySelector('meta[name="theme-color"]')?.setAttribute("content", mat);
    try {
        localStorage.setItem(STORAGE_KEY, surface.id);
    }
    catch {
        /* storage blocked: the choice lives for this page only */
    }
    return surface;
};
export const currentSurface = () => SURFACES.find((s) => s.id === read()) ?? SURFACES[0];
export const nextSurface = () => {
    const i = SURFACES.findIndex((s) => s.id === currentSurface().id);
    return applySurface(SURFACES[(i + 1) % SURFACES.length].id);
};
