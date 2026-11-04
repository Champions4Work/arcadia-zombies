import { clock, tierName } from "../sim/difficulty";
import { isWon, killCount, lichUp } from "../sim/finale";
import { upgName } from "../sim/progress";
import { UPG_COUNT, type World } from "../sim/types";
import { ACHIEVEMENTS, type Life, type RunRecord } from "./leaderboard";

export const HEAD_FALL = "YOU FELL";
export const HEAD_WIN = "VICTORY";

export interface ResultStat {
  id: string;
  label: string;
  value: string;
  delay: number;
}

export interface ResultCard {
  id: number;
  name: string;
  level: number;
}

export interface ResultBadge {
  id: string;
  name: string;
  detail: string;
  on: boolean;
  progress: string;
}

export interface RunResult {
  won: boolean;
  headline: string;
  cause: string;
  time: string;
  stats: ResultStat[];
  cards: ResultCard[];
  badges: ResultBadge[];
}

export interface ResultInput {
  won: boolean;
  tick: number;
  kills: number;
  level: number;
  gold: number;
  rank: number;
  lich: boolean;
  upgrades: ArrayLike<number>;
  badges?: ResultBadge[];
}

export function readRunResult(input: ResultInput): RunResult {
  const time = clock(input.tick);
  const cause = input.won
    ? "The Clockwork Lich is scrap."
    : input.lich
      ? "The Clockwork Lich ended the run."
      : `Overrun on ${tierName(input.rank)}.`;
  return {
    won: input.won,
    headline: input.won ? HEAD_WIN : HEAD_FALL,
    cause,
    time,
    stats: [
      { id: "time", label: "TIME", value: time, delay: 0 },
      { id: "kills", label: "KILLS", value: String(Math.max(0, input.kills | 0)), delay: 90 },
      { id: "level", label: "LEVEL", value: String(Math.max(1, input.level | 0)), delay: 180 },
      { id: "gold", label: "GOLD", value: String(Math.max(0, input.gold | 0)), delay: 270 },
    ],
    cards: cardsFrom(input.upgrades),
    badges: input.badges ?? [],
  };
}

export function resultFromWorld(w: World, gold: number, badges: ResultBadge[] = []): RunResult {
  return readRunResult({
    won: isWon(w),
    tick: w.tick,
    kills: killCount(w),
    level: w.level,
    gold,
    rank: w.rank,
    lich: lichUp(w),
    upgrades: w.upgrades,
    badges,
  });
}

export function resultBadges(run: RunRecord, life: Life, unlocked: readonly string[]): ResultBadge[] {
  return ACHIEVEMENTS.map((a) => {
    const on = unlocked.includes(a.id) || a.test(run, life);
    return {
      id: a.id,
      name: a.name,
      detail: a.detail,
      on,
      progress: on ? "SEALED" : "OPEN",
    };
  });
}

function cardsFrom(upgrades: ArrayLike<number>): ResultCard[] {
  const cards: ResultCard[] = [];
  const n = Math.min(upgrades.length, UPG_COUNT);
  for (let i = 0; i < n; i++) {
    const level = upgrades[i] ?? 0;
    if (level <= 0) continue;
    const name = upgName(i);
    if (!name) continue;
    cards.push({ id: i, name, level });
  }
  return cards;
}
