export const installComposer = (source, totalItems) => {
    if (!new URLSearchParams(location.search).has("edit"))
        return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "composer";
    button.textContent = "Copy positions";
    const status = document.createElement("p");
    status.className = "composer__status";
    status.setAttribute("role", "status");
    document.body.append(button, status);
    let hide = 0;
    const say = (text) => {
        status.textContent = text;
        status.hidden = false;
        clearTimeout(hide);
        hide = window.setTimeout(() => (status.hidden = true), 6000);
    };
    status.hidden = true;
    button.addEventListener("click", () => {
        const changes = source.positionChanges();
        if (!changes.length) {
            say("Nothing to copy: drag some objects on the messy table first.");
            return;
        }
        const path = location.pathname.replace(/^\/+/, "");
        const page = !path || path.endsWith("/") ? `${path}index.html` : path;
        const text = JSON.stringify({ tool: "tavola-positions", page, items: totalItems, changes });
        console.log(text);
        const near = changes.filter((c) => c.near).length;
        const done = `${changes.length} position${changes.length > 1 ? "s" : ""} copied`
            + (near ? `; ${near} touch${near > 1 ? "" : "es"} another object (data-on-top?)` : "") + ".";
        // The clipboard can refuse, be missing (http on a phone) or never answer: then the box
        const write = navigator.clipboard?.writeText(text) ?? Promise.reject(new Error("no clipboard"));
        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("no answer")), 1500));
        Promise.race([write, timeout]).then(() => say(done), () => showText(text, done));
    });
};
/** No clipboard (http on a phone): the JSON in a box, already selected. */
const showText = (text, done) => {
    const dialog = document.createElement("dialog");
    dialog.className = "composer__dialog";
    const label = document.createElement("label");
    label.textContent = `${done.replace("copied", "ready")} Copy the text below:`;
    const area = document.createElement("textarea");
    area.readOnly = true;
    area.value = text;
    area.rows = 8;
    label.append(area);
    const close = document.createElement("button");
    close.type = "button";
    close.textContent = "Close";
    close.addEventListener("click", () => dialog.close());
    dialog.addEventListener("close", () => dialog.remove());
    dialog.append(label, close);
    document.body.append(dialog);
    dialog.showModal();
    area.select();
};
