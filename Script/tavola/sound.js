/**
 * Table sounds, synthesised with Web Audio: no files to load.
 * Off by default; the visitor turns them on and the choice is remembered.
 *
 * Actions: hover (a touch on glass), press (a tap), lift (paper peeling off),
 * open / close, toggle, nav (leaving the page).
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
    let unlocked = false;
    let lastHover = 0;
    const audio = () => {
        ctx ??= new AudioContext();
        if (ctx.state === "suspended")
            void ctx.resume();
        return ctx;
    };
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
        g.gain.linearRampToValueAtTime(gain, t + 0.004);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        osc.connect(g).connect(c.destination);
        osc.start(t);
        osc.stop(t + dur + 0.02);
    };
    const noise = (dur, gain, freq, sweepTo, delay = 0) => {
        const c = audio();
        const t = c.currentTime + delay;
        const n = Math.ceil(c.sampleRate * dur);
        const buffer = c.createBuffer(1, n, c.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < n; i++)
            data[i] = Math.random() * 2 - 1;
        const src = c.createBufferSource();
        const filter = c.createBiquadFilter();
        const g = c.createGain();
        src.buffer = buffer;
        filter.type = "bandpass";
        filter.frequency.setValueAtTime(freq, t);
        if (sweepTo)
            filter.frequency.exponentialRampToValueAtTime(sweepTo, t + dur);
        g.gain.setValueAtTime(gain, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        src.connect(filter).connect(g).connect(c.destination);
        src.start(t);
    };
    const kit = {
        hover: () => tone(3600, 3600, 0.01, "sine", 0.012),
        press: () => {
            tone(1900, 1500, 0.035, "sine", 0.05);
            noise(0.012, 0.04, 4000);
        },
        lift: () => noise(0.09, 0.06, 2200, 7000),
        open: () => {
            noise(0.015, 0.08, 3000);
            tone(100, 100, 0.2, "triangle", 0.03, 0.02);
        },
        close: () => noise(0.05, 0.05, 2400),
        toggle: () => {
            noise(0.012, 0.08, 2500);
            tone(100, 100, 0.08, "triangle", 0.03);
        },
        nav: () => {
            noise(0.012, 0.09, 2600);
            tone(100, 100, 0.26, "triangle", 0.035, 0.02);
            tone(1200, 1200, 0.02, "sine", 0.02, 0.1);
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
