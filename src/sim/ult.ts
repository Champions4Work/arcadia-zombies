import { hurtBoss } from "./boss.hot";
import { hurtZombie } from "./combat.hot";
import { EV_BOOM, MAX_ZOMBIES, type World } from "./types";

export const ULT_NEED = 40;
export const ULT_PER_MIN = 22;
export const ULT_CD = 12 * 60;
export const ULT_DMG = 4;
export const ULT_BLAST = 22;
export const ULT_KEY = "f";
const HZ_MIN = 60 * 60;

export function ultNeed(tick: number): number {
  const min = Math.max(0, tick) / HZ_MIN;
  return ULT_NEED + ((min | 0) * ULT_PER_MIN);
}

function needOf(w: World): number {
  return ultNeed(w.tick ?? 0);
}

export function ultFill(w: World): number {
  const n = w.ult ?? 0;
  const need = needOf(w);
  if (n <= 0 || need <= 0) return 0;
  if (n >= need) return 1;
  return n / need;
}

export function ultReady(w: World): boolean {
  return (w.ult ?? 0) >= needOf(w) && (w.ultBlast ?? 0) <= 0 && (w.ultCd ?? 0) <= 0;
}

export function chargeUlt(w: World, n: number): void {
  if (n <= 0 || (w.ultBlast ?? 0) > 0 || (w.ultCd ?? 0) > 0) return;
  const cap = needOf(w);
  const next = (w.ult ?? 0) + n;
  w.ult = next > cap ? cap : next;
}

export function fireUlt(w: World): boolean {
  if (!ultReady(w)) return false;
  w.ult = 0;
  w.ultBlast = ULT_BLAST;
  w.ultCd = ULT_CD;
  w.events[EV_BOOM] = 1;
  const z = w.zombies;
  for (let i = 0; i < MAX_ZOMBIES; i++) {
    if (!z.alive[i]) continue;
    hurtZombie(w, i, ULT_DMG);
    if (w.over) return true;
  }
  if (w.boss.on) hurtBoss(w, ULT_DMG);
  return true;
}

export function tryUlt(w: World, fired: number): boolean {
  if (fired <= 0) return false;
  return fireUlt(w);
}

export function stepUlt(w: World): void {
  if ((w.ultBlast ?? 0) > 0) w.ultBlast--;
  if ((w.ultCd ?? 0) > 0) w.ultCd--;
}
