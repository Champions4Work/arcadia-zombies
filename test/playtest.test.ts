import { playBot } from "./playtest";

const SEEDS = [1, 2, 3, 4, 5, 6, 7, 8];
const SURVIVE_BAND = { min: 60, max: 420 };
const MIN_MEDIAN_KILLS = 40;

const median = (xs: number[]): number => {
  const s = [...xs].sort((a, b) => a - b);
  return ((s[(s.length - 1) >> 1] ?? 0) + (s[s.length >> 1] ?? 0)) / 2;
};

describe("headless bot playtest", () => {
  const runs = SEEDS.map((s) => playBot(s));
  const secs = median(runs.map((r) => r.seconds));
  const kills = median(runs.map((r) => r.kills));
  console.log(`playtest: median survival ${secs}s, median kills ${kills}, deaths ${runs.filter((r) => r.died).length}/${runs.length}`);

  it("kiting bot survival stays in the target difficulty band", () => {
    expect(secs).toBeGreaterThanOrEqual(SURVIVE_BAND.min);
    expect(secs).toBeLessThanOrEqual(SURVIVE_BAND.max);
  });

  it("kiting bot gets enough kills to feel powerful", () => {
    expect(kills).toBeGreaterThanOrEqual(MIN_MEDIAN_KILLS);
  });

  it("the game is not trivially endless for a simple bot", () => {
    expect(runs.some((r) => r.died)).toBe(true);
  });
});
