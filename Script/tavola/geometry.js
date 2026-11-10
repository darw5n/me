/**
 * Small geometry helpers shared by the layout, the camera and the minimap.
 * All functions are pure.
 */
export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
export const lerp = (from, to, t) => from + (to - from) * t;
/** Ease-out cubic, used for every camera flight. */
export const easeOut = (t) => 1 - (1 - t) ** 3;
export const degToRad = (deg) => (deg * Math.PI) / 180;
/**
 * Size of the axis-aligned box that contains an element of `size`
 * rotated by `rotation` degrees around its centre.
 */
export const rotatedBox = (size, rotation) => {
    const a = Math.abs(degToRad(rotation));
    return {
        w: size.w * Math.cos(a) + size.h * Math.sin(a),
        h: size.w * Math.sin(a) + size.h * Math.cos(a),
    };
};
/** Smallest rectangle containing all the given rectangles. */
export const union = (rects) => {
    let left = Infinity;
    let top = Infinity;
    let right = -Infinity;
    let bottom = -Infinity;
    for (const r of rects) {
        left = Math.min(left, r.x);
        top = Math.min(top, r.y);
        right = Math.max(right, r.x + r.w);
        bottom = Math.max(bottom, r.y + r.h);
    }
    if (left === Infinity)
        return { x: 0, y: 0, w: 0, h: 0 };
    return { x: left, y: top, w: right - left, h: bottom - top };
};
export const centre = (r) => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 });
/** Grow a rectangle by the same margin on every side. */
export const inflate = (r, margin) => ({
    x: r.x - margin,
    y: r.y - margin,
    w: r.w + margin * 2,
    h: r.h + margin * 2,
});
/** True when two rectangles are closer than `gap` on both axes. */
export const overlapsWithGap = (a, b, gap) => a.x < b.x + b.w + gap && b.x < a.x + a.w + gap && a.y < b.y + b.h + gap && b.y < a.y + a.h + gap;
