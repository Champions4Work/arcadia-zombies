import { acceptLog, clampLimit, listRuns, rejectBody, saveRun, type RunStore } from "../src/api/runs";
import { Z_ELITE } from "../src/sim/foes";
import { UPG_TESLA, UPG_WPN_RIVET } from "../src/sim/types";
import { createWorld } from "../src/sim/world";
import {
  deathCause,
  emptyLog,
  formatRunLog,
  isRunLog,
  parseRunLog,
  pushSample,
  RUN_LOG_V,
  sampleRun,
  shouldSample,
} from "../src/shell/run-log";

const mem = (): RunStore => {
  const m = new Map<string, string>();
  return {
    get: async (k) => (m.has(k) ? m.get(k) ?? null : null),
    put: async (k, v) => { m.set(k, v); },
  };
};

const view = { w: 390, h: 844 };

describe("run log schema", () => {
  it("records a minute sample without personal fields", () => {
    const w = createWorld(3);
    w.tick = 3600;
    w.level = 2;
    w.hurt = 3;
    w.dealt = 40;
    w.kills = 9;
    w.upgrades[UPG_TESLA] = 1;
    w.zombies.alive[0] = 1;
    w.zombies.kind[0] = Z_ELITE;
    const row = sampleRun(w, view, [58, 60], "");
    expect(row.t).toBe(60);
    expect(row.level).toBe(2);
    expect(row.hurt).toBe(3);
    expect(row.kills).toBe(9);
    expect(row.elites).toBe(1);
    expect(row.alive).toBe(1);
    expect(row.dps).toBeGreaterThan(0);
    expect(row.character).toBe("tinker");
    expect(row.modifier).toBe("none");
    expect(row.viewW).toBe(390);
    expect(row.weapons.some((g) => g.name.includes("RIVET") || g.lv >= 1)).toBe(true);
    expect(JSON.stringify(row)).not.toMatch(/email|userAgent|"ip"|password/i);
    const log = emptyLog();
    pushSample(log, row);
    expect(isRunLog(log)).toBe(true);
    expect(parseRunLog(log)?.v).toBe(RUN_LOG_V);
    expect(formatRunLog(log)).toContain("K9");
    expect(shouldSample(3600, 0)).toBe(true);
    expect(shouldSample(3599, 0)).toBe(false);
    expect(shouldSample(7200, 3600)).toBe(true);
    expect(deathCause(w, false, false)).toContain("overrun");
  });

  it("rejects personal payloads and serves recent runs from the store", async () => {
    expect(rejectBody("x".repeat(30_000))).toBe("too large");
    expect(rejectBody("{\"email\":\"a@b.c\"}")).toBe("personal");
    const w = createWorld(1);
    w.upgrades[UPG_WPN_RIVET] = 1;
    const log = emptyLog();
    pushSample(log, sampleRun(w, view, [60], "overrun:CALM"));
    expect(acceptLog(log)).toBe(true);
    const store = mem();
    const saved = await saveRun(store, log, 1000, "abc");
    expect(saved?.id).toBe("abc");
    const rows = await listRuns(store, 5);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.log.samples[0]?.kills).toBe(0);
    expect(clampLimit(999)).toBe(40);
  });
});
