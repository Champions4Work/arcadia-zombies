import { createRng, nextFloat, type Rng } from "./rng";
import { H, W, type World } from "./types";

export const MAP_NONE = 0;
export const MAP_VENT = 1;
export const MAP_DROP = 2;
export const MAP_FOG = 3;
export const MAP_GEAR = 4;

export const MAP_IDLE = 0;
export const MAP_WARN = 1;
export const MAP_LIVE = 2;

export const GEAR_N = 8;
export const VENT_DMG = 4;
export const VENT_R = 56;
export const FOG_SIGHT = 72;
export const DROP_HEAL = 1;
export const DROP_SCORE = 45;
export const GEAR_SCORE = 18;

export const WARN_TICKS = 180;
export const VENT_LIVE = 120;
export const DROP_LIVE = 280;
export const FOG_LIVE = 168;
export const GEAR_LIVE = 200;
export const FIRST_MIN = 420;
export const FIRST_SPAN = 180;
export const GAP_MIN = 480;
export const GAP_SPAN = 300;
export const CRATE_R2 = 18 * 18;
export const GEAR_R2 = 20 * 20;
export const CRATE_FALL = 22;

export interface MapBag {
  rng: Rng;
  nextAt: number;
  kind: number;
  phase: number;
  x: number;
  y: number;
  life: number;
  banner: number;
  bannerKind: number;
  lastKind: number;
  strike: number;
  strikeX: number;
  strikeY: number;
  strikeR: number;
  strikeDmg: number;
  crate: number;
  gearX: Float32Array;
  gearY: Float32Array;
  gearVy: Float32Array;
  gearOn: Uint8Array;
  spawnCd: number;
}

const bag = new WeakMap<World, MapBag>();

function mixSeed(seed: number): number {
  let x = (seed >>> 0) ^ 0x6d2b79f5;
  x = Math.imul(x ^ (x >>> 16), 0x7feb352d);
  x = Math.imul(x ^ (x >>> 15), 0x846ca68b);
  x = (x ^ (x >>> 16)) >>> 0;
  return x || 1;
}

function create(rng: Rng): MapBag {
  const gearX = new Float32Array(GEAR_N);
  const gearY = new Float32Array(GEAR_N);
  const gearVy = new Float32Array(GEAR_N);
  const gearOn = new Uint8Array(GEAR_N);
  const state: MapBag = {
    rng, nextAt: 0, kind: MAP_NONE, phase: MAP_IDLE, x: W / 2, y: H / 2, life: 0,
    banner: 0, bannerKind: MAP_NONE, lastKind: MAP_NONE, strike: 0, strikeX: 0, strikeY: 0,
    strikeR: 0, strikeDmg: 0, crate: 0, gearX, gearY, gearVy, gearOn, spawnCd: 0,
  };
  state.nextAt = FIRST_MIN + ((nextFloat(rng) * FIRST_SPAN) | 0);
  return state;
}

export function attachMapEvents(w: World): void {
  if (bag.has(w)) return;
  bag.set(w, create(createRng(mixSeed(w.rng.state))));
}

export function mapState(w: World): MapBag {
  const found = bag.get(w);
  if (found) return found;
  const made = create(createRng(1));
  bag.set(w, made);
  return made;
}

export function mapKind(w: World): number {
  return mapState(w).kind;
}

export function mapPhase(w: World): number {
  return mapState(w).phase;
}

export function mapX(w: World): number {
  return mapState(w).x;
}

export function mapY(w: World): number {
  return mapState(w).y;
}

export function mapLife(w: World): number {
  return mapState(w).life;
}

export function mapBanner(w: World): number {
  return mapState(w).banner;
}

export function mapBannerKind(w: World): number {
  return mapState(w).bannerKind;
}

export function mapStrikeOn(w: World): number {
  return mapState(w).strike;
}

export function mapStrikeX(w: World): number {
  return mapState(w).strikeX;
}

export function mapStrikeY(w: World): number {
  return mapState(w).strikeY;
}

export function mapStrikeR(w: World): number {
  return mapState(w).strikeR;
}

export function mapStrikeDmg(w: World): number {
  return mapState(w).strikeDmg;
}

export function clearMapStrike(w: World): void {
  mapState(w).strike = 0;
}

export function crateOn(w: World): number {
  return mapState(w).crate;
}

export function gearOn(w: World, i: number): number {
  return mapState(w).gearOn[i] ?? 0;
}

export function gearX(w: World, i: number): number {
  return mapState(w).gearX[i] ?? 0;
}

export function gearY(w: World, i: number): number {
  return mapState(w).gearY[i] ?? 0;
}

export function fogSight(w: World): number {
  const m = mapState(w);
  if (m.phase === MAP_LIVE && m.kind === MAP_FOG) return FOG_SIGHT;
  return 1e6;
}

export function fogCover(w: World): number {
  const m = mapState(w);
  if (m.kind !== MAP_FOG) return 0;
  if (m.phase === MAP_WARN) return (1 - m.life / WARN_TICKS) * 0.45;
  if (m.phase === MAP_LIVE) return 0.86;
  return 0;
}

export function mapLabel(kind: number, live: number): string {
  if (kind === MAP_VENT) return live ? "STEAM VENT" : "VENT INCOMING";
  if (kind === MAP_DROP) return live ? "SUPPLY DROP" : "AIRSHIP INBOUND";
  if (kind === MAP_FOG) return live ? "FOG SURGE" : "FOG INCOMING";
  if (kind === MAP_GEAR) return live ? "GEAR RAIN" : "GEARS INCOMING";
  return "";
}
