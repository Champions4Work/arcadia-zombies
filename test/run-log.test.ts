import { acceptLog, clampLimit, dispatchRuns, listRuns, rejectBody, saveRun, type RunStore } from "../src/api/runs";
import { overlayLines } from "../src/render/fps";
import { Z_ELITE } from "../src/sim/foes";
import { step } from "../src/sim/step.hot";
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
  SAMPLE_EARLY_TICK,
  SAMPLE_EARLY_UNTIL,
  SAMPLE_MAX,
  SAMPLE_TICK,
  sampleRun,
  shouldSample,
  type RunLog,
  type RunSample,
} from "../src/shell/run-log";
import { emptySendTally, sendRunLog } from "../src/shell/run-send";

const mem = (): RunStore => {
  const m = new Map<string, string>();
  return {
    get: async (k) => (m.has(k) ? m.get(k) ?? null : null),
    put: async (k, v) => { m.set(k, v); },
  };
};

const view = { w: 390, h: 844 };

function namedSample(weapons: string[], upgrades: string[]): RunSample {
  const w = createWorld(1);
  w.tick = SAMPLE_EARLY_TICK;
  w.level = 3;
  w.hp = 12;
  w.maxHp = 14;
  w.kills = 7;
  w.dealt = 80;
  const row = sampleRun(w, view, [58, 60], "");
  row.weapons = weapons.map((name) => ({ name, lv: 1 }));
  row.upgrades = upgrades.map((name) => ({ name, lv: 1 }));
  return row;
}

describe("run log schema", () => {
  it("records a sample with level, kills, dps, hp, and fps", () => {
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
    expect(row.hp).toBe(w.maxHp);
    expect(row.hurt).toBe(3);
    expect(row.kills).toBe(9);
    expect(row.elites).toBe(1);
    expect(row.alive).toBe(1);
    expect(row.dps).toBeGreaterThan(0);
    expect(row.fps).toEqual([58, 60]);
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
    expect(deathCause(w, false, false)).toContain("overrun");
  });

  it("samples every 20s for the first 5 min, then every 60s, and caps at 48 rows", () => {
    expect(shouldSample(SAMPLE_EARLY_TICK - 1, 0)).toBe(false);
    expect(shouldSample(SAMPLE_EARLY_TICK, 0)).toBe(true);
    expect(shouldSample(SAMPLE_EARLY_TICK * 2, SAMPLE_EARLY_TICK)).toBe(true);
    expect(shouldSample(3599, 0)).toBe(true);
    expect(shouldSample(3600, 0)).toBe(true);
    expect(shouldSample(SAMPLE_EARLY_UNTIL, SAMPLE_EARLY_UNTIL - SAMPLE_EARLY_TICK)).toBe(true);
    expect(shouldSample(SAMPLE_EARLY_UNTIL + SAMPLE_TICK - 1, SAMPLE_EARLY_UNTIL)).toBe(false);
    expect(shouldSample(SAMPLE_EARLY_UNTIL + SAMPLE_TICK, SAMPLE_EARLY_UNTIL)).toBe(true);
    expect(shouldSample(SAMPLE_EARLY_TICK, 0, SAMPLE_MAX)).toBe(false);
    const log = emptyLog();
    for (let i = 0; i < SAMPLE_MAX + 2; i++) {
      const row = namedSample(["RIVET GUN"], ["TESLA COIL"]);
      row.t = i;
      row.death = i === SAMPLE_MAX + 1 ? "overrun:CALM" : "";
      pushSample(log, row);
    }
    expect(log.samples).toHaveLength(SAMPLE_MAX);
    expect(log.samples[SAMPLE_MAX - 1]?.death).toBe("overrun:CALM");
  });

  it("keeps a sample when world hp went negative", () => {
    const w = createWorld(2);
    w.hp = -4;
    const row = sampleRun(w, view, [60], "overrun:CALM");
    expect(row.hp).toBe(0);
    const log = emptyLog();
    pushSample(log, row);
    expect(log.samples).toHaveLength(1);
  });

  it("accepts a log whose gear names contain Airship and Whip", async () => {
    const log = emptyLog();
    pushSample(log, namedSample(["Airship"], ["Whip"]));
    const raw = JSON.stringify(log);
    expect(raw).toContain("Airship");
    expect(raw).toContain("Whip");
    expect(raw.includes("ip")).toBe(true);
    expect(rejectBody(raw)).toBe(null);
    expect(acceptLog(log)).toBe(true);
    const store = mem();
    const saved = await saveRun(store, log, 1000, "air");
    expect(saved?.log.samples[0]?.weapons[0]?.name).toBe("Airship");
    expect(saved?.log.samples[0]?.upgrades[0]?.name).toBe("Whip");
  });

  it("rejects only payloads whose fields are named ip, email, or userAgent", () => {
    expect(rejectBody("x".repeat(30_000))).toBe("too large");
    expect(rejectBody("{\"email\":\"a@b.c\"}")).toBe("personal");
    expect(rejectBody("{\"ip\":\"1.2.3.4\"}")).toBe("personal");
    expect(rejectBody("{\"userAgent\":\"x\"}")).toBe("personal");
    expect(rejectBody("{\"nested\":{\"email\":\"a@b.c\"}}")).toBe("personal");
    expect(rejectBody("{\"skip\":1,\"Whip\":\"Airship\"}")).toBe(null);
    const w = createWorld(1);
    w.upgrades[UPG_WPN_RIVET] = 1;
    const log = emptyLog();
    pushSample(log, sampleRun(w, view, [60], "overrun:CALM"));
    expect(acceptLog(log)).toBe(true);
  });

  it("serves recent runs from the store", async () => {
    const w = createWorld(1);
    w.upgrades[UPG_WPN_RIVET] = 1;
    const log = emptyLog();
    pushSample(log, sampleRun(w, view, [60], "overrun:CALM"));
    const store = mem();
    const saved = await saveRun(store, log, 1000, "abc");
    expect(saved?.id).toBe("abc");
    const rows = await listRuns(store, 5);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.log.samples[0]?.kills).toBe(0);
    expect(clampLimit(999)).toBe(40);
  });
});

