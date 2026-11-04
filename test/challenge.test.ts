import { CHALLENGE_HEADING, challengeAt, challengeBlurb, challengeForDay, seedLabel, utcDayKey } from "../src/shell/challenge";
import { MOD_LIST } from "../src/sim/modifiers";

const noon = (day: number): Date => new Date(Date.UTC(2026, 10, day, 12, 0, 0));

describe("daily challenge", () => {
  it("keeps one seed and modifier pack for a UTC day", () => {
    const early = challengeAt(new Date(Date.UTC(2026, 10, 4, 0, 0, 1)));
    const late = challengeAt(new Date(Date.UTC(2026, 10, 4, 23, 59, 59)));
    expect(early.day).toBe("2026-11-04");
    expect(late).toEqual(early);
    expect(early.seed).toBeGreaterThan(0);
    const next = challengeAt(new Date(Date.UTC(2026, 10, 5, 0, 0, 1)));
    expect(next).not.toEqual(early);
    expect(next.day).toBe("2026-11-05");
  });

  it("names the UTC day and falls back when the date is invalid", () => {
    expect(utcDayKey(new Date(Date.UTC(2026, 10, 4, 15, 30)))).toBe("2026-11-04");
    expect(utcDayKey(new Date(NaN))).toBe("1970-01-01");
    expect(challengeAt(new Date(NaN))).toEqual(challengeForDay("1970-01-01"));
  });

  it("describes the day, the seed label, and any live modifier names", () => {
    const day = challengeAt(noon(4));
    const blurb = challengeBlurb(day);
    expect(blurb.startsWith(CHALLENGE_HEADING)).toBe(true);
    expect(blurb).toContain(day.day);
    expect(blurb).toContain(seedLabel(day.seed));
    expect(blurb).toMatch(/SEED [0-9A-F]{8}/);
    expect(seedLabel(day.seed)).toMatch(/^SEED [0-9A-F]{8}$/);
    if (day.mods > 0) {
      const names = MOD_LIST.filter((mod) => (day.mods & mod.bit) !== 0).map((mod) => mod.name);
      expect(names.length).toBeGreaterThan(0);
      for (const name of names) expect(blurb).toContain(name);
    }
  });

  it("rolls more than one seed and more than one pack across November 2026", () => {
    const seeds = new Set<number>();
    const packs = new Set<number>();
    const mask = MOD_LIST.reduce((bits, mod) => bits | mod.bit, 0);
    for (let day = 1; day <= 31; day++) {
      const date = noon(day);
      const challenge = challengeAt(date);
      expect(challenge).toEqual(challengeForDay(utcDayKey(date)));
      expect(challenge.seed).toBeGreaterThan(0);
      expect(challenge.seed).not.toBe(0x51ed0b);
      expect(challenge.mods & ~mask).toBe(0);
      let bits = 0;
      let left = challenge.mods;
      while (left > 0) {
        bits += left & 1;
        left >>= 1;
      }
      expect(bits).toBeLessThanOrEqual(2);
      const blurb = challengeBlurb(challenge);
      expect(blurb.startsWith(`${CHALLENGE_HEADING}\n`)).toBe(true);
      expect(blurb).toContain(challenge.day);
      expect(blurb).toMatch(/SEED [0-9A-F]{8}/);
      if (challenge.mods > 0) {
        const named = MOD_LIST.some((mod) => (challenge.mods & mod.bit) !== 0 && blurb.includes(mod.name));
        expect(named).toBe(true);
      }
      seeds.add(challenge.seed);
      packs.add(challenge.mods);
    }
    expect(seeds.size).toBeGreaterThan(1);
    expect(packs.size).toBeGreaterThan(1);
  });
});
