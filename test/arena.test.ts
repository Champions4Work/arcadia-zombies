import {
  ARENA_H, ARENA_W, BARREL_HP, CLEAR_R, EDGE_PAD, HEAL_HP, MINI_H, MINI_W, MINI_X, MINI_Y,
  MIN_SPAWN_R, OB_BARREL, OB_BOILER, OB_CRATE, OB_GEAR, OB_PIPE, PROP_CELL, PROP_COLS, SPAWN_BOT, SPAWN_INSET, SPAWN_MARGIN,
  SPAWN_TOP,
  TELE_LIFE, arrowTip, edgePoint, hitsProp, miniDot, showsArrow,
} from "../src/sim/arena";
import { step } from "../src/sim/step.hot";
import {
  H, MAX_ZOMBIES, W, Z_BRUTE, Z_GHOUL, Z_SHAMBLER, type Input, type World,
} from "../src/sim/types";
import { PACK, Z_ELITE, Z_KIND, Z_RAT } from "../src/sim/foes";
import { createWorld } from "../src/sim/world";

const idle = (pick = 0): Input => ({ dx: 0, dy: 0, pick });
const freeze = (w: World): void => {
  w.toSpawn = 99;
  w.spawnCd = 99999;
  w.wave = 1;
  w.fireCd = 99999;
  w.hurtCd = 999999;
  w.hp = 80;
  w.maxHp = 80;
};
const clearProps = (w: World): void => { w.arena.obsAlive.fill(0); };
const expectInView = (w: World, x: number, y: number): void => {
  const sx = x - w.arena.camX;
  const sy = y - w.arena.camY;
  expect(x).toBeGreaterThanOrEqual(w.arena.camX - SPAWN_MARGIN);
  expect(x).toBeLessThanOrEqual(w.arena.camX + W + SPAWN_MARGIN);
  expect(y).toBeGreaterThanOrEqual(w.arena.camY - SPAWN_MARGIN);
  expect(y).toBeLessThanOrEqual(w.arena.camY + H + SPAWN_MARGIN);
  expect(sx).toBeGreaterThanOrEqual(SPAWN_INSET - 1);
  expect(sx).toBeLessThanOrEqual(W - SPAWN_INSET + 1);
  expect(sy).toBeGreaterThanOrEqual(SPAWN_TOP - 1);
  expect(sy).toBeLessThanOrEqual(H - SPAWN_BOT + 1);
  const onRadar = (sx - 48) * (sx - 48) + (sy - 262) * (sy - 262) <= 38 * 38;
  const onRack = sy >= 278 && sx >= 96 && sx <= 380;
  expect(onRadar).toBe(false);
  expect(onRack).toBe(false);
  expect(Math.hypot(x - w.px, y - w.py)).toBeGreaterThanOrEqual(MIN_SPAWN_R - 0.05);
};
const projectTele = (w: World, buf: Float32Array): number => {
  let n = 0;
  for (let i = 0; i < w.arena.teleAlive.length; i++) {
    if (!w.arena.teleAlive[i]) continue;
    edgePoint(w.arena.camX, w.arena.camY, w.arena.teleEdge[i] ?? 0, w.arena.teleU[i] ?? 0, buf);
    expectInView(w, buf[0] ?? 0, buf[1] ?? 0);
    n++;
  }
  return n;
};

