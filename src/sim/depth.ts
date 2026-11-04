import { ARENA_W, CLEAR_R, HEAL_HP, MAX_OBS, OB_BOILER, OB_CRATE, OB_GEAR, indexProps } from "./arena";
import { applyUpgrade, offerable } from "./progress";
import { UPG_DMG, UPG_FIRE, UPG_HP, UPG_SPEED, type World } from "./types";

export const MAX_BELTS = 2;
export const MAX_CARGO = 2;
export const MAX_VENTS = 8;
export const MAX_LANE = 8;
export const CARGO_RIDE = 0;
export const CARGO_SLIDE = 1;
export const CARGO_LAND = 2;
export const CARGO_HEAL = 0;
export const CARGO_UPG = 1;
export const VENT_SLOW = 0.55;
export const VENT_R = 22;
export const VENT_R2 = VENT_R * VENT_R;
export const ZOMBIE_VENT_R = 14;
export const ZOMBIE_VENT_R2 = ZOMBIE_VENT_R * ZOMBIE_VENT_R;
export const BELT_SPEED = 0.9;
export const SLIDE_SPEED = 1.6;
export const CARGO_GAP = 420;
export const FIRST_CARGO = 90;
export const DROP_ALONG = 160;
export const BELT_SPAN = 320;
export const LANE_X = ARENA_W / 2;
export const CARGO_R2 = 20 * 20;
export const BELT_UPG_CAP = 2;
export const CARGO_SCORE = 12;
export const CARGO_PWR = 8;
export const LAND_R2 = 16;
export const LANE_VENT_N = 3;

export interface DepthBag {
  beltX: Float32Array;
  beltY: Float32Array;
  beltW: Float32Array;
  beltVert: Uint8Array;
  beltN: number;
  cargoOn: Uint8Array;
  cargoBelt: Uint8Array;
  cargoPhase: Uint8Array;
  cargoKind: Uint8Array;
  cargoX: Float32Array;
  cargoY: Float32Array;
  cargoT: Float32Array;
  lastSpawn: Int32Array;
  spawned: number;
  granted: number;
  ventX: Float32Array;
  ventY: Float32Array;
  ventN: number;
  laneI: Int16Array;
  laneN: number;
}

const bag = new WeakMap<World, DepthBag>();

const BELTS: readonly [number, number, number, number][] = [
  [296, 658, 368, 0],
];

const VENTS: readonly [number, number][] = [
  [360, 200],
  [480, 190],
  [600, 200],
];

const LANE: readonly [number, number, number, number, number, number, number][] = [
  [OB_BOILER, 308, 520, 14, 16, 16, 2],
  [OB_GEAR, 652, 520, 13, 13, 13, 2],
];

function create(): DepthBag {
  return {
    beltX: new Float32Array(MAX_BELTS),
    beltY: new Float32Array(MAX_BELTS),
    beltW: new Float32Array(MAX_BELTS),
    beltVert: new Uint8Array(MAX_BELTS),
    beltN: 0,
    cargoOn: new Uint8Array(MAX_CARGO),
    cargoBelt: new Uint8Array(MAX_CARGO),
    cargoPhase: new Uint8Array(MAX_CARGO),
    cargoKind: new Uint8Array(MAX_CARGO),
    cargoX: new Float32Array(MAX_CARGO),
    cargoY: new Float32Array(MAX_CARGO),
    cargoT: new Float32Array(MAX_CARGO),
    lastSpawn: new Int32Array(MAX_BELTS),
    spawned: 0,
    granted: 0,
    ventX: new Float32Array(MAX_VENTS),
    ventY: new Float32Array(MAX_VENTS),
    ventN: 0,
    laneI: new Int16Array(MAX_LANE),
    laneN: 0,
  };
}

function fillLayout(d: DepthBag): void {
  d.beltN = 0;
  for (let i = 0; i < BELTS.length && d.beltN < MAX_BELTS; i++) {
    const row = BELTS[i];
    if (!row) continue;
    const n = d.beltN;
    d.beltX[n] = row[0] ?? 0;
    d.beltY[n] = row[1] ?? 0;
    d.beltW[n] = row[2] ?? BELT_SPAN;
    d.beltVert[n] = row[3] ?? 1;
    d.lastSpawn[n] = -CARGO_GAP;
    d.beltN++;
  }
  d.ventN = 0;
  for (let i = 0; i < VENTS.length && d.ventN < MAX_VENTS; i++) {
    const row = VENTS[i];
    if (!row) continue;
    d.ventX[d.ventN] = row[0] ?? 0;
    d.ventY[d.ventN] = row[1] ?? 0;
    d.ventN++;
  }
}

function nearObs(w: World, x: number, y: number, pad: number): boolean {
  const a = w.arena;
  for (let i = 0; i < a.obsN; i++) {
    if (!a.obsAlive[i]) continue;
    const ox = a.obsX[i] ?? 0;
    const oy = a.obsY[i] ?? 0;
    const r = a.obsR[i] ?? 0;
    const hw = r > 0 ? r : (a.obsHW[i] ?? 0);
    const hh = r > 0 ? r : (a.obsHH[i] ?? 0);
    const dx = Math.abs(x - ox);
    const dy = Math.abs(y - oy);
    if (dx < hw + pad && dy < hh + pad) return true;
  }
  return false;
}

