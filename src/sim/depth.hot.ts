import { emitFx } from "./combat.hot";
import {
  BELT_SPEED, BELT_UPG_CAP, CARGO_GAP, CARGO_HEAL, CARGO_LAND, CARGO_PWR, CARGO_R2, CARGO_RIDE, CARGO_SCORE,
  CARGO_SLIDE, CARGO_UPG, DROP_ALONG, FIRST_CARGO, LAND_R2, SLIDE_SPEED, VENT_R2, VENT_SLOW, ZOMBIE_VENT_R2,
  beltDropX, beltDropY, beltHeal, depthState, grantBeltUpg,
} from "./depth";
import { applyScore, hasMod, MOD_NOHEAL } from "./modifiers";
import { chargeUlt } from "./ult";
import { FX_PUFF, FX_SPARK, type World } from "./types";

function beltBusy(w: World, belt: number): number {
  const d = depthState(w);
  for (let i = 0; i < d.cargoOn.length; i++) {
    if (d.cargoOn[i] && d.cargoBelt[i] === belt) return 1;
  }
  return 0;
}

function spawnCargo(w: World, belt: number): void {
  const d = depthState(w);
  if (beltBusy(w, belt)) return;
  let slot = -1;
  for (let i = 0; i < d.cargoOn.length; i++) {
    if (!d.cargoOn[i]) { slot = i; break; }
  }
  if (slot < 0) return;
  d.cargoOn[slot] = 1;
  d.cargoBelt[slot] = belt;
  d.cargoPhase[slot] = CARGO_RIDE;
  d.cargoT[slot] = 0;
  d.cargoX[slot] = d.beltX[belt] ?? 0;
  d.cargoY[slot] = d.beltY[belt] ?? 0;
  const upg = d.granted < BELT_UPG_CAP && (d.spawned % 3) === 2 ? 1 : 0;
  d.cargoKind[slot] = upg ? CARGO_UPG : CARGO_HEAL;
  d.lastSpawn[belt] = w.tick;
  d.spawned++;
}

function ridePos(w: World, i: number): void {
  const d = depthState(w);
  const belt = d.cargoBelt[i] ?? 0;
  const t = d.cargoT[i] ?? 0;
  const bx = d.beltX[belt] ?? 0;
  const by = d.beltY[belt] ?? 0;
  if (d.beltVert[belt]) {
    d.cargoX[i] = bx;
    d.cargoY[i] = by + t;
  } else {
    d.cargoX[i] = bx + t;
    d.cargoY[i] = by;
  }
}

function slideCargo(w: World, i: number): void {
  const d = depthState(w);
  const belt = d.cargoBelt[i] ?? 0;
  const tx = beltDropX(w, belt);
  const ty = beltDropY(w, belt);
  const x = d.cargoX[i] ?? 0;
  const y = d.cargoY[i] ?? 0;
  const dx = tx - x;
  const dy = ty - y;
  if (dx * dx + dy * dy <= LAND_R2) {
    d.cargoX[i] = tx;
    d.cargoY[i] = ty;
    d.cargoPhase[i] = CARGO_LAND;
    return;
  }
  const len = Math.hypot(dx, dy) || 1;
  const step = SLIDE_SPEED;
  d.cargoX[i] = x + (dx / len) * step;
  d.cargoY[i] = y + (dy / len) * step;
}

function collectCargo(w: World, i: number): void {
  const d = depthState(w);
  const dx = w.px - (d.cargoX[i] ?? 0);
  const dy = w.py - (d.cargoY[i] ?? 0);
  if (dx * dx + dy * dy > CARGO_R2) return;
  const kind = d.cargoKind[i] ?? 0;
  d.cargoOn[i] = 0;
  emitFx(w, FX_SPARK, w.px, w.py, 0);
  emitFx(w, FX_PUFF, d.cargoX[i] ?? w.px, d.cargoY[i] ?? w.py, 8);
  w.score += applyScore(CARGO_SCORE, w.mods);
  if (kind === CARGO_UPG) {
    if (grantBeltUpg(w)) return;
    chargeUlt(w, CARGO_PWR);
    return;
  }
  if (!hasMod(w.mods, MOD_NOHEAL)) beltHeal(w);
}

function tickCargo(w: World): void {
  const d = depthState(w);
  for (let i = 0; i < d.cargoOn.length; i++) {
    if (!d.cargoOn[i]) continue;
    const phase = d.cargoPhase[i] ?? 0;
    if (phase === CARGO_RIDE) {
      d.cargoT[i] = (d.cargoT[i] ?? 0) + BELT_SPEED;
      ridePos(w, i);
      if ((d.cargoT[i] ?? 0) >= DROP_ALONG) d.cargoPhase[i] = CARGO_SLIDE;
    } else if (phase === CARGO_SLIDE) {
      slideCargo(w, i);
    }
    collectCargo(w, i);
  }
}

function trySpawn(w: World): void {
  const d = depthState(w);
  if (w.tick < FIRST_CARGO) return;
  for (let b = 0; b < d.beltN; b++) {
    const wait = b === 0 ? CARGO_GAP : CARGO_GAP + 80;
    const last = d.lastSpawn[b] ?? 0;
    if (w.tick - last < wait) continue;
    spawnCargo(w, b);
  }
}

export function ventSlowAt(w: World, x: number, y: number): number {
  const d = depthState(w);
  for (let i = 0; i < d.ventN; i++) {
    const dx = x - (d.ventX[i] ?? 0);
    const dy = y - (d.ventY[i] ?? 0);
    if (dx * dx + dy * dy < VENT_R2) return VENT_SLOW;
  }
  return 1;
}

export function ventSlowZombieAt(w: World, x: number, y: number): number {
  const d = depthState(w);
  for (let i = 0; i < d.ventN; i++) {
    const dx = x - (d.ventX[i] ?? 0);
    const dy = y - (d.ventY[i] ?? 0);
    if (dx * dx + dy * dy < ZOMBIE_VENT_R2) return VENT_SLOW;
  }
  return 1;
}

export function ventSlowMul(w: World): number {
  return ventSlowAt(w, w.px, w.py);
}

export function stepDepth(w: World): void {
  tickCargo(w);
  trySpawn(w);
}
