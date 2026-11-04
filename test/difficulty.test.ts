import {
  clock, CURVE, dmgScale, hpScale, killXp, MIDGAME, mixWeight, rarityWeight, scaledDmg, scaledHp, scoreMul,
  spawnEvery, speedScale, tickAtMinute, tierAt, tierFrac, tierName,
} from "../src/sim/difficulty";
import { step } from "../src/sim/step.hot";
import { EV_RANK, MAX_ZOMBIES, Z_BRUTE, Z_GHOUL, Z_SHAMBLER } from "../src/sim/types";
import { createWorld } from "../src/sim/world";

const idle = { dx: 0, dy: 0, pick: 0 };

describe("difficulty ranks", () => {
  it("changes tier on exact 30s boundaries", () => {
    expect(CURVE.ticks).toBe(1800);
    expect(tierAt(0)).toBe(0);
    expect(tierAt(1799)).toBe(0);
    expect(tierAt(1800)).toBe(1);
    expect(tierAt(3599)).toBe(1);
    expect(tierAt(3600)).toBe(2);
    expect(tierFrac(0)).toBe(0);
    expect(tierFrac(900)).toBeCloseTo(0.5);
    expect(tierFrac(1800)).toBe(1);
    expect(tierFrac(1801)).toBeCloseTo(1 / 1800);
    expect(tierName(0)).toBe("CALM");
    expect(tierName(1)).toBe("SIMMERING");
    expect(tierName(2)).toBe("STEAMING");
    expect(tierName(3)).toBe("BOILING");
    expect(tierName(4)).toBe("OVERPRESSURE");
    expect(tierName(5)).toBe("MELTDOWN");
    expect(tierName(6)).toBe("CLOCKWORK APOCALYPSE");
    expect(tierName(7)).toBe("ASH CROWN");
    expect(tierName(20)).toMatch(/^EPOCH /);
    expect(clock(0)).toBe("0:00");
    expect(clock(1800)).toBe("0:30");
    expect(clock(3600)).toBe("1:00");
    expect(MIDGAME.startMin).toBe(3);
    expect(MIDGAME.endMin).toBe(8);
    expect(tickAtMinute(MIDGAME.startMin)).toBe(3 * 60 * 60);
    expect(tickAtMinute(MIDGAME.endMin)).toBe(8 * 60 * 60);
    expect(tierAt(tickAtMinute(MIDGAME.startMin))).toBe(6);
    expect(tierAt(tickAtMinute(MIDGAME.endMin))).toBe(16);
  });
  it("ranks the live run up at the boundary and raises a banner", () => {
    const w = createWorld(1);
    w.hp = 9999;
    w.maxHp = 9999;
    w.fireCd = 999999;
    for (let i = 0; i < MAX_ZOMBIES; i++) {
      w.zombies.alive[i] = 1;
      w.zombies.x[i] = -80;
      w.zombies.y[i] = -80;
      w.zombies.vx[i] = 0;
      w.zombies.hp[i] = 9999;
    }
    for (let t = 0; t < 1799; t++) step(w, idle);
    expect(w.tick).toBe(1799);
    expect(w.rank).toBe(0);
    expect(w.events[EV_RANK]).toBe(0);
    expect(tierName(w.rank)).toBe("CALM");
    step(w, idle);
    expect(w.tick).toBe(1800);
    expect(w.rank).toBe(1);
    expect(w.events[EV_RANK]).toBe(1);
    expect(w.banner).toBeGreaterThan(0);
    expect(w.rankFlash).toBeGreaterThan(0);
    expect(tierName(w.rank)).toBe("SIMMERING");
    for (let t = 0; t < 1799; t++) step(w, idle);
    expect(w.tick).toBe(3599);
    expect(w.rank).toBe(1);
    step(w, idle);
    expect(w.tick).toBe(3600);
    expect(w.rank).toBe(2);
    expect(w.events[EV_RANK]).toBe(1);
    expect(tierName(w.rank)).toBe("STEAMING");
  });
  it("scales spawn rate, hp, damage, speed, xp, and the zombie mix from one table", () => {
    expect(spawnEvery(0)).toBe(CURVE.spawnBase);
    expect(spawnEvery(4)).toBe(CURVE.spawnBase - 4 * CURVE.spawnPer);
    expect(spawnEvery(30)).toBe(CURVE.spawnMin);
    expect(spawnEvery(4)).toBeLessThan(spawnEvery(0));
    expect(hpScale(4)).toBe(CURVE.hpNum + 4 * CURVE.hpPer + 16 * CURVE.hpQuad);
    expect(scaledHp(1, 0)).toBe(1);
    expect(scaledHp(3, 0)).toBe(3);
    expect(scaledHp(1, 4)).toBe(Math.max(1, Math.round(hpScale(4) / 100)));
    expect(scaledHp(3, 4)).toBe(Math.max(1, Math.round(3 * hpScale(4) / 100)));
    expect(dmgScale(0)).toBe(CURVE.dmgNum);
    expect(scaledDmg(1, 0)).toBe(1);
    expect(scaledDmg(2, 0)).toBe(2);
    expect(scaledDmg(2, 4)).toBeGreaterThan(scaledDmg(2, 0));
    expect(speedScale(4)).toBeGreaterThan(speedScale(0));
    expect(killXp(Z_SHAMBLER, 0)).toBe(1);
    expect(killXp(Z_GHOUL, 0)).toBeGreaterThan(killXp(Z_SHAMBLER, 0));
    expect(killXp(Z_BRUTE, 0)).toBeGreaterThan(killXp(Z_GHOUL, 0));
    expect(killXp(Z_SHAMBLER, 4)).toBe(killXp(Z_SHAMBLER, 0) + CURVE.xpCap * CURVE.xpPer);
    expect(killXp(Z_SHAMBLER, 8)).toBe(killXp(Z_SHAMBLER, 0));
    expect(scoreMul(3)).toBe(CURVE.scoreBase + 3 * CURVE.scorePer);
    expect(mixWeight(4, Z_BRUTE)).toBeGreaterThan(mixWeight(0, Z_BRUTE));
    expect(mixWeight(4, Z_SHAMBLER)).toBeLessThan(mixWeight(0, Z_SHAMBLER));
    expect(mixWeight(6, Z_GHOUL)).toBeGreaterThan(mixWeight(0, Z_GHOUL));
    const spawned = (rank: number): { hp: number; sp: number } => {
      const w = createWorld(8 + rank);
      w.rank = rank;
      w.hp = 9999;
      w.maxHp = 9999;
      w.fireCd = 999999;
      for (let n = 0; n < 40; n++) {
        w.zombies.alive.fill(0);
        w.toSpawn = 1;
        w.spawnCd = 1;
        step(w, idle);
        for (let i = 0; i < MAX_ZOMBIES; i++) {
          if (w.zombies.alive[i] && w.zombies.kind[i] === Z_SHAMBLER) {
            return { hp: w.zombies.hp[i] ?? 0, sp: w.zombies.vx[i] ?? 0 };
          }
        }
      }
      throw new Error("no shambler");
    };
    const low = spawned(0);
    const high = spawned(4);
    expect(low.hp).toBe(scaledHp(1, 0));
    expect(high.hp).toBe(scaledHp(1, 4));
    expect(high.hp).toBeGreaterThan(low.hp);
    expect(high.sp).toBeGreaterThan(low.sp);
  });
  it("shifts the spawn mix toward brutes on higher tiers", () => {
    const tally = (rank: number): number[] => {
      const w = createWorld(9);
      w.rank = rank;
      w.hp = 99999;
      w.maxHp = 99999;
      w.fireCd = 999999;
      const seen = [0, 0, 0];
      for (let n = 0; n < 200; n++) {
        w.zombies.alive.fill(0);
        w.toSpawn = 1;
        w.spawnCd = 1;
        step(w, idle);
        for (let i = 0; i < MAX_ZOMBIES; i++) {
          if (!w.zombies.alive[i]) continue;
          const k = w.zombies.kind[i] ?? 0;
          seen[k] = (seen[k] ?? 0) + 1;
        }
      }
      return seen;
    };
    const calm = tally(0);
    const hot = tally(8);
    expect(hot[Z_BRUTE] ?? 0).toBeGreaterThan(calm[Z_BRUTE] ?? 0);
    expect(calm[Z_SHAMBLER] ?? 0).toBeGreaterThan(hot[Z_SHAMBLER] ?? 0);
  });
  it("improves legendary rarity weight as the tier climbs", () => {
    expect(rarityWeight(0, 0)).toBeGreaterThan(rarityWeight(0, 2));
    expect(rarityWeight(8, 2)).toBeGreaterThan(rarityWeight(0, 2));
    expect(rarityWeight(8, 0)).toBeLessThan(rarityWeight(0, 0));
    expect(rarityWeight(8, 1)).toBeGreaterThan(rarityWeight(0, 1));
  });
});
