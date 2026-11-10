/**
 * What a click does on a given spot of the table. Shared by the cursor (to show
 * it before the click) and by the reactions (to do it).
 *
 * - "view"  a photo or a screen: opens the viewer       → magnifier
 * - "leave" another site, an email, a folder, a jump     → arrow with a label
 * - "ring"  a note, a post-it, a card: the pencil ring   → pencil
 * - "move"  stickers, props, chalk: nothing but moving   → open hand
 * - "none"  not on an object
 */
/**
 * The red pencil (pencil cursor + ring on click) is on hold (Darwin, 10/11/2026):
 * the pencil showed almost everywhere and added little. While this is false, notes
 * and cards behave like stickers ("move"), and no ring is ever drawn. The code
 * stays: set it to true to bring the pencil back.
 */
export const PENCIL_ENABLED = false;
const MOVE_ONLY = new Set(["sticker", "prop", "chalk"]);
/** True for links that take the visitor somewhere else. */
export const leavesTheTable = (target) => {
    const link = target.closest("a[href]");
    if (!link || link.hasAttribute("data-view"))
        return false;
    if (link.matches("[data-open], [data-email-user], [data-request], [target=_blank]"))
        return true;
    const href = link.getAttribute("href") ?? "";
    // A jump to another object: the ring goes on the destination, not here.
    if (href.startsWith("#"))
        return href.length > 1;
    try {
        const url = new URL(link.href);
        if (url.protocol !== "http:" && url.protocol !== "https:")
            return true;
        return url.origin !== location.origin || url.pathname !== location.pathname;
    }
    catch {
        return false;
    }
};
export const clickActionOf = (target) => {
    const item = target.closest(".item");
    if (!item)
        return "none";
    if (target.closest("a[data-view]"))
        return "view";
    if (leavesTheTable(target))
        return "leave";
    if (!PENCIL_ENABLED || item.hasAttribute("data-no-ring") || MOVE_ONLY.has(item.dataset["material"] ?? ""))
        return "move";
    return "ring";
};
