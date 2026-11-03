import { bulletDmg, fireEvery } from "./progress";
import {
  UPG_WPN_FLAME, UPG_WPN_HARP, UPG_WPN_MORT, UPG_WPN_RIVET, UPG_WPN_SHOT,
  WPN_FLAME, WPN_HARP, WPN_SHOT, type World,
} from "./types";

export const BOMB_FUSE = 28;

export function rivetEvery(w: World): number {
  const lv = w.upgrades[UPG_WPN_RIVET] ?? 1;
  return Math.max(3, fireEvery(w) - Math.max(0, lv - 1));
}

export function rivetHit(w: World): number {
  const lv = w.upgrades[UPG_WPN_RIVET] ?? 1;
  return bulletDmg(w) + (lv >= 4 ? 1 : 0);
}

export function weaponEvery(kind: number, lv: number): number {
  if (kind === WPN_SHOT) return Math.max(8, 26 - lv * 3);
  if (kind === WPN_FLAME) return Math.max(4, 12 - lv);
  if (kind === WPN_HARP) return Math.max(14, 36 - lv * 4);
  return Math.max(20, 48 - lv * 4);
}

export function pelletCount(lv: number): number {
  return 2 + lv;
}

export function pelletLife(lv: number): number {
  return 12 + lv * 2;
}

export function pelletHit(w: World): number {
  return bulletDmg(w);
}

export function flameJets(lv: number): number {
  return lv;
}

export function flameLife(lv: number): number {
  return 14 + lv * 2;
}

export function harpoonPierce(lv: number): number {
  return lv + 1;
}

export function harpoonDamage(w: World, lv: number): number {
  return bulletDmg(w) + lv;
}

export function mortarRadius(lv: number): number {
  return 26 + lv * 8;
}

export function mortarDamage(w: World, lv: number): number {
  return bulletDmg(w) + lv;
}

export function upgDetail(id: number): string {
  if (id === UPG_WPN_RIVET) return "BRASS BOLTS";
  if (id === UPG_WPN_SHOT) return "CLOSE CONE";
  if (id === UPG_WPN_FLAME) return "BOILER JET";
  if (id === UPG_WPN_HARP) return "PIERCES LINE";
  if (id === UPG_WPN_MORT) return "AREA BLAST";
  return "";
}
