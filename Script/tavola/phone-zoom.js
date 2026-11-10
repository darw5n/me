/**
 * Phone: two fingers zoom the table, not the page. The fixed corner and the bar
 * keep their size; the table scales from its top-left corner and the scroll moves
 * with it, so the spot between the fingers stays under them (and moving both
 * fingers pans).
 *
 * At 100% a sideways swipe snaps to the lanes again; zoomed in or out, the table
 * pans freely. A zoom that ends close to 100% settles on it.
 */
import { clamp } from "./geometry.js";
export const PHONE_ZOOM_MIN = 0.5;
export const PHONE_ZOOM_MAX = 2.5;
/** A pinch that ends within this distance of 100% comes back to exactly 100%. */
const SETTLE_RANGE = 0.1;
const fingers = (e) => {
    const [a, b] = [e.touches[0], e.touches[1]];
    return [{ x: a.clientX, y: a.clientY }, { x: b.clientX, y: b.clientY }];
};
/**
 * `isActive` says when two fingers may zoom: on a phone, and not while an object
 * is lifted.
 */
export const attachPhoneZoom = (view, world, isActive) => {
    let zoom = 1;
    let gesture = null;
    const apply = (next, centre, anchor) => {
        zoom = next;
        world.style.setProperty("--phone-zoom", String(zoom));
        view.classList.toggle("is-zoomed", zoom !== 1);
        // The view is fixed at the top-left of the screen, so client coordinates are
        // view coordinates.
        view.scrollLeft = anchor.x * zoom - centre.x;
        view.scrollTop = anchor.y * zoom - centre.y;
    };
    view.addEventListener("touchstart", (e) => {
        if (e.touches.length !== 2 || !isActive())
            return;
        const [a, b] = fingers(e);
        const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        gesture = {
            distance: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)),
            zoom,
            anchor: { x: (view.scrollLeft + mid.x) / zoom, y: (view.scrollTop + mid.y) / zoom },
        };
        view.classList.add("is-zooming");
    });
    view.addEventListener("touchmove", (e) => {
        if (!gesture || e.touches.length !== 2)
            return;
        e.preventDefault(); // no page scroll and no browser zoom meanwhile
        const [a, b] = fingers(e);
        const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        const next = clamp((gesture.zoom * Math.hypot(a.x - b.x, a.y - b.y)) / gesture.distance, PHONE_ZOOM_MIN, PHONE_ZOOM_MAX);
        apply(next, mid, gesture.anchor);
    }, { passive: false });
    const end = (e) => {
        if (!gesture || e.touches.length >= 2)
            return;
        gesture = null;
        view.classList.remove("is-zooming");
        if (zoom !== 1 && Math.abs(zoom - 1) < SETTLE_RANGE) {
            const centre = { x: view.clientWidth / 2, y: view.clientHeight / 2 };
            apply(1, centre, { x: (view.scrollLeft + centre.x) / zoom, y: (view.scrollTop + centre.y) / zoom });
        }
    };
    view.addEventListener("touchend", end);
    view.addEventListener("touchcancel", end);
    // Safari zooms the page with its own gesture events, regardless of touch-action.
    const block = (e) => {
        if (isActive())
            e.preventDefault();
    };
    view.addEventListener("gesturestart", block);
    view.addEventListener("gesturechange", block);
    return {
        get zoom() {
            return zoom;
        },
        reset() {
            if (zoom === 1)
                return;
            apply(1, { x: 0, y: 0 }, { x: view.scrollLeft / zoom, y: view.scrollTop / zoom });
        },
    };
};
