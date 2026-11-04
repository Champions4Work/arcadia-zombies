import {
  EV_BOOM, EV_HURT, EV_KILL, EV_LEVEL, EV_RANK, EV_SAW, EV_SHIELD, EV_SHOT, EV_SIREN, EV_TESLA,
  EV_WAVE, FX_SPARK, MAX_FX, UPG_PIERCE, UPG_SHOTGUN, WPN_FLAME, WPN_HARP, WPN_MORT, WPN_SHOT,
  type World,
} from "../sim/types";

export const SFX_MUTE_KEY = "arcadia.sfx.muted";
export const SFX_VOL_KEY = "arcadia.sfx.volume";
export const SFX_VOL_DEFAULT = 0.8;

export const CUE_RIFLE = 0;
export const CUE_SHOTGUN = 1;
export const CUE_RIVET = 2;
export const CUE_TESLA = 3;
export const CUE_SAW = 4;
export const CUE_HIT = 5;
export const CUE_DEATH = 6;
export const CUE_HURT = 7;
export const CUE_LEVEL = 8;
export const CUE_PICK = 9;
export const CUE_RANK = 10;
export const CUE_BOSS = 11;
export const CUE_CLICK = 12;
export const CUE_SHIELD = 13;
export const CUE_BOOM = 14;
export const CUE_WAVE = 15;
export const CUE_N = 16;
export const VOICE_CAP = 8;

const GAP = new Float32Array([
  0.035, 0.035, 0.035, 0.08, 0.14, 0.08, 0.12, 0.2, 0.3, 0.15, 0.5, 1.5, 0.045, 0.1, 0.22, 0.7,
]);
const DUR = new Float32Array([
  0.05, 0.11, 0.06, 0.1, 0.08, 0.05, 0.18, 0.26, 0.46, 0.16, 0.42, 0.72, 0.03, 0.12, 0.16, 0.26,
]);
const BASE = new Float32Array([
  0.05, 0.055, 0.045, 0.04, 0.034, 0.04, 0.05, 0.06, 0.042, 0.05, 0.05, 0.046, 0.04, 0.04, 0.052, 0.044,
]);

export interface SfxPrefs {
  muted: boolean;
  volume: number;
}

