let ctx: AudioContext | null = null;
export function unlockAudio(): void { if (!ctx) ctx = new AudioContext(); }
export function blip(freq: number, dur: number, type: OscillatorType): void {
  if (!ctx) return;
  const o = ctx.createOscillator(); const g = ctx.createGain();
  o.type = type; o.frequency.value = freq; g.gain.value = 0.05;
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
  o.connect(g).connect(ctx.destination); o.start(); o.stop(ctx.currentTime + dur);
}
