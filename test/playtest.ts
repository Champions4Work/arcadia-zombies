import { countAlive } from "../src/shell/run-log";
import { step } from "../src/sim/step.hot";
import type { Input, World } from "../src/sim/types";
import { createWorld } from "../src/sim/world";

export interface MinuteBucket {
  min: number;
  hurt: number;
  kills: number;
  level: number;
  alive: number;
  killMs: number;
}

export interface BotResult {
  seconds: number;
  kills: number;
  level: number;
  died: boolean;
  hurt: number;
  buckets: MinuteBucket[];
}
export type BotInput = (w: World) => Input;

const HZ = 60;
const CAP = HZ * 600;
const MINUTE = HZ * 60;

export const kite = (w: World): Input => {
  const a = (w.tick / HZ) * 0.9;
  return { dx: Math.cos(a), dy: Math.sin(a), pick: 1, skip: w.chestOpen ? 1 : 0 };
};

export function playHeld(seed: number, bot: BotInput, capTicks = HZ * 480): BotResult {
  const w = createWorld(seed);
  const buckets: MinuteBucket[] = [];
  let lastHurt = 0;
  let lastKills = 0;
  let lastTick = 0;
  let lastMin = 0;
  for (let n = 0; w.tick < capTicks && n < capTicks * 2; n++) {
    step(w, bot(w));
    if (w.over) {
      w.over = false;
      w.hp = w.maxHp > 0 ? w.maxHp : 5;
    }
    const min = Math.floor(w.tick / MINUTE);
    if (min > lastMin) {
      buckets.push(snapBucket(w, lastTick, lastHurt, lastKills));
      lastHurt = w.hurt;
      lastKills = w.kills;
      lastTick = w.tick;
      lastMin = min;
    }
  }
  if (w.tick > lastTick) buckets.push(snapBucket(w, lastTick, lastHurt, lastKills));
  return {
    seconds: Math.round(w.tick / HZ),
    kills: w.kills,
    level: w.level,
    died: false,
    hurt: w.hurt,
    buckets,
  };
}

export function playBot(seed: number, bot: BotInput, capTicks = CAP): BotResult {
  const w = createWorld(seed);
  const buckets: MinuteBucket[] = [];
  let lastHurt = 0;
  let lastKills = 0;
  let lastTick = 0;
  let lastMin = 0;
  for (let n = 0; !w.over && w.tick < capTicks && n < capTicks * 2; n++) {
    step(w, bot(w));
    const min = Math.floor(w.tick / MINUTE);
    if (min > lastMin) {
      buckets.push(snapBucket(w, lastTick, lastHurt, lastKills));
      lastHurt = w.hurt;
      lastKills = w.kills;
      lastTick = w.tick;
      lastMin = min;
    }
  }
  if (w.tick > lastTick) buckets.push(snapBucket(w, lastTick, lastHurt, lastKills));
  return {
    seconds: Math.round(w.tick / HZ),
    kills: w.kills,
    level: w.level,
    died: w.over,
    hurt: w.hurt,
    buckets,
  };
}

function snapBucket(w: World, lastTick: number, lastHurt: number, lastKills: number): MinuteBucket {
  const dt = Math.max(1, w.tick - lastTick);
  const kills = Math.max(0, w.kills - lastKills);
  return {
    min: Math.ceil(w.tick / MINUTE),
    hurt: Math.max(0, w.hurt - lastHurt),
    kills,
    level: w.level,
    alive: countAlive(w).alive,
    killMs: kills > 0 ? Math.round((dt * 1000) / (HZ * kills)) : dt * 1000 / HZ,
  };
}
