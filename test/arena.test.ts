import {
  ARENA_H, ARENA_W, ARENA_WALL, BLAST_R, CLEAR, MAX_OBS, OBS_BARREL, OBS_CARRIAGE, OBS_CRATE,
  OBS_GEAR, OBS_PIPE, OBS_VENT, PLAYER_R, VENT_CYCLE, bodyR, createArena, obstacleAt,
} from "../src/sim/arena";
import { followCam, createCam, snapCam } from "../src/render/camera";
import { edgeMark, markX, markY } from "../src/render/markers";
import { step } from "../src/sim/step.hot";
import { H, W, EV_BOOM, EV_HURT, Z_SHAMBLER, type Input, type World } from "../src/sim/types";
import { createWorld } from "../src/sim/world";

const idle = (): Input => ({ dx: 0, dy: 0, pick: 0 });
const freeze = (w: World): void => { w.toSpawn = 99; w.spawnCd = 99999; w.wave = 1; w.fireCd = 99999; };
const wipe = (w: World): void => {
  const a = w.arena;
  for (let i = 0; i < MAX_OBS; i++) a.alive[i] = 0;
  a.n = 0;
};
const put = (w: World, kind: number, x: number, y: number, hw: number, hh: number, phase = 0, hp = 1): number => {
  const a = w.arena;
  const i = a.n;
  a.x[i] = x;
  a.y[i] = y;
  a.hw[i] = hw;
  a.hh[i] = hh;
  a.kind[i] = kind;
  a.hp[i] = hp;
  a.alive[i] = 1;
  a.phase[i] = phase;
  a.n = i + 1;
  return i;
};
const sig = (seed: number): string => {
  const a = createArena(seed);
  let s = String(a.n);
  for (let i = 0; i < a.n; i++) {
    s += `|${a.kind[i]},${a.x[i]},${a.y[i]},${a.hw[i]},${a.hh[i]},${a.phase[i]},${a.hp[i]}`;
  }
  return s;
};

describe("arena layout", () => {
  it("is four times the screen and walled", () => {
    expect(ARENA_W * ARENA_H).toBe(W * H * 4);
    expect(ARENA_W).toBeGreaterThan(W);
    expect(ARENA_H).toBeGreaterThan(H);
    expect(ARENA_WALL).toBeGreaterThan(0);
  });
  it("places the same props for a seed and different props for another", () => {
    expect(sig(42)).toBe(sig(42));
    expect(sig(1)).not.toBe(sig(2));
  });
  it("keeps every prop kind inside the walls and out of the spawn clear", () => {
    const a = createArena(7);
    const seen = new Set<number>();
    expect(a.n).toBeGreaterThan(40);
    const cx = ARENA_W / 2;
    const cy = ARENA_H / 2;
    for (let i = 0; i < a.n; i++) {
      const kind = a.kind[i] ?? 0;
      seen.add(kind);
      const x = a.x[i] ?? 0;
      const y = a.y[i] ?? 0;
      const hw = a.hw[i] ?? 0;
      const hh = a.hh[i] ?? 0;
      expect(x - hw).toBeGreaterThanOrEqual(ARENA_WALL);
      expect(x + hw).toBeLessThanOrEqual(ARENA_W - ARENA_WALL);
      expect(y - hh).toBeGreaterThanOrEqual(ARENA_WALL);
      expect(y + hh).toBeLessThanOrEqual(ARENA_H - ARENA_WALL);
      const clearX = Math.abs(x - cx) - hw;
      const clearY = Math.abs(y - cy) - hh;
      expect(clearX >= CLEAR - 0.01 || clearY >= CLEAR - 0.01).toBe(true);
      if (kind === OBS_BARREL) expect(a.hp[i]).toBe(1);
    }
    expect(seen.has(OBS_PIPE)).toBe(true);
    expect(seen.has(OBS_CRATE)).toBe(true);
    expect(seen.has(OBS_CARRIAGE)).toBe(true);
    expect(seen.has(OBS_VENT)).toBe(true);
    expect(seen.has(OBS_GEAR)).toBe(true);
    expect(seen.has(OBS_BARREL)).toBe(true);
    for (let i = 0; i < a.n; i++) {
      for (let j = i + 1; j < a.n; j++) {
        const dx = Math.abs((a.x[i] ?? 0) - (a.x[j] ?? 0));
        const dy = Math.abs((a.y[i] ?? 0) - (a.y[j] ?? 0));
        const hit = dx < (a.hw[i] ?? 0) + (a.hw[j] ?? 0) && dy < (a.hh[i] ?? 0) + (a.hh[j] ?? 0);
        expect(hit).toBe(false);
      }
    }
  });
});

