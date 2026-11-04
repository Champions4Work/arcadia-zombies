import { getBus, isMuted, type Bus } from "./sound";
import {
  PHASE_OVER, PHASE_PAUSE, PHASE_PLAY, PHASE_TITLE, PHASE_WORKSHOP, type Phase,
} from "../shell/session";

declare const driveBrand: unique symbol;
declare const musicVolumeBrand: unique symbol;

export const BED_MENU = "menu";
export const BED_WAVE = "wave";
export const BED_HORDE = "horde";
export const BED_BOSS = "boss";
export type BedId = typeof BED_MENU | typeof BED_WAVE | typeof BED_HORDE | typeof BED_BOSS;

export const TIMBRE_GEAR = "gear";
export const TIMBRE_THUMP = "thump";
export const TIMBRE_BRASS = "brass";
export const TIMBRE_ORGAN = "organ";
export const TIMBRE_STEAM = "steam";
export const TIMBRE_BELL = "bell";
export type Timbre =
  | typeof TIMBRE_GEAR | typeof TIMBRE_THUMP | typeof TIMBRE_BRASS
  | typeof TIMBRE_ORGAN | typeof TIMBRE_STEAM | typeof TIMBRE_BELL;

export type Drive = number & { readonly [driveBrand]: "Drive" };
export type MusicVolume = number & { readonly [musicVolumeBrand]: "MusicVolume" };

export interface MusicSnap {
  phase: Phase;
  wave: number;
  rank: number;
  toSpawn: number;
  alive: number;
  bossOn: number;
  bossPending: number;
  lich: boolean;
}

export type Cue =
  | { readonly audible: false }
  | { readonly audible: true; readonly bed: BedId; readonly drive: Drive };

export interface MusicPrefs {
  muted: boolean;
  volume: MusicVolume;
}

