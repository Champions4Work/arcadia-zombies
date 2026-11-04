import { CURVE, spawnEvery, tickAtMinute, tierAt } from "../src/sim/difficulty";
import { directorFloor, FRIENDLY_TICK, PHONE_PRESSURE, threatPct } from "../src/sim/director";
import { step } from "../src/sim/step.hot";
import { MAX_ZOMBIES } from "../src/sim/types";
import { createWorld } from "../src/sim/world";
import { aggressive } from "./aggressive";
import { playHeld } from "./playtest";

const SEEDS = [1, 2, 3, 4, 5, 6];
const idle = { dx: 0, dy: 0, pick: 0 };

describe("phone pressure band", () => {
  it("ramps sim threat and spawn cadence after the two-minute teach window", () => {
    const teach = createWorld(1);
    teach.tick = FRIENDLY_TICK - 1;
    expect(threatPct(teach)).toBe(PHONE_PRESSURE.teachThreatPct);
    const mid = createWorld(2);
    mid.tick = tickAtMinute(PHONE_PRESSURE.midStartMin);
    expect(threatPct(mid)).toBeGreaterThan(PHONE_PRESSURE.teachThreatPct);
    expect(directorFloor(mid)).toBeGreaterThanOrEqual(PHONE_PRESSURE.midFloorMin);
    const tier = tierAt(mid.tick);
    expect(spawnEvery(tier)).toBeLessThanOrEqual(PHONE_PRESSURE.midSpawnEveryMax);
    expect(spawnEvery(tier)).toBeGreaterThanOrEqual(CURVE.spawnMin);
  });

  it("keeps contact damage at or above the mid band after the teach window", () => {
    const held = SEEDS.map((s) => playHeld(s, aggressive, 60 * 360));
    for (const run of held) {
      for (const bucket of run.buckets) {
        if (bucket.min <= PHONE_PRESSURE.teachMin) continue;
        expect(bucket.hurt + bucket.blocked).toBeGreaterThanOrEqual(PHONE_PRESSURE.midHurtMin);
      }
    }
  });

  it("queues a mid-run horde floor before the next spawn tick", () => {
    const w = createWorld(3);
    w.tick = tickAtMinute(4);
    w.rank = tierAt(w.tick);
    w.toSpawn = 0;
    w.spawnCd = 12;
    for (let i = 0; i < MAX_ZOMBIES; i++) w.zombies.alive[i] = 0;
    for (let t = 0; t < 120; t++) step(w, idle);
    let alive = 0;
    for (let i = 0; i < MAX_ZOMBIES; i++) if (w.zombies.alive[i]) alive++;
    expect(alive + w.toSpawn).toBeGreaterThanOrEqual(PHONE_PRESSURE.midFloorMin);
  });
});