describe("movement and cover", () => {
  it("stops the player on a pipe and on the arena wall", () => {
    const w = createWorld(3);
    freeze(w);
    wipe(w);
    put(w, OBS_PIPE, w.px + PLAYER_R + 20 + 1, w.py, 20, 8);
    const x0 = w.px;
    step(w, { dx: 1, dy: 0, pick: 0 });
    expect(w.px).toBe(x0);
    wipe(w);
    w.px = ARENA_W - 30;
    w.py = ARENA_H - 30;
    for (let t = 0; t < 40; t++) step(w, { dx: 1, dy: 1, pick: 0 });
    expect(w.px).toBeCloseTo(ARENA_W - ARENA_WALL - PLAYER_R, 4);
    expect(w.py).toBeCloseTo(ARENA_H - ARENA_WALL - PLAYER_R, 4);
  });
  it("stops a rivet on a pipe so the zombie behind it lives", () => {
    const w = createWorld(4);
    freeze(w);
    wipe(w);
    put(w, OBS_PIPE, w.px + 36, w.py, 8, 24);
    w.zombies.alive[0] = 1;
    w.zombies.kind[0] = Z_SHAMBLER;
    w.zombies.hp[0] = 5;
    w.zombies.vx[0] = 0;
    w.zombies.x[0] = w.px + 70;
    w.zombies.y[0] = w.py;
    w.bullets.alive[0] = 1;
    w.bullets.x[0] = w.px + 16;
    w.bullets.y[0] = w.py;
    w.bullets.vx[0] = 5;
    w.bullets.vy[0] = 0;
    w.bHit[0] = -1;
    for (let t = 0; t < 16; t++) step(w, idle());
    expect(w.zombies.hp[0]).toBe(5);
    expect(w.zombies.alive[0]).toBe(1);
    expect(w.bullets.alive[0]).toBe(0);
  });
  it("steers a zombie around a pipe instead of through it", () => {
    const w = createWorld(5);
    freeze(w);
    wipe(w);
    const pipeY = w.py - 40;
    put(w, OBS_PIPE, w.px, pipeY, 40, 6);
    w.zombies.alive[0] = 1;
    w.zombies.kind[0] = Z_SHAMBLER;
    w.zombies.hp[0] = 40;
    w.zombies.vx[0] = 1.2;
    w.zombies.x[0] = w.px;
    w.zombies.y[0] = w.py - 58;
    const x0 = w.zombies.x[0] ?? 0;
    for (let t = 0; t < 24; t++) step(w, idle());
    const x = w.zombies.x[0] ?? 0;
    const y = w.zombies.y[0] ?? 0;
    expect(Math.abs(x - x0)).toBeGreaterThan(4);
    expect(y).toBeLessThan(pipeY);
    expect(obstacleAt(w.arena, x, y, bodyR(Z_SHAMBLER))).toBe(-1);
  });
});

