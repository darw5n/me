/**
 * "Ask for the portfolio": a short form that writes the email for the visitor.
 *
 * The site is static, so nothing is sent from here: submitting opens the
 * visitor's own email app with the subject and the text ready (mailto:), from
 * their own address. For those without an email app, the sent state shows the
 * message and Darwin's address with buttons to copy them.
 *
 * Markup: `#request-dialog` in index.html; any `a[data-request]` opens it. The
 * address is split in data-to-user / data-to-domain, so crawlers do not find it.
 */

import type { Sound } from "./sound.js";

export interface Request {
  name: string;
  company: string;
  message: string;
}

export const subjectOf = (r: Request): string =>
  `Portfolio access: ${r.name}${r.company ? `, ${r.company}` : ""}`;

export const bodyOf = (r: Request): string =>
  [
    "Hi Darwin,",
    "",
    `I'm ${r.name}${r.company ? ` from ${r.company}` : ""}. Could you send me the link to your portfolio?`,
    ...(r.message ? ["", r.message] : []),
    "",
    "Thanks!",
  ].join("\n");

/** Copies text, with a fallback for browsers without the async clipboard. */
const copy = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.className = "sr-only";
    document.body.append(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  }
};

export const installRequest = (root: ParentNode, sound: Sound): void => {
  const dialog = document.getElementById("request-dialog") as HTMLDialogElement | null;
  const form = dialog?.querySelector<HTMLFormElement>("form");
  if (!dialog || !form) return;

  const ask = form.querySelector<HTMLElement>(".request__ask")!;
  const sent = form.querySelector<HTMLElement>(".request__sent")!;
  const error = form.querySelector<HTMLElement>(".request__error")!;
  const status = form.querySelector<HTMLElement>(".request__status")!;
  const submit = form.querySelector<HTMLButtonElement>(".request__submit")!;
  const cancel = form.querySelector<HTMLButtonElement>(".request__cancel")!;
  const name = form.elements.namedItem("name") as HTMLInputElement;
  const address = `${dialog.dataset["toUser"]}@${dialog.dataset["toDomain"]}`;
  let opener: HTMLElement | null = null;
  let last: Request | null = null;

  /** Two states: the form, or "almost done" with the copy buttons. */
  const showSent = (on: boolean): void => {
    ask.hidden = on;
    sent.hidden = !on;
    submit.textContent = on ? "Open it again" : "Write the email";
    cancel.textContent = on ? "Close" : "Cancel";
    status.textContent = "";
  };

  const setError = (on: boolean): void => {
    error.hidden = !on;
    name.setAttribute("aria-invalid", String(on));
  };

  const open = (from: HTMLElement): void => {
    opener = from;
    showSent(false);
    setError(false);
    dialog.showModal();
    document.documentElement.classList.add("has-dialog");
    name.focus();
    sound.play("lift");
  };

  root.addEventListener("click", (e) => {
    const link = (e.target as Element | null)?.closest<HTMLElement>("a[data-request]");
    if (!link || e.defaultPrevented) return;
    e.preventDefault();
    open(link);
  });

  name.addEventListener("input", () => {
    if (name.value.trim()) setError(false);
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!sent.hidden && last) {
      location.href = `mailto:${address}?subject=${encodeURIComponent(subjectOf(last))}&body=${encodeURIComponent(bodyOf(last))}`;
      return;
    }
    const data = new FormData(form);
    const request: Request = {
      name: String(data.get("name") ?? "").trim(),
      company: String(data.get("company") ?? "").trim(),
      message: String(data.get("message") ?? "").trim(),
    };
    if (!request.name) {
      setError(true);
      name.focus();
      return;
    }
    last = request;
    form.querySelector<HTMLElement>(".request__address")!.textContent = address;
    location.href = `mailto:${address}?subject=${encodeURIComponent(subjectOf(request))}&body=${encodeURIComponent(bodyOf(request))}`;
    showSent(true);
    sound.play("press");
  });

  form.querySelector(".request__copy-message")?.addEventListener("click", async () => {
    if (!last) return;
    const ok = await copy(`${subjectOf(last)}\n\n${bodyOf(last)}`);
    status.textContent = ok ? "Message copied." : "Couldn't copy: select the text by hand.";
  });
  form.querySelector(".request__copy-address")?.addEventListener("click", async () => {
    const ok = await copy(address);
    status.textContent = ok ? "Address copied." : "Couldn't copy: select the address by hand.";
  });

  cancel.addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) dialog.close(); // on the backdrop
  });
  dialog.addEventListener("close", () => {
    document.documentElement.classList.remove("has-dialog");
    opener?.focus();
  });
};
