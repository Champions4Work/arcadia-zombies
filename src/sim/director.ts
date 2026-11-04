import { CURVE } from "./difficulty";
import {
  UPG_DMG, UPG_FIRE, UPG_MORTAR, UPG_SAWS, UPG_SHOTGUN, UPG_TESLA, UPG_VENT,
  UPG_WPN_FLAME, UPG_WPN_HARP, UPG_WPN_MORT, UPG_WPN_SHOT, type World,
} from "./types";

export const FRIENDLY_TICK = 7200;
const HZ = 60;
const PCT_CAP = 640;
const PACK_CAP = 10;
const FLOOR_CAP = 20;
const ELITE_CAP = 90;

export function playerPower(w: World): number {
  return w.level
    + (w.upgrades[UPG_DMG] ?? 0)
    + (w.upgrades[UPG_FIRE] ?? 0)
    + (w.upgrades[UPG_SAWS] ?? 0)
    + (w.upgrades[UPG_TESLA] ?? 0)
    + (w.upgrades[UPG_SHOTGUN] ?? 0)
    + (w.upgrades[UPG_VENT] ?? 0)
    + (w.upgrades[UPG_MORTAR] ?? 0)
    + (w.upgrades[UPG_WPN_SHOT] ?? 0)
    + (w.upgrades[UPG_WPN_FLAME] ?? 0)
    + (w.upgrades[UPG_WPN_HARP] ?? 0)
    + (w.upgrades[UPG_WPN_MORT] ?? 0);
}

export function expectedPower(tick: number): number {
  const min = tick / (HZ * 60);
  return 2 + ((min * 2) | 0);
}

export function threatPct(w: World): number {
  if (w.tick < FRIENDLY_TICK) return 100;
  const min = w.tick / (HZ * 60);
  const over = playerPower(w) - expectedPower(w.tick);
  const extra = over > 0 ? over * 24 : 0;
  const time = ((min - 2) * 16) | 0;
  const n = 100 + time + extra;
  return n > PCT_CAP ? PCT_CAP : n;
}

export function scaleThreat(base: number, w: World): number {
  const pct = threatPct(w);
  if (pct === 100) return base;
  return Math.max(1, Math.round(base * pct / 100));
}

export function scaleSpeed(base: number, w: World): number {
  const pct = threatPct(w);
  if (pct === 100) return base;
  return base * pct / 100;
}

export function directorPack(w: World): number {
  if (w.tick < FRIENDLY_TICK) return 0;
  const over = playerPower(w) - expectedPower(w.tick);
  const min = (w.tick / (HZ * 60)) | 0;
  const n = (min - 2) + (over > 0 ? over >> 2 : 0);
  return n > PACK_CAP ? PACK_CAP : n;
}

export function directorFloor(w: World): number {
  if (w.tick < FRIENDLY_TICK) return 0;
  const min = (w.tick / (HZ * 60)) | 0;
  const over = playerPower(w) - expectedPower(w.tick);
  const n = 5 + min + (over > 0 ? over >> 1 : 0);
  return n > FLOOR_CAP ? FLOOR_CAP : n;
}

export function directorSpawn(base: number, w: World): number {
  if (w.tick < FRIENDLY_TICK) return base;
  const n = base - Math.min(4, directorPack(w));
  return n < CURVE.spawnMin ? CURVE.spawnMin : n;
}

export function directorElite(w: World): number {
  if (w.tick < FRIENDLY_TICK) return 0;
  const over = playerPower(w) - expectedPower(w.tick);
  const min = (w.tick / (HZ * 60)) | 0;
  const n = (min - 2) * 10 + (over > 0 ? over * 6 : 0);
  return n > ELITE_CAP ? ELITE_CAP : n;
}
