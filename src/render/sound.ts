export interface Bus { ctx: AudioContext; master: GainNode }

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let muted = false;
let held = false;

function markHeld(): void {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-audio", held ? "held" : "live");
}

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
  if (!held && ctx.state === "suspended") void ctx.resume();
  markHeld();
  return { ctx, master };
}

export function holdAudio(on: boolean): void {
  held = on;
  markHeld();
  if (!ctx) return;
  if (on) void ctx.suspend();
  else if (ctx.state === "suspended") void ctx.resume();
}

export function audioHeld(): boolean {
  return held;
}

export function setMuted(on: boolean): void {
  muted = on;
  if (master) master.gain.value = on ? 0 : 1;
}

export function isMuted(): boolean {
  return muted;
}
