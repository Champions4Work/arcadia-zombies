import { EVOL_AEGIS, EVOL_CANNON, EVOL_STORM, UNION_CROWN } from "../src/sim/types";
import {
  FORGE_QUESTS,
  KILL_QUESTS,
  QUEST_HEADING,
  QUEST_KEY,
  QUEST_KILLS,
  QUEST_LEVEL,
  QUEST_SCORE,
  QUEST_SECONDS,
  QUEST_UNION,
  SURVIVE_QUESTS,
  applyRun,
  dayKey,
  formatQuest,
  freshQuests,
  loadQuests,
  openRun,
  parseQuestSave,
  questBoard,
  questsForDay,
  rollDay,
  saveQuests,
  snapshotRun,
  unionForged,
} from "../src/shell/quests";

const mem = () => {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => (m.has(k) ? m.get(k) ?? null : null),
    setItem: (k: string, v: string) => { m.set(k, v); },
    raw: m,
  };
};

const blank = { kills: 0, seconds: 0, union: false, score: 0, level: 0 };

describe("daily quests", () => {
  it("rotates three quests from the kill, survive, and forge sets", () => {
    const labels = [...KILL_QUESTS, ...SURVIVE_QUESTS, ...FORGE_QUESTS].map((q) => q.label);
    expect(labels).toEqual(expect.arrayContaining(["Kill 300 zombies", "Survive 8 minutes", "Forge a union"]));
    const ids = [...KILL_QUESTS, ...SURVIVE_QUESTS, ...FORGE_QUESTS].map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
    let kills = false;
    let survive = false;
    let forge = false;
    const boards = new Set<string>();
    for (let d = 1; d <= 31; d++) {
      const day = `2026-11-${d < 10 ? "0" : ""}${d}`;
      const three = questsForDay(day);
      expect(questsForDay(day).map((q) => q.id)).toEqual(three.map((q) => q.id));
      expect(three[0]?.kind).toBe(QUEST_KILLS);
      expect(three[1]?.kind).toBe(QUEST_SECONDS);
      expect([QUEST_UNION, QUEST_LEVEL, QUEST_SCORE]).toContain(three[2]?.kind);
      boards.add(three.map((q) => q.id).join("|"));
      for (const q of three) {
        if (q.id === "kills-300") kills = true;
        if (q.id === "survive-8") survive = true;
        if (q.id === "forge-union") forge = true;
      }
    }
    expect(boards.size).toBeGreaterThan(1);
    expect(kills && survive && forge).toBe(true);
  });

  it("keys a calendar day in local time", () => {
    expect(dayKey(new Date(2026, 10, 3, 23, 30))).toBe("2026-11-03");
    expect(dayKey(new Date(2026, 10, 4, 0, 5))).toBe("2026-11-04");
    expect(dayKey(new Date(NaN))).toBe("1970-01-01");
  });

  it("formats the sample board and caps a finished goal", () => {
    const kill = KILL_QUESTS[1];
    const survive = SURVIVE_QUESTS[1];
    const forge = FORGE_QUESTS[0];
    expect(kill && formatQuest(kill, 0)).toBe("Kill 300 zombies · 0/300");
    expect(kill && formatQuest(kill, 300)).toBe("Kill 300 zombies · done");
    expect(kill && formatQuest(kill, 999)).toBe("Kill 300 zombies · done");
    expect(survive && formatQuest(survive, 125)).toBe("Survive 8 minutes · 2:05/8:00");
    expect(survive && formatQuest(survive, 479)).toBe("Survive 8 minutes · 7:59/8:00");
    expect(forge && formatQuest(forge, 0)).toBe("Forge a union · 0/1");
    expect(forge && formatQuest(forge, 1)).toBe("Forge a union · done");
    const state = freshQuests("2026-11-03");
    expect(questBoard(state).startsWith(`${QUEST_HEADING}\n`)).toBe(true);
    expect(questBoard(state).split("\n")).toHaveLength(4);
  });

  it("banks kills across runs, keeps the best survival, and forges once", () => {
    let state = openRun(freshQuests("2026-11-03"));
    state = applyRun(state, { kills: 120, seconds: 90, union: false, score: 400, level: 2 });
    expect(state.open).toBe(false);
    state = applyRun(state, { kills: 999, seconds: 999, union: true, score: 999, level: 9 });
    expect(state.kills).toBe(120);
    state = openRun(state);
    state = applyRun(state, { kills: 40.9, seconds: 500, union: true, score: 50, level: 1 });
    expect(state.kills).toBe(160);
    expect(state.bestSeconds).toBe(500);
    expect(state.unions).toBe(1);
    expect(state.bestScore).toBe(400);
    expect(state.bestLevel).toBe(2);
    const again = openRun(state);
    expect(again.open).toBe(true);
    expect(openRun(again)).toBe(again);
  });

  it("drops a closed run and a new day", () => {
    const closed = applyRun(freshQuests("2026-11-03"), { kills: 10, seconds: 10, union: true, score: 10, level: 1 });
    expect(closed.kills).toBe(0);
    const live = openRun(closed);
    const next = rollDay(live, "2026-11-04");
    expect(next.day).toBe("2026-11-04");
    expect(next.kills).toBe(0);
    expect(next.open).toBe(true);
    expect(rollDay(next, "2026-11-04")).toBe(next);
    const kept = applyRun(next, { kills: 3, seconds: 8 * 60, union: false, score: 1, level: 0 });
    expect(kept.kills).toBe(3);
    expect(kept.bestSeconds).toBe(480);
  });

  it("reads a snapshot from ticks and union gears without inventing progress", () => {
    const ups = new Uint8Array(19);
    expect(unionForged(null)).toBe(false);
    expect(unionForged(ups)).toBe(false);
    expect(snapshotRun({ kills: 4, tick: 90 * 60 + 30, upgrades: ups, score: 12, level: 1 })).toEqual({
      kills: 4, seconds: 90, union: false, score: 12, level: 1,
    });
    ups[EVOL_STORM] = 1;
    expect(unionForged(ups)).toBe(true);
    ups[EVOL_STORM] = 0;
    ups[EVOL_CANNON] = 2;
    expect(snapshotRun({ kills: 0, tick: 480 * 60, upgrades: ups, score: 0, level: 0 }).union).toBe(true);
    ups[EVOL_CANNON] = 0;
    ups[EVOL_AEGIS] = 1;
    expect(unionForged(ups)).toBe(true);
    const wide = new Uint8Array(31);
    wide[UNION_CROWN] = 1;
    expect(unionForged(wide)).toBe(true);
    expect(snapshotRun({ kills: 1, tick: Number.NaN, upgrades: ups, score: 1, level: 1 }).seconds).toBe(0);
  });

  it("parses saved progress safely and resets on a new day", () => {
    const day = "2026-11-03";
    expect(parseQuestSave(null, day).kills).toBe(0);
    expect(parseQuestSave("", day).bestSeconds).toBe(0);
    expect(parseQuestSave("{", day).unions).toBe(0);
    expect(parseQuestSave("null", day).bestScore).toBe(0);
    expect(parseQuestSave("[]", day).bestLevel).toBe(0);
    expect(parseQuestSave("42", day).kills).toBe(0);
    const messy = JSON.stringify({
      day,
      kills: -5,
      bestSeconds: 1.9,
      unions: true,
      bestScore: "9",
      bestLevel: null,
      ids: ["nope"],
    });
    const parsed = parseQuestSave(messy, day);
    expect(parsed.day).toBe(day);
    expect(parsed.kills).toBe(0);
    expect(parsed.bestSeconds).toBe(1);
    expect(parsed.unions).toBe(0);
    expect(parsed.bestScore).toBe(0);
    expect(parsed.bestLevel).toBe(0);
    expect(parsed.quests.map((q) => q.id)).toEqual(questsForDay(day).map((q) => q.id));
    expect(parseQuestSave(JSON.stringify({ day: "2026-11-02", kills: 80 }), day).kills).toBe(0);
    const huge = parseQuestSave(JSON.stringify({ day, kills: 5e12, bestSeconds: Infinity }), day);
    expect(huge.kills).toBe(1_000_000_000);
    expect(huge.bestSeconds).toBe(0);
    const store = mem();
    let state = openRun(freshQuests(day));
    state = applyRun(state, { ...blank, kills: 12, seconds: 40 });
    saveQuests(store, state);
    expect(store.getItem(QUEST_KEY)).toContain("\"kills\":12");
    expect(loadQuests(store, day).kills).toBe(12);
    expect(loadQuests(store, day).bestSeconds).toBe(40);
    expect(loadQuests(store, "2026-11-04").kills).toBe(0);
    const boom = {
      getItem() { throw new Error("blocked"); },
      setItem() { throw new Error("blocked"); },
    };
    expect(loadQuests(boom, day).kills).toBe(0);
    expect(() => saveQuests(boom, state)).not.toThrow();
  });
});
