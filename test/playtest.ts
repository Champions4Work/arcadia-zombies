import { offerCount } from "../src/sim/characters";
import { MAX_CHESTS } from "../src/sim/chest";
import { offerId, UPG_RARITY } from "../src/sim/progress";
import { step } from "../src/sim/step.hot";
import { EV_SHIELD, UPG_COUNT, type Input, type World } from "../src/sim/types";
import { ultReady } from "../src/sim/ult";
import { createWorld } from "../src/sim/world";
import { countAlive } from "../src/shell/run-log";

export interface MinuteBucket {
  min: number;
  hurt: number;
  kills: number;
  level: number;
  alive: number;
  killMs: number;
  dealt: number;
  dps: number;
  kpm: number;
  hpPct: number;
  blocked: number;
}

export interface PowerCap {
  level: number;
  kpm: number;
  dps: number;
  hpPct: number;
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
const STEP_LIM = 16;

export const POWER_MINUTES = [2, 4, 6, 8] as const;

export const POWER_CEILING: Readonly<Record<number, PowerCap>> = {
  2: { level: 10, kpm: 135, dps: 40, hpPct: 100 },
  4: { level: 16, kpm: 160, dps: 650, hpPct: 100 },
  6: { level: 22, kpm: 900, dps: 35000, hpPct: 100 },
  8: { level: 28, kpm: 640, dps: 56000, hpPct: 100 },
};

const CARD_BIAS: readonly number[] = [
  40, 35, 35, 30, 30, 5, 10, 20, 25, 12, 8, 6, 40, 8, 22, 38,
  60, 60, 55, 60, 60, 60, 55, 55, 60, 55,
  15, 45, 45, 45, 50,
];

export function cardPower(id: number, have: number): number {
  if (id < 0 || id >= UPG_COUNT) return -1;
  const rarity = UPG_RARITY[id] ?? 0;
  const bias = CARD_BIAS[id] ?? 0;
  const fresh = have <= 0 ? 20 : 0;
  return rarity * 100 + bias + fresh;
}

export function bestPick(w: World): number {
  const n = offerCount(w);
  let slot = 1;
  let top = -1;
  for (let i = 0; i < n; i++) {
    const id = offerId(w, i);
    const score = cardPower(id, w.upgrades[id] ?? 0);
    if (score > top) {
      top = score;
      slot = i + 1;
    }
  }
  return slot;
}

function nearestChest(w: World): { dx: number; dy: number } | null {
  let bx = 0;
  let by = 0;
  let bd = 1e18;
  let found = 0;
  for (let i = 0; i < MAX_CHESTS; i++) {
    if (!w.chestOn[i]) continue;
    const dx = (w.chestX[i] ?? 0) - w.px;
    const dy = (w.chestY[i] ?? 0) - w.py;
    const d2 = dx * dx + dy * dy;
    if (d2 < bd) {
      bd = d2;
      bx = dx;
      by = dy;
      found = 1;
    }
  }
  if (!found) return null;
  const d = Math.sqrt(bd) || 1;
  return { dx: bx / d, dy: by / d };
}

export const kite = (w: World): Input => {
  const a = (w.tick / HZ) * 0.9;
  return { dx: Math.cos(a), dy: Math.sin(a), pick: 1, skip: w.chestOpen ? 1 : 0 };
};

export const greedy = (w: World): Input => {
  const pick = w.choosing ? bestPick(w) : 1;
  const ult = ultReady(w) ? 1 : 0;
  const chest = nearestChest(w);
  const skip = w.chestOpen ? 1 : 0;
  if (chest) return { dx: chest.dx, dy: chest.dy, pick, skip, ult };
  const orbit = kite(w);
  return { dx: orbit.dx, dy: orbit.dy, pick, skip, ult };
};

export function bucketAt(run: BotResult, min: number): MinuteBucket | undefined {
  return run.buckets.find((b) => b.min === min);
}

export function powerAt(run: BotResult, min: number): PowerCap | undefined {
  const b = bucketAt(run, min);
  if (!b) return undefined;
  return { level: b.level, kpm: b.kpm, dps: b.dps, hpPct: b.hpPct };
}

export function formatPowerRow(name: string, min: number, cap: PowerCap): string {
  const lv = cap.level.toFixed(1);
  const kpm = cap.kpm.toFixed(1);
  const dps = cap.dps.toFixed(1);
  const hp = cap.hpPct.toFixed(1);
  return `${name}\t${min}\t${lv}\t${kpm}\t${dps}\t${hp}`;
}

export function formatPowerTable(name: string, runs: BotResult[]): string {
  const lines = [`${name}\tmin\tlevel\tkpm\tdps\thpPct`];
  for (const min of POWER_MINUTES) {
    const rows = runs.map((r) => powerAt(r, min)).filter((r): r is PowerCap => !!r);
    if (!rows.length) {
      lines.push(`${name}\t${min}\t-\t-\t-\t-`);
      continue;
    }
    const mid = (key: keyof PowerCap): number => median(rows.map((r) => r[key]));
    lines.push(formatPowerRow(name, min, {
      level: mid("level"),
      kpm: mid("kpm"),
      dps: mid("dps"),
      hpPct: mid("hpPct"),
    }));
  }
  return lines.join("\n");
}

export const median = (xs: number[]): number => {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  return ((s[(s.length - 1) >> 1] ?? 0) + (s[s.length >> 1] ?? 0)) / 2;
};

export function playHeld(seed: number, bot: BotInput, capTicks = HZ * 480): BotResult {
  const w = createWorld(seed);
  const buckets: MinuteBucket[] = [];
  let lastHurt = 0;
  let lastKills = 0;
  let lastDealt = 0;
  let lastTick = 0;
  let lastMin = 0;
  let lastBlocked = 0;
  let blocked = 0;
  let fell = 0;
  for (let n = 0; w.tick < capTicks && n < capTicks * STEP_LIM; n++) {
    step(w, bot(w));
    if (w.events[EV_SHIELD]) blocked++;
    if (w.over) {
      w.over = false;
      w.hp = w.maxHp > 0 ? w.maxHp : 5;
      fell = 1;
    }
    const min = Math.floor(w.tick / MINUTE);
    if (min > lastMin) {
      buckets.push(snapBucket(w, lastTick, lastHurt, lastKills, lastDealt, fell, blocked - lastBlocked));
      lastHurt = w.hurt;
      lastKills = w.kills;
      lastDealt = w.dealt;
      lastTick = w.tick;
      lastMin = min;
      lastBlocked = blocked;
      fell = 0;
    }
  }
  if (w.tick > lastTick) buckets.push(snapBucket(w, lastTick, lastHurt, lastKills, lastDealt, fell, blocked - lastBlocked));
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
  let lastDealt = 0;
  let lastTick = 0;
  let lastMin = 0;
  let lastBlocked = 0;
  let blocked = 0;
  for (let n = 0; !w.over && w.tick < capTicks && n < capTicks * STEP_LIM; n++) {
    step(w, bot(w));
    if (w.events[EV_SHIELD]) blocked++;
    const min = Math.floor(w.tick / MINUTE);
    if (min > lastMin) {
      buckets.push(snapBucket(w, lastTick, lastHurt, lastKills, lastDealt, 0, blocked - lastBlocked));
      lastHurt = w.hurt;
      lastKills = w.kills;
      lastDealt = w.dealt;
      lastTick = w.tick;
      lastMin = min;
      lastBlocked = blocked;
    }
  }
  if (w.tick > lastTick) buckets.push(snapBucket(w, lastTick, lastHurt, lastKills, lastDealt, 0, blocked - lastBlocked));
  return {
    seconds: Math.round(w.tick / HZ),
    kills: w.kills,
    level: w.level,
    died: w.over,
    hurt: w.hurt,
    buckets,
  };
}

function snapBucket(
  w: World,
  lastTick: number,
  lastHurt: number,
  lastKills: number,
  lastDealt: number,
  fell: number,
  blocked: number,
): MinuteBucket {
  const dt = Math.max(1, w.tick - lastTick);
  const sec = dt / HZ;
  const kills = Math.max(0, w.kills - lastKills);
  const dealt = Math.max(0, w.dealt - lastDealt);
  const livePct = w.maxHp > 0 ? (100 * w.hp) / w.maxHp : 0;
  return {
    min: Math.ceil(w.tick / MINUTE),
    hurt: Math.max(0, w.hurt - lastHurt),
    kills,
    level: w.level,
    alive: countAlive(w).alive,
    killMs: kills > 0 ? Math.round((dt * 1000) / (HZ * kills)) : dt * 1000 / HZ,
    dealt,
    dps: dealt / sec,
    kpm: kills * 60 / sec,
    hpPct: fell ? 0 : livePct,
    blocked: blocked < 0 ? 0 : blocked,
  };
}
