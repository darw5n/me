/**
 * Keyboard shortcuts on top of the table's own keys (input.ts: arrows, + − 0, T), and a
 * card that lists them all, mouse and fingers included, for those who would never guess.
 *
 * - ⌘/Ctrl + and ⌘/Ctrl − zoom the table, not the page, like the bar's buttons; ⌘/Ctrl 0 is
 *   See all. Only where the bar shows those buttons: on a phone the browser keeps its zoom.
 * - B changes the table's surface, S turns the sound on or off, ? opens this card.
 * - ⌘T, ⌘M and the like are not used: the browser and the system keep them for themselves.
 *
 * Every shortcut presses the bar's own button, so sounds, labels and states stay in step.
 * The bar's buttons show their key on hover (data-key) and announce it (aria-keyshortcuts).
 */
const mac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
const MOD = mac ? "⌘" : "Ctrl";
/** Presses a bar button, if it is shown. Returns whether it did. */
const press = (id) => {
    const button = document.getElementById(id);
    if (!button || button.offsetParent === null)
        return false;
    button.click();
    return true;
};
const rows = [
    [["drag"], "move the table, or carry an object"],
    [["scroll"], "move the table"],
    [[`${MOD} + scroll`, "pinch"], "zoom"],
    [["←", "→", "↑", "↓"], "move the table"],
    [["+", "−"], "zoom in, zoom out (also with " + MOD + ")"],
    [["0"], "see all, and back"],
    [["T"], "tidy up, and mess it up again"],
    [["B"], "change the table"],
    [["S"], "sound on or off"],
    [["?"], "this card"],
];
const buildCard = () => {
    const dialog = document.createElement("dialog");
    dialog.className = "shortcuts";
    dialog.setAttribute("aria-labelledby", "shortcuts-title");
    // A click outside closes it, natively; the listener below only where closedby is
    // missing (Safari). Esc closes it everywhere.
    dialog.setAttribute("closedby", "any");
    const list = rows
        .map(([keys, what]) => `<div><dt>${keys.map((k) => `<kbd>${k}</kbd>`).join(" ")}</dt><dd>${what}</dd></div>`)
        .join("");
    dialog.innerHTML = `
    <div class="shortcuts__card">
      <h2 id="shortcuts-title">On this table</h2>
      <dl class="shortcuts__list">${list}</dl>
      <button type="button" class="shortcuts__close">Close</button>
    </div>`;
    dialog.querySelector(".shortcuts__close")?.addEventListener("click", () => dialog.close());
    if (!("closedBy" in HTMLDialogElement.prototype)) {
        dialog.addEventListener("click", (e) => {
            if (e.target === dialog)
                dialog.close(); // on the veil
        });
    }
    document.body.append(dialog);
    return dialog;
};
/** Key hints on the bar: shown on hover, announced to screen readers. */
const labelBar = () => {
    const keys = [
        ["tidy", "T", "T"],
        ["see-all", "0", "0"],
        ["zoom-in", `${MOD} +`, mac ? "Meta+=" : "Control+="],
        ["zoom-out", `${MOD} −`, mac ? "Meta+-" : "Control+-"],
        ["surface", "B", "B"],
        ["sound", "S", "S"],
    ];
    for (const [id, show, aria] of keys) {
        const el = document.getElementById(id);
        if (!el)
            continue;
        el.dataset["key"] = show;
        el.setAttribute("aria-keyshortcuts", aria);
    }
};
export const installShortcuts = () => {
    labelBar();
    let card = null;
    const openCard = () => {
        card ??= buildCard();
        if (card.open) {
            card.close();
            return;
        }
        card.showModal();
    };
    addEventListener("keydown", (e) => {
        const target = e.target;
        if (target?.closest("input, textarea, select, [contenteditable]"))
            return;
        // Another dialog is open (a photo, the form): its own keys win
        if (document.querySelector("dialog[open]:not(.shortcuts)"))
            return;
        const mod = (mac ? e.metaKey : e.ctrlKey) && !e.altKey;
        if (mod) {
            let done = false;
            if (e.key === "=" || e.key === "+")
                done = press("zoom-in");
            else if (e.key === "-" || e.key === "_")
                done = press("zoom-out");
            else if (e.key === "0")
                done = press("see-all");
            if (done)
                e.preventDefault();
            return;
        }
        if (e.metaKey || e.ctrlKey || e.altKey)
            return;
        switch (e.key) {
            case "b":
            case "B":
                if (press("surface"))
                    e.preventDefault();
                break;
            case "s":
            case "S":
                if (press("sound"))
                    e.preventDefault();
                break;
            case "?":
                e.preventDefault();
                openCard();
                break;
        }
    });
};
