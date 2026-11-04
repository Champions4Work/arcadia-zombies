import {
  BOSS_BEHEMOTH, BOSS_EVERY, BOSS_GEAR, BOSS_KINDS, BOSS_TANK, BOSS_WARN, bossMaxHp, bossName, patternCount,
  MAX_BOSS_SHOTS, MAX_CLOUDS,
} from "../src/sim/boss";
import { bossSpeedMul } from "../src/sim/boss.hot";
import { drawBoss } from "../src/render/boss";
import { step } from "../src/sim/step.hot";
import { MAX_ZOMBIES, Z_GHOUL, type Input, type World } from "../src/sim/types";
import { createWorld } from "../src/sim/world";

const idle: Input = { dx: 0, dy: 0, pick: 0 };
const BANNED = ["#d5e4ea", "#e4e7ee", "#fff1c2"];

function hold(w: World): void {
  w.toSpawn = 80;
  w.spawnCd = 999999;
  w.fireCd = 999999;
  w.wave = 3;
}
function arm(kind: number, phase: number, mode: number, timer: number, tier = 1): World {
  const w = createWorld(1);
  hold(w);
  w.boss.on = 1;
  w.boss.kind = kind;
  w.boss.phase = phase;
  w.boss.mode = mode;
  w.boss.timer = timer;
  w.boss.tier = tier;
  w.boss.hp = 800;
  w.boss.maxHp = 800;
  w.boss.x = 70;
  w.boss.y = 160;
  w.px = 320;
  w.py = 160;
  return w;
}
function ghouls(w: World): number {
  let n = 0;
  for (let i = 0; i < MAX_ZOMBIES; i++) if (w.zombies.alive[i] && w.zombies.kind[i] === Z_GHOUL) n++;
  return n;
}
function shots(w: World): number {
  let n = 0;
  for (let i = 0; i < MAX_BOSS_SHOTS; i++) if ((w.boss.shotLife[i] ?? 0) > 0) n++;
  return n;
}
function clouds(w: World): number {
  let n = 0;
  for (let i = 0; i < MAX_CLOUDS; i++) if ((w.boss.cloudLife[i] ?? 0) > 0) n++;
  return n;
}
function livingKind(w: World, index: number): number {
  if ((w.boss.shotLife[index] ?? 0) <= 0) return -1;
  return w.boss.shotKind[index] ?? 0;
}
function shellVx(w: World): number {
  for (let i = 0; i < MAX_BOSS_SHOTS; i++) {
    if ((w.boss.shotLife[i] ?? 0) > 0) return w.boss.shotVx[i] ?? 0;
  }
  return 0;
}
function kindsAreShells(w: World): boolean {
  let n = 0;
  for (let i = 0; i < MAX_BOSS_SHOTS; i++) {
    const kind = livingKind(w, i);
    if (kind < 0) continue;
    if (kind !== 2) return false;
    n++;
  }
  return n > 0;
}
function anchorX(w: World, side: number): number {
  const b = w.boss;
  return b.x - b.aimX * 20 + (-b.aimY) * 14 * side;
}
function anchorY(w: World, side: number): number {
  const b = w.boss;
  return b.y - b.aimY * 20 + b.aimX * 14 * side;
}
function park(w: World): void {
  w.boss.x = 80;
  w.boss.y = 200;
  w.px = 900;
  w.py = 200;
  w.hp = 40;
  w.hurtCd = 2;
  w.shield = 0;
}

interface Paper {
  ctx: CanvasRenderingContext2D;
  seen: string[];
  lines: number[][];
  rects: { s: string; w: number; h: number }[];
  rotates: number;
  arcs: number;
}
function watch(): Paper {
  const seen: string[] = [];
  const lines: number[][] = [];
  const rects: { s: string; w: number; h: number }[] = [];
  let rotates = 0;
  let arcs = 0;
  let fillStyle = "";
  let strokeStyle = "";
  const ctx = new Proxy({} as CanvasRenderingContext2D, {
    get(_t, prop) {
      if (prop === "fillStyle") return fillStyle;
      if (prop === "strokeStyle") return strokeStyle;
      if (prop === "rotate") return () => { rotates++; };
      if (prop === "lineTo") return (x: number, y: number) => { lines.push([x, y]); };
      if (prop === "arc") return () => { arcs++; };
      if (prop === "createLinearGradient" || prop === "createRadialGradient") {
        return () => ({ addColorStop() {} });
      }
      if (prop === "fillRect") return (_x: number, _y: number, w: number, h: number) => {
        rects.push({ s: fillStyle, w, h });
      };
      return () => undefined;
    },
    set(_t, prop, value) {
      if (prop === "fillStyle") {
        fillStyle = String(value);
        seen.push(fillStyle);
      }
      if (prop === "strokeStyle") {
        strokeStyle = String(value);
        seen.push(strokeStyle);
      }
      return true;
    },
  });
  return { ctx, seen, lines, rects, get rotates() { return rotates; }, get arcs() { return arcs; } };
}
function clean(seen: string[]): boolean {
  for (let i = 0; i < seen.length; i++) {
    if (BANNED.indexOf(seen[i] ?? "") >= 0) return false;
  }
  return true;
}

