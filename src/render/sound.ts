export interface Bus { ctx: AudioContext; master: GainNode }

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let muted = false;

export function getBus(): Bus | null {
  return ctx && master ? { ctx, master } : null;
}

export function unlockAudio(): Bus {
  if (!ctx || !master) {
    ctx = new AudioContext();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 1;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return { ctx, master };
}

export function setMuted(on: boolean): void {
  muted = on;
  if (master) master.gain.value = on ? 0 : 1;
}

export function isMuted(): boolean {
  return muted;
}

export function blip(freq: number, dur: number, type: OscillatorType): void {
  if (!ctx || !master) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.value = 0.05;
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
  o.connect(g).connect(master);
  o.start();
  o.stop(ctx.currentTime + dur);
}
