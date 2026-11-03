import { step } from "../src/sim/step.hot";
import type { Input, World } from "../src/sim/types";
import { createWorld } from "../src/sim/world";

export interface BotResult { seconds: number; kills: number; level: number; died: boolean }

const HZ = 60;
const CAP = HZ * 600;

const kite = (w: World): Input => {
  const a = (w.tick / HZ) * 0.9;
  return { dx: Math.cos(a), dy: Math.sin(a), pick: 1, skip: w.chestOpen ? 1 : 0 };
};

export function playBot(seed: number, capTicks = CAP): BotResult {
  const w = createWorld(seed);
  for (let n = 0; !w.over && w.tick < capTicks && n < capTicks * 2; n++) step(w, kite(w));
  return { seconds: Math.round(w.tick / HZ), kills: w.kills, level: w.level, died: w.over };
}
