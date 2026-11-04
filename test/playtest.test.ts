import { CURVE, hpScale, MIDGAME, spawnEvery, tierAt, tickAtMinute } from "../src/sim/difficulty";
import { PHONE_PRESSURE } from "../src/sim/director";
import { stackRank, UPG_RARITY, xpNeed } from "../src/sim/progress";
import { MAX_ZOMBIES, UPG_HP, UPG_TESLA, UPG_WPN_FLAME, UPG_WPN_RIVET, Z_SHAMBLER } from "../src/sim/types";
import { createWorld } from "../src/sim/world";
import { glyphCell, juiceHit, lastNumberCrit, numberScale, resetJuice } from "../src/render/juice";
import { WPN_TAGS } from "../src/render/weapons";
import { Z_ELITE } from "../src/sim/foes";
import { PHASE_PLAY, PHASE_TITLE } from "../src/shell/session";
import { showMenuChrome } from "../src/shell/play-chrome";
import { aggressive } from "./aggressive";
import {
  bestPick, cardPower, formatPowerTable, greedy, kite, playBot, playHeld, POWER_CEILING,
  POWER_MINUTES, powerAt, type BotResult,
} from "./playtest";
import { MAX_CHESTS } from "../src/sim/chest";

const SEEDS = [1, 2, 3, 4, 5, 6, 7, 8];
const SURVIVE_BAND = { min: 45, max: 480 };
const KITE_BAND = { min: 60, max: 480 };
const MIN_MEDIAN_KILLS = 40;
const MAX_MEDIAN_KILLS = 1800;
const MID_START_HP = { min: 900, max: 3600 };
const MID_END_HP = { min: 4000, max: 40000 };
const LEVEL_AT_4 = { min: 2, max: 14 };
const HURT_AFTER_2 = PHONE_PRESSURE.midHurtMin;
const LATE_HURT = 2;
const KILL_MS = { min: 40, max: 8000 };

const median = (xs: number[]): number => {
  const s = [...xs].sort((a, b) => a - b);
  return ((s[(s.length - 1) >> 1] ?? 0) + (s[s.length >> 1] ?? 0)) / 2;
};

const summarize = (name: string, runs: BotResult[]): { secs: number; kills: number; level: number; hurt: number } => {
  const secs = median(runs.map((r) => r.seconds));
  const kills = median(runs.map((r) => r.kills));
  const level = median(runs.map((r) => r.level));
  const hurt = median(runs.map((r) => r.hurt));
  console.log(`playtest ${name}: median survival ${secs}s, median kills ${kills}, median lv ${level}, median hurt ${hurt}, deaths ${runs.filter((r) => r.died).length}/${runs.length}`);
  return { secs, kills, level, hurt };
};

