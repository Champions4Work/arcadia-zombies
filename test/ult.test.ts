import { resetJuice } from "../src/render/juice";
import { chargeUlt, fireUlt, tryUlt, ULT_NEED, ultFill, ultReady } from "../src/sim/ult";
import { killZombie } from "../src/sim/combat.hot";
import { step } from "../src/sim/step.hot";
import { Z_SHAMBLER, type Input, type World } from "../src/sim/types";
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

function fodder(w: World, n: number): void {
  for (let i = 0; i < n; i++) {
    w.zombies.alive[i] = 1;
    w.zombies.kind[i] = Z_SHAMBLER;
    w.zombies.hp[i] = 1;
    w.zombies.x[i] = 40 + i * 8;
    w.zombies.y[i] = 50;
  }
}

describe("ultimate steam blast", () => {
  it("fills from kills and a fire key clears the yard", () => {
    const w = createWorld(8);
    freeze(w);
    expect(ultFill(w)).toBe(0);
    expect(ultReady(w)).toBe(false);
    expect(tryUlt(w, 1)).toBe(false);
    fodder(w, ULT_NEED);
    for (let i = 0; i < ULT_NEED; i++) killZombie(w, i);
    chargeUlt(w, ULT_NEED);
    expect(ultReady(w)).toBe(true);
    expect(ultFill(w)).toBe(1);
    fodder(w, 6);
    const before = 6;
    let alive = 0;
    for (let i = 0; i < 6; i++) if (w.zombies.alive[i]) alive++;
    expect(alive).toBe(before);
    expect(fireUlt(w)).toBe(true);
    alive = 0;
    for (let i = 0; i < 6; i++) if (w.zombies.alive[i]) alive++;
    expect(alive).toBe(0);
    expect(ultReady(w)).toBe(false);
    expect(w.ultBlast).toBeGreaterThan(0);
  });

  it("charges across steps from kills and input.ult fires it", () => {
    const w = createWorld(9);
    freeze(w);
    fodder(w, 4);
    for (let i = 0; i < 4; i++) {
      w.bullets.alive[i] = 1;
      w.bullets.x[i] = w.zombies.x[i] ?? 0;
      w.bullets.y[i] = w.zombies.y[i] ?? 0;
      w.bullets.vx[i] = 0;
      w.bullets.vy[i] = 0;
      w.bHit[i] = -1;
    }
    step(w, idle);
    expect(w.kills).toBeGreaterThan(0);
    expect(w.ult).toBe(w.kills);
    w.ult = ULT_NEED;
    fodder(w, 3);
    step(w, { dx: 0, dy: 0, pick: 0, ult: 1 });
    let alive = 0;
    for (let i = 0; i < 3; i++) if (w.zombies.alive[i]) alive++;
    expect(alive).toBe(0);
    expect(w.ult).toBe(0);
  });
});
