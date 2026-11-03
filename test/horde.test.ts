import { ARENA_H, ARENA_W } from "../src/sim/arena";
import { Z_ELITE, Z_KNIGHT, foeHitR2 } from "../src/sim/foes";
import { SAW_HIT_R2, sawAngle, sawRadius } from "../src/sim/progress";
import { GRID_CELL, GRID_COLS, GRID_PAD, GRID_ROWS } from "../src/sim/grid";
import { beginQuery, nextQuery, rebuildZombieGrid } from "../src/sim/grid.hot";
import { fillHorde, HORDE_BULLETS, HORDE_ZOMBIES } from "../src/sim/horde";
import { snapshot } from "../src/sim/run";
import { step } from "../src/sim/step.hot";
import { H, MAX_BULLETS, MAX_ZOMBIES, W, Z_BRUTE, Z_GHOUL, Z_SHAMBLER, type Input, type World } from "../src/sim/types";
import { createWorld } from "../src/sim/world";
import { composeHorde } from "../src/render/blit.hot";
import { offScreen, shouldBlitHorde } from "../src/render/cull";
import { fpsEnabled, fpsReadout, noteFrame, resetFps, toggleFps, toggleFromKey } from "../src/render/fps";
import { bg, buildSprites, zombieSprite } from "../src/render/horde-sprites";

const idle: Input = { dx: 0, dy: 0, pick: 0 };
const frame = new Uint32Array(W * H);

function aliveCount(flag: Uint8Array, n: number): number {
  let k = 0;
  for (let i = 0; i < n; i++) if (flag[i]) k++;
  return k;
}

function hold(w: World): void {
  w.toSpawn = 0;
  w.spawnCd = 99999;
  w.fireCd = 99999;
  w.hurtCd = 99999;
  w.over = false;
  w.choosing = 0;
}

function queryAt(x: number, y: number): number[] {
  beginQuery(x, y);
  const got: number[] = [];
  for (;;) {
    const i = nextQuery();
    if (i < 0) break;
    got.push(i);
  }
  return got;
}

describe("horde capacity", () => {
  it("stores at least 1500 zombies and 1000 projectiles in typed pools", () => {
    expect(MAX_ZOMBIES).toBeGreaterThanOrEqual(HORDE_ZOMBIES);
    expect(MAX_BULLETS).toBeGreaterThanOrEqual(HORDE_BULLETS);
    expect(HORDE_ZOMBIES).toBe(1500);
    expect(HORDE_BULLETS).toBe(1000);
    const w = createWorld(1);
    expect(w.zombies.x).toBeInstanceOf(Float32Array);
    expect(w.zombies.y).toBeInstanceOf(Float32Array);
    expect(w.zombies.alive).toBeInstanceOf(Uint8Array);
    expect(w.bullets.vx).toBeInstanceOf(Float32Array);
    expect(w.zombies.x.length).toBe(MAX_ZOMBIES);
    expect(w.bullets.x.length).toBe(MAX_BULLETS);
    w.bGun[3] = 4;
    w.bLife[3] = 12;
    w.bRad[3] = 66;
    fillHorde(w);
    expect(aliveCount(w.zombies.alive, MAX_ZOMBIES)).toBe(HORDE_ZOMBIES);
    expect(aliveCount(w.bullets.alive, MAX_BULLETS)).toBe(HORDE_BULLETS);
    expect(w.bGun[3]).toBe(0);
    expect(w.bLife[3]).toBe(0);
    expect(w.bRad[3]).toBe(0);
    expect(w.bullets.alive[3]).toBe(1);
  });

  it("keeps the broadphase cell larger than a brute, elite knight, or saw hit", () => {
    expect(Math.sqrt(foeHitR2(Z_BRUTE))).toBeLessThan(GRID_CELL);
    expect(Math.sqrt(foeHitR2(Z_KNIGHT | Z_ELITE))).toBeLessThan(GRID_CELL);
    expect(Math.sqrt(SAW_HIT_R2)).toBeLessThan(GRID_CELL);
  });
});