describe("run send", () => {
  it("retries once and counts a failure only after both attempts miss", async () => {
    const log: RunLog = emptyLog();
    pushSample(log, namedSample(["Airship"], ["Whip"]));
    const tally = emptySendTally();
    let calls = 0;
    const ok = await sendRunLog("/api/runs", log, async () => {
      calls += 1;
      if (calls === 1) throw new Error("net");
      return { ok: true };
    }, tally);
    expect(ok).toBe(true);
    expect(calls).toBe(2);
    expect(tally.fails).toBe(0);
    const failTally = emptySendTally();
    let misses = 0;
    const missed = await sendRunLog("/api/runs", log, async () => {
      misses += 1;
      return { ok: false };
    }, failTally);
    expect(missed).toBe(false);
    expect(misses).toBe(2);
    expect(failTally.fails).toBe(1);
    expect(overlayLines(true, 60, failTally.fails, true)).toEqual(["FPS 60", "FAIL 1"]);
  });
});

describe("runs HTTP dispatch", () => {
  it("accepts a sampled standing run with non-empty samples", async () => {
    const w = createWorld(4);
    const log = emptyLog();
    let last = 0;
    const hold = { dx: 0, dy: 0, pick: 1, reroll: 0, skip: 1, ult: 0 };
    for (let n = 0; !w.over && n < 60 * 180; n++) {
      step(w, hold);
      if (shouldSample(w.tick, last, log.samples.length)) {
        last = w.tick;
        pushSample(log, sampleRun(w, view, [60]));
      }
    }
    if (w.over) pushSample(log, sampleRun(w, view, [60], deathCause(w, false, false)));
    expect(log.samples.length).toBeGreaterThan(0);
    expect(log.samples[0]?.level).toBeGreaterThan(0);
    expect(log.samples.some((s) => s.fps.length > 0)).toBe(true);
    expect(rejectBody(JSON.stringify(log))).toBe(null);
    expect(acceptLog(log)).toBe(true);
    const store = mem();
    const posted = await dispatchRuns("POST", new URL("http://127.0.0.1/api/runs"), JSON.stringify(log), store, 3, "bot1");
    expect(posted.status).toBe(201);
    const listed = await dispatchRuns("GET", new URL("http://127.0.0.1/api/runs"), "", store, 3, "x");
    const body = listed.data as { runs: { log: RunLog }[] };
    expect(body.runs[0]?.log.samples.length).toBeGreaterThan(0);
  });

  it("stores a POST with Airship and Whip and returns non-empty samples", async () => {
    const log = emptyLog();
    pushSample(log, namedSample(["Airship"], ["Whip"]));
    const store = mem();
    const url = new URL("http://127.0.0.1/api/runs");
    const posted = await dispatchRuns("POST", url, JSON.stringify(log), store, 2000, "post1");
    expect(posted.status).toBe(201);
    const listed = await dispatchRuns("GET", url, "", store, 2000, "x");
    expect(listed.status).toBe(200);
    const body = listed.data as { runs: { log: RunLog }[] };
    expect(body.runs[0]?.log.samples.length).toBeGreaterThan(0);
    expect(body.runs[0]?.log.samples[0]?.weapons[0]?.name).toBe("Airship");
    expect(body.runs[0]?.log.samples[0]?.level).toBe(3);
    expect(body.runs[0]?.log.samples[0]?.kills).toBe(7);
    expect(body.runs[0]?.log.samples[0]?.dps).toBeGreaterThan(0);
    expect(body.runs[0]?.log.samples[0]?.hp).toBeGreaterThan(0);
    expect(body.runs[0]?.log.samples[0]?.fps.length).toBeGreaterThan(0);
  });
});
