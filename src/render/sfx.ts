import type { World } from "../sim/types";
import { getBus, isMuted, type Bus } from "./sound";
import {
  admitCue, clampSfxVolume, collectCues, createSfxGate, createSfxTrack,
  CUE_BOSS, CUE_CLICK, CUE_DEATH, CUE_HIT, CUE_HURT, CUE_LEVEL, CUE_N, CUE_PICK,
  CUE_RANK, CUE_RIFLE, CUE_RIVET, CUE_SAW, CUE_SHIELD, CUE_SHOTGUN, CUE_TESLA,
  cueBase, cueDur, loadSfxPrefs, mixGain, resetSfxGate, SFX_VOL_DEFAULT, saveSfxPrefs,
  voicesAt, type SfxPrefs, type Store,
} from "./sfx-cues";

const track = createSfxTrack();
const gate = createSfxGate();
const cueBuf = new Uint8Array(CUE_N);
const pref: SfxPrefs = { muted: false, volume: SFX_VOL_DEFAULT };

let sfxGain: GainNode | null = null;
let noise: AudioBuffer | null = null;

export interface SfxSink {
  now(): number;
  play(id: number, when: number, vol: number): void;
}

export function sfxMuted(): boolean {
  return pref.muted;
}

export function sfxVolume(): number {
  return pref.volume;
}

export function readSfxPrefs(): SfxPrefs {
  return { muted: pref.muted, volume: pref.volume };
}

export function setSfxMuted(on: boolean): void {
  pref.muted = on;
  applyBus();
}

export function toggleSfxMuted(): void {
  setSfxMuted(!pref.muted);
}

export function setSfxVolume(v: number): void {
  pref.volume = clampSfxVolume(v);
  applyBus();
}

export function bootSfx(store: Store | null): void {
  const next = store ? loadSfxPrefs(store) : { muted: false, volume: SFX_VOL_DEFAULT };
  setSfxMuted(next.muted);
  setSfxVolume(next.volume);
}

export function persistSfx(store: Store): void {
  saveSfxPrefs(store, readSfxPrefs());
}

export function resetSfxPlayback(): void {
  track.choosing = 0;
  track.rank = 0;
  track.bossWave = -1;
  track.primed = 0;
  resetSfxGate(gate);
}

function sfxSilent(): boolean {
  return pref.muted || pref.volume <= 0 || isMuted();
}

function applyBus(): void {
  if (!sfxGain) return;
  sfxGain.gain.value = pref.muted ? 0 : pref.volume;
}

function noiseBuf(ctx: AudioContext): AudioBuffer {
  if (noise) return noise;
  const n = 4096;
  const buffer = ctx.createBuffer(1, n, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let s = 0x6d2b79f5;
  for (let i = 0; i < n; i++) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    data[i] = ((s >>> 8) & 255) / 128 - 1;
  }
  noise = buffer;
  return buffer;
}

function ensure(bus: Bus): GainNode {
  if (sfxGain) return sfxGain;
  const gain = bus.ctx.createGain();
  const comp = bus.ctx.createDynamicsCompressor();
  comp.threshold.value = -18;
  comp.knee.value = 8;
  comp.ratio.value = 12;
  comp.attack.value = 0.003;
  comp.release.value = 0.14;
  gain.connect(comp).connect(bus.master);
  sfxGain = gain;
  applyBus();
  return gain;
}

function tone(
  ctx: AudioContext, dest: AudioNode, t: number, type: OscillatorType,
  f0: number, f1: number, dur: number, vol: number,
): void {
  if (vol < 0.0002 || dur <= 0) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(f0, t);
  if (f1 !== f0) osc.frequency.exponentialRampToValueAtTime(f1 < 30 ? 30 : f1, t + dur);
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain).connect(dest);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

function burst(ctx: AudioContext, dest: AudioNode, t: number, dur: number, vol: number, freq: number): void {
  if (vol < 0.0002 || dur <= 0) return;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf(ctx);
  src.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = freq;
  filter.Q.value = 0.7;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(filter).connect(gain).connect(dest);
  src.start(t);
  src.stop(t + dur + 0.02);
}

