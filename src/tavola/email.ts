/**
 * Email links without the address in the HTML, so crawlers do not harvest it.
 * `<a data-email-user="name" data-email-domain="example.com" data-email-subject="…">`
 * The mailto: is built on activation (click, Enter or Space), every time.
 */

export const installEmailLinks = (root: ParentNode): void => {
  const build = (link: HTMLElement): string | null => {
    const user = link.dataset["emailUser"];
    const domain = link.dataset["emailDomain"];
    if (!user || !domain) return null;
    const subject = link.dataset["emailSubject"];
    return `mailto:${user}@${domain}${subject ? `?subject=${encodeURIComponent(subject)}` : ""}`;
  };

  const open = (link: HTMLElement): void => {
    const href = build(link);
    if (href) location.href = href;
  };

  root.querySelectorAll<HTMLElement>("[data-email-user]").forEach((link) => {
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
