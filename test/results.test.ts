import { HEAD_FALL, HEAD_WIN, readRunResult, resultBadges, resultFromWorld } from "../src/shell/results";
import { emptyLeaderboard } from "../src/shell/leaderboard";
import { UPG_TESLA, UPG_SHOTGUN } from "../src/sim/types";
import { createWorld } from "../src/sim/world";

describe("end of run sheet", () => {
  it("shows YOU FELL with time, kills, level, gold, and gear cards instead of a jammed string", () => {
    const sheet = readRunResult({
      won: false,
      tick: 8 * 60 + 20 * 60,
      kills: 42,
      level: 6,
      gold: 18,
      rank: 2,
      lich: false,
      upgrades: upgradeRow({ [UPG_TESLA]: 2, [UPG_SHOTGUN]: 1 }),
    });
    expect(sheet.headline).toBe(HEAD_FALL);
    expect(sheet.cause.toLowerCase()).toContain("overrun");
    expect(sheet.time).toBe("0:28");
    expect(sheet.stats.map((row) => row.id)).toEqual(["time", "kills", "level", "gold"]);
    expect(sheet.stats.map((row) => row.value)).toEqual(["0:28", "42", "6", "18"]);
    expect(sheet.cards).toEqual([
      { id: UPG_TESLA, name: "TESLA COIL", level: 2 },
      { id: UPG_SHOTGUN, name: "SCATTER VALVE", level: 1 },
    ]);
  });

  it("shows VICTORY when the lich falls and reads the same stats from the world", () => {
    const win = readRunResult({
      won: true,
      tick: 20 * 60 * 60,
      kills: 201,
      level: 11,
      gold: 90,
      rank: 6,
      lich: true,
      upgrades: [],
    });
    expect(win.headline).toBe(HEAD_WIN);
    expect(win.cause.toLowerCase()).toContain("lich");
    expect(win.stats.find((row) => row.id === "kills")?.value).toBe("201");
    const world = createWorld(1);
    world.tick = 120;
    world.level = 3;
    world.upgrades[UPG_TESLA] = 1;
    const fromWorld = resultFromWorld(world, 7);
    expect(fromWorld.headline).toBe(HEAD_FALL);
    expect(fromWorld.stats.find((row) => row.id === "gold")?.value).toBe("7");
    expect(fromWorld.cards.some((card) => card.id === UPG_TESLA && card.level === 1)).toBe(true);
    const badges = resultBadges(
      { score: 10, time: 120, tier: 0, kills: 1, build: "", character: "tinker", mods: 0, workshop: "", daily: "" },
      emptyLeaderboard().life,
      [],
    );
    expect(badges.find((b) => b.id === "first-blood")?.on).toBe(true);
    expect(badges.find((b) => b.id === "butcher")?.progress).toBe("OPEN");
  });
});

function upgradeRow(levels: Record<number, number>): number[] {
  const row = new Array<number>(31).fill(0);
  for (const [id, lv] of Object.entries(levels)) row[Number(id)] = lv;
  return row;
}
