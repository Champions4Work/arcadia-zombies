import type { World } from "../sim/types";
import { getBus, isMuted, type Bus } from "./sound";
import {
  admitCue, clampSfxVolume, collectCues, createSfxGate, createSfxTrack,
  CUE_BOOM, CUE_BOSS, CUE_CLICK, CUE_DASH, CUE_DEATH, CUE_HIT, CUE_HURT, CUE_LEVEL, CUE_N, CUE_PICK,
  CUE_RANK, CUE_RIFLE, CUE_RIVET, CUE_SAW, CUE_SHIELD, CUE_SHOTGUN, CUE_TESLA, CUE_WAVE,
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
  track.bossWave = -1;
  track.primed = 0;
  track.dashT = 0;
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

function wobble(when: number, id: number): number {
  const u = Math.imul(((when * 4096) | 0) ^ id, 0x9e3779b1) >>> 0;
  return 0.975 + (u & 15) * 0.0032;
}

function tone(
  ctx: AudioContext, dest: AudioNode, t: number, type: OscillatorType,
  f0: number, f1: number, dur: number, vol: number,
): void {
  if (vol < 0.0002 || dur <= 0) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const twist = wobble(t, (f0 | 0) ^ type.length);
  osc.type = type;
  osc.frequency.setValueAtTime(f0 * twist, t);
  if (f1 !== f0) osc.frequency.exponentialRampToValueAtTime((f1 < 30 ? 30 : f1) * twist, t + dur);
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
  osc.frequency.setValueAtTime(622, t);
  osc.frequency.linearRampToValueAtTime(415, t + 0.12);
  osc.frequency.linearRampToValueAtTime(622, t + 0.24);
  osc.frequency.linearRampToValueAtTime(370, t + 0.4);
  osc.frequency.linearRampToValueAtTime(740, t + 0.56);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(vol, t + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
  osc.connect(gain).connect(dest);
  osc.start(t);
  osc.stop(t + 0.74);
}

function renderCue(ctx: AudioContext, dest: AudioNode, id: number, t: number, vol: number): void {
  switch (id) {
    case CUE_RIFLE:
      tone(ctx, dest, t, "square", 1920, 520, 0.024, vol);
      burst(ctx, dest, t, 0.012, vol * 0.5, 3400);
      tone(ctx, dest, t, "triangle", 110, 55, 0.04, vol * 0.35);
      return;
    case CUE_SHOTGUN:
      tone(ctx, dest, t, "square", 240, 62, 0.07, vol);
      burst(ctx, dest, t, 0.065, vol * 0.85, 820);
      burst(ctx, dest, t, 0.035, vol * 0.4, 2200);
      return;
    case CUE_RIVET:
      tone(ctx, dest, t, "square", 1760, 920, 0.022, vol);
      tone(ctx, dest, t + 0.014, "square", 1320, 660, 0.02, vol * 0.72);
      burst(ctx, dest, t, 0.01, vol * 0.25, 4200);
      return;
    case CUE_TESLA:
      tone(ctx, dest, t, "square", 2100, 280, 0.055, vol * 0.85);
      tone(ctx, dest, t + 0.012, "square", 2800, 920, 0.04, vol * 0.38);
      burst(ctx, dest, t, 0.045, vol * 0.32, 3000);
      return;
    case CUE_SAW:
      tone(ctx, dest, t, "square", 300, 130, 0.055, vol);
      tone(ctx, dest, t, "triangle", 450, 200, 0.045, vol * 0.48);
      burst(ctx, dest, t, 0.045, vol * 0.38, 1700);
      return;
    case CUE_HIT:
      tone(ctx, dest, t, "square", 680, 240, 0.022, vol * 0.55);
      burst(ctx, dest, t, 0.02, vol * 0.75, 2400);
      return;
    case CUE_DEATH:
      tone(ctx, dest, t, "square", 220, 48, 0.16, vol);
      tone(ctx, dest, t + 0.04, "triangle", 90, 42, 0.12, vol * 0.55);
      burst(ctx, dest, t, 0.09, vol * 0.5, 320);
      burst(ctx, dest, t + 0.02, 0.05, vol * 0.28, 1400);
      return;
    case CUE_HURT:
      tone(ctx, dest, t, "square", 98, 44, 0.14, vol);
      burst(ctx, dest, t, 0.055, vol * 0.42, 160);
      return;
    case CUE_LEVEL:
      tone(ctx, dest, t, "square", 494, 494, 0.07, vol * 0.72);
      tone(ctx, dest, t + 0.065, "square", 622, 622, 0.07, vol * 0.72);
      tone(ctx, dest, t + 0.13, "square", 740, 740, 0.14, vol * 0.68);
      return;
    case CUE_PICK:
      tone(ctx, dest, t, "square", 740, 988, 0.045, vol);
      tone(ctx, dest, t + 0.045, "square", 988, 1175, 0.07, vol * 0.62);
      tone(ctx, dest, t + 0.08, "triangle", 1480, 1480, 0.06, vol * 0.35);
      return;
    case CUE_RANK:
      tone(ctx, dest, t, "square", 185, 185, 0.2, vol * 0.78);
      tone(ctx, dest, t, "square", 277, 277, 0.2, vol * 0.48);
      tone(ctx, dest, t + 0.14, "square", 370, 370, 0.18, vol * 0.42);
      return;
    case CUE_BOSS:
      siren(ctx, dest, t, vol);
      return;
    case CUE_CLICK:
      tone(ctx, dest, t, "square", 2400, 1800, 0.012, vol * 0.85);
      burst(ctx, dest, t, 0.008, vol * 0.2, 5200);
      return;
    case CUE_SHIELD:
      tone(ctx, dest, t, "triangle", 370, 554, 0.07, vol);
      tone(ctx, dest, t + 0.035, "square", 740, 740, 0.055, vol * 0.42);
      return;
    case CUE_BOOM:
      tone(ctx, dest, t, "square", 165, 48, 0.11, vol);
      burst(ctx, dest, t, 0.095, vol * 0.78, 380);
      burst(ctx, dest, t, 0.045, vol * 0.38, 1900);
      return;
    case CUE_WAVE:
      tone(ctx, dest, t, "square", 330, 330, 0.08, vol * 0.62);
      tone(ctx, dest, t + 0.07, "square", 440, 440, 0.08, vol * 0.62);
      tone(ctx, dest, t + 0.14, "square", 554, 554, 0.1, vol * 0.58);
      tone(ctx, dest, t + 0.22, "triangle", 880, 660, 0.14, vol * 0.4);
      return;
    case CUE_DASH:
      burst(ctx, dest, t, 0.055, vol * 0.65, 1900);
      burst(ctx, dest, t, 0.035, vol * 0.32, 520);
      tone(ctx, dest, t, "square", 920, 260, 0.045, vol * 0.52);
      tone(ctx, dest, t + 0.018, "triangle", 440, 120, 0.07, vol * 0.38);
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
