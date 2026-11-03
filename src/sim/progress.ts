import { nextFloat } from "./rng";
import {
  EV_LEVEL, OFFER_N, UPG_COUNT, UPG_DMG, UPG_FIRE, UPG_HP, UPG_MAGNET, UPG_MAX,
  UPG_SAWS, UPG_SHIELD, UPG_SPEED, UPG_TESLA, type World,
} from "./types";
export const UPG_NAMES: readonly string[] = [
  "TESLA COIL",
  "STEAM SHOTGUN",
  "SAW GEARS",
  "FIRE RATE",
  "DAMAGE",
  "MAX HP",
  "MOVE SPEED",
  "MAGNET",
  "PIERCE RIVET",
  "BOILER SHIELD",
];
export const CARD_W = 132;
export const CARD_H = 168;
export const CARD_Y = 68;
export const CARD_GAP = 8;
export const CARD_X0 = 34;
export const PICKUP_R2 = 144;
export const COG_PULL = 2.4;
export const SAW_HIT_R2 = 81;
export const SAW_SPIN = 0.08;
export function xpNeed(level: number): number {
  return 4 + level * 4;
}
export function fireEvery(w: World): number {
  return Math.max(3, 12 - (w.upgrades[UPG_FIRE] ?? 0) * 2);
}
export function moveSpeed(w: World): number {
  return 2 + (w.upgrades[UPG_SPEED] ?? 0) * 0.4;
}
export function magnetR(w: World): number {
  return 16 + (w.upgrades[UPG_MAGNET] ?? 0) * 24;
}
export function bulletDmg(w: World): number {
  return 1 + (w.upgrades[UPG_DMG] ?? 0);
}
export function sawRadius(w: World): number {
  return 26 + (w.upgrades[UPG_SAWS] ?? 0) * 8;
}
export function sawAngle(tick: number, i: number, n: number): number {
  return tick * SAW_SPIN + i * ((Math.PI * 2) / n);
}
export function teslaEvery(w: World): number {
  return Math.max(18, 54 - (w.upgrades[UPG_TESLA] ?? 0) * 6);
}
export function teslaRange(w: World): number {
  return 64 + (w.upgrades[UPG_TESLA] ?? 0) * 20;
}
export function teslaChain(w: World): number {
  return 40 + (w.upgrades[UPG_TESLA] ?? 0) * 14;
}
export function shieldReload(w: World): number {
  return Math.max(60, 180 - (w.upgrades[UPG_SHIELD] ?? 0) * 20);
}
export function upgName(id: number): string {
  return UPG_NAMES[id] ?? "";
}
export function cardSlot(x: number, y: number): number {
  if (y < CARD_Y || y > CARD_Y + CARD_H) return 0;
  for (let i = 0; i < OFFER_N; i++) {
    const x0 = CARD_X0 + i * (CARD_W + CARD_GAP);
    if (x >= x0 && x <= x0 + CARD_W) return i + 1;
  }
  return 0;
}
export function canUpgrade(w: World): boolean {
  for (let i = 0; i < UPG_COUNT; i++) {
    if ((w.upgrades[i] ?? 0) < UPG_MAX) return true;
  }
  return false;
}
export function applyUpgrade(w: World, id: number): void {
  if (id < 0 || id >= UPG_COUNT) return;
  const lv = w.upgrades[id] ?? 0;
  if (lv >= UPG_MAX) return;
  w.upgrades[id] = lv + 1;
  if (id === UPG_HP) {
    w.maxHp = 5 + (w.upgrades[UPG_HP] ?? 0);
    w.hp = w.maxHp;
  }
  if (id === UPG_SHIELD) {
    w.shield = w.upgrades[UPG_SHIELD] ?? 0;
    w.shieldCd = shieldReload(w);
  }
}
export function rollOffers(w: World): void {
  const s = w.scratch;
  for (let i = 0; i < UPG_COUNT; i++) s[i] = i;
  for (let i = UPG_COUNT - 1; i > 0; i--) {
    const j = (nextFloat(w.rng) * (i + 1)) | 0;
    const t = s[i] ?? 0;
    s[i] = s[j] ?? 0;
    s[j] = t;
  }
  w.offers[0] = -1;
  w.offers[1] = -1;
  w.offers[2] = -1;
  let n = 0;
  for (let i = 0; i < UPG_COUNT && n < OFFER_N; i++) {
    const id = s[i] ?? 0;
    if ((w.upgrades[id] ?? 0) >= UPG_MAX) continue;
    w.offers[n++] = id;
  }
}
export function beginLevel(w: World): void {
  if (w.choosing) return;
  const need = xpNeed(w.level);
  if (w.xp < need) return;
  if (!canUpgrade(w)) return;
  w.xp -= need;
  w.level++;
  rollOffers(w);
  if ((w.offers[0] ?? -1) < 0) return;
  w.choosing = 1;
  w.events[EV_LEVEL] = 1;
}
export function takeXp(w: World, n: number): void {
  w.xp += n;
  beginLevel(w);
}
export function tryPick(w: World, pick: number): boolean {
  if (!w.choosing) return false;
  if (pick < 1 || pick > OFFER_N) return false;
  const id = w.offers[pick - 1] ?? -1;
  if (id < 0) return false;
  applyUpgrade(w, id);
  w.choosing = 0;
  w.offers[0] = -1;
  w.offers[1] = -1;
  w.offers[2] = -1;
  beginLevel(w);
  return true;
}
