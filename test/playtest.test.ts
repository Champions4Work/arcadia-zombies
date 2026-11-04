import { CURVE, hpScale, MIDGAME, spawnEvery, tierAt, tickAtMinute } from "../src/sim/difficulty";
import { MAX_ZOMBIES } from "../src/sim/types";
import { createWorld } from "../src/sim/world";
import { aggressive } from "./aggressive";
import { kite, playBot, type BotResult } from "./playtest";

const SEEDS = [1, 2, 3, 4, 5, 6, 7, 8];
const SURVIVE_BAND = { min: 60, max: 420 };
const MIN_MEDIAN_KILLS = 40;
const MID_START_HP = { min: 900, max: 2200 };
const MID_END_HP = { min: 4000, max: 10000 };

const median = (xs: number[]): number => {
  const s = [...xs].sort((a, b) => a - b);
  return ((s[(s.length - 1) >> 1] ?? 0) + (s[s.length >> 1] ?? 0)) / 2;
};

const summarize = (name: string, runs: BotResult[]): { secs: number; kills: number } => {
  const secs = median(runs.map((r) => r.seconds));
  const kills = median(runs.map((r) => r.kills));
  console.log(`playtest ${name}: median survival ${secs}s, median kills ${kills}, deaths ${runs.filter((r) => r.died).length}/${runs.length}`);
  return { secs, kills };
};

describe("headless bot playtest", () => {
  const kiteRuns = SEEDS.map((s) => playBot(s, kite));
  const agrRuns = SEEDS.map((s) => playBot(s, aggressive));
  const kiteSum = summarize("kiting", kiteRuns);
  const agrSum = summarize("aggressive", agrRuns);
  const allRuns = [...kiteRuns, ...agrRuns];

  it("kiting bot survival stays in the target difficulty band", () => {
    expect(kiteSum.secs).toBeGreaterThanOrEqual(SURVIVE_BAND.min);
    expect(kiteSum.secs).toBeLessThanOrEqual(SURVIVE_BAND.max);
  });

  it("kiting bot gets enough kills to feel powerful", () => {
    expect(kiteSum.kills).toBeGreaterThanOrEqual(MIN_MEDIAN_KILLS);
  });

  it("aggressive bot survival stays in the target difficulty band", () => {
    expect(agrSum.secs).toBeGreaterThanOrEqual(SURVIVE_BAND.min);
    expect(agrSum.secs).toBeLessThanOrEqual(SURVIVE_BAND.max);
  });

  it("aggressive bot gets enough kills to feel powerful", () => {
    expect(agrSum.kills).toBeGreaterThanOrEqual(MIN_MEDIAN_KILLS);
  });

  it("the game is not trivially endless for a simple bot", () => {
    expect(kiteRuns.some((r) => r.died)).toBe(true);
    expect(agrRuns.some((r) => r.died)).toBe(true);
  });

  it("minutes 3-8 stay reachable and a simple kite is not usually endless", () => {
    const start = MIDGAME.startMin * 60;
    const end = MIDGAME.endMin * 60;
    expect(kiteRuns.some((r) => r.seconds >= start)).toBe(true);
    expect(allRuns.filter((r) => r.seconds > end).length).toBeLessThanOrEqual(1);
    expect(kiteSum.secs).toBeLessThanOrEqual(SURVIVE_BAND.max);
  });

  it("minutes 3-8 keep foe HP in a human-fair band", () => {
    expect(MIDGAME.startMin).toBe(3);
    expect(MIDGAME.endMin).toBe(8);
    const startHp = hpScale(tierAt(tickAtMinute(MIDGAME.startMin)));
    const endHp = hpScale(tierAt(tickAtMinute(MIDGAME.endMin)));
    expect(startHp).toBeGreaterThanOrEqual(MID_START_HP.min);
    expect(startHp).toBeLessThanOrEqual(MID_START_HP.max);
    expect(endHp).toBeGreaterThanOrEqual(MID_END_HP.min);
    expect(endHp).toBeLessThanOrEqual(MID_END_HP.max);
    expect(endHp).toBeGreaterThan(startHp);
    expect(spawnEvery(tierAt(tickAtMinute(MIDGAME.startMin)))).toBe(CURVE.spawnMin);
  });
});

describe("aggressive bot", () => {
  it("walks toward the nearest living foe", () => {
    const w = createWorld(1);
    w.toSpawn = 0;
    w.zombies.alive[0] = 1;
    w.zombies.x[0] = w.px + 80;
    w.zombies.y[0] = w.py;
    const input = aggressive(w);
    expect(input.dx).toBeGreaterThan(0.9);
    expect(Math.abs(input.dy ?? 0)).toBeLessThan(0.1);
    expect(input.pick).toBe(1);
  });

  it("walks toward the boss when no zombies are up", () => {
    const w = createWorld(1);
    w.toSpawn = 0;
    for (let i = 0; i < MAX_ZOMBIES; i++) w.zombies.alive[i] = 0;
    w.boss.on = 1;
    w.boss.x = w.px;
    w.boss.y = w.py - 60;
    const input = aggressive(w);
    expect(input.dy).toBeLessThan(-0.9);
    expect(Math.abs(input.dx ?? 0)).toBeLessThan(0.1);
  });
});
