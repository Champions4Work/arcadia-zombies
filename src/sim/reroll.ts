import { rollOffers } from "./progress";
import type { World } from "./types";

export const REROLL_X = 150;
export const REROLL_Y = 272;
export const REROLL_W = 180;
export const REROLL_H = 36;

export function rerollHit(x: number, y: number): boolean {
  return x >= REROLL_X && x <= REROLL_X + REROLL_W && y >= REROLL_Y && y <= REROLL_Y + REROLL_H;
}

export function tryReroll(w: World): boolean {
  if (!w.choosing || w.meta.rerollLeft <= 0) return false;
  w.meta.rerollLeft -= 1;
  rollOffers(w);
  return true;
}