describe("scrolling arena", () => {
  it("is about four times the screen", () => {
    expect(ARENA_W * ARENA_H).toBe(W * H * 4);
    expect(ARENA_W).toBeGreaterThan(W);
    expect(ARENA_H).toBeGreaterThan(H);
  });
  it("lays out the same props for the same seed", () => {
    const a = createWorld(42);
    const b = createWorld(42);
    expect(a.arena.obsN).toBeGreaterThan(20);
    expect(Array.from(a.arena.obsX)).toEqual(Array.from(b.arena.obsX));
    expect(Array.from(a.arena.obsY)).toEqual(Array.from(b.arena.obsY));
    expect(Array.from(a.arena.obsKind)).toEqual(Array.from(b.arena.obsKind));
    expect(Array.from(a.arena.obsAlive)).toEqual(Array.from(b.arena.obsAlive));
    const c = createWorld(99);
    expect(Array.from(a.arena.obsX)).not.toEqual(Array.from(c.arena.obsX));
  });
  it("places boilers, crates, pipes, gear piles, and barrels", () => {
    for (let seed = 1; seed <= 8; seed++) {
      const w = createWorld(seed);
      const n = [0, 0, 0, 0, 0];
      for (let i = 0; i < w.arena.obsN; i++) {
        if (!w.arena.obsAlive[i]) continue;
        n[w.arena.obsKind[i] ?? 0] = (n[w.arena.obsKind[i] ?? 0] ?? 0) + 1;
        const ox = w.arena.obsX[i] ?? 0;
        const oy = w.arena.obsY[i] ?? 0;
        const r = w.arena.obsR[i] ?? 0;
        const hw = w.arena.obsHW[i] ?? 0;
        const hh = w.arena.obsHH[i] ?? 0;
        let gap = 0;
        if (r > 0) gap = Math.hypot(ox - w.px, oy - w.py) - r;
        else {
          const ex = Math.max(0, Math.abs(ox - w.px) - hw);
          const ey = Math.max(0, Math.abs(oy - w.py) - hh);
          gap = Math.hypot(ex, ey);
        }
        expect(gap).toBeGreaterThan(CLEAR_R - 8);
      }
      expect(n[OB_BOILER]).toBeGreaterThan(0);
      expect(n[OB_CRATE]).toBeGreaterThan(0);
      expect(n[OB_PIPE]).toBeGreaterThan(0);
      expect(n[OB_GEAR]).toBeGreaterThan(0);
      expect(n[OB_BARREL]).toBeGreaterThan(0);
    }
  });
  it("blocks the player on solid props and slides along them", () => {
    const kinds = [OB_BOILER, OB_CRATE, OB_PIPE, OB_GEAR];
    for (const kind of kinds) {
      const w = createWorld(4);
      freeze(w);
      clearProps(w);
      w.arena.obsN = 1;
      w.arena.obsAlive[0] = 1;
      w.arena.obsKind[0] = kind;
      w.arena.obsX[0] = w.px + 36;
      w.arena.obsY[0] = w.py;
      if (kind === OB_PIPE) {
        w.arena.obsHW[0] = 8;
        w.arena.obsHH[0] = 28;
        w.arena.obsR[0] = 0;
      } else if (kind === OB_CRATE) {
        w.arena.obsHW[0] = 12;
        w.arena.obsHH[0] = 12;
        w.arena.obsR[0] = 0;
      } else if (kind === OB_BOILER) {
        w.arena.obsHW[0] = 16;
        w.arena.obsHH[0] = 16;
        w.arena.obsR[0] = 16;
      } else {
        w.arena.obsHW[0] = 14;
        w.arena.obsHH[0] = 14;
        w.arena.obsR[0] = 14;
      }
      const x0 = w.px;
      const y0 = w.py;
      for (let t = 0; t < 30; t++) step(w, { dx: 1, dy: 0, pick: 0 });
      const ox = w.arena.obsX[0] ?? 0;
      expect(w.px).toBeGreaterThan(x0 + 4);
      expect(w.px).toBeLessThan(ox);
      expect(hitsProp(w.px, w.py, 8, ox, w.arena.obsY[0] ?? 0, w.arena.obsHW[0] ?? 0, w.arena.obsHH[0] ?? 0, w.arena.obsR[0] ?? 0)).toBe(false);
      for (let t = 0; t < 20; t++) step(w, { dx: 1, dy: 1, pick: 0 });
      expect(w.py).toBeGreaterThan(y0 + 8);
      expect(w.px).toBeLessThan(ox);
    }
  });
  it("clamps the player inside the arena", () => {
    const w = createWorld(1);
    freeze(w);
    clearProps(w);
    for (let t = 0; t < 900; t++) step(w, { dx: 1, dy: 1, pick: 0 });
    expect(w.px).toBe(ARENA_W - EDGE_PAD);
    expect(w.py).toBe(ARENA_H - EDGE_PAD);
    for (let t = 0; t < 900; t++) step(w, { dx: -1, dy: -1, pick: 0 });
    expect(w.px).toBe(EDGE_PAD);
    expect(w.py).toBe(EDGE_PAD);
  });
  it("eases the camera toward the player and keeps it inside the arena", () => {
    const w = createWorld(2);
    freeze(w);
    const cam0 = w.arena.camX;
    w.px += 90;
    const tx = Math.min(ARENA_W - W, Math.max(0, w.px - W / 2));
    step(w, idle());
    expect(w.arena.camX).toBeGreaterThan(cam0 + 1);
    expect(w.arena.camX).toBeLessThan(tx - 1);
    for (let t = 0; t < 80; t++) step(w, idle());
    expect(Math.abs(w.arena.camX - tx)).toBeLessThan(0.2);
    w.px = EDGE_PAD;
    w.py = EDGE_PAD;
    for (let t = 0; t < 80; t++) step(w, idle());
    expect(w.arena.camX).toBe(0);
    expect(w.arena.camY).toBe(0);
    w.px = ARENA_W - EDGE_PAD;
    w.py = ARENA_H - EDGE_PAD;
    for (let t = 0; t < 80; t++) step(w, idle());
    expect(w.arena.camX).toBe(ARENA_W - W);
    expect(w.arena.camY).toBe(ARENA_H - H);
  });
});

