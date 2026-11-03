import { step } from "./step.hot";
import type { Input, World } from "./types";
import { createWorld } from "./world";
export function snapshot(w: World) {
  return {
    tick: w.tick, score: w.score, hp: w.hp, maxHp: w.maxHp, wave: w.wave, over: w.over,
    px: w.px, py: w.py, xp: w.xp, level: w.level, choosing: w.choosing, shield: w.shield,
    upgrades: Array.from(w.upgrades), offers: Array.from(w.offers),
  };
}
export function simulate(seed: number, inputs: readonly Input[]) {
  const w = createWorld(seed);
  for (const i of inputs) step(w, i);
  return snapshot(w);
}