describe("spatial hash", () => {
  it("returns nearby zombies in ascending index order and skips a far one", () => {
    const w = createWorld(1);
    w.zombies.alive[3] = 1;
    w.zombies.x[3] = 10;
    w.zombies.y[3] = 40;
    w.zombies.alive[1] = 1;
    w.zombies.x[1] = 40;
    w.zombies.y[1] = 40;
    w.zombies.alive[2] = 1;
    w.zombies.x[2] = 12;
    w.zombies.y[2] = 44;
    w.zombies.alive[9] = 1;
    w.zombies.x[9] = 400;
    w.zombies.y[9] = 280;
    rebuildZombieGrid(w.zombies.alive, w.zombies.x, w.zombies.y, MAX_ZOMBIES);
    expect(queryAt(24, 40)).toEqual([1, 2, 3]);
  });

  it("keeps a far-arena zombie out of the near-screen cell", () => {
    expect(GRID_COLS * GRID_CELL).toBeGreaterThanOrEqual(ARENA_W + GRID_PAD);
    expect(GRID_ROWS * GRID_CELL).toBeGreaterThanOrEqual(ARENA_H + GRID_PAD);
    const w = createWorld(1);
    w.zombies.alive[0] = 1;
    w.zombies.x[0] = 600;
    w.zombies.y[0] = 100;
    w.zombies.alive[1] = 1;
    w.zombies.x[1] = ARENA_W - 40;
    w.zombies.y[1] = ARENA_H - 40;
    rebuildZombieGrid(w.zombies.alive, w.zombies.x, w.zombies.y, MAX_ZOMBIES);
    expect(queryAt(600, 100)).toEqual([0]);
    expect(queryAt(ARENA_W - 40, ARENA_H - 40)).toEqual([1]);
  });

  it("damages a brute across a diagonal cell and not a far decoy", () => {
    const w = createWorld(3);
    hold(w);
    for (let i = 0; i < 300; i++) {
      w.zombies.alive[i] = 1;
      w.zombies.x[i] = 360;
      w.zombies.y[i] = 30 + (i % 8);
      w.zombies.hp[i] = 6;
      w.zombies.kind[i] = Z_SHAMBLER;
      w.zombies.vx[i] = 0;
    }
    const brute = 300;
    w.zombies.alive[brute] = 1;
    w.zombies.x[brute] = 22;
    w.zombies.y[brute] = 22;
    w.zombies.hp[brute] = 6;
    w.zombies.kind[brute] = Z_BRUTE;
    w.zombies.vx[brute] = 0;
    w.bullets.alive[0] = 1;
    w.bullets.x[0] = 32;
    w.bullets.y[0] = 32;
    w.bullets.vx[0] = 0;
    w.bullets.vy[0] = 0;
    w.bHit[0] = -1;
    step(w, idle);
    expect(w.zombies.hp[brute]).toBe(5);
    expect(w.zombies.hp[0]).toBe(6);
    expect(w.bullets.alive[0]).toBe(0);
  });

  it("lands a stacked rivet on the lower index", () => {
    const w = createWorld(4);
    hold(w);
    w.zombies.alive[4] = 1;
    w.zombies.x[4] = 200;
    w.zombies.y[4] = 80;
    w.zombies.hp[4] = 5;
    w.zombies.vx[4] = 0;
    w.zombies.alive[2] = 1;
    w.zombies.x[2] = 200;
    w.zombies.y[2] = 80;
    w.zombies.hp[2] = 5;
    w.zombies.vx[2] = 0;
    w.bullets.alive[0] = 1;
    w.bullets.x[0] = 200;
    w.bullets.y[0] = 80;
    w.bullets.vx[0] = 0;
    w.bullets.vy[0] = 0;
    w.bHit[0] = -1;
    step(w, idle);
    expect(w.zombies.hp[2]).toBe(4);
    expect(w.zombies.hp[4]).toBe(5);
    expect(w.bullets.alive[0]).toBe(0);
  });

  it("still cuts the zombie under a saw when the arena is crowded", () => {
    const w = createWorld(8);
    hold(w);
    w.upgrades[2] = 1;
    w.tick = 3;
    for (let i = 0; i < 80; i++) {
      w.zombies.alive[i] = 1;
      w.zombies.x[i] = 20;
      w.zombies.y[i] = 20;
      w.zombies.hp[i] = 4;
      w.zombies.vx[i] = 0;
    }
    const saw = 90;
    const arc = sawAngle(4, 0, 1);
    const reach = sawRadius(w);
    w.zombies.alive[saw] = 1;
    w.zombies.x[saw] = w.px + Math.cos(arc) * reach;
    w.zombies.y[saw] = w.py + Math.sin(arc) * reach;
    w.zombies.hp[saw] = 4;
    w.zombies.vx[saw] = 0;
    step(w, idle);
    expect(w.tick).toBe(4);
    expect(w.zombies.hp[saw]).toBeLessThan(4);
    expect(w.zombies.hp[0]).toBe(4);
  });

  it("matches a linear scan for every foe, including an elite knight", () => {
    const w = createWorld(42);
    const z = w.zombies;
    const n = 480;
    for (let i = 0; i < n; i++) {
      z.alive[i] = 1;
      z.x[i] = (i * 37) % (W + 80) - 40;
      z.y[i] = (i * 19) % (H + 80) - 40;
      const kind = i % 7;
      z.kind[i] = i % 5 === 0 ? kind | Z_ELITE : kind;
      z.hp[i] = 20;
      z.vx[i] = 0;
    }
    rebuildZombieGrid(z.alive, z.x, z.y, MAX_ZOMBIES);
    for (let q = 0; q < 64; q++) {
      const x = (q * 53) % W;
      const y = (q * 29) % H;
      const linear: number[] = [];
      for (let i = 0; i < n; i++) {
        const dx = (z.x[i] ?? 0) - x;
        const dy = (z.y[i] ?? 0) - y;
        if (dx * dx + dy * dy < foeHitR2(z.kind[i] ?? 0)) linear.push(i);
      }
      beginQuery(x, y);
      const hashed: number[] = [];
      for (;;) {
        const i = nextQuery();
        if (i < 0) break;
        const dx = (z.x[i] ?? 0) - x;
        const dy = (z.y[i] ?? 0) - y;
        if (dx * dx + dy * dy < foeHitR2(z.kind[i] ?? 0)) hashed.push(i);
      }
      expect(hashed).toEqual(linear);
    }
  });
});