describe("spawn telegraph", () => {
  it("holds a ground telegraph for 36 ticks before the zombie exists", () => {
    const w = createWorld(4);
    freeze(w);
    w.toSpawn = 1;
    w.spawnCd = 1;
    step(w, idle());
    expect(w.arena.lastN).toBe(0);
    let marked = 0;
    let life = 0;
    for (let i = 0; i < w.arena.teleAlive.length; i++) {
      if (!w.arena.teleAlive[i]) continue;
      marked++;
      life = w.arena.teleLeft[i] ?? 0;
    }
    expect(marked).toBe(1);
    expect(life).toBe(TELE_LIFE);
    expect(TELE_LIFE / 60).toBeCloseTo(0.6);
    for (let t = 0; t < TELE_LIFE - 1; t++) {
      step(w, idle());
      expect(w.arena.lastN).toBe(0);
    }
    step(w, idle());
    expect(w.arena.lastN).toBe(1);
    let puff = 0;
    for (let i = 0; i < w.fxKind.length; i++) if ((w.fxKind[i] ?? 0) === 3) puff++;
    expect(puff).toBeGreaterThan(0);
  });
  it("plants the telegraph on the visible edge", () => {
    const w = createWorld(6);
    freeze(w);
    clearProps(w);
    w.toSpawn = 1;
    w.spawnCd = 1;
    step(w, idle());
    const buf = new Float32Array(4);
    expect(projectTele(w, buf)).toBe(1);
    const x = buf[0] ?? 0;
    const y = buf[1] ?? 0;
    const sx = x - w.arena.camX;
    const sy = y - w.arena.camY;
    const onEdge = sy <= SPAWN_TOP + 1 || H - sy <= SPAWN_BOT + 1 || sx <= SPAWN_INSET + 1 || W - sx <= SPAWN_INSET + 1;
    expect(onEdge).toBe(true);
    expect(sy).toBeGreaterThanOrEqual(SPAWN_TOP - 1);
  });
  it("spawns inside the camera view plus margin and outside the player radius", () => {
    const buf = new Float32Array(4);
    const dirs = [
      { dx: 0, dy: 0 },
      { dx: 1, dy: 0 },
      { dx: -1, dy: 0.25 },
      { dx: 0.2, dy: 1 },
    ];
    for (const seed of [1, 2, 7, 11, 42]) {
      const w = createWorld(seed);
      freeze(w);
      w.toSpawn = 8;
      w.spawnCd = 1;
      let spawned = 0;
      for (let t = 0; t < 2500 && spawned < 6; t++) {
        const before = w.zombies.alive.slice();
        const dir = dirs[t % dirs.length] ?? idle();
        step(w, { dx: dir.dx, dy: dir.dy, pick: 0 });
        projectTele(w, buf);
        for (let i = 0; i < MAX_ZOMBIES; i++) {
          if (!w.zombies.alive[i] || before[i]) continue;
          expectInView(w, w.zombies.x[i] ?? 0, w.zombies.y[i] ?? 0);
          spawned++;
        }
      }
      expect(spawned).toBeGreaterThanOrEqual(6);
    }
  });
  it("does not spawn on a player pinned to the arena corner", () => {
    const w = createWorld(3);
    freeze(w);
    w.px = 12;
    w.py = 12;
    w.arena.camX = 0;
    w.arena.camY = 0;
    w.wave = 2;
    w.toSpawn = 4;
    w.spawnCd = 1;
    let n = 0;
    for (let t = 0; t < 900 && n < 3; t++) {
      const before = w.zombies.alive.slice();
      step(w, { dx: -1, dy: -1, pick: 0 });
      for (let i = 0; i < MAX_ZOMBIES; i++) {
        if (!w.zombies.alive[i] || before[i]) continue;
        expectInView(w, w.zombies.x[i] ?? 0, w.zombies.y[i] ?? 0);
        n++;
      }
    }
    expect(n).toBeGreaterThanOrEqual(3);
  });
  it("releases a whole pack from one telegraph inside the view", () => {
    const w = createWorld(5);
    freeze(w);
    w.rank = 3;
    w.arena.teleAlive[0] = 1;
    w.arena.teleLeft[0] = 1;
    w.arena.teleKind[0] = Z_RAT;
    w.arena.teleEdge[0] = 1;
    w.arena.teleU[0] = 0.35;
    step(w, idle());
    let rats = 0;
    for (let i = 0; i < MAX_ZOMBIES; i++) {
      if (!w.zombies.alive[i]) continue;
      expect((w.zombies.kind[i] ?? 0) & Z_KIND).toBe(Z_RAT);
      expectInView(w, w.zombies.x[i] ?? 0, w.zombies.y[i] ?? 0);
      rats++;
    }
    expect(rats).toBe(PACK[Z_RAT]);
    expect(w.arena.teleAlive[0]).toBe(0);
  });
});