export interface Store {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface SfxTrack {
  choosing: number;
  bossWave: number;
  primed: number;
}

export interface SfxGate {
  last: Float64Array;
  until: Float64Array;
  owner: Int8Array;
}

export function sfxMuteLabel(muted: boolean): string {
  return muted ? "SFX Off" : "SFX On";
}

export function clampSfxVolume(v: number): number {
  if (!Number.isFinite(v)) return SFX_VOL_DEFAULT;
  if (v <= 0) return 0;
  if (v >= 1) return 1;
  return v;
}

export function sfxVolumePercent(volume: number): number {
  return Math.round(clampSfxVolume(volume) * 100);
}

export function loadSfxPrefs(store: Store): SfxPrefs {
  const raw = store.getItem(SFX_VOL_KEY);
  const volume = raw === null || raw.trim() === "" ? SFX_VOL_DEFAULT : clampSfxVolume(Number(raw));
  return { muted: store.getItem(SFX_MUTE_KEY) === "1", volume };
}

export function saveSfxPrefs(store: Store, prefs: SfxPrefs): void {
  store.setItem(SFX_MUTE_KEY, prefs.muted ? "1" : "0");
  store.setItem(SFX_VOL_KEY, clampSfxVolume(prefs.volume).toFixed(2));
}

export function isBossWave(wave: number): boolean {
  const w = wave | 0;
  return w >= 5 && w % 5 === 0;
}

export function shotCue(w: World): number {
  const gun = w.gun;
  if (gun === WPN_SHOT) return CUE_SHOTGUN;
  if (gun === WPN_HARP) return CUE_RIVET;
  if (gun === WPN_FLAME || gun === WPN_MORT) return CUE_RIFLE;
  if ((w.upgrades[UPG_SHOTGUN] ?? 0) > 0) return CUE_SHOTGUN;
  if ((w.upgrades[UPG_PIERCE] ?? 0) > 0) return CUE_RIVET;
  return CUE_RIFLE;
}

export function cueGap(id: number): number {
  return GAP[id] ?? 0;
}

export function cueDur(id: number): number {
  return DUR[id] ?? 0;
}

export function cueBase(id: number): number {
  return BASE[id] ?? 0;
}

export function mixGain(base: number, active: number): number {
  const n = active > 0 ? active : 0;
  const g = base / (1 + n * 0.65);
  if (g > 0.08) return 0.08;
  if (g < 0) return 0;
  return g;
}

export function createSfxTrack(): SfxTrack {
  return { choosing: 0, bossWave: -1, primed: 0 };
}

export function createSfxGate(): SfxGate {
  const gate: SfxGate = {
    last: new Float64Array(CUE_N),
    until: new Float64Array(VOICE_CAP),
    owner: new Int8Array(VOICE_CAP),
  };
  resetSfxGate(gate);
  return gate;
}

export function resetSfxGate(gate: SfxGate): void {
  gate.last.fill(-1e9);
  gate.until.fill(0);
  gate.owner.fill(-1);
}

export function cuePreempts(id: number): boolean {
  return id === CUE_BOSS || id === CUE_RANK || id === CUE_PICK || id === CUE_BOOM || id === CUE_WAVE;
}

export function voicesAt(gate: SfxGate, now: number): number {
  let n = 0;
  const until = gate.until;
  for (let i = 0; i < until.length; i++) if ((until[i] ?? 0) > now) n++;
  return n;
}

export function admitCue(gate: SfxGate, id: number, now: number, dur: number): boolean {
  if (id < 0 || id >= CUE_N) return false;
  const gap = GAP[id] ?? 0;
  if (now - (gate.last[id] ?? 0) < gap) return false;
  const until = gate.until;
  const owner = gate.owner;
  let slot = -1;
  let victim = -1;
  let victimEnd = Number.POSITIVE_INFINITY;
  for (let i = 0; i < until.length; i++) {
    const end = until[i] ?? 0;
    if (end > now) {
      if (!cuePreempts(owner[i] ?? -1) && end < victimEnd) {
        victimEnd = end;
        victim = i;
      }
    } else if (slot < 0) slot = i;
  }
  if (slot < 0) {
    if (!cuePreempts(id) || victim < 0) return false;
    slot = victim;
  }
  gate.last[id] = now;
  until[slot] = now + (dur > 0 ? dur : 0.01);
  owner[slot] = id;
  return true;
}

function zombieStruck(w: World): boolean {
  const kind = w.fxKind;
  const ticks = w.fxTick;
  const tick = w.tick;
  for (let i = 0; i < MAX_FX; i++) {
    if (kind[i] === FX_SPARK && ticks[i] === tick) return true;
  }
  return false;
}

function put(out: Uint8Array, n: number, id: number): number {
  if (n < out.length) out[n] = id;
  return n < out.length ? n + 1 : n;
}

export function collectCues(w: World, track: SfxTrack, out: Uint8Array): number {
  let n = 0;
  if (track.primed) {
    if (isBossWave(w.wave) && w.wave !== track.bossWave) n = put(out, n, CUE_BOSS);
    if (w.events[EV_RANK]) n = put(out, n, CUE_RANK);
    if (track.choosing > 0 && w.choosing === 0) n = put(out, n, CUE_PICK);
  }
  if (isBossWave(w.wave)) track.bossWave = w.wave;
  track.choosing = w.choosing;
  track.primed = 1;
  if (w.events[EV_LEVEL]) n = put(out, n, CUE_LEVEL);
  if (w.events[EV_HURT]) n = put(out, n, CUE_HURT);
  if (w.events[EV_SHOT]) n = put(out, n, shotCue(w));
  if (w.events[EV_TESLA]) n = put(out, n, CUE_TESLA);
  if (w.events[EV_SHIELD]) n = put(out, n, CUE_SHIELD);
  if (w.events[EV_SIREN]) n = put(out, n, CUE_BOSS);
  const saw = (w.events[EV_SAW] ?? 0) > 0;
  if (saw) n = put(out, n, CUE_SAW);
  if (w.events[EV_KILL]) n = put(out, n, CUE_DEATH);
  if (zombieStruck(w) && (!saw || w.events[EV_SHOT] || w.events[EV_TESLA])) n = put(out, n, CUE_HIT);
  if (w.events[EV_WAVE]) n = put(out, n, CUE_WAVE);
  if (w.events[EV_BOOM]) n = put(out, n, CUE_BOOM);
  return n;
}