describe("horde drawing", () => {
  it("culls sprites outside the arena and keeps partial ones", () => {
    expect(offScreen(-40, 10, 36)).toBe(true);
    expect(offScreen(10, H + 40, 36)).toBe(true);
    expect(offScreen(W / 2, H / 2, 36)).toBe(false);
    expect(offScreen(-8, 40, 36)).toBe(false);
    expect(shouldBlitHorde(95, 10)).toBe(false);
    expect(shouldBlitHorde(96, 0)).toBe(true);
    expect(shouldBlitHorde(1, 80)).toBe(true);
    buildSprites();
    bg.fill(0);
    const w = createWorld(1);
    hold(w);
    w.arena.camX = 0;
    w.arena.camY = 0;
    w.zombies.alive[0] = 1;
    w.zombies.x[0] = -200;
    w.zombies.y[0] = -200;
    w.zombies.kind[0] = Z_SHAMBLER;
    w.bullets.alive[0] = 1;
    w.bullets.x[0] = W + 80;
    w.bullets.y[0] = -40;
    composeHorde(w, frame);
    let painted = 0;
    for (let i = 0; i < frame.length; i++) if (frame[i]) painted++;
    expect(painted).toBe(0);
    w.zombies.x[0] = 2;
    w.zombies.y[0] = 100;
    composeHorde(w, frame);
    painted = 0;
    for (let i = 0; i < frame.length; i++) if (frame[i]) painted++;
    expect(painted).toBeGreaterThan(8);
  });

  it("paints the nearer zombie over the one behind it", () => {
    buildSprites();
    bg.fill(0);
    const w = createWorld(2);
    hold(w);
    w.arena.camX = 0;
    w.arena.camY = 0;
    w.tick = 0;
    w.zombies.alive[0] = 1;
    w.zombies.kind[0] = Z_SHAMBLER;
    w.zombies.x[0] = 120;
    w.zombies.y[0] = 90;
    w.zombies.alive[1] = 1;
    w.zombies.kind[1] = Z_GHOUL;
    w.zombies.x[1] = 120;
    w.zombies.y[1] = 100;
    composeHorde(w, frame);
    const front = zombieSprite(Z_GHOUL, 0);
    const dx = (120 - front.ox) | 0;
    const dy = (100 - front.oy) | 0;
    let matched = 0;
    for (let y = 0; y < front.h; y++) {
      const py = dy + y;
      if (py < 0 || py >= H) continue;
      for (let x = 0; x < front.w; x++) {
        const px = dx + x;
        if (px < 0 || px >= W) continue;
        const src = front.pix[y * front.w + x] ?? 0;
        if (!src) continue;
        expect(frame[py * W + px]).toBe(src);
        matched++;
      }
    }
    expect(matched).toBeGreaterThan(8);
  });

  it("blits the camera window instead of the world origin", () => {
    buildSprites();
    bg.fill(0);
    const w = createWorld(5);
    hold(w);
    w.tick = 0;
    w.arena.camX = 400;
    w.arena.camY = 180;
    w.zombies.alive[0] = 1;
    w.zombies.kind[0] = Z_SHAMBLER;
    w.zombies.x[0] = 480;
    w.zombies.y[0] = 250;
    composeHorde(w, frame);
    const spr = zombieSprite(Z_SHAMBLER, 0);
    const dx = (80 - spr.ox) | 0;
    const dy = (70 - spr.oy) | 0;
    let matched = 0;
    for (let y = 0; y < spr.h; y++) {
      const py = dy + y;
      if (py < 0 || py >= H) continue;
      for (let x = 0; x < spr.w; x++) {
        const px = dx + x;
        if (px < 0 || px >= W) continue;
        const src = spr.pix[y * spr.w + x] ?? 0;
        if (!src) continue;
        expect(frame[py * W + px]).toBe(src);
        matched++;
      }
    }
    expect(matched).toBeGreaterThan(8);
    w.arena.camX = 0;
    w.arena.camY = 0;
    composeHorde(w, frame);
    expect(frame[dy * W + dx] ?? 0).toBe(0);
  });
});