describe("headless bot playtest", () => {
  const kiteRuns = SEEDS.map((s) => playBot(s, kite));
  const agrRuns = SEEDS.map((s) => playBot(s, aggressive));
  const greedRuns = SEEDS.map((s) => playBot(s, greedy));
  const kiteSum = summarize("kiting", kiteRuns);
  const agrSum = summarize("aggressive", agrRuns);
  const greedSum = summarize("greedy", greedRuns);
  const allRuns = [...kiteRuns, ...agrRuns, ...greedRuns];
  const heldByBot = {
    kite: SEEDS.map((s) => playHeld(s, kite, 60 * 480)),
    aggressive: SEEDS.map((s) => playHeld(s, aggressive, 60 * 480)),
    greedy: SEEDS.map((s) => playHeld(s, greedy, 60 * 480)),
  };
  console.log(formatPowerTable("kite", heldByBot.kite));
  console.log(formatPowerTable("aggressive", heldByBot.aggressive));
  console.log(formatPowerTable("greedy", heldByBot.greedy));

  it("kiting bot survival stays in the target difficulty band", () => {
    expect(kiteSum.secs).toBeGreaterThanOrEqual(KITE_BAND.min);
    expect(kiteSum.secs).toBeLessThanOrEqual(KITE_BAND.max);
  });

  it("kiting bot gets enough kills to feel powerful", () => {
    expect(kiteSum.kills).toBeGreaterThanOrEqual(MIN_MEDIAN_KILLS);
    expect(kiteSum.kills).toBeLessThanOrEqual(MAX_MEDIAN_KILLS);
  });

  it("aggressive bot survival stays in the target difficulty band", () => {
    expect(agrSum.secs).toBeGreaterThanOrEqual(SURVIVE_BAND.min);
    expect(agrSum.secs).toBeLessThanOrEqual(SURVIVE_BAND.max);
  });

  it("aggressive bot gets enough kills to feel powerful", () => {
    expect(agrSum.kills).toBeGreaterThanOrEqual(MIN_MEDIAN_KILLS);
    expect(agrSum.kills).toBeLessThanOrEqual(MAX_MEDIAN_KILLS);
  });

  it("greedy bot survival stays in the target difficulty band", () => {
    expect(greedSum.secs).toBeGreaterThanOrEqual(SURVIVE_BAND.min);
    expect(greedSum.secs).toBeLessThanOrEqual(SURVIVE_BAND.max);
  });

  it("greedy bot gets enough kills to feel powerful", () => {
    expect(greedSum.kills).toBeGreaterThanOrEqual(MIN_MEDIAN_KILLS);
    expect(greedSum.kills).toBeLessThanOrEqual(MAX_MEDIAN_KILLS);
  });

  it("the game is not trivially endless for a simple bot", () => {
    expect(kiteRuns.some((r) => r.died)).toBe(true);
    expect(agrRuns.some((r) => r.died)).toBe(true);
    expect(greedRuns.some((r) => r.died)).toBe(true);
  });

  it("the friendly open stays reachable and a simple kite is not usually endless", () => {
    expect(kiteRuns.some((r) => r.seconds >= 90)).toBe(true);
    expect(allRuns.filter((r) => r.seconds > MIDGAME.endMin * 60).length).toBeLessThanOrEqual(2);
    expect(kiteSum.secs).toBeLessThanOrEqual(KITE_BAND.max);
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

  it("level at 4:00 stays in a sane band", () => {
    const held = [1, 2, 3].map((s) => playHeld(s, aggressive, 60 * 240));
    const atFour = held.map((r) => r.buckets.find((b) => b.min === 4) ?? { level: r.level });
    expect(atFour.length).toBeGreaterThan(0);
    for (const row of atFour) {
      expect(row.level).toBeGreaterThanOrEqual(LEVEL_AT_4.min);
      expect(row.level).toBeLessThanOrEqual(LEVEL_AT_4.max);
    }
    expect(xpNeed(20)).toBeGreaterThan(xpNeed(4) * 3);
    expect(stackRank(5)).toBeLessThan(5);
  });

  it("pressure keeps pace in every lived minute after the friendly open", () => {
    const held = [1, 2].map((s) => playHeld(s, aggressive, 60 * 360));
    for (const run of held) {
      for (const bucket of run.buckets) {
        if (bucket.min <= 2) continue;
        expect(bucket.hurt + bucket.blocked).toBeGreaterThanOrEqual(HURT_AFTER_2);
        expect(bucket.killMs).toBeGreaterThanOrEqual(KILL_MS.min);
        expect(bucket.killMs).toBeLessThanOrEqual(KILL_MS.max);
      }
    }
  });

  it("the strong bot still takes meaningful damage late", () => {
    const lateHurt = SEEDS.some((s) => {
      const held = playHeld(s, aggressive, 60 * 480);
      const late = held.buckets.filter((b) => b.min >= 4);
      return late.some((b) => b.hurt >= LATE_HURT);
    });
    expect(lateHurt).toBe(true);
    expect(agrSum.hurt).toBeGreaterThan(0);
  });

  it("power stays under the ceiling at 2 4 6 and 8 minutes for every bot", () => {
    for (const [name, runs] of Object.entries(heldByBot)) {
      for (const min of POWER_MINUTES) {
        const cap = POWER_CEILING[min];
        const rows = runs.map((r) => powerAt(r, min)).filter((r): r is NonNullable<typeof r> => !!r);
        expect(cap, `${name} missing ceiling at ${min}`).toBeTruthy();
        expect(rows.length, `${name} missing sample at ${min}`).toBe(runs.length);
        if (!cap || !rows.length) continue;
        const mid = (key: "level" | "kpm" | "dps" | "hpPct"): number => median(rows.map((r) => r[key]));
        expect(mid("level"), `${name} median level at ${min}m`).toBeLessThanOrEqual(cap.level);
        expect(mid("kpm"), `${name} median kpm at ${min}m`).toBeLessThanOrEqual(cap.kpm);
        expect(mid("dps"), `${name} median dps at ${min}m`).toBeLessThanOrEqual(cap.dps);
        expect(mid("hpPct"), `${name} median hp at ${min}m`).toBeLessThanOrEqual(cap.hpPct);
        for (const row of rows) {
          expect(row.level, `${name} level at ${min}m`).toBeLessThanOrEqual(cap.level);
        }
      }
    }
  });
});

describe("greedy bot", () => {
  it("picks the strongest offer instead of card 1", () => {
    const w = createWorld(1);
    w.choosing = 1;
    w.offers[0] = UPG_HP;
    w.offers[1] = UPG_TESLA;
    expect(cardPower(UPG_TESLA, 0)).toBeGreaterThan(cardPower(UPG_HP, 0));
    expect(UPG_RARITY[UPG_TESLA]).toBeGreaterThan(UPG_RARITY[UPG_HP] ?? 0);
    expect(bestPick(w)).toBe(2);
    const input = greedy(w);
    expect(input.pick).toBe(2);
    expect(input.skip).toBe(0);
  });

  it("walks to a dropped chest and does not skip the reveal", () => {
    const w = createWorld(1);
    w.toSpawn = 0;
    for (let i = 0; i < MAX_CHESTS; i++) w.chestOn[i] = 0;
    w.chestOn[0] = 1;
    w.chestX[0] = w.px + 80;
    w.chestY[0] = w.py;
    const input = greedy(w);
    expect(input.dx).toBeGreaterThan(0.9);
    expect(Math.abs(input.dy ?? 0)).toBeLessThan(0.1);
    expect(input.skip).toBe(0);
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

describe("owner screenshot bugs", () => {
  it("starts rivet unlocked and flame locked until picked", () => {
    const w = createWorld(1);
    expect(w.upgrades[UPG_WPN_RIVET]).toBe(1);
    expect(w.upgrades[UPG_WPN_FLAME]).toBe(0);
    expect(WPN_TAGS).toEqual(["RIVET", "SHOT", "FLAME", "HARP", "MORT"]);
    for (const tag of WPN_TAGS) expect(tag.length).toBeLessThanOrEqual(5);
  });

  it("keeps damage glyphs small and not crit on ordinary hits", () => {
    resetJuice();
    juiceHit(0, 10, 10, 9, Z_SHAMBLER, false, 1);
    expect(lastNumberCrit()).toBe(0);
    expect(numberScale(0)).toBe(1);
    expect(glyphCell()).toBeLessThanOrEqual(2);
    expect(glyphCell() * 5).toBeLessThanOrEqual(10);
    juiceHit(1, 10, 10, 9, Z_SHAMBLER, true, 1);
    expect(lastNumberCrit()).toBe(0);
    expect(numberScale(1)).toBe(1);
    juiceHit(2, 10, 10, 2, Z_SHAMBLER | Z_ELITE, true, 2);
    expect(lastNumberCrit()).toBe(1);
    expect(numberScale(2)).toBe(1);
  });

  it("hides menu sliders while a run is live", () => {
    expect(showMenuChrome(PHASE_PLAY)).toBe(false);
    expect(showMenuChrome(PHASE_TITLE)).toBe(true);
  });
});
