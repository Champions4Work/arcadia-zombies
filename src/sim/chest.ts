import { ARENA_H, ARENA_W } from "./arena";
import { Z_ELITE } from "./foes";
import { applyUpgrade, evolutionReady, offerable } from "./progress";
import { nextFloat, type Rng } from "./rng";
import {
  EV_CHEST, EV_CHEST_END, EVOL_AEGIS, EVOL_CANNON, EVOL_STORM, UPG_COUNT,
  type Input, type World,
} from "./types";

export const MAX_CHESTS = 4;
export const CHEST_SLOTS = 5;
export const ELITE_MARK = Z_ELITE;
export const ELITE_DROP = 0.15;
export const TIER_ONE = 0.7;
export const TIER_THREE = 0.25;
export const TIER_FIVE = 0.05;
export const REVEAL_LO = 90;
export const REVEAL_HI = 150;
export const CHEST_R2 = 28 * 28;

export function rollChestCount(rng: Rng): number {
  const r = nextFloat(rng);
  if (r < TIER_ONE) return 1;
  if (r < TIER_ONE + TIER_THREE) return 3;
  return 5;
}

export function rollEliteDrop(rng: Rng): boolean {
  return nextFloat(rng) < ELITE_DROP;
}

export function chestGoldAt(dur: number): number {
  const at = (dur * 0.78) | 0;
  return at > 1 ? at : 1;
}

function allowed(w: World, id: number): boolean {
  if (!evolutionReady(w, id)) return false;
  return offerable(w, id);
}

function takeEvolution(w: World): number {
  const s = w.scratch;
  if (s[EVOL_STORM]) { s[EVOL_STORM] = 0; return EVOL_STORM; }
  if (s[EVOL_CANNON]) { s[EVOL_CANNON] = 0; return EVOL_CANNON; }
  if (s[EVOL_AEGIS]) { s[EVOL_AEGIS] = 0; return EVOL_AEGIS; }
  return -1;
}

function takeCandidate(w: World): number {
  const s = w.scratch;
  let c = 0;
  for (let i = 0; i < UPG_COUNT; i++) if (s[i]) c++;
  if (c <= 0) return -1;
  let k = (nextFloat(w.rng) * c) | 0;
  for (let i = 0; i < UPG_COUNT; i++) {
    if (!s[i]) continue;
    if (k === 0) {
      s[i] = 0;
      return i;
    }
    k--;
  }
  return -1;
}

function beginReveal(w: World): void {
  const want = rollChestCount(w.rng);
  const s = w.scratch;
  let avail = 0;
  for (let i = 0; i < UPG_COUNT; i++) {
    const ok = allowed(w, i) ? 1 : 0;
    s[i] = ok;
    avail += ok;
  }
  const n = want < avail ? want : avail;
  for (let i = 0; i < CHEST_SLOTS; i++) w.chestPrize[i] = -1;
  let filled = 0;
  if (n > 0) {
    const evo = takeEvolution(w);
    if (evo >= 0) {
      w.chestPrize[filled] = evo;
      applyUpgrade(w, evo);
      filled++;
    }
  }
  while (filled < n) {
    const id = takeCandidate(w);
    if (id < 0) break;
    w.chestPrize[filled] = id;
    applyUpgrade(w, id);
    filled++;
  }
  w.chestCount = filled;
  if (filled <= 0) {
    w.chestOpen = 0;
    return;
  }
  const span = REVEAL_HI - REVEAL_LO + 1;
  w.chestDur = REVEAL_LO + ((nextFloat(w.rng) * span) | 0);
  w.chestT = 0;
  w.chestGold = 0;
  w.chestOpen = 1;
  w.events[EV_CHEST] = 1;
}

export function dropChest(w: World, x: number, y: number): number {
  const cx = x < 16 ? 16 : x > ARENA_W - 16 ? ARENA_W - 16 : x;
  const cy = y < 24 ? 24 : y > ARENA_H - 16 ? ARENA_H - 16 : y;
  let slot = -1;
  for (let i = 0; i < MAX_CHESTS; i++) {
    if (!w.chestOn[i]) { slot = i; break; }
  }
  if (slot < 0) {
    slot = w.chestCursor;
    w.chestCursor = slot + 1 < MAX_CHESTS ? slot + 1 : 0;
  }
  w.chestX[slot] = cx;
  w.chestY[slot] = cy;
  w.chestOn[slot] = 1;
  return slot;
}

export function openBossChest(w: World, x: number, y: number, endRun: boolean): void {
  const slot = dropChest(w, x, y);
  if (!endRun) return;
  if (w.chestOn[slot]) {
    w.chestOn[slot] = 0;
    beginReveal(w);
  }
  if (w.chestOpen) w.chestSeal = 1;
  else w.over = true;
}

export function eliteChest(w: World, rawKind: number, x: number, y: number): void {
  if ((rawKind & ELITE_MARK) === 0) return;
  if (rollEliteDrop(w.rng)) dropChest(w, x, y);
}

export function openTouchedChest(w: World): void {
  if (w.chestOpen || w.choosing || w.over) return;
  for (let i = 0; i < MAX_CHESTS; i++) {
    if (!w.chestOn[i]) continue;
    const dx = w.px - (w.chestX[i] ?? 0);
    const dy = w.py - (w.chestY[i] ?? 0);
    if (dx * dx + dy * dy > CHEST_R2) continue;
    w.chestOn[i] = 0;
    beginReveal(w);
    return;
  }
}

export function stepChest(w: World, input: Input): boolean {
  if (!w.chestOpen) {
    if (w.chestLinger > 0) w.chestLinger--;
    if (!w.chestSeal) return false;
    if (w.chestLinger <= 0) {
      w.chestSeal = 0;
      w.over = true;
    }
    return true;
  }
  const skip = (input.skip ?? 0) > 0;
  if (skip) {
    if (!w.chestGold) {
      w.chestGold = 1;
      w.events[EV_CHEST_END] = 1;
    }
    w.chestOpen = 0;
    w.chestLinger = 18;
    return true;
  }
  w.chestT++;
  if (!w.chestGold && w.chestT >= chestGoldAt(w.chestDur)) {
    w.chestGold = 1;
    w.events[EV_CHEST_END] = 1;
  }
  if (w.chestT >= w.chestDur) {
    w.chestOpen = 0;
    w.chestLinger = 16;
  }
  return true;
}
