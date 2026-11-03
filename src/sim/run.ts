import { step } from "./step.hot";
import type { Input } from "./types";
import { createWorld } from "./world";
export function simulate(seed: number, inputs: readonly Input[]) {
  const w = createWorld(seed);
  for (const i of inputs) step(w, i);
  return { tick: w.tick, score: w.score, hp: w.hp, wave: w.wave, over: w.over, px: w.px, py: w.py };
}
