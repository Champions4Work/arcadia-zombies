import { juiceHit } from "../render/juice";
import { eliteChest } from "./chest";
import { tallyKill } from "./finale";
import { foeKillXp, foeScore, Z_ELITE, Z_GAS, Z_KIND } from "./foes";
import { detonateGas } from "./foes.hot";
import { applyScore, cannonHit } from "./modifiers";
import { takeXp } from "./progress";
import {
  EV_KILL, FX_PUFF, FX_SPARK, FX_XP, MAX_FX, UPG_DYNAMO, type World,
} from "./types";

export function emitFx(w: World, kind: number, x: number, y: number, a: number): void {
  const i = w.fxHead;
  w.fxKind[i] = kind;
  w.fxX[i] = x;
  w.fxY[i] = y;
  w.fxA[i] = a;
  w.fxTick[i] = w.tick;
  w.fxHead = i + 1 < MAX_FX ? i + 1 : 0;
}

export function killZombie(w: World, i: number): void {
  const z = w.zombies;
  const raw = z.kind[i] ?? 0;
  const x = z.x[i] ?? 0;
  const y = z.y[i] ?? 0;
  z.alive[i] = 0;
  tallyKill(w);
  w.score += applyScore(foeScore(raw, w.wave, w.rank), w.mods);
  w.kills += 1;
  w.events[EV_KILL] = (w.events[EV_KILL] ?? 0) + 1;
  emitFx(w, FX_PUFF, x, y, raw & Z_KIND);
  const xp = foeKillXp(raw, w.rank);
  emitFx(w, FX_XP, x, y - 8, xp);
  const dyn = w.upgrades[UPG_DYNAMO] ?? 0;
  if (dyn > 0) w.fireCd = Math.max(0, w.fireCd - dyn * 3);
  takeXp(w, xp);
  eliteChest(w, raw, x, y);
  if ((raw & Z_KIND) === Z_GAS) detonateGas(w, x, y, (raw & Z_ELITE) !== 0 ? 1 : 0);
}

export function hurtZombie(w: World, i: number, dmg: number): void {
  const hit = cannonHit(dmg, w.mods);
  const z = w.zombies;
  z.hp[i] = (z.hp[i] ?? 1) - hit;
  emitFx(w, FX_SPARK, z.x[i] ?? 0, z.y[i] ?? 0, 0);
  const killed = (z.hp[i] ?? 0) <= 0;
  if (killed) killZombie(w, i);
  juiceHit(i, z.x[i] ?? 0, z.y[i] ?? 0, hit, z.kind[i] ?? 0, killed, w.tick);
}