describe("clockwork tank", () => {
  it("names the tank between the gearlord and the behemoth", () => {
    expect(bossName(BOSS_TANK)).toBe("CLOCKWORK TANK");
    expect(patternCount(BOSS_TANK)).toBe(3);
    expect(bossMaxHp(BOSS_TANK, 0, 0)).toBe(108);
    expect(bossMaxHp(BOSS_TANK, 0, 0)).toBeGreaterThan(bossMaxHp(BOSS_GEAR, 0, 0));
    expect(bossMaxHp(BOSS_TANK, 0, 0)).toBeLessThan(bossMaxHp(BOSS_BEHEMOTH, 0, 0));
    expect(BOSS_KINDS).toBe(4);
    expect(bossName(4)).toBe("BOSS");
  });

  it("warns as a tank at eight minutes and opens on a tread scar", () => {
    const w = createWorld(3);
    hold(w);
    const n = 3;
    w.boss.n = n;
    w.tick = (n + 1) * BOSS_EVERY - BOSS_WARN - 1;
    w.hp = 40;
    w.hurtCd = 3;
    step(w, idle);
    expect(w.boss.on).toBe(0);
    expect(w.boss.pending).toBe(1);
    expect(w.boss.warn).toBeGreaterThan(0);
    expect(w.boss.kind).toBe(BOSS_TANK);
    for (let i = 0; i < BOSS_EVERY && !w.boss.on; i++) {
      w.hp = 40;
      w.hurtCd = 3;
      step(w, idle);
    }
    expect(w.boss.on).toBe(1);
    expect(w.boss.kind).toBe(BOSS_TANK);
    expect(w.boss.phase).toBe(0);
    expect(w.boss.mode).toBe(1);
    expect(w.boss.timer).toBe(36);
    expect(w.boss.tier).toBe(16);
    expect(w.boss.maxHp).toBe(108 + 16 * 48 + 3 * 20);
  });

  it("drops two tread scars that are still burning after the cloud tick", () => {
    const w = arm(BOSS_TANK, 0, 1, 1, 1);
    const rng = w.rng.state;
    step(w, idle);
    expect(w.rng.state).toBe(rng);
    expect(clouds(w)).toBe(2);
    expect(w.boss.cloudX[0]).toBeCloseTo(anchorX(w, -1), 3);
    expect(w.boss.cloudY[0]).toBeCloseTo(anchorY(w, -1), 3);
    expect(w.boss.cloudX[1]).toBeCloseTo(anchorX(w, 1), 3);
    expect(w.boss.cloudY[1]).toBeCloseTo(anchorY(w, 1), 3);
    expect(w.boss.cloudLife[0]).toBe(119);
    expect(w.boss.cloudLife[1]).toBe(119);
    expect(w.boss.cloudR[0]).toBe(18);
    expect(w.boss.cloudR[1]).toBe(18);
    expect(shots(w)).toBe(0);
    expect(ghouls(w)).toBe(0);
    expect(w.boss.slam).toBe(0);
  });

  it("slows a player who steps onto a tread scar", () => {
    const w = arm(BOSS_TANK, 0, 1, 1, 1);
    step(w, idle);
    w.px = w.boss.cloudX[0] ?? 0;
    w.py = w.boss.cloudY[0] ?? 0;
    w.hp = 40;
    w.hurtCd = 0;
    step(w, idle);
    expect(bossSpeedMul(w)).toBeLessThan(1);
  });

  it("fires one shell below tier 8, two from tier 8, and three from tier 20", () => {
    const once = (tier: number): World => {
      const w = arm(BOSS_TANK, 1, 1, 1, tier);
      step(w, idle);
      return w;
    };
    const low = once(1);
    const mid = once(7);
    expect(low.boss.mode).toBe(0);
    expect(mid.boss.mode).toBe(0);
    expect(low.boss.vx).toBe(0);
    expect(mid.boss.vx).toBe(0);
    expect(shots(low)).toBe(1);
    expect(shots(mid)).toBe(1);
    expect(shellVx(low)).toBeGreaterThan(2);
    expect(shellVx(mid)).toBeGreaterThan(2);
    expect(kindsAreShells(low)).toBe(true);
    expect(kindsAreShells(mid)).toBe(true);
    expect(low.boss.slam).toBe(0);
    const burst = arm(BOSS_TANK, 1, 1, 1, 8);
    step(burst, idle);
    expect(burst.boss.mode).toBe(2);
    expect(shots(burst)).toBe(1);
    for (let i = 0; i < 12; i++) {
      burst.hp = 40;
      step(burst, idle);
    }
    expect(burst.boss.mode).toBe(0);
    expect(shots(burst)).toBe(2);
    expect(kindsAreShells(burst)).toBe(true);
    const heavy = arm(BOSS_TANK, 1, 1, 1, 20);
    step(heavy, idle);
    expect(heavy.boss.mode).toBe(2);
    for (let i = 0; i < 24; i++) {
      heavy.hp = 40;
      step(heavy, idle);
    }
    expect(heavy.boss.mode).toBe(0);
    expect(shots(heavy)).toBe(3);
    expect(kindsAreShells(heavy)).toBe(true);
  });

  it("lunges without a slam and hits only a player on the hull", () => {
    const w = arm(BOSS_TANK, 2, 1, 1, 1);
    step(w, idle);
    expect(w.boss.mode).toBe(2);
    expect(w.boss.vx).toBeGreaterThan(1.5);
    expect(w.boss.vx).toBeLessThan(3);
    expect(w.boss.slam).toBe(0);
    const x = w.boss.x;
    step(w, idle);
    expect(w.boss.x).toBeGreaterThan(x);
    expect(w.boss.slam).toBe(0);
    const aside = arm(BOSS_TANK, 2, 1, 1, 1);
    step(aside, idle);
    const ax = aside.boss.aimX;
    const ay = aside.boss.aimY;
    aside.px = aside.boss.x + (-ay) * 48;
    aside.py = aside.boss.y + ax * 48;
    aside.hp = 5;
    aside.hurtCd = 0;
    aside.shield = 0;
    for (let i = 0; i < 14; i++) step(aside, idle);
    expect(aside.hp).toBe(5);
    expect(aside.boss.slam).toBe(0);
    const hull = arm(BOSS_TANK, 2, 1, 1, 1);
    step(hull, idle);
    hull.px = hull.boss.x;
    hull.py = hull.boss.y;
    hull.hp = 5;
    hull.hurtCd = 0;
    hull.shield = 0;
    step(hull, idle);
    expect(hull.hp).toBeLessThan(5);
    expect(hull.boss.slam).toBe(0);
  });

  it("pins a leftward ram at the arena edge", () => {
    const w = arm(BOSS_TANK, 2, 1, 1, 1);
    w.boss.x = 50;
    w.boss.y = 160;
    w.px = 10;
    w.py = 160;
    w.hp = 40;
    step(w, idle);
    expect(w.boss.mode).toBe(2);
    expect(w.boss.vx).toBeLessThan(0);
    w.px = 400;
    w.py = 400;
    w.hp = 40;
    w.hurtCd = 3;
    for (let i = 0; i < 20 && w.boss.mode === 2; i++) step(w, idle);
    expect(w.boss.mode).toBe(0);
    expect(w.boss.x).toBe(36);
  });

  it("uses a 36 tick opening scar and later winds of 40, 36, and 34", () => {
    const w = arm(BOSS_TANK, 0, 1, 36, 1);
    park(w);
    expect(w.boss.timer).toBe(36);
    const winds: number[] = [];
    let prev = w.boss.phase;
    for (let i = 0; i < 400 && winds.length < 3; i++) {
      w.hp = 40;
      w.hurtCd = 2;
      step(w, idle);
      if (w.boss.mode === 1 && w.boss.phase !== prev) {
        winds.push(w.boss.timer);
        prev = w.boss.phase;
      }
    }
    expect(winds).toEqual([40, 36, 34]);
  });

  it("matches a second run for 200 ticks", () => {
    const a = arm(BOSS_TANK, 0, 1, 36, 1);
    const b = arm(BOSS_TANK, 0, 1, 36, 1);
    park(a);
    park(b);
    for (let i = 0; i < 200; i++) {
      a.hp = 40;
      b.hp = 40;
      step(a, idle);
      step(b, idle);
    }
    expect(a.boss.x).toBe(b.boss.x);
    expect(a.boss.y).toBe(b.boss.y);
    expect(a.boss.vx).toBe(b.boss.vx);
    expect(a.boss.vy).toBe(b.boss.vy);
    expect(a.boss.phase).toBe(b.boss.phase);
    expect(a.boss.mode).toBe(b.boss.mode);
    expect(a.boss.timer).toBe(b.boss.timer);
    expect(a.rng.state).toBe(b.rng.state);
    for (let i = 0; i < MAX_BOSS_SHOTS; i++) {
      expect(a.boss.shotKind[i]).toBe(b.boss.shotKind[i]);
      expect(a.boss.shotLife[i]).toBe(b.boss.shotLife[i]);
    }
  });

  it("paints a yawed hull, cinder scars, and copper shells", () => {
    const body = arm(BOSS_TANK, 1, 1, 20, 1);
    body.boss.x = 100;
    body.boss.y = 120;
    body.boss.aimX = 0.6;
    body.boss.aimY = 0.8;
    const drawn = watch();
    drawBoss(drawn.ctx, body, 1);
    expect(drawn.rotates).toBeGreaterThanOrEqual(1);
    const ex = 100 + 0.6 * 96;
    const ey = 120 + 0.8 * 96;
    let aimed = false;
    for (let i = 0; i < drawn.lines.length; i++) {
      const line = drawn.lines[i] ?? [0, 0];
      if (Math.abs((line[0] ?? 0) - ex) < 1e-6 && Math.abs((line[1] ?? 0) - ey) < 1e-6) aimed = true;
    }
    expect(aimed).toBe(true);
    expect(clean(drawn.seen)).toBe(true);
    expect(drawn.arcs).toBeGreaterThan(0);
    const scar = arm(BOSS_TANK, 0, 0, 10, 1);
    scar.boss.cloudX[0] = 40;
    scar.boss.cloudY[0] = 50;
    scar.boss.cloudR[0] = 18;
    scar.boss.cloudLife[0] = 80;
    const ash = watch();
    drawBoss(ash.ctx, scar, 0);
    expect(ash.seen.indexOf("#120c08")).toBeGreaterThanOrEqual(0);
    expect(ash.seen.indexOf("#ff5a1a")).toBeGreaterThanOrEqual(0);
    expect(ash.seen.indexOf("#d5e4ea")).toBe(-1);
    const shell = arm(BOSS_TANK, 1, 0, 10, 1);
    shell.boss.shotKind[0] = 2;
    shell.boss.shotLife[0] = 40;
    shell.boss.shotX[0] = 30;
    shell.boss.shotY[0] = 40;
    shell.boss.shotVx[0] = 2.4;
    shell.boss.shotVy[0] = 0;
    shell.boss.shotKind[1] = 1;
    shell.boss.shotLife[1] = 40;
    shell.boss.shotX[1] = 80;
    shell.boss.shotY[1] = 80;
    shell.boss.shotR[1] = 20;
    const round = watch();
    drawBoss(round.ctx, shell, 2);
    expect(round.rotates).toBe(0);
    expect(round.arcs).toBe(0);
    expect(round.seen.indexOf("#c8963e")).toBeGreaterThanOrEqual(0);
    expect(round.seen.indexOf("#b5562f")).toBeGreaterThanOrEqual(0);
    expect(round.seen.indexOf("#ffd27a")).toBeGreaterThanOrEqual(0);
    expect(round.seen.indexOf("#e4e7ee")).toBe(-1);
    expect(round.seen.indexOf("#d5e4ea")).toBe(-1);
    let brass = false;
    for (let i = 0; i < round.rects.length; i++) {
      const rect = round.rects[i];
      if (rect && rect.s === "#c8963e" && rect.w === 5) brass = true;
    }
    expect(brass).toBe(true);
    expect(clean(round.seen)).toBe(true);
  });
});