describe("barrels and steering", () => {
  it("stops a rivet on a pipe", () => {
    const w = createWorld(8);
    freeze(w);
    clearProps(w);
    w.arena.obsN = 1;
    w.arena.obsAlive[0] = 1;
    w.arena.obsKind[0] = OB_PIPE;
    w.arena.obsX[0] = w.px + 36;
    w.arena.obsY[0] = w.py;
    w.arena.obsHW[0] = 12;
    w.arena.obsHH[0] = 12;
    w.arena.obsR[0] = 0;
    const z = 0;
    w.zombies.alive[z] = 1;
    w.zombies.x[z] = w.px + 80;
    w.zombies.y[z] = w.py;
    w.zombies.hp[z] = 5;
    w.zombies.vx[z] = 0;
    w.bullets.alive[0] = 1;
    w.bullets.x[0] = w.px + 36;
    w.bullets.y[0] = w.py;
    w.bullets.vx[0] = 0;
    w.bullets.vy[0] = 0;
    w.bHit[0] = -1;
    step(w, idle());
    expect(w.bullets.alive[0]).toBe(0);
    expect(w.zombies.hp[z]).toBe(5);
    expect(w.arena.obsAlive[0]).toBe(1);
  });
  it("stops a rivet on a pipe that only overlaps the next prop cell by its radius", () => {
    const w = createWorld(8);
    freeze(w);
    clearProps(w);
    w.arena.obsN = 1;
    w.arena.obsAlive[0] = 1;
    w.arena.obsKind[0] = OB_PIPE;
    w.arena.obsX[0] = PROP_CELL - 10;
    w.arena.obsY[0] = PROP_CELL * 0.5;
    w.arena.obsHW[0] = 9;
    w.arena.obsHH[0] = 9;
    w.arena.obsR[0] = 0;
    w.bullets.alive[0] = 1;
    w.bullets.x[0] = PROP_CELL;
    w.bullets.y[0] = PROP_CELL * 0.5;
    w.bullets.vx[0] = 0;
    w.bullets.vy[0] = 0;
    w.bHit[0] = -1;
    w.bullets.alive[1] = 1;
    w.bullets.x[1] = PROP_CELL + 14;
    w.bullets.y[1] = PROP_CELL * 0.5;
    w.bullets.vx[1] = 0;
    w.bullets.vy[1] = 0;
    w.bHit[1] = -1;
    step(w, idle());
    expect(w.bullets.alive[0]).toBe(0);
    expect(w.bullets.alive[1]).toBe(1);
    expect(w.arena.obsAlive[0]).toBe(1);
    expect(w.arena.propOverflow).toBe(0);
    const qx = PROP_CELL;
    const qy = PROP_CELL * 0.5;
    const cell = (qx / PROP_CELL) | 0;
    const row = (qy / PROP_CELL) | 0;
    let node = w.arena.propHead[cell + row * PROP_COLS] ?? -1;
    let found = 0;
    while (node >= 0) {
      if ((w.arena.propNode[node] ?? -1) === 0) found = 1;
      node = w.arena.propNext[node] ?? -1;
    }
    expect(found).toBe(1);
  });
  it("breaks a barrel into a small heal", () => {
    const w = createWorld(9);
    freeze(w);
    clearProps(w);
    w.arena.obsN = 1;
    w.arena.obsAlive[0] = 1;
    w.arena.obsKind[0] = OB_BARREL;
    w.arena.obsX[0] = w.px + 28;
    w.arena.obsY[0] = w.py;
    w.arena.obsHW[0] = 8;
    w.arena.obsHH[0] = 10;
    w.arena.obsR[0] = 9;
    w.arena.obsHp[0] = 1;
    expect(BARREL_HP).toBeGreaterThan(1);
    w.bullets.alive[0] = 1;
    w.bullets.x[0] = w.px + 28;
    w.bullets.y[0] = w.py;
    w.bullets.vx[0] = 0;
    w.bullets.vy[0] = 0;
    w.bHit[0] = -1;
    w.hp = 2;
    w.maxHp = 5;
    step(w, idle());
    expect(w.arena.obsAlive[0]).toBe(0);
    let slot = -1;
    for (let k = 0; k < w.arena.healAlive.length; k++) {
      if (w.arena.healAlive[k]) slot = k;
    }
    expect(slot).toBeGreaterThanOrEqual(0);
    w.arena.healX[slot] = w.px;
    w.arena.healY[slot] = w.py;
    step(w, idle());
    expect(w.hp).toBe(2 + HEAL_HP);
    expect(w.arena.healAlive[slot]).toBe(0);
    w.hp = w.maxHp;
    w.arena.healAlive[slot] = 1;
    w.arena.healX[slot] = w.px;
    w.arena.healY[slot] = w.py;
    step(w, idle());
    expect(w.hp).toBe(w.maxHp);
    expect(w.arena.healAlive[slot]).toBe(1);
  });
  it("breaks a boiler and a gear pylon without dropping a heal", () => {
    for (const kind of [OB_BOILER, OB_GEAR, OB_CRATE]) {
      const w = createWorld(11);
      freeze(w);
      clearProps(w);
      w.arena.obsN = 1;
      w.arena.obsAlive[0] = 1;
      w.arena.obsKind[0] = kind;
      w.arena.obsX[0] = w.px + 24;
      w.arena.obsY[0] = w.py;
      w.arena.obsHW[0] = 12;
      w.arena.obsHH[0] = 12;
      w.arena.obsR[0] = kind === OB_CRATE ? 0 : 12;
      w.arena.obsHp[0] = 1;
      w.bullets.alive[0] = 1;
      w.bullets.x[0] = w.px + 24;
      w.bullets.y[0] = w.py;
      w.bullets.vx[0] = 0;
      w.bullets.vy[0] = 0;
      w.bHit[0] = -1;
      step(w, idle());
      expect(w.arena.obsAlive[0]).toBe(0);
      expect(Array.from(w.arena.healAlive).some((v) => v === 1)).toBe(false);
    }
  });
  it("steers a zombie around a pipe wall and a boiler", () => {
    const wall = createWorld(12);
    freeze(wall);
    clearProps(wall);
    wall.arena.obsN = 1;
    wall.arena.obsAlive[0] = 1;
    wall.arena.obsKind[0] = OB_PIPE;
    wall.arena.obsX[0] = wall.px;
    wall.arena.obsY[0] = wall.py + 46;
    wall.arena.obsHW[0] = 32;
    wall.arena.obsHH[0] = 6;
    wall.arena.obsR[0] = 0;
    wall.zombies.alive[0] = 1;
    wall.zombies.kind[0] = Z_SHAMBLER;
    wall.zombies.x[0] = wall.px;
    wall.zombies.y[0] = wall.py + 90;
    wall.zombies.vx[0] = 1.2;
    wall.zombies.hp[0] = 30;
    const x0 = wall.zombies.x[0] ?? 0;
    const y0 = wall.zombies.y[0] ?? 0;
    const start = Math.hypot(x0 - wall.px, y0 - wall.py);
    let lateral = 0;
    for (let t = 0; t < 240; t++) {
      step(wall, idle());
      lateral = Math.max(lateral, Math.abs((wall.zombies.x[0] ?? 0) - x0));
    }
    const zx = wall.zombies.x[0] ?? 0;
    const zy = wall.zombies.y[0] ?? 0;
    expect(lateral).toBeGreaterThan(24);
    expect(Math.hypot(zx - wall.px, zy - wall.py)).toBeLessThan(start - 8);
    expect(hitsProp(zx, zy, 9, wall.arena.obsX[0] ?? 0, wall.arena.obsY[0] ?? 0, 32, 6, 0)).toBe(false);
    const boil = createWorld(13);
    freeze(boil);
    clearProps(boil);
    boil.arena.obsN = 1;
    boil.arena.obsAlive[0] = 1;
    boil.arena.obsKind[0] = OB_BOILER;
    boil.arena.obsR[0] = 16;
    boil.arena.obsHW[0] = 16;
    boil.arena.obsHH[0] = 16;
    boil.arena.obsX[0] = boil.px + 30;
    boil.arena.obsY[0] = boil.py;
    boil.zombies.alive[0] = 1;
    boil.zombies.x[0] = boil.px + 78;
    boil.zombies.y[0] = boil.py;
    boil.zombies.vx[0] = 1.1;
    boil.zombies.hp[0] = 30;
    const sx = boil.zombies.x[0] ?? 0;
    let rise = 0;
    for (let t = 0; t < 180; t++) {
      step(boil, idle());
      rise = Math.max(rise, Math.abs((boil.zombies.y[0] ?? 0) - boil.py));
    }
    expect(rise).toBeGreaterThan(10);
    expect(boil.zombies.x[0] ?? 0).toBeLessThan(sx);
    expect(hitsProp(
      boil.zombies.x[0] ?? 0, boil.zombies.y[0] ?? 0, 9,
      boil.arena.obsX[0] ?? 0, boil.arena.obsY[0] ?? 0, 16, 16, 16,
    )).toBe(false);
  });
});

