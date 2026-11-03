import { applyUpgrade } from "../src/sim/progress";
import { step } from "../src/sim/step.hot";
import { EV_KILL, UNION_CROWN, UPG_PIERCE, type Input } from "../src/sim/types";
import { createWorld } from "../src/sim/world";
import {
  ACHIEVEMENTS,
  BOARD_LIMIT,
  LEADERBOARD_KEY,
  buildLabel,
  captureRun,
  commitRun,
  createTracker,
  emptyLeaderboard,
  formatTime,
  loadLeaderboard,
  noteKills,
  presentBoard,
  rankSum,
  resetTracker,
  runLine,
  saveLeaderboard,
  settleRun,
  shareText,
  type RunRecord,
  type SavedRecords,
  type Store,
} from "../src/shell/leaderboard";

const mem = (): Store & { raw(): Map<string, string> } => {
  const m = new Map<string, string>();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) ?? null : null),
    setItem: (k, v) => { m.set(k, v); },
    raw: () => m,
  };
};

const row = (score: number, time = 0, tier = 1, kills = 0, build = "STOCK", character = "tinker"): RunRecord => ({
  score, time, tier, kills, build, character,
});

const zero = (): RunRecord => row(0);

describe("run records", () => {
  it("records the pressure rank as the tier and the upgrade ranks as the build", () => {
    const run = captureRun({
      score: 80, time: 600, tier: 4, kills: 9, upgrades: [0, 2, 0, 0, 1, 0, 0, 0, 0, 0],
    });
    expect(run).toEqual({ score: 80, time: 600, tier: 4, kills: 9, build: "SHOT2 DMG1", character: "tinker" });
    expect(shareText(run)).toBe("Arcadia: Gears of the Dead — Score 80 · 0:10 · OVERPRESSURE · 9 kills · SHOT2 DMG1 · Tinker");
    const brute = captureRun({
      score: 80, time: 600, tier: 4, kills: 9, upgrades: [0, 2, 0, 0, 1, 0, 0, 0, 0, 0], character: "brute",
    });
    expect(brute.character).toBe("brute");
    expect(runLine(brute)).toContain("Brute");
    expect(captureRun({
      score: 1, time: 1, tier: 0, kills: 0, upgrades: [], character: "lich",
    }).character).toBe("tinker");
  });

  it("formats survival time from 60 ticks per second", () => {
    expect(formatTime(0)).toBe("0:00");
    expect(formatTime(59)).toBe("0:00");
    expect(formatTime(60)).toBe("0:01");
    expect(formatTime(3600)).toBe("1:00");
    expect(formatTime(3661)).toBe("1:01");
  });

  it("writes an empty boiler as STOCK and keeps upgrade order", () => {
    expect(buildLabel([])).toBe("STOCK");
    expect(buildLabel([0, 0, 0, 0, 0, 0, 0, 0, 0, 0])).toBe("STOCK");
    expect(buildLabel([2, 0, 1, 3, 0, 0, 0, 0, 0, 4])).toBe("TESLA2 SAWS1 FIRE3 SHIELD4");
    expect(buildLabel([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 2])).toBe("MORTAR1 STORM2");
    expect(buildLabel([0, 0, 0, 0, 0, 9, 0, 0, 0, 0])).toBe("HP9");
    expect(rankSum("TESLA5 SHOT3")).toBe(8);
    expect(rankSum("STOCK")).toBe(0);
  });

  it("includes the crown code when thunder crown is forged", () => {
    const crowned: number[] = [];
    crowned[UNION_CROWN] = 1;
    expect(buildLabel(crowned)).toContain("CROWN1");
  });

  it("adds every kill reported in a tick", () => {
    const tracker = createTracker();
    noteKills(tracker, 0);
    noteKills(tracker, 2);
    noteKills(tracker, 1);
    expect(tracker.kills).toBe(3);
    resetTracker(tracker);
    expect(tracker.kills).toBe(0);
  });

  it("counts each corpse when one tick fells more than one zombie", () => {
    const w = createWorld(4);
    w.toSpawn = 0;
    w.fireCd = 9999;
    w.wave = 2;
    applyUpgrade(w, UPG_PIERCE);
    const place = (i: number): void => {
      const z = w.zombies;
      z.alive[i] = 1;
      z.hp[i] = 1;
      z.x[i] = w.px + 16;
      z.y[i] = w.py;
      z.vx[i] = 0;
    };
    place(0);
    place(1);
    w.bullets.alive[0] = 1;
    w.bullets.x[0] = w.px + 16;
    w.bullets.y[0] = w.py;
    w.bPierce[0] = w.upgrades[UPG_PIERCE] ?? 0;
    step(w, { dx: 0, dy: 0, pick: 0 } satisfies Input);
    expect(w.events[EV_KILL]).toBe(2);
    expect(w.zombies.alive[0]).toBe(0);
    expect(w.zombies.alive[1]).toBe(0);
    const tracker = createTracker();
    noteKills(tracker, w.events[EV_KILL] ?? 0);
    const saved = emptyLeaderboard();
    const settled = settleRun(saved, captureRun({
      score: w.score, time: w.tick, tier: w.wave, kills: tracker.kills, upgrades: w.upgrades,
    }));
    expect(saved.life.kills).toBe(2);
    expect(saved.life.runs).toBe(1);
    expect(settled.toasts).toEqual(["Unlocked: First Blood"]);
    expect(settled.line).toContain("2 kills");
    expect(settled.share).toContain("2 kills");
  });
});