function siren(ctx: AudioContext, dest: AudioNode, t: number, vol: number): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "square";
  osc.frequency.setValueAtTime(494, t);
  osc.frequency.linearRampToValueAtTime(370, t + 0.16);
  osc.frequency.linearRampToValueAtTime(494, t + 0.32);
  osc.frequency.linearRampToValueAtTime(370, t + 0.48);
  osc.frequency.linearRampToValueAtTime(494, t + 0.64);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(vol, t + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
  osc.connect(gain).connect(dest);
  osc.start(t);
  osc.stop(t + 0.74);
}

function renderCue(ctx: AudioContext, dest: AudioNode, id: number, t: number, vol: number): void {
  switch (id) {
    case CUE_RIFLE:
      tone(ctx, dest, t, "square", 780, 520, 0.04, vol);
      burst(ctx, dest, t, 0.025, vol * 0.5, 2600);
      return;
    case CUE_SHOTGUN:
      tone(ctx, dest, t, "sine", 150, 55, 0.1, vol);
      burst(ctx, dest, t, 0.09, vol * 0.85, 380);
      return;
    case CUE_RIVET:
      tone(ctx, dest, t, "square", 1480, 860, 0.045, vol);
      tone(ctx, dest, t, "triangle", 2200, 1400, 0.03, vol * 0.45);
      return;
    case CUE_TESLA:
      tone(ctx, dest, t, "square", 1860, 280, 0.09, vol);
      tone(ctx, dest, t + 0.02, "sawtooth", 2400, 700, 0.06, vol * 0.35);
      return;
    case CUE_SAW:
      tone(ctx, dest, t, "sawtooth", 190, 160, 0.07, vol);
      tone(ctx, dest, t, "square", 310, 240, 0.06, vol * 0.55);
      return;
    case CUE_HIT:
      burst(ctx, dest, t, 0.035, vol, 1700);
      tone(ctx, dest, t, "sine", 240, 140, 0.04, vol * 0.6);
      return;
    case CUE_DEATH:
      tone(ctx, dest, t, "sawtooth", 168, 46, 0.16, vol);
      burst(ctx, dest, t, 0.1, vol * 0.4, 220);
      return;
    case CUE_HURT:
      tone(ctx, dest, t, "triangle", 96, 48, 0.24, vol);
      burst(ctx, dest, t, 0.08, vol * 0.35, 140);
      return;
    case CUE_LEVEL:
      tone(ctx, dest, t, "triangle", 523, 523, 0.18, vol * 0.7);
      tone(ctx, dest, t + 0.08, "triangle", 659, 659, 0.18, vol * 0.7);
      tone(ctx, dest, t + 0.16, "sine", 784, 784, 0.26, vol * 0.65);
      return;
    case CUE_PICK:
      tone(ctx, dest, t, "sine", 620, 980, 0.12, vol);
      tone(ctx, dest, t + 0.06, "triangle", 980, 1320, 0.1, vol * 0.55);
      return;
    case CUE_RANK:
      tone(ctx, dest, t, "sawtooth", 123, 123, 0.4, vol * 0.8);
      tone(ctx, dest, t, "square", 185, 185, 0.4, vol * 0.45);
      return;
    case CUE_BOSS:
      siren(ctx, dest, t, vol);
      return;
    case CUE_CLICK:
      tone(ctx, dest, t, "square", 1680, 1200, 0.025, vol);
      return;
    case CUE_SHIELD:
      tone(ctx, dest, t, "sine", 320, 480, 0.1, vol);
      return;
    default:
      return;
  }
}

const liveSink: SfxSink = {
  now: () => getBus()?.ctx.currentTime ?? 0,
  play: (id, when, vol) => {
    const bus = getBus();
    if (!bus) return;
    renderCue(bus.ctx, ensure(bus), id, when, vol);
  },
};

export function playSfxCue(id: number, sink?: SfxSink): boolean {
  if (sfxSilent()) return false;
  if (!sink && !getBus()) return false;
  const out = sink ?? liveSink;
  const now = out.now();
  const dur = cueDur(id);
  if (!admitCue(gate, id, now, dur)) return false;
  out.play(id, now, mixGain(cueBase(id), voicesAt(gate, now) - 1));
  return true;
}

export function playUiClick(): void {
  playSfxCue(CUE_CLICK);
}

export function playWorldSfx(w: World, sink?: SfxSink): void {
  const n = collectCues(w, track, cueBuf);
  for (let i = 0; i < n; i++) playSfxCue(cueBuf[i] ?? 0, sink);
}