function stampLane(w: World, d: DepthBag): void {
  const a = w.arena;
  d.laneN = 0;
  for (let p = 0; p < LANE.length && d.laneN < MAX_LANE; p++) {
    const row = LANE[p];
    if (!row) continue;
    const x = row[1] ?? 0;
    const y = row[2] ?? 0;
    const dx = x - w.px;
    const dy = y - w.py;
    if (dx * dx + dy * dy < CLEAR_R * CLEAR_R) continue;
    if (nearObs(w, x, y, 18)) continue;
    let slot = -1;
    for (let i = 0; i < MAX_OBS; i++) {
      if (i >= a.obsN || !a.obsAlive[i]) { slot = i; break; }
    }
    if (slot < 0) break;
    a.obsX[slot] = x;
    a.obsY[slot] = y;
    a.obsKind[slot] = row[0] ?? OB_CRATE;
    a.obsHW[slot] = row[3] ?? 12;
    a.obsHH[slot] = row[4] ?? 12;
    a.obsR[slot] = row[5] ?? 0;
    a.obsHp[slot] = row[6] ?? 1;
    a.obsAlive[slot] = 1;
    if (slot >= a.obsN) a.obsN = slot + 1;
    d.laneI[d.laneN] = slot;
    d.laneN++;
  }
  indexProps(a);
}

export function attachDepth(w: World): void {
  if (bag.has(w)) return;
  const d = create();
  fillLayout(d);
  stampLane(w, d);
  bag.set(w, d);
}

export function depthState(w: World): DepthBag {
  const found = bag.get(w);
  if (found) return found;
  const d = create();
  fillLayout(d);
  bag.set(w, d);
  return d;
}

export function beltN(w: World): number {
  return depthState(w).beltN;
}

export function beltX(w: World, i: number): number {
  return depthState(w).beltX[i] ?? 0;
}

export function beltY(w: World, i: number): number {
  return depthState(w).beltY[i] ?? 0;
}

export function beltW(w: World, i: number): number {
  return depthState(w).beltW[i] ?? 0;
}

export function beltVert(w: World, i: number): number {
  return depthState(w).beltVert[i] ?? 0;
}

export function cargoOn(w: World, i: number): number {
  return depthState(w).cargoOn[i] ?? 0;
}

export function cargoX(w: World, i: number): number {
  return depthState(w).cargoX[i] ?? 0;
}

export function cargoY(w: World, i: number): number {
  return depthState(w).cargoY[i] ?? 0;
}

export function cargoPhase(w: World, i: number): number {
  return depthState(w).cargoPhase[i] ?? 0;
}

export function cargoKind(w: World, i: number): number {
  return depthState(w).cargoKind[i] ?? 0;
}

export function cargoGranted(w: World): number {
  return depthState(w).granted;
}

export function ventCount(w: World): number {
  return depthState(w).ventN;
}

export function ventX(w: World, i: number): number {
  return depthState(w).ventX[i] ?? 0;
}

export function ventY(w: World, i: number): number {
  return depthState(w).ventY[i] ?? 0;
}

export function lanePropCount(w: World): number {
  return depthState(w).laneN;
}

export function lanePropAt(w: World, i: number): number {
  return depthState(w).laneI[i] ?? -1;
}

export function takeBeltUpg(w: World): number {
  if (offerable(w, UPG_SPEED)) return UPG_SPEED;
  if (offerable(w, UPG_FIRE)) return UPG_FIRE;
  if (offerable(w, UPG_DMG)) return UPG_DMG;
  if (offerable(w, UPG_HP)) return UPG_HP;
  return -1;
}

export function grantBeltUpg(w: World): number {
  const d = depthState(w);
  if (d.granted >= BELT_UPG_CAP) return 0;
  const id = takeBeltUpg(w);
  if (id < 0) return 0;
  applyUpgrade(w, id);
  d.granted++;
  return 1;
}

export function beltHeal(w: World): number {
  if (w.hp >= w.maxHp) return 0;
  w.hp += HEAL_HP;
  if (w.hp > w.maxHp) w.hp = w.maxHp;
  return 1;
}

export function reviewDepth(w: World): void {
  attachDepth(w);
  const d = depthState(w);
  const a = w.arena;
  d.cargoOn[0] = 1;
  d.cargoBelt[0] = 0;
  d.cargoPhase[0] = CARGO_RIDE;
  d.cargoKind[0] = CARGO_UPG;
  d.cargoX[0] = 356;
  d.cargoY[0] = 658;
  d.ventX[0] = w.px - 96;
  d.ventY[0] = w.py + 96;
  d.cargoT[0] = DROP_ALONG * 0.55;
  let slot = -1;
  for (let i = 0; i < MAX_OBS; i++) {
    if (i >= a.obsN || !a.obsAlive[i]) { slot = i; break; }
  }
  if (slot >= 0) {
    a.obsX[slot] = 308;
    a.obsY[slot] = 520;
    a.obsKind[slot] = OB_BOILER;
    a.obsHW[slot] = 14;
    a.obsHH[slot] = 16;
    a.obsR[slot] = 16;
    a.obsHp[slot] = 2;
    a.obsAlive[slot] = 1;
    if (slot >= a.obsN) a.obsN = slot + 1;
    indexProps(a);
  }
}
