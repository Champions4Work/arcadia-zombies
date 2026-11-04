import { resetJuice } from "../src/render/juice";
import { BOSS_BEHEMOTH } from "../src/sim/boss";
import { Z_ELITE } from "../src/sim/foes";
import { step } from "../src/sim/step.hot";
import { plantBossWarn, WARN_ELITE_TICKS, warnLive } from "../src/sim/warn";
import { Z_GHOUL, type Input, type World } from "../src/sim/types";
import { createWorld } from "../src/sim/world";

beforeEach(() => {
  resetJuice();
});

const idle: Input = { dx: 0, dy: 0, pick: 0 };

function freeze(w: World): void {
  w.toSpawn = 0;
  w.spawnCd = 99999;
  w.fireCd = 99999;
  w.wpnCd.fill(9999);
}

describe("attack telegraphs", () => {
  it("shows a glowing warning before a boss charge deals damage", () => {
    const w = createWorld(2);
    freeze(w);
    w.hp = 20;
    w.maxHp = 20;
    w.hurtCd = 0;
    w.boss.on = 1;
    w.boss.kind = BOSS_BEHEMOTH;
    w.boss.phase = 0;
    w.boss.mode = 1;
    w.boss.timer = 10;
    w.boss.x = w.px + 40;
    w.boss.y = w.py;
    w.boss.aimX = -1;
    w.boss.aimY = 0;
    plantBossWarn(w, 10);
    expect(warnLive(w)).toBeGreaterThan(0);
    const hp = w.hp;
    w.hurtCd = 0;
    step(w, idle);
    expect(w.hp).toBe(hp);
    expect(warnLive(w)).toBeGreaterThan(0);
    expect(w.boss.mode).toBe(1);
  });

  it("plants an elite charge warning before the lunge", () => {
    const w = createWorld(3);
    freeze(w);
    w.hp = 20;
    w.hurtCd = 99;
    w.zombies.alive[0] = 1;
    w.zombies.kind[0] = Z_GHOUL | Z_ELITE;
    w.zombies.hp[0] = 8;
    w.zombies.vx[0] = 0.4;
    w.zombies.x[0] = w.px + 48;
    w.zombies.y[0] = w.py;
    expect(warnLive(w)).toBe(0);
    const hp = w.hp;
    step(w, idle);
    expect(warnLive(w)).toBeGreaterThan(0);
    expect(w.hp).toBe(hp);
    let left = WARN_ELITE_TICKS;
    while (left-- > 0 && warnLive(w) > 0) step(w, idle);
    expect(w.hp).toBe(hp);
  });
});
