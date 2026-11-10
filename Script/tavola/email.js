/**
 * Email links without the address in the HTML, so crawlers do not harvest it.
 * `<a href="#" data-mail="…encoded…" data-email-subject="…">` (see mail.ts)
 * The mailto: is built on activation (click, Enter or Space), every time.
 */
import { decodeMail } from "./mail.js";
export const installEmailLinks = (root) => {
    const build = (link) => {
        const address = decodeMail(link.dataset["mail"]);
        if (!address)
            return null;
        const subject = link.dataset["emailSubject"];
        return `mailto:${address}${subject ? `?subject=${encodeURIComponent(subject)}` : ""}`;
    };
    const open = (link) => {
        const href = build(link);
        if (href)
            location.href = href;
    };
    root.querySelectorAll("a[data-mail]").forEach((link) => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            open(link);
        });
        link.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                open(link);
            }
        });
    });
};