export interface Store {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export type MusicRowKind = "mute" | "volume";

export interface MusicRowHooks {
  gesture(): void;
  commit(kind: MusicRowKind): void;
}

export const MUSIC_VOL_DEFAULT = 0.8 as MusicVolume;

const MUSIC_MUTE_KEY = "arcadia.music.muted";
const MUSIC_VOL_KEY = "arcadia.music.volume";
const REST = -128;
const HORDE_ON = 36;
const HORDE_OFF = 24;
const FADE_BED = 0.9;
const FADE_OUT = 0.28;
const LOOKAHEAD = 0.14;

interface Voice {
  timbre: Timbre;
  gain: number;
  oct: number;
  minDrive: number;
  phraseMask: number;
  semi: readonly number[];
  phraseSemi: readonly number[];
}

interface Score {
  bed: BedId;
  bpm: number;
  bpmFull: number;
  beats: number;
  steps: number;
  phrases: number;
  rootHz: number;
  voices: readonly Voice[];
}

interface Deck {
  gain: GainNode;
  bed: BedId | null;
  drive: Drive;
  step: number;
  nextT: number;
  rampUntil: number;
}

type Heard = Extract<Cue, { audible: true }>;

function row(
  timbre: Timbre,
  gain: number,
  oct: number,
  minDrive: number,
  phraseMask: number,
  phraseSemi: readonly number[],
  semi: readonly number[],
): Voice {
  return { timbre, gain, oct, minDrive, phraseMask, phraseSemi, semi };
}

function bind(score: Score): Score {
  for (let i = 0; i < score.voices.length; i++) {
    const voice = score.voices[i];
    if (!voice || voice.semi.length !== score.steps || voice.phraseSemi.length !== score.phrases) {
      throw new Error(`music score ${score.bed}`);
    }
  }
  return score;
}

const MENU = bind({
  bed: BED_MENU, bpm: 68, bpmFull: 68, beats: 3, steps: 12, phrases: 4, rootHz: 185,
  voices: [
    row(TIMBRE_ORGAN, 0.038, 0, 0, 15, [0, 3, 7, 0], [0, REST, 3, REST, 7, REST, 10, REST, 7, REST, 3, 0]),
    row(TIMBRE_GEAR, 0.026, 2, 0, 15, [0, 0, 0, 0], [0, REST, REST, REST, REST, REST, 0, REST, REST, REST, REST, REST]),
    row(TIMBRE_STEAM, 0.018, 0, 0, 1, [0, 0, 0, 0], [0, REST, REST, REST, REST, REST, REST, REST, REST, REST, REST, REST]),
  ],
});

const WAVE = bind({
  bed: BED_WAVE, bpm: 96, bpmFull: 118, beats: 4, steps: 16, phrases: 4, rootHz: 55,
  voices: [
    row(TIMBRE_GEAR, 0.024, 2, 0, 15, [0, 0, 0, 0], [0, REST, 0, REST, 0, REST, 0, REST, 0, REST, 0, REST, 0, REST, 0, REST]),
    row(TIMBRE_THUMP, 0.058, 0, 0, 15, [0, 0, -2, 0], [0, REST, REST, REST, 0, REST, 7, REST, 0, REST, REST, REST, 0, REST, 5, REST]),
    row(TIMBRE_BRASS, 0.024, 0, 0, 15, [0, 3, -2, 0], [0, REST, REST, 0, REST, REST, 7, REST, REST, 0, REST, 3, 10, REST, REST, 0]),
    row(TIMBRE_BRASS, 0.028, 1, 0, 15, [0, 3, 7, 0], [0, REST, 3, REST, 7, REST, 10, REST, 8, REST, 7, REST, 3, REST, 0, REST]),
    row(TIMBRE_BRASS, 0.015, 1, 0.45, 15, [0, 3, 7, 10], [10, REST, 12, REST, 15, REST, 19, REST, 15, REST, 12, REST, 10, REST, 15, REST]),
  ],
});

const HORDE = bind({
  bed: BED_HORDE, bpm: 128, bpmFull: 142, beats: 4, steps: 16, phrases: 4, rootHz: 55,
  voices: [
    row(TIMBRE_GEAR, 0.028, 2, 0, 15, [0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
    row(TIMBRE_THUMP, 0.062, 0, 0, 15, [0, -1, 0, -2], [0, REST, REST, 0, 0, REST, 7, 0, 0, REST, REST, 0, 0, REST, 3, 0]),
    row(TIMBRE_BRASS, 0.03, 1, 0, 15, [0, 1, 6, 0], [REST, 0, REST, 7, REST, 0, REST, 10, REST, 0, REST, 7, REST, 3, REST, 10]),
    row(TIMBRE_ORGAN, 0.03, -1, 0.25, 15, [0, 0, 1, 0], [0, REST, REST, REST, REST, REST, REST, REST, REST, REST, REST, REST, REST, REST, REST, REST]),
    row(TIMBRE_STEAM, 0.024, 0, 0.5, 5, [0, 0, 0, 0], [0, REST, REST, REST, REST, REST, REST, REST, REST, REST, REST, REST, REST, REST, REST, REST]),
  ],
});

const BOSS = bind({
  bed: BED_BOSS, bpm: 76, bpmFull: 84, beats: 4, steps: 16, phrases: 4, rootHz: 55,
  voices: [
    row(TIMBRE_GEAR, 0.032, 1, 0, 15, [0, 0, 0, 0], [0, REST, REST, REST, REST, REST, REST, REST, 0, REST, REST, REST, REST, REST, REST, REST]),
    row(TIMBRE_THUMP, 0.068, -1, 0, 15, [0, -2, -5, 0], [0, REST, REST, REST, REST, REST, REST, REST, REST, REST, REST, REST, REST, REST, REST, REST]),
    row(TIMBRE_ORGAN, 0.04, 1, 0, 15, [0, 3, 7, 10], [0, REST, REST, 3, REST, REST, 7, REST, 10, REST, 8, REST, 7, REST, 3, 0]),
    row(TIMBRE_BRASS, 0.022, 0, 0.5, 15, [0, -2, -5, 0], [0, REST, REST, REST, 7, REST, REST, REST, REST, REST, REST, REST, 10, REST, REST, REST]),
    row(TIMBRE_BELL, 0.034, 2, 0.75, 1, [0, 0, 0, 0], [0, REST, REST, REST, REST, REST, REST, REST, REST, REST, REST, REST, REST, REST, REST, REST]),
  ],
});

const pref: MusicPrefs = { muted: false, volume: MUSIC_VOL_DEFAULT };
let engineCue: Cue = { audible: false };
let lastSnap: MusicSnap | null = null;
let live: 0 | 1 = 0;
let decks: [Deck, Deck] | null = null;
let musicGain: GainNode | null = null;
let noise: AudioBuffer | null = null;
let musicMuteBtn: HTMLButtonElement | null = null;
let hushed = false;

function clamp01(n: number): number {
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

function drive(n: number): Drive {
  return clamp01(n) as Drive;
}

function clampVolume(raw: number): MusicVolume {
  if (!Number.isFinite(raw)) return MUSIC_VOL_DEFAULT;
  return clamp01(raw) as MusicVolume;
}

function count(n: number): number {
  const x = n | 0;
  return x > 0 ? x : 0;
}

function scoreOf(bed: BedId): Score {
  switch (bed) {
    case BED_MENU: return MENU;
    case BED_WAVE: return WAVE;
    case BED_HORDE: return HORDE;
    case BED_BOSS: return BOSS;
  }
}

function bpmOf(score: Score, amount: number): number {
  return score.bpm + (score.bpmFull - score.bpm) * amount;
}

export function silence(): Cue {
  return { audible: false };
}

function bossDrive(lich: boolean, bossOn: number, pending: number): Drive {
  if (lich) return drive(1);
  if (bossOn !== 0) return drive(0.85);
  if (pending === 2) return drive(0.6);
  return drive(0.35);
}

function cuePlay(snap: MusicSnap, prev: Cue): Cue {
  const wave = count(snap.wave);
  const rank = count(snap.rank);
  const pressure = count(snap.alive) + count(snap.toSpawn);
  const bossOn = count(snap.bossOn);
  const pending = count(snap.bossPending);
  if (snap.lich || bossOn !== 0 || pending !== 0) {
    return { audible: true, bed: BED_BOSS, drive: bossDrive(snap.lich, bossOn, pending) };
  }
  const staying = prev.audible && prev.bed === BED_HORDE && pressure >= HORDE_OFF;
  if (pressure >= HORDE_ON || staying) {
    return { audible: true, bed: BED_HORDE, drive: drive(0.35 + pressure / 80) };
  }
  return { audible: true, bed: BED_WAVE, drive: drive(Math.max(wave, rank) / 8) };
}

export function cueFrom(snap: MusicSnap, prev: Cue): Cue {
  switch (snap.phase) {
    case PHASE_PAUSE:
    case PHASE_OVER:
      return silence();
    case PHASE_TITLE:
    case PHASE_WORKSHOP:
      return { audible: true, bed: BED_MENU, drive: drive(0) };
    case PHASE_PLAY:
      return cuePlay(snap, prev);
  }
}

export function tempoOf(cue: Cue): number {
  if (!cue.audible) return 0;
  return bpmOf(scoreOf(cue.bed), cue.drive);
}

export function timbresOf(bed: BedId): readonly Timbre[] {
  const voices = scoreOf(bed).voices;
  const out: Timbre[] = [];
  for (let i = 0; i < voices.length; i++) {
    const timbre = voices[i]?.timbre;
    if (timbre && !out.includes(timbre)) out.push(timbre);
  }
  return out;
}

export function parseMusicPrefs(mutedRaw: string | null, volumeRaw: string | null): MusicPrefs {
  const volume = volumeRaw === null || volumeRaw === ""
    ? MUSIC_VOL_DEFAULT
    : clampVolume(Number(volumeRaw));
  return { muted: mutedRaw === "1", volume };
}

export function musicMuted(): boolean {
  return pref.muted;
}

export function musicVolume(): MusicVolume {
  return pref.volume;
}

export function musicMuteLabel(muted: boolean): string {
  return muted ? "Music Off" : "Music On";
}

export function musicVolumePercent(volume: MusicVolume): number {
  return Math.round(volume * 100);
}

function musicLevel(): number {
  return pref.muted || pref.volume <= 0 ? 0 : pref.volume;
}

function musicSilent(): boolean {
  return pref.muted || pref.volume <= 0 || isMuted();
}

function paintMute(): void {
  if (!musicMuteBtn) return;
  musicMuteBtn.textContent = musicMuteLabel(pref.muted);
  musicMuteBtn.setAttribute("aria-pressed", pref.muted ? "true" : "false");
}

function dropGain(deck: Deck, ctx: AudioContext): void {
  const old = deck.gain;
  old.gain.cancelScheduledValues(0);
  old.gain.value = 0;
  old.disconnect();
  const next = ctx.createGain();
  next.gain.value = 0;
  if (musicGain) next.connect(musicGain);
  deck.gain = next;
  deck.rampUntil = 0;
}

function hushDecks(ctx: AudioContext): void {
  if (!decks) return;
  dropGain(decks[0], ctx);
  dropGain(decks[1], ctx);
  decks[0].bed = null;
  decks[1].bed = null;
  decks[0].nextT = 0;
  decks[1].nextT = 0;
  engineCue = silence();
  hushed = true;
}

function noiseBuf(ctx: AudioContext): AudioBuffer {
  const n = 4096;
  const buffer = ctx.createBuffer(1, n, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let s = 0x6d2b79f5;
  for (let i = 0; i < n; i++) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    data[i] = ((s >>> 8) & 255) / 128 - 1;
  }
  return buffer;
}

function makeDeck(ctx: AudioContext): Deck {
  const gain = ctx.createGain();
  gain.gain.value = 0;
  return { gain, bed: null, drive: drive(0), step: 0, nextT: 0, rampUntil: 0 };
}

function ensure(bus: Bus): boolean {
  if (musicGain && decks) return false;
  const mg = bus.ctx.createGain();
  mg.gain.value = musicLevel();
  const comp = bus.ctx.createDynamicsCompressor();
  comp.threshold.value = -22;
  comp.knee.value = 10;
  comp.ratio.value = 10;
  comp.attack.value = 0.004;
  comp.release.value = 0.16;
  const left = makeDeck(bus.ctx);
  const right = makeDeck(bus.ctx);
  left.gain.connect(mg);
  right.gain.connect(mg);
  mg.connect(comp).connect(bus.master);
  musicGain = mg;
  decks = [left, right];
  noise = noiseBuf(bus.ctx);
  return true;
}

function assignGain(): void {
  if (musicGain) musicGain.gain.value = musicLevel();
}

function load(deck: Deck, cue: Heard, now: number): void {
  const bus = getBus();
  if (bus) dropGain(deck, bus.ctx);
  deck.bed = cue.bed;
  deck.drive = cue.drive;
  deck.step = 0;
  deck.nextT = now + 0.05;
}

function cut(deck: Deck, target: number, now: number): void {
  const param = deck.gain.gain;
  param.cancelScheduledValues(now);
  param.setValueAtTime(target, now);
  deck.rampUntil = 0;
}

function ramp(deck: Deck, target: number, seconds: number, now: number): void {
  const param = deck.gain.gain;
  param.cancelScheduledValues(now);
  param.setValueAtTime(param.value, now);
  param.linearRampToValueAtTime(target, now + seconds);
  deck.rampUntil = now + seconds;
}

function idleIndex(): 0 | 1 {
  return live === 0 ? 1 : 0;
}

function hardStart(cue: Heard, now: number): void {
  if (!decks) return;
  const idle = idleIndex();
  load(decks[idle], cue, now);
  cut(decks[idle], 1, now);
  cut(decks[live], 0, now);
  live = idle;
}

function crossfade(cue: Heard, now: number): void {
  if (!decks) return;
  const idle = idleIndex();
  load(decks[idle], cue, now);
  ramp(decks[idle], 1, FADE_BED, now);
  ramp(decks[live], 0, FADE_BED, now);
  live = idle;
}

function route(prev: Cue, next: Cue, built: boolean, now: number): void {
  if (!decks) return;
  if (!next.audible) {
    ramp(decks[0], 0, FADE_OUT, now);
    ramp(decks[1], 0, FADE_OUT, now);
    return;
  }
  if (built || !prev.audible) {
    hardStart(next, now);
    return;
  }
  crossfade(next, now);
}

function shape(param: AudioParam, t: number, vol: number, attack: number, dur: number): void {
  if (attack <= 0) param.setValueAtTime(vol, t);
  else {
    param.setValueAtTime(0.0001, t);
    param.exponentialRampToValueAtTime(vol, t + attack);
  }
  param.exponentialRampToValueAtTime(0.0001, t + dur);
}

function tone(
  ctx: AudioContext, dest: AudioNode, type: OscillatorType,
  hz: number, t: number, stop: number,
): OscillatorNode {
  const node = ctx.createOscillator();
  node.type = type;
  node.frequency.setValueAtTime(Math.max(1, hz), t);
  node.connect(dest);
  node.start(t);
  node.stop(stop);
  return node;
}

function hitGear(ctx: AudioContext, dest: AudioNode, t: number, vol: number): void {
  if (!noise) return;
  const src = ctx.createBufferSource();
  src.buffer = noise;
  src.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = 3400;
  const gain = ctx.createGain();
  shape(gain.gain, t, vol, 0, 0.012);
  src.connect(filter).connect(gain).connect(dest);
  src.start(t);
  src.stop(t + 0.016);
  const click = ctx.createGain();
  shape(click.gain, t, vol * 0.5, 0, 0.008);
  click.connect(dest);
  tone(ctx, click, "square", 2400, t, t + 0.01);
}

function hitThump(ctx: AudioContext, dest: AudioNode, t: number, hz: number, vol: number): void {
  const gain = ctx.createGain();
  shape(gain.gain, t, vol, 0, 0.09);
  gain.connect(dest);
  const node = tone(ctx, gain, "triangle", hz, t, t + 0.11);
  node.frequency.exponentialRampToValueAtTime(Math.max(1, hz * 0.42), t + 0.08);
}

function hitBrass(ctx: AudioContext, dest: AudioNode, t: number, hz: number, vol: number): void {
  const gain = ctx.createGain();
  shape(gain.gain, t, vol, 0.003, 0.09);
  gain.connect(dest);
  tone(ctx, gain, "square", hz, t, t + 0.11);
  const mix = ctx.createGain();
  mix.gain.value = 0.18;
  mix.connect(gain);
  tone(ctx, mix, "square", hz * 2, t, t + 0.06);
}

function hitOrgan(ctx: AudioContext, dest: AudioNode, t: number, hz: number, vol: number): void {
  const gain = ctx.createGain();
  shape(gain.gain, t, vol, 0.018, 0.34);
  gain.connect(dest);
  tone(ctx, gain, "triangle", hz, t, t + 0.36);
  const mix = ctx.createGain();
  mix.gain.value = 0.26;
  mix.connect(gain);
  tone(ctx, mix, "square", hz * 2, t, t + 0.36);
}

function hitSteam(ctx: AudioContext, dest: AudioNode, t: number, vol: number): void {
  if (!noise) return;
  const src = ctx.createBufferSource();
  src.buffer = noise;
  src.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(1100, t);
  filter.frequency.exponentialRampToValueAtTime(2600, t + 0.18);
  const gain = ctx.createGain();
  shape(gain.gain, t, vol, 0.02, 0.18);
  src.connect(filter).connect(gain).connect(dest);
  src.start(t);
  src.stop(t + 0.2);
}

function hitBell(ctx: AudioContext, dest: AudioNode, t: number, hz: number, vol: number): void {
  const gain = ctx.createGain();
  shape(gain.gain, t, vol, 0, 0.26);
  gain.connect(dest);
  tone(ctx, gain, "square", hz, t, t + 0.07);
  tone(ctx, gain, "square", hz * 1.498, t + 0.055, t + 0.13);
  const mix = ctx.createGain();
  mix.gain.value = 0.4;
  mix.connect(gain);
  tone(ctx, mix, "triangle", hz * 2, t + 0.11, t + 0.28);
}

function hit(ctx: AudioContext, timbre: Timbre, dest: AudioNode, t: number, hz: number, vol: number): void {
  switch (timbre) {
    case TIMBRE_GEAR:
      hitGear(ctx, dest, t, vol);
      return;
    case TIMBRE_THUMP:
      hitThump(ctx, dest, t, hz, vol);
      return;
    case TIMBRE_BRASS:
      hitBrass(ctx, dest, t, hz, vol);
      return;
    case TIMBRE_ORGAN:
      hitOrgan(ctx, dest, t, hz, vol);
      return;
    case TIMBRE_STEAM:
      hitSteam(ctx, dest, t, vol);
      return;
    case TIMBRE_BELL:
      hitBell(ctx, dest, t, hz, vol);
      return;
  }
}

function strike(ctx: AudioContext, deck: Deck, score: Score, t: number): void {
  const stepInBar = deck.step % score.steps;
  const phrase = Math.floor(deck.step / score.steps) % score.phrases;
  const voices = score.voices;
  for (let i = 0; i < voices.length; i++) {
    const voice = voices[i];
    if (!voice || deck.drive < voice.minDrive) continue;
    if ((voice.phraseMask & (1 << phrase)) === 0) continue;
    const semi = voice.semi[stepInBar];
    if (semi === undefined || semi === REST) continue;
    const bend = voice.phraseSemi[phrase] ?? 0;
    const hz = score.rootHz * 2 ** (voice.oct + (semi + bend) / 12);
    hit(ctx, voice.timbre, deck.gain, t, hz, voice.gain);
  }
}

function fill(ctx: AudioContext): void {
  if (musicSilent() || !decks) {
    if (musicSilent() && decks && !hushed) hushDecks(ctx);
    return;
  }
  hushed = false;
  const now = ctx.currentTime;
  for (let i = 0; i < 2; i++) {
    const deck = decks[i];
    if (!deck || deck.bed === null) continue;
    if (deck.gain.gain.value < 0.001 && now >= deck.rampUntil) continue;
    const score = scoreOf(deck.bed);
    const stepDur = (60 / bpmOf(score, deck.drive)) * (score.beats / score.steps);
    if (deck.nextT < now) deck.nextT = now;
    while (deck.nextT < now + LOOKAHEAD) {
      strike(ctx, deck, score, deck.nextT);
      deck.step += 1;
      deck.nextT += stepDur;
    }
  }
}

function becameAudible(prev: Cue, next: Cue): boolean {
  return !prev.audible && next.audible;
}

function fellSilent(prev: Cue, next: Cue): boolean {
  return prev.audible && !next.audible;
}

function bedChanged(prev: Cue, next: Cue): boolean {
  return prev.audible && next.audible && prev.bed !== next.bed;
}

export function needsHardStart(next: Cue, liveBed: BedId | null): boolean {
  return next.audible && liveBed === null;
}

export function syncMusic(snap: MusicSnap): void {
  const prev = engineCue;
  const next = cueFrom(snap, prev);
  engineCue = next;
  lastSnap = snap;
  const bus = getBus();
  if (!bus) return;
  const built = ensure(bus);
  if (!decks) return;
  if (built || becameAudible(prev, next) || bedChanged(prev, next) || fellSilent(prev, next)) {
    route(prev, next, built, bus.ctx.currentTime);
  } else if (needsHardStart(next, decks[live].bed)) {
    route(silence(), next, true, bus.ctx.currentTime);
  } else if (next.audible && decks[live].bed === next.bed) {
    decks[live].drive = next.drive;
  }
  fill(bus.ctx);
}

function applyPref(): void {
  const bus = getBus();
  if (musicSilent()) {
    if (bus) {
      ensure(bus);
      hushDecks(bus.ctx);
    }
    assignGain();
    return;
  }
  if (!bus) return;
  assignGain();
  if (lastSnap) syncMusic(lastSnap);
  else ensure(bus);
  assignGain();
}

export function setMusicMuted(muted: boolean): void {
  pref.muted = muted;
  paintMute();
  applyPref();
}

export function toggleMusicMuted(): void {
  setMusicMuted(!musicMuted());
}

export function setMusicVolume(raw: number): void {
  pref.volume = clampVolume(raw);
  applyPref();
}

export function bootMusic(store: Store | null): void {
  const next = store
    ? parseMusicPrefs(store.getItem(MUSIC_MUTE_KEY), store.getItem(MUSIC_VOL_KEY))
    : { muted: false, volume: MUSIC_VOL_DEFAULT };
  pref.muted = next.muted;
  pref.volume = next.volume;
  paintMute();
  const bus = getBus();
  if (musicSilent() && bus && decks) hushDecks(bus.ctx);
  assignGain();
}

export function persistMusic(store: Store): void {
  store.setItem(MUSIC_MUTE_KEY, pref.muted ? "1" : "0");
  store.setItem(MUSIC_VOL_KEY, pref.volume.toFixed(2));
}

export function mountMusicRow(root: ParentNode, hooks: MusicRowHooks): void {
  if (root.querySelector("#music-mute")) return;
  const button = document.createElement("button");
  button.id = "music-mute";
  button.type = "button";
  button.setAttribute("aria-label", "Mute music");
  musicMuteBtn = button;
  paintMute();
  button.addEventListener("click", () => {
    hooks.gesture();
    toggleMusicMuted();
    hooks.commit("mute");
  });
  const label = document.createElement("label");
  label.append("Music");
  const input = document.createElement("input");
  input.id = "music-vol";
  input.type = "range";
  input.min = "0";
  input.max = "100";
  input.value = String(musicVolumePercent(pref.volume));
  input.setAttribute("aria-label", "Music volume");
  input.addEventListener("input", () => {
    hooks.gesture();
    setMusicVolume(Number(input.value) / 100);
    hooks.commit("volume");
  });
  label.append(input);
  root.append(button, label);
}
