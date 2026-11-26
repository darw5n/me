/**
 * Preloader: a cloth over the table until fonts and every image on the table are in
 * (and decoded), so nothing jumps as it loads. The content is already in the HTML:
 * without JavaScript the page is readable at once.
 *
 * While it waits: the name, a line of chalk that fills with the real progress, and a
 * phrase that changes every second, like Claude Code while it works ("setting the
 * table…"), with a pulsing star in front. The phrases come from the page
 * (`data-phrases` on the overlay, separated by "|"), so each site has its own.
 *
 * Then the entrance: the cloth is pulled away from the top-left corner, so the lines
 * of the mat appear as it goes, and the objects land one after the other in reading
 * order (`--enter` on each, see _table.scss).
 *
 * - shown at least MIN_MS from the opening of the page, a little longer than loading needs on a fast line, so the
 *   name and a few phrases are seen (Darwin, 13/11/2026); never more than MAX_MS: on a
 *   slow line the table opens anyway and late images arrive in place;
 * - its own words do not wait for this script: their two fonts are preloaded with
 *   `font-display: block` and the CSS brings them in, so no fallback font flashes;
 * - the progress line moves with time and with loading, whichever is slower, so it
 *   fills evenly instead of jumping to the end;
 * - quick on the next page of the same visit (sessionStorage), when all is cached;
 * - with reduced motion: no phrase changes, no pull, no stagger.
 */
const MIN_MS = 3400;
/** How often the phrase changes. */
const PHRASE_MS = 850;
const MAX_MS = 6000;
const SESSION_KEY = "tavola-seen";
/** The pull of the cloth (keep in step with .preloader in _ui.scss). */
const PULL_MS = 1100;
/** Time between two objects landing, and the longest wait for the last one. */
const STEP_MS = 45;
const MAX_STAGGER_MS = 1300;
/** Claude Code's working star, frame by frame. */
const STAR = ["·", "✢", "✳", "✶", "✻", "✽", "✻", "✶", "✳", "✢"];
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
/** Loaded and decoded (or failed: a broken image must not hold the table back). */
const whenImageSettles = async (img) => {
    if (!img.complete) {
        await new Promise((resolve) => {
            img.addEventListener("load", () => resolve(), { once: true });
            img.addEventListener("error", () => resolve(), { once: true });
        });
    }
    try {
        await img.decode();
    }
    catch {
        /* not decodable: shown as it is */
    }
};
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
/** Phrases that change while the table loads; returns a stop function. */
const animatePhrases = (overlay, still) => {
    const phrase = overlay.querySelector(".preloader__phrase");
    const star = overlay.querySelector(".preloader__star");
    const phrases = (overlay.dataset["phrases"] ?? "").split("|").map((p) => p.trim()).filter(Boolean);
    if (still || !phrase)
        return () => { };
    // The first phrase is the one in the HTML; the rest come in a shuffled order
    const rest = phrases.filter((p) => p !== phrase.textContent?.trim()).sort(() => Math.random() - 0.5);
    let i = 0;
    let frame = 0;
    const starTimer = star ? window.setInterval(() => (star.textContent = STAR[frame++ % STAR.length]), 120) : 0;
    const phraseTimer = rest.length
        ? window.setInterval(() => {
            phrase.classList.add("is-changing");
            window.setTimeout(() => {
                phrase.textContent = rest[i++ % rest.length];
                phrase.classList.remove("is-changing");
            }, 180);
        }, PHRASE_MS)
        : 0;
    return () => {
        clearInterval(starTimer);
        clearInterval(phraseTimer);
    };
};
/**
 * Landing order: what the visitor sees first lands first, top to bottom and left to
 * right, a few ms apart; objects outside the opening view land at once (unseen).
 */
const stagger = (items) => {
    const w = innerWidth;
    const h = innerHeight;
    const seen = items
        .map((el) => ({ el, r: el.getBoundingClientRect() }))
        .filter(({ r }) => r.bottom > 0 && r.right > 0 && r.top < h && r.left < w)
        .sort((a, b) => a.r.top + a.r.left * 0.4 - (b.r.top + b.r.left * 0.4));
    let last = 0;
    seen.forEach(({ el }, k) => {
        last = Math.min(k * STEP_MS, MAX_STAGGER_MS);
        el.style.setProperty("--enter", `${last}ms`);
    });
    return last;
};
/** Resolves when the table may be revealed. */
export const runPreloader = async ({ overlay, images, items = [], reducedMotion }) => {
    const root = document.documentElement;
    const quick = seenThisVisit() || reducedMotion;
    // Counted from the opening of the page, not from when this script runs
    const least = quick ? 250 : Math.max(250, MIN_MS - performance.now());
    const start = performance.now();
    const stopPhrases = overlay ? animatePhrases(overlay, reducedMotion) : () => { };
    // Under the cloth nothing can be reached: Tab would land on objects nobody sees (and
    // the camera would fly to them). Set here, not in the HTML, so the page works without JS.
    const covered = overlay ? [...document.querySelectorAll("#view, body > .controls")] : [];
    for (const el of covered)
        el.inert = true;
    // Progress: fonts count as one step, every image as one; shown no faster than time
    const total = images.length + 1;
    let done = 0;
    let frame = 0;
    const paint = () => {
        const loaded = done / total;
        const timed = Math.min(1, (performance.now() - start) / least);
        overlay?.style.setProperty("--progress", Math.min(loaded, timed).toFixed(3));
        if (Math.min(loaded, timed) < 1)
            frame = requestAnimationFrame(paint);
    };
    if (overlay && !reducedMotion)
        frame = requestAnimationFrame(paint);
    const tick = () => {
        done += 1;
    };
    const fonts = (document.fonts?.ready ?? Promise.resolve()).then(tick);
    const assets = Promise.all([fonts, ...images.map((img) => whenImageSettles(img).then(tick))]);
    await Promise.race([Promise.all([assets, wait(least)]), wait(MAX_MS)]);
    cancelAnimationFrame(frame);
    overlay?.style.setProperty("--progress", "1");
    // A beat on the full line before the cloth goes
    if (!quick)
        await wait(250);
    stopPhrases();
    markSeen();
    const longest = reducedMotion ? 0 : stagger(items);
    if (!reducedMotion) {
        root.classList.add("is-entering");
        window.setTimeout(() => root.classList.remove("is-entering"), PULL_MS + longest + 1000);
    }
    root.classList.add("is-ready");
    for (const el of covered)
        el.inert = false;
    if (overlay) {
        overlay.setAttribute("aria-hidden", "true");
        // Remove it once pulled away; the timeout covers an animation that never ends
        // (tab in the background, styles not loaded).
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
            overlay.addEventListener("animationend", (e) => {
                if (e.target === overlay)
                    remove();
            });
            setTimeout(remove, PULL_MS + 800);
        }
    }
};
