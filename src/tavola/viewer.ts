/**
 * Viewer for photos and screens: a plain, accessible base. Opens for
 * `a[data-view]` (href = the full image, data-caption = the words under it),
 * moves between the links of the same object with the arrows, closes with
 * Escape or the button. The look is a placeholder: it will be redesigned.
 *
 * Its commands sit in a floating bar shaped like the table's, in the same spot,
 * light on the dark backdrop: ‹ 2 / 6 › one segment like the zoom, then Close,
 * the main (yellow) action, on the right.
 */

import type { Sound } from "./sound.js";

export const installViewer = (root: ParentNode, sound: Sound): void => {
  const dialog = document.createElement("dialog");
  dialog.className = "viewer";
  dialog.setAttribute("aria-label", "Photo viewer");
  dialog.innerHTML = `
    <figure class="viewer__figure"><img class="viewer__image" alt=""><figcaption class="viewer__caption"></figcaption></figure>
    <div class="controls viewer__bar" role="toolbar" aria-label="Photo controls">
      <span class="controls__steps viewer__steps" role="group" aria-label="Photos">
        <button type="button" class="viewer__prev" aria-label="Previous photo">‹</button>
        <output class="viewer__count" aria-live="polite"></output>
        <button type="button" class="viewer__next" aria-label="Next photo">›</button>
      </span>
      <button type="button" class="controls__primary viewer__close" autofocus>Close</button>
    </div>`;
  document.body.append(dialog);

  const image = dialog.querySelector<HTMLImageElement>(".viewer__image")!;
  const caption = dialog.querySelector<HTMLElement>(".viewer__caption")!;
  const prev = dialog.querySelector<HTMLButtonElement>(".viewer__prev")!;
  const next = dialog.querySelector<HTMLButtonElement>(".viewer__next")!;
  const close = dialog.querySelector<HTMLButtonElement>(".viewer__close")!;
  const steps = dialog.querySelector<HTMLElement>(".viewer__steps")!;
  const count = dialog.querySelector<HTMLOutputElement>(".viewer__count")!;

  let group: HTMLAnchorElement[] = [];
  let index = 0;
  let opener: HTMLElement | null = null;

  const show = (i: number): void => {
    index = (i + group.length) % group.length;
    const link = group[index]!;
    const inner = link.querySelector("img");
    image.src = link.href;
    image.alt = link.dataset["alt"] ?? inner?.alt ?? "";
    caption.textContent = link.dataset["caption"] ?? "";
    // One photo: no arrows, the bar holds only Close
    steps.hidden = group.length < 2;
    count.textContent = `${index + 1} / ${group.length}`;
  };

  const open = (link: HTMLAnchorElement): void => {
    const item = link.closest(".item") ?? document;
    group = [...item.querySelectorAll<HTMLAnchorElement>("a[data-view]")];
    if (group.length === 0) group = [link];
    opener = link;
    show(group.indexOf(link));
    dialog.showModal();
    // The viewer's bar takes the place of the table's: hide that one meanwhile
    document.documentElement.classList.add("has-dialog");
    sound.play("lift");
  };

  root.addEventListener("click", (e) => {
    if (e.defaultPrevented) return;
    const target = e.target as Element | null;
    const link = target?.closest<HTMLAnchorElement>("a[data-view]");
    if (!link) return;
    e.preventDefault();
    open(link);
  });

  prev.addEventListener("click", () => show(index - 1));
  next.addEventListener("click", () => show(index + 1));
  close.addEventListener("click", () => dialog.close());
  dialog.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") show(index - 1);
    if (e.key === "ArrowRight") show(index + 1);
  });
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) dialog.close(); // on the backdrop
  });
  dialog.addEventListener("close", () => {
    document.documentElement.classList.remove("has-dialog");
    sound.play("press");
    image.removeAttribute("src");
    opener?.focus();
  });
};