describe("off-screen marks", () => {
  it("draws arrows only for elites", () => {
    expect(showsArrow(Z_SHAMBLER, -40, 80)).toBe(0);
    expect(showsArrow(Z_GHOUL, 900, -20)).toBe(0);
    expect(showsArrow(Z_BRUTE, -30, 100)).toBe(0);
    expect(showsArrow(Z_SHAMBLER | Z_ELITE, 120, 140)).toBe(0);
    expect(showsArrow(Z_BRUTE | Z_ELITE, -30, 100)).toBe(1);
    expect(showsArrow(Z_GHOUL | Z_ELITE, 100, 400)).toBe(1);
    const tip = new Float32Array(4);
    arrowTip(-40, 100, tip);
    expect(tip[0]).toBe(18);
    expect(tip[2]).toBeLessThan(0);
  });
  it("maps the arena into the minimap", () => {
    const out = new Float32Array(4);
    miniDot(0, 0, out);
    expect(out[0]).toBeCloseTo(MINI_X + 2);
    expect(out[1]).toBeCloseTo(MINI_Y + 2);
    miniDot(ARENA_W, ARENA_H, out);
    expect(out[0]).toBeCloseTo(MINI_X + MINI_W - 2);
    expect(out[1]).toBeCloseTo(MINI_Y + MINI_H - 2);
    expect(MINI_W).toBeLessThan(W / 4);
    expect(MINI_H).toBeLessThan(H / 4);
  });
});
