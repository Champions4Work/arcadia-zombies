import { directorElite, directorFloor, directorPack, directorSpawn, FRIENDLY_TICK, playerPower, scaleThreat, threatPct } from "../src/sim/director";
import { CURVE, scaledDmg } from "../src/sim/difficulty";
import { foeContact } from "../src/sim/foes";
import { step } from "../src/sim/step.hot";
import { MAX_ZOMBIES, UPG_DMG, Z_SHAMBLER } from "../src/sim/types";
import { createWorld } from "../src/sim/world";

const idle = { dx: 0, dy: 0, pick: 0 };

describe("adaptive director", () => {
  it("leaves the first two minutes at identity threat", () => {
    const w = createWorld(1);
    w.tick = FRIENDLY_TICK - 1;
    w.level = 20;
    w.upgrades[UPG_DMG] = 5;
    expect(threatPct(w)).toBe(100);
    expect(scaleThreat(8, w)).toBe(8);
    expect(playerPower(w)).toBeGreaterThan(20);
  });

  it("raises threat after the friendly open when the player is strong", () => {
    const w = createWorld(1);
    w.tick = FRIENDLY_TICK + 60 * 60 * 2;
    w.level = 18;
    w.upgrades[UPG_DMG] = 4;
    expect(threatPct(w)).toBeGreaterThan(100);
    expect(scaleThreat(10, w)).toBeGreaterThan(10);
    expect(directorSpawn(CURVE.spawnMin, w)).toBeGreaterThanOrEqual(CURVE.spawnMin);
    expect(directorFloor(w)).toBeLessThanOrEqual(20);
    expect(directorElite(w)).toBeLessThanOrEqual(90);
  });

  it("deals late contact damage on ash crown even to a standing player", () => {
    const w = createWorld(2);
    w.tick = 7 * 1800;
    w.rank = 7;
    w.toSpawn = 0;
    w.spawnCd = 99999;
    w.fireCd = 99999;
    w.hurtCd = 0;
    w.shield = 0;
    w.hp = 40;
    w.maxHp = 40;
    for (let i = 0; i < MAX_ZOMBIES; i++) w.zombies.alive[i] = 0;
    w.zombies.alive[0] = 1;
    w.zombies.kind[0] = Z_SHAMBLER;
    w.zombies.hp[0] = 999;
    w.zombies.x[0] = w.px;
    w.zombies.y[0] = w.py;
    w.zombies.vx[0] = 0;
    step(w, idle);
    const hit = scaleThreat(scaledDmg(foeContact(Z_SHAMBLER), w.rank), w);
    expect(hit).toBeGreaterThan(0);
    expect(w.hurt).toBe(hit);
    expect(w.hp).toBe(40 - hit);
  });

  it("keeps spawn tables on the locked director curve", () => {
    expect(CURVE.spawnBase).toBe(36);
    expect(CURVE.spawnPer).toBe(6);
    expect(CURVE.spawnMin).toBe(4);
    const w = createWorld(1);
    w.tick = 0;
    expect(directorPack(w)).toBe(0);
    expect(directorFloor(w)).toBe(0);
    expect(directorElite(w)).toBe(0);
    w.tick = FRIENDLY_TICK - 1;
    expect(directorPack(w)).toBe(0);
    expect(directorFloor(w)).toBe(0);
    expect(directorElite(w)).toBe(0);
    expect(directorSpawn(CURVE.spawnBase, w)).toBe(CURVE.spawnBase);
  });
});
