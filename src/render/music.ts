import { getBus, unlockAudio } from "./sound";

const BASS = [0, 0, 7, 0, 3, 7, 0, 5, 10, 7, 3, 0];
const LEAD = [12, 15, 19, 15, 12, 10, 12, 15, 17, 15, 14, 12];
const ACC = [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1];
const ROOT = 55;

let wave = 0;
let armed = false;
let gen = 0;
let nextT = 0;
let stepI = 0;
let noise: AudioBuffer | null = null;

export function musicBpm(w: number): number {
  return 88 + Math.min(8, Math.max(0, w | 0)) * 8;
}

export function musicVoices(w: number): number {
  return 1 + Math.min(4, Math.max(0, w | 0));
}

export function setMusicWave(w: number): void {
  wave = Math.max(0, w | 0);
}

export function setMusicOn(on: boolean): void {
  if (on) {
    const bus = getBus();
    if (!bus) return;
    if (!noise) noise = hiss(bus.ctx);
    if (!armed) {
      armed = true;
      nextT = bus.ctx.currentTime + 0.05;
      pump(++gen);
    }
    return;
  }
  armed = false;
  gen++;
}

function hiss(ctx: AudioContext): AudioBuffer {
  const n = ctx.sampleRate;
  const b = ctx.createBuffer(1, n, n);
  const d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  return b;
}

function hz(semi: number): number {
  return ROOT * 2 ** (semi / 12);
}

function pump(id: number): void {
  const tick = (): void => {
    if (id !== gen || !armed) return;
    fill();
    setTimeout(tick, 40);
  };
  tick();
}

function fill(): void {
  const { ctx, master } = unlockAudio();
  const bpm = musicBpm(wave);
  const stepDur = 20 / bpm;
  const voices = musicVoices(wave);
  const until = ctx.currentTime + 0.14;
  while (nextT < until) {
    const t = Math.max(nextT, ctx.currentTime);
    const i = stepI % 12;
    const acc = ACC[i] ?? 0;
    click(ctx, master, t, acc ? 0.05 : 0.02);
    if (acc) thump(ctx, master, t, hz(BASS[i] ?? 0), 0.07);
    if (voices >= 2 && (acc || voices >= 4)) brass(ctx, master, t, hz(BASS[i] ?? 0), 0.18, 0.03);
    if (voices >= 3 && (i % 2 === 0 || voices >= 5)) brass(ctx, master, t, hz(LEAD[i] ?? 12), 0.12, 0.025);
    if (voices >= 5 && acc) brass(ctx, master, t, hz((LEAD[i] ?? 12) + 7), 0.1, 0.016);
    if (voices >= 4 && i === 0) steam(ctx, master, t);
    stepI++;
    nextT = t + stepDur;
  }
}

function brass(ctx: AudioContext, dest: AudioNode, t: number, freq: number, dur: number, vol: number): void {
  const o1 = ctx.createOscillator();
  const o2 = ctx.createOscillator();
  const g = ctx.createGain();
  o1.type = "sawtooth";
  o2.type = "square";
  o1.frequency.setValueAtTime(freq, t);
  o2.frequency.setValueAtTime(freq * 1.005, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o1.connect(g);
  o2.connect(g);
  g.connect(dest);
  o1.start(t);
  o2.start(t);
  o1.stop(t + dur + 0.02);
  o2.stop(t + dur + 0.02);
}

function thump(ctx: AudioContext, dest: AudioNode, t: number, freq: number, vol: number): void {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = "sine";
  o.frequency.setValueAtTime(freq, t);
  o.frequency.exponentialRampToValueAtTime(freq * 0.5, t + 0.12);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
  o.connect(g).connect(dest);
  o.start(t);
  o.stop(t + 0.16);
}

function click(ctx: AudioContext, dest: AudioNode, t: number, vol: number): void {
  if (!noise) return;
  const src = ctx.createBufferSource();
  src.buffer = noise;
  const f = ctx.createBiquadFilter();
  f.type = "highpass";
  f.frequency.value = 2200;
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
  src.connect(f).connect(g).connect(dest);
  src.start(t);
  src.stop(t + 0.035);
}

function steam(ctx: AudioContext, dest: AudioNode, t: number): void {
  if (!noise) return;
  const src = ctx.createBufferSource();
  src.buffer = noise;
  const f = ctx.createBiquadFilter();
  f.type = "bandpass";
  f.frequency.setValueAtTime(900, t);
  f.frequency.exponentialRampToValueAtTime(1800, t + 0.28);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.04, t + 0.04);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
  src.connect(f).connect(g).connect(dest);
  src.start(t);
  src.stop(t + 0.34);
}
