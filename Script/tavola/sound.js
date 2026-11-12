/**
 * Table sounds, synthesised with Web Audio: no files and no library, every sound
 * is built from oscillators and filtered noise at the moment it plays.
 * Off by default; the visitor turns them on and the choice is remembered.
 *
 * The kit (short, dry, like things on a real desk):
 * - hover  a fingertip grazing the surface
 * - lift   a sheet peeling off the table
 * - press  the sheet dropped back, a soft thud
 * - mark   the red pencil drawing a ring
 * - tidy   everything sliding into place, then a small chime
 * - mess   the same slide, falling apart
 * - toggle a switch click
 * - nav    a folder opened: two taps and a rising note
 */
const STORAGE_KEY = "tavola-sound";
const read = () => {
    try {
        return localStorage.getItem(STORAGE_KEY) === "on";
    }
    catch {
        return false;
    }
};
const write = (on) => {
    try {
        localStorage.setItem(STORAGE_KEY, on ? "on" : "off");
    }
    catch {
        /* storage blocked: the setting lives for this page only */
    }
};
export const createSound = () => {
    let on = read();
    let ctx = null;
    let master = null;
    let unlocked = false;
    let lastHover = 0;
    const audio = () => {
        if (!ctx) {
            ctx = new AudioContext();
            master = ctx.createGain();
            master.gain.value = 0.9;
            // A touch of room: a short, quiet delay tail so sounds do not feel pasted on
            const delay = ctx.createDelay(0.2);
            delay.delayTime.value = 0.06;
            const tail = ctx.createGain();
            tail.gain.value = 0.12;
            master.connect(ctx.destination);
            master.connect(delay).connect(tail).connect(ctx.destination);
        }
        if (ctx.state === "suspended")
            void ctx.resume();
        return ctx;
    };
    const out = () => (audio(), master);
    /** A pitched tone with an attack and an exponential release. */
    const tone = (from, to, dur, type, gain, delay = 0) => {
        const c = audio();
        const t = c.currentTime + delay;
        const osc = c.createOscillator();
        const g = c.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(from, t);
        if (to !== from)
            osc.frequency.exponentialRampToValueAtTime(to, t + dur);
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(gain, t + 0.005);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        osc.connect(g).connect(out());
        osc.start(t);
        osc.stop(t + dur + 0.02);
    };
    /** Filtered white noise; the filter can sweep, which is what makes paper sound like paper. */
    const noise = (dur, gain, freq, opts = {}) => {
        const c = audio();
        const t = c.currentTime + (opts.delay ?? 0);
        const n = Math.ceil(c.sampleRate * dur);
        const buffer = c.createBuffer(1, n, c.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < n; i++)
            data[i] = Math.random() * 2 - 1;
        const src = c.createBufferSource();
        const filter = c.createBiquadFilter();
        const g = c.createGain();
        src.buffer = buffer;
        filter.type = opts.type ?? "bandpass";
        filter.Q.value = opts.q ?? 1;
        filter.frequency.setValueAtTime(freq, t);
        if (opts.sweepTo)
            filter.frequency.exponentialRampToValueAtTime(opts.sweepTo, t + dur);
        g.gain.setValueAtTime(gain, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        src.connect(filter).connect(g).connect(out());
        src.start(t);
    };
    const kit = {
        hover: () => noise(0.014, 0.02, 5200, { q: 2 }),
        lift: () => {
            noise(0.11, 0.07, 900, { sweepTo: 6500, q: 1.4 });
            tone(140, 110, 0.05, "sine", 0.03);
        },
        press: () => {
            tone(190, 80, 0.07, "sine", 0.09);
            noise(0.018, 0.05, 2400, { type: "lowpass" });
        },
        mark: () => {
            noise(0.16, 0.05, 1800, { sweepTo: 3200, q: 0.8 });
            noise(0.03, 0.03, 4000, { delay: 0.1 });
        },
        tidy: () => {
            noise(0.26, 0.06, 400, { type: "lowpass", sweepTo: 4000 });
            tone(880, 880, 0.12, "sine", 0.035, 0.22);
            tone(1320, 1320, 0.16, "sine", 0.03, 0.3);
        },
        mess: () => {
            noise(0.24, 0.06, 4000, { type: "lowpass", sweepTo: 350 });
            tone(1320, 880, 0.14, "sine", 0.03, 0.12);
        },
        toggle: () => {
            noise(0.012, 0.09, 3000);
            tone(620, 620, 0.04, "triangle", 0.04);
        },
        nav: () => {
            tone(190, 90, 0.06, "sine", 0.08);
            tone(190, 90, 0.06, "sine", 0.08, 0.09);
            tone(520, 1040, 0.22, "sine", 0.035, 0.16);
            noise(0.2, 0.04, 1200, { sweepTo: 5000, delay: 0.14 });
        },
    };
    // Browsers allow audio only after a gesture: remember the first one.
    const unlock = () => {
        unlocked = true;
        if (on)
            audio();
    };
    addEventListener("pointerdown", unlock, { capture: true, once: true });
    addEventListener("keydown", unlock, { capture: true, once: true });
    const play = (action) => {
        if (!on || !unlocked)
            return;
        if (action === "hover") {
            const now = performance.now();
            if (now - lastHover < 45)
                return;
            lastHover = now;
        }
        try {
            kit[action]();
        }
        catch {
            /* no audio device: stay silent */
        }
    };
    return {
        play,
        get on() {
            return on;
        },
        toggle() {
            on = !on;
            write(on);
            if (on)
                unlocked = true;
            play("toggle");
        },
    };
};