describe("leaderboard", () => {
  it("keeps ten runs sorted by score, then time, kills, and tier", () => {
    const saved = emptyLeaderboard();
    commitRun(saved, row(10, 5, 1, 1));
    commitRun(saved, row(50, 10, 1, 1));
    commitRun(saved, row(50, 80, 1, 1));
    commitRun(saved, row(50, 80, 1, 4));
    commitRun(saved, row(50, 80, 3, 4));
    expect(saved.board.map((r) => [r.score, r.time, r.kills, r.tier])).toEqual([
      [50, 80, 4, 3],
      [50, 80, 4, 1],
      [50, 80, 1, 1],
      [50, 10, 1, 1],
      [10, 5, 1, 1],
    ]);
  });

  it("drops the weakest score past the top 10 and still counts that run", () => {
    const saved = emptyLeaderboard();
    for (let i = 0; i < BOARD_LIMIT; i++) commitRun(saved, row(100 - i, 1));
    const missed = commitRun(saved, row(5, 400, 2, 1));
    expect(saved.board).toHaveLength(BOARD_LIMIT);
    expect(saved.board.some((r) => r.time === 400)).toBe(false);
    expect(saved.life.runs).toBe(11);
    expect(saved.life.kills).toBe(1);
    expect(saved.life.bestTime).toBe(400);
    expect(missed).toEqual(["first-blood"]);
    commitRun(saved, row(91, 30));
    expect(saved.board.map((r) => r.score)).toEqual([100, 99, 98, 97, 96, 95, 94, 93, 92, 91]);
    expect(saved.board[9]).toMatchObject({ score: 91, time: 30 });
    expect(saved.life.bestTime).toBe(400);
  });

  it("shows score, time, tier, kills, and build from the title-screen board", () => {
    const saved = emptyLeaderboard();
    expect(presentBoard(saved).life).toBe("Kills 0 · Best time — · Runs 0");
    expect(presentBoard(saved).empty).toBe(true);
    expect(presentBoard(saved).achievements).toHaveLength(10);
    commitRun(saved, captureRun({
      score: 80, time: 600, tier: 4, kills: 9, upgrades: [0, 2, 0, 0, 1, 0, 0, 0, 0, 0],
    }));
    const view = presentBoard(saved);
    expect(view.life).toBe("Kills 9 · Best time 0:10 · Runs 1");
    expect(view.rows[0]).toEqual({
      title: "#1  Score 80",
      detail: "0:10 · OVERPRESSURE · 9 kills · SHOT2 DMG1 · Tinker",
      share: "Arcadia: Gears of the Dead — Score 80 · 0:10 · OVERPRESSURE · 9 kills · SHOT2 DMG1 · Tinker",
    });
  });
});

