/**
 * Preloader: a cloth over the table until fonts and the first images are in,
 * so the objects do not jump as they load. The content is already in the HTML:
 * without JavaScript the page is readable at once.
 *
 * - shown at least MIN_MS, never more than MAX_MS;
 * - skipped on the next page of the same visit (sessionStorage), when
 *   everything is cached anyway.
 */
const MIN_MS = 500;
const MAX_MS = 2600;
const SESSION_KEY = "tavola-seen";
const seenThisVisit = () => {
    try {
        return sessionStorage.getItem(SESSION_KEY) === "1";
    }
    catch {
        return false;
    }
};
const markSeen = () => {
    try {
        sessionStorage.setItem(SESSION_KEY, "1");
    }
    catch {
        /* storage blocked */
    }
};
const whenImageSettles = (img) => img.complete
    ? Promise.resolve()
    : new Promise((resolve) => {
        img.addEventListener("load", () => resolve(), { once: true });
        img.addEventListener("error", () => resolve(), { once: true });
    });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
/** Resolves when the table may be revealed. */
export const runPreloader = async ({ overlay, images, reducedMotion }) => {
    const root = document.documentElement;
    const quick = seenThisVisit() || reducedMotion;
    const assets = Promise.all([document.fonts?.ready ?? Promise.resolve(), ...images.map(whenImageSettles)]);
    await Promise.race([Promise.all([assets, wait(quick ? 0 : MIN_MS)]), wait(MAX_MS)]);
    markSeen();
    root.classList.add("is-ready");
    if (overlay) {
        overlay.setAttribute("aria-hidden", "true");
        // Let the fade finish before removing it from the tree; the timeout covers a
        // transition that never ends (tab in the background, styles not loaded).
        let removed = false;
        const remove = () => {
            if (removed)
                return;
            removed = true;
            overlay.remove();
        };
        if (reducedMotion) {
            remove();
        }
        else {
            overlay.addEventListener("transitionend", remove, { once: true });
            setTimeout(remove, 1200);
        }
    }
};
