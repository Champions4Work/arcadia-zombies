import { chaseZombie } from "../src/sim/arena.hot";
import { step } from "../src/sim/step.hot";
import type { Input, World } from "../src/sim/types";
import { createWorld } from "../src/sim/world";
import { KIND_GRATE, TILE, ventSlow, groundCols, groundKind, groundRows } from "../src/render/ground";

const right: Input = { dx: 1, dy: 0, pick: 0 };

function hold(w: World): void {
  w.toSpawn = 99;
  w.spawnCd = 99999;
  w.wave = 1;
  w.fireCd = 99999;
  w.hurtCd = 999999;
  w.hp = 80;
  w.maxHp = 80;
  w.arena.obsAlive.fill(0);
}

function firstGrate(): { x: number; y: number } | null {
  const cols = groundCols();
  const rows = groundRows();
  for (let r = 12; r < rows - 4; r++) {
    for (let c = 8; c < cols - 8; c++) {
      if (groundKind(c, r) !== KIND_GRATE) continue;
      return { x: c * TILE + 8, y: r * TILE + 8 };
    }
  }
  return null;
}

describe("vent slow on the floor", () => {
  it("cuts player slide and zombie chase to 0.55 on a grate", () => {
    const grate = firstGrate();
    expect(grate).not.toBeNull();
    const gx = grate?.x ?? 0;
    const gy = grate?.y ?? 0;
    expect(ventSlow(gx, gy)).toBe(0.55);

    const slow = createWorld(21);
    hold(slow);
    slow.px = gx;
    slow.py = gy;
    step(slow, right);
    const slowDx = slow.px - gx;

    const open = createWorld(21);
    hold(open);
    open.px = 480;
    open.py = 320;
    step(open, right);
    const openDx = open.px - 480;
    expect(openDx).toBeGreaterThan(0);
    expect(slowDx / openDx).toBeCloseTo(0.55, 4);

    const chaser = createWorld(22);
    hold(chaser);
    chaser.px = gx + 80;
    chaser.py = gy;
    chaser.zombies.alive[0] = 1;
    chaser.zombies.kind[0] = 0;
    chaser.zombies.x[0] = gx;
    chaser.zombies.y[0] = gy;
    chaser.zombies.vx[0] = 2;
    chaseZombie(chaser, 0);
    expect((chaser.zombies.x[0] ?? 0) - gx).toBeCloseTo(1.1, 4);

    const runner = createWorld(22);
    hold(runner);
    runner.px = 560;
    runner.py = 320;
    runner.zombies.alive[0] = 1;
    runner.zombies.kind[0] = 0;
    runner.zombies.x[0] = 480;
    runner.zombies.y[0] = 320;
    runner.zombies.vx[0] = 2;
    chaseZombie(runner, 0);
    expect((runner.zombies.x[0] ?? 0) - 480).toBeCloseTo(2, 4);
  });
});