describe("fps toggle", () => {
  it("arms from the F key and samples frames per second", () => {
    resetFps();
    expect(toggleFromKey("F", false)).toBe(true);
    expect(toggleFromKey("f", true)).toBe(false);
    expect(toggleFromKey("w", false)).toBe(false);
    expect(fpsEnabled()).toBe(false);
    expect(toggleFps()).toBe(true);
    expect(fpsReadout()).toBe(-1);
    noteFrame(1000);
    for (let i = 1; i <= 16; i++) noteFrame(1000 + i * 16);
    expect(fpsReadout()).toBe(63);
    expect(toggleFps()).toBe(false);
    expect(fpsEnabled()).toBe(false);
  });
});

describe("horde benchmark", () => {
  it("steps 1500 enemies and 1000 projectiles under the frame budget", () => {
    const w = createWorld(11);
    hold(w);
    const cols = 40;
    const rows = Math.ceil(HORDE_ZOMBIES / cols);
    const prime = (): void => {
      hold(w);
      for (let i = 0; i < HORDE_ZOMBIES; i++) {
        w.zombies.alive[i] = 1;
        w.zombies.x[i] = ((i % cols) + 0.5) * (W / cols);
        w.zombies.y[i] = (((i / cols) | 0) + 0.5) * (H / rows);
        w.zombies.hp[i] = 30000;
        w.zombies.kind[i] = i % 3;
        w.zombies.vx[i] = 0.45;
      }
      for (let j = 0; j < HORDE_BULLETS; j++) {
        w.bullets.alive[j] = 1;
        w.bullets.x[j] = (w.zombies.x[j] ?? 0) + 6;
        w.bullets.y[j] = w.zombies.y[j] ?? 0;
        w.bullets.vx[j] = j & 1 ? 5 : -5;
        w.bullets.vy[j] = 0;
        w.bHit[j] = -1;
        w.bPierce[j] = 0;
      }
    };
    for (let i = 0; i < 8; i++) {
      prime();
      step(w, idle);
    }
    const steps = 20;
    let total = 0;
    for (let i = 0; i < steps; i++) {
      prime();
      const mark = w.bullets.x[0] ?? 0;
      const t0 = performance.now();
      step(w, idle);
      total += performance.now() - t0;
      expect(w.over).toBe(false);
      expect(w.choosing).toBe(0);
      expect(aliveCount(w.zombies.alive, HORDE_ZOMBIES)).toBe(HORDE_ZOMBIES);
      const moved = (w.bullets.x[0] ?? 0) !== mark || w.bullets.alive[0] === 0;
      expect(moved).toBe(true);
    }
    const per = total / steps;
    expect(per).toBeLessThan(12);
  });

  it("composites a full horde into one frame buffer under the frame budget", () => {
    buildSprites();
    bg.fill(0x0a0704ff);
    const w = createWorld(12);
    hold(w);
    const cols = 40;
    const rows = Math.ceil(HORDE_ZOMBIES / cols);
    for (let i = 0; i < HORDE_ZOMBIES; i++) {
      w.zombies.alive[i] = 1;
      w.zombies.x[i] = ((i % cols) + 0.5) * (W / cols);
      w.zombies.y[i] = (((i / cols) | 0) + 0.5) * (H / rows);
      w.zombies.kind[i] = i % 3;
    }
    for (let j = 0; j < HORDE_BULLETS; j++) {
      w.bullets.alive[j] = 1;
      w.bullets.x[j] = (j * 17) % W;
      w.bullets.y[j] = (j * 13) % H;
      w.bullets.vx[j] = 5;
      w.bullets.vy[j] = 0;
    }
    for (let i = 0; i < 3; i++) composeHorde(w, frame);
    const t0 = performance.now();
    composeHorde(w, frame);
    expect(performance.now() - t0).toBeLessThan(12);
    let painted = 0;
    for (let i = 0; i < frame.length; i++) if ((frame[i] ?? 0) !== 0) painted++;
    expect(painted).toBe(W * H);
  });

  it("stays deterministic across two hordes with the same seed", () => {
    const run = (): { score: number; hp: number; xs: number[] } => {
      const w = createWorld(99);
      fillHorde(w, 180, 180);
      const input: Input = { dx: 1, dy: 0, pick: 1 };
      for (let t = 0; t < 30; t++) step(w, input);
      return { score: snapshot(w).score, hp: w.hp, xs: Array.from(w.zombies.x.slice(0, 180)) };
    };
    expect(run()).toEqual(run());
  });
});