describe("hazards", () => {
  it("a steam vent damages on its puff and then waits", () => {
    const w = createWorld(6);
    freeze(w);
    wipe(w);
    put(w, OBS_VENT, w.px + 30, w.py, 8, 6, VENT_CYCLE - 1);
    w.zombies.alive[0] = 1;
    w.zombies.kind[0] = Z_SHAMBLER;
    w.zombies.hp[0] = 6;
    w.zombies.vx[0] = 0;
    w.zombies.x[0] = w.px + 30;
    w.zombies.y[0] = w.py + 12;
    const hp = w.hp;
    step(w, idle());
    expect(w.events[EV_HURT]).toBe(1);
    expect(w.hp).toBe(hp - 1);
    expect(w.zombies.hp[0]).toBe(5);
    const zhp = w.zombies.hp[0];
    const php = w.hp;
    step(w, idle());
    expect(w.hp).toBe(php);
    expect(w.zombies.hp[0]).toBe(zhp);
  });
  it("a shot barrel explodes, hurts a nearby zombie, and chains", () => {
    const w = createWorld(8);
    freeze(w);
    wipe(w);
    put(w, OBS_BARREL, w.px + 64, w.py, 8, 8, 0, 1);
    put(w, OBS_BARREL, w.px + 64 + 36, w.py, 8, 8, 0, 1);
    w.zombies.alive[0] = 1;
    w.zombies.kind[0] = Z_SHAMBLER;
    w.zombies.hp[0] = 20;
    w.zombies.vx[0] = 0;
    w.zombies.x[0] = w.px + 64;
    w.zombies.y[0] = w.py + 24;
    w.bullets.alive[0] = 1;
    w.bullets.x[0] = w.px + 40;
    w.bullets.y[0] = w.py;
    w.bullets.vx[0] = 5;
    w.bullets.vy[0] = 0;
    w.bHit[0] = -1;
    let boom = 0;
    for (let t = 0; t < 14; t++) {
      step(w, idle());
      if (w.events[EV_BOOM]) boom = 1;
    }
    expect(boom).toBe(1);
    expect(w.arena.alive[0]).toBe(0);
    expect(w.arena.alive[1]).toBe(0);
    expect(w.zombies.hp[0] ?? 0).toBeLessThan(20);
    expect(w.hp).toBe(5);
    expect(36).toBeLessThan(BLAST_R);
  });
});

describe("camera and off-screen markers", () => {
  it("eases toward the player and stays inside the map", () => {
    const cam = createCam();
    snapCam(cam, ARENA_W / 2, ARENA_H / 2);
    expect(cam.x).toBeCloseTo((ARENA_W - W) / 2);
    expect(cam.y).toBeCloseTo((ARENA_H - H) / 2);
    const x0 = cam.x;
    followCam(cam, ARENA_W / 2 + 180, ARENA_H / 2);
    expect(cam.x).toBeGreaterThan(x0);
    expect(cam.x).toBeLessThan(x0 + 180);
    for (let i = 0; i < 90; i++) followCam(cam, ARENA_W / 2 + 180, ARENA_H / 2);
    expect(cam.x).toBeCloseTo((ARENA_W - W) / 2 + 180, 0);
    expect(cam.x).toBeGreaterThanOrEqual(0);
    expect(cam.x).toBeLessThanOrEqual(ARENA_W - W);
    snapCam(cam, 0, 0);
    expect(cam.x).toBe(0);
    expect(cam.y).toBe(0);
    snapCam(cam, ARENA_W, ARENA_H);
    expect(cam.x).toBe(ARENA_W - W);
    expect(cam.y).toBe(ARENA_H - H);
  });
  it("pins an off-screen zombie to the screen edge and ignores one in view", () => {
    const camX = ARENA_W / 2 - W / 2;
    const camY = ARENA_H / 2 - H / 2;
    const px = ARENA_W / 2;
    const py = ARENA_H / 2;
    expect(edgeMark(camX, camY, px, py, px + 10, py)).toBe(false);
    expect(edgeMark(camX, camY, px, py, px + 400, py)).toBe(true);
    expect(markX()).toBeCloseTo(W - 16, 4);
    expect(markY()).toBeCloseTo(H / 2, 4);
    expect(edgeMark(camX, camY, px, py, px, py - 300)).toBe(true);
    expect(markY()).toBeCloseTo(42, 4);
    expect(markX()).toBeCloseTo(W / 2, 4);
    expect(edgeMark(camX, camY, px, py, px + 400, py - 300)).toBe(true);
    expect(markY()).toBeCloseTo(42, 4);
    expect(markX()).toBeGreaterThan(W / 2);
    expect(markX()).toBeLessThan(W - 16);
  });
});