describe("lifetime stats and achievements", () => {
  it("tracks total kills, best time, and runs played", () => {
    const saved = emptyLeaderboard();
    commitRun(saved, row(10, 100, 1, 4));
    commitRun(saved, row(20, 40, 1, 6));
    expect(saved.life).toEqual({ kills: 10, bestTime: 100, runs: 2 });
    commitRun(saved, row(5, 500, 1, 1));
    expect(saved.life).toEqual({ kills: 11, bestTime: 500, runs: 3 });
  });

  it("defines ten achievements", () => {
    expect(ACHIEVEMENTS).toHaveLength(10);
    expect(new Set(ACHIEVEMENTS.map((a) => a.id)).size).toBe(10);
  });

  it("unlocks each achievement on its boundary and never again", () => {
    const once = (run: RunRecord, prior?: (s: SavedRecords) => void): string[] => {
      const saved = emptyLeaderboard();
      if (prior) prior(saved);
      return commitRun(saved, run);
    };
    expect(once(zero())).toEqual([]);
    expect(once(row(0, 0, 0, 1))).toEqual(["first-blood"]);
    expect(once(row(0, 0, 0, 11))).not.toContain("dozen");
    expect(once(row(0, 0, 0, 12))).toEqual(["first-blood", "dozen"]);
    expect(once(row(0, 0, 0, 49))).not.toContain("butcher");
    expect(once(row(0, 0, 0, 50))).toContain("butcher");
    expect(once(row(0, 0, 2))).not.toContain("third-gear");
    expect(once(row(0, 0, 3))).toEqual(["third-gear"]);
    expect(once(row(0, 0, 4))).not.toContain("boiler");
    expect(once(row(0, 0, 5))).toEqual(["third-gear", "boiler"]);
    expect(once(row(999))).not.toContain("purse");
    expect(once(row(1000))).toEqual(["purse"]);
    expect(once(row(0, 3599))).not.toContain("minute");
    expect(once(row(0, 3600))).toEqual(["minute"]);
    expect(once(row(0, 0, 0, 0, "TESLA5 SHOT2"))).not.toContain("tinkerer");
    expect(once(row(0, 0, 0, 0, "TESLA5 SHOT3"))).toEqual(["tinkerer"]);
    const saved = emptyLeaderboard();
    for (let i = 0; i < 4; i++) expect(commitRun(saved, zero())).not.toContain("clocked");
    expect(commitRun(saved, zero())).toEqual(["clocked"]);
    expect(commitRun(saved, zero())).toEqual([]);
    const kills = emptyLeaderboard();
    expect(commitRun(kills, row(0, 0, 0, 99))).not.toContain("century");
    expect(commitRun(kills, row(0, 0, 0, 1))).toContain("century");
    expect(kills.life.kills).toBe(100);
    expect(commitRun(kills, row(0, 0, 0, 5))).not.toContain("century");
  });

  it("toasts a haul in definition order and stays quiet after reload", () => {
    const store = mem();
    store.setItem("arcadia.best", "7");
    const saved = emptyLeaderboard();
    const settled = settleRun(saved, captureRun({
      score: 1000,
      time: 3600,
      tier: 5,
      kills: 50,
      upgrades: [5, 3, 0, 0, 0, 0, 0, 0, 0, 0],
    }));
    expect(settled.toasts).toEqual([
      "Unlocked: First Blood",
      "Unlocked: Dozen Down",
      "Unlocked: The Butcher",
      "Unlocked: Third Gear",
      "Unlocked: Boiler Room",
      "Unlocked: Brass Purse",
      "Unlocked: Sixty Seconds",
      "Unlocked: Tinkerer",
    ]);
    expect(presentBoard(saved).achievements.filter((a) => a.on).map((a) => a.line)).toEqual([
      "[x] First Blood — Kill a zombie",
      "[x] Dozen Down — 12 kills in a run",
      "[x] The Butcher — 50 kills in a run",
      "[x] Third Gear — Reach Boiling",
      "[x] Boiler Room — Reach Meltdown",
      "[x] Brass Purse — Score 1000",
      "[x] Sixty Seconds — Survive one minute",
      "[x] Tinkerer — 8 upgrade ranks",
    ]);
    expect(presentBoard(saved).achievements.filter((a) => !a.on).map((a) => a.line)).toEqual([
      "[ ] Clocked In — Play 5 runs",
      "[ ] Century — 100 lifetime kills",
    ]);
    saveLeaderboard(store, saved);
    expect(store.getItem("arcadia.best")).toBe("7");
    const again = loadLeaderboard(store);
    const second = settleRun(again, captureRun({
      score: 1000, time: 3600, tier: 5, kills: 50, upgrades: [5, 3, 0, 0, 0, 0, 0, 0, 0, 0],
    }));
    expect(second.toasts).toEqual(["Unlocked: Century"]);
    expect(again.life).toEqual({ kills: 100, bestTime: 3600, runs: 2 });
    expect(settleRun(again, row(1, 1, 1, 1)).toasts).toEqual([]);
  });
});

describe("leaderboard storage", () => {
  it("round-trips the board and ignores corrupt payloads", () => {
    const store = mem();
    expect(loadLeaderboard(store)).toEqual(emptyLeaderboard());
    const saved = emptyLeaderboard();
    commitRun(saved, row(40, 90, 2, 3, "FIRE1"));
    saveLeaderboard(store, saved);
    expect(loadLeaderboard(store)).toEqual(saved);
    for (const raw of ["{", "null", "[]", "\"x\"", ""]) {
      store.setItem(LEADERBOARD_KEY, raw);
      expect(loadLeaderboard(store)).toEqual(emptyLeaderboard());
    }
    store.setItem(LEADERBOARD_KEY, JSON.stringify({
      v: 1,
      board: [
        null,
        { foo: 1 },
        { score: -4, time: -10, tier: -1, kills: -2, build: "STOCK" },
        { score: 5, time: 120, tier: 2, kills: 3, build: "NOPE" },
        { score: 9, time: 60, tier: 1, kills: 0, build: "FIRE1 TESLA2" },
      ],
      life: { kills: 40, bestTime: 500, runs: 12 },
      unlocked: ["first-blood", "nope", "first-blood", 3],
    }));
    const loaded = loadLeaderboard(store);
    expect(loaded.board.map((r) => [r.score, r.build])).toEqual([
      [9, "FIRE1 TESLA2"],
      [5, "STOCK"],
      [0, "STOCK"],
    ]);
    expect(loaded.life).toEqual({ kills: 40, bestTime: 500, runs: 12 });
    expect(loaded.unlocked).toEqual(["first-blood"]);
    expect(() => saveLeaderboard({
      getItem: () => null,
      setItem: () => { throw new Error("quota"); },
    }, emptyLeaderboard())).not.toThrow();
    expect(loadLeaderboard({
      getItem: () => { throw new Error("blocked"); },
      setItem: () => undefined,
    })).toEqual(emptyLeaderboard());
  });
});
