import { hurtBoss } from "./boss.hot";
import { hurtZombie } from "./combat.hot";
import { EV_BOOM, MAX_ZOMBIES, type World } from "./types";

export const ULT_NEED = 20;
export const ULT_DMG = 8;
export const ULT_BLAST = 22;
export const ULT_KEY = "f";

export function ultFill(w: World): number {
  const n = w.ult ?? 0;
  if (n <= 0) return 0;
  if (n >= ULT_NEED) return 1;
  return n / ULT_NEED;
}

export function ultReady(w: World): boolean {
  return (w.ult ?? 0) >= ULT_NEED && (w.ultBlast ?? 0) <= 0;
}

export function chargeUlt(w: World, n: number): void {
  if (n <= 0 || (w.ultBlast ?? 0) > 0) return;
  const next = (w.ult ?? 0) + n;
  w.ult = next > ULT_NEED ? ULT_NEED : next;
}

export function fireUlt(w: World): boolean {
  if (!ultReady(w)) return false;
  w.ult = 0;
  w.ultBlast = ULT_BLAST;
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
}
