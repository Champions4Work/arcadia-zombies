import {
  MOD_DOUBLE,
  MOD_FAST,
  MOD_GEAR,
  MOD_GLASS,
  MOD_NOHEAL,
  clampMods,
  modNames,
} from "../sim/modifiers";

export const CHALLENGE_HEADING = "Daily Challenge";

const PACKS: readonly number[] = [
  0,
  MOD_FAST,
  MOD_DOUBLE,
  MOD_GLASS,
  MOD_NOHEAL,
  MOD_GEAR,
  MOD_DOUBLE | MOD_FAST,
  MOD_GLASS | MOD_NOHEAL,
  MOD_GEAR | MOD_DOUBLE,
  MOD_FAST | MOD_NOHEAL,
];

export interface Challenge {
  day: string;
  seed: number;
  mods: number;
}

export function utcDayKey(date: Date): string {
  if (!Number.isFinite(date.getTime())) return "1970-01-01";
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + 1;
  const d = date.getUTCDate();
  return `${y}-${m < 10 ? "0" : ""}${m}-${d < 10 ? "0" : ""}${d}`;
}

function mixDay(day: string): number {
  let hash = 2166136261;
  for (let i = 0; i < day.length; i++) {
    hash ^= day.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

const ARENA_SALT = 0x51ed0b;
const SEED_BUMP = 0x9e3779b9;

export function challengeForDay(day: string): Challenge {
  const hash = mixDay(day);
  let seed = hash >>> 0;
  if (seed === 0 || seed === ARENA_SALT) seed = (seed ^ SEED_BUMP) >>> 0;
  if (seed === 0) seed = 1;
  const pack = PACKS[hash % PACKS.length] ?? 0;
  return { day, seed, mods: clampMods(pack) };
}

export function challengeAt(date: Date): Challenge {
  return challengeForDay(utcDayKey(date));
}

export function seedLabel(seed: number): string {
  const hex = (seed >>> 0).toString(16).toUpperCase().padStart(8, "0");
  return `SEED ${hex}`;
}

export function challengeBlurb(c: Challenge): string {
  const names = modNames(c.mods);
  const tail = names ? ` · ${names}` : "";
  return `${CHALLENGE_HEADING}\n${c.day} · ${seedLabel(c.seed)}${tail}`;
}
