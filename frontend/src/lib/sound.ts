/** Lightweight Web Audio SFX — no external files required */

let ctx: AudioContext | null = null;
let suspenseNodes: { osc: OscillatorNode; gain: GainNode }[] = [];
let suspenseOn = false;

function ac() {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function playClick() {
  try {
    const c = ac();
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = "triangle";
    o.frequency.value = 880;
    g.gain.value = 0.04;
    o.connect(g);
    g.connect(c.destination);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.08);
    o.stop(c.currentTime + 0.09);
  } catch {
    /* ignore */
  }
}

export function playReveal() {
  try {
    const c = ac();
    [523, 659, 784].forEach((freq, i) => {
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = "sine";
      o.frequency.value = freq;
      g.gain.value = 0.05;
      o.connect(g);
      g.connect(c.destination);
      const t = c.currentTime + i * 0.08;
      o.start(t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      o.stop(t + 0.26);
    });
  } catch {
    /* ignore */
  }
}

export function startSuspenseMusic() {
  if (suspenseOn) return;
  try {
    const c = ac();
    suspenseOn = true;
    const freqs = [110, 164.81, 196];
    suspenseNodes = freqs.map((freq, i) => {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = i === 0 ? "sine" : "triangle";
      osc.frequency.value = freq;
      gain.gain.value = 0.012;
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start();
      return { osc, gain };
    });
  } catch {
    suspenseOn = false;
  }
}

export function stopSuspenseMusic() {
  suspenseOn = false;
  for (const n of suspenseNodes) {
    try {
      n.gain.gain.exponentialRampToValueAtTime(0.001, ac().currentTime + 0.2);
      n.osc.stop(ac().currentTime + 0.25);
    } catch {
      /* ignore */
    }
  }
  suspenseNodes = [];
}

export function setSuspenseEnabled(on: boolean) {
  if (on) startSuspenseMusic();
  else stopSuspenseMusic();
}
