import { Z_GAS, Z_KIND, Z_KNIGHT, Z_RAT, Z_SPITTER } from "./foes";
import { createRng, nextFloat, type Rng } from "./rng";
import { H, W, Z_BRUTE, Z_GHOUL, type Arena } from "./types";

export const ARENA_W = W * 2;
export const ARENA_H = H * 2;
export const ARENA_WALL = 16;
export const MAX_OBS = 72;
export const CLEAR = 56;
export const GAP = 26;
export const VENT_CYCLE = 120;
export const VENT_REACH = 28;
export const BLAST_R = 46;
export const BLAST_R2 = BLAST_R * BLAST_R;
export const PLAYER_R = 8;
export const OBS_PIPE = 1;
export const OBS_CRATE = 2;
export const OBS_CARRIAGE = 3;
export const OBS_VENT = 4;
export const OBS_GEAR = 5;
export const OBS_BARREL = 6;

const PLAN_KIND = new Uint8Array([
  OBS_PIPE, OBS_CRATE, OBS_CARRIAGE, OBS_VENT, OBS_GEAR, OBS_BARREL,
]);
const PLAN_N = new Uint8Array([18, 18, 8, 10, 8, 10]);
const STEP = new Float32Array(2);
const SIZE = new Float32Array(2);
const RING = new Float32Array(2);
let sidePick = 0;

export function stepX(): number { return STEP[0] ?? 0; }
export function stepY(): number { return STEP[1] ?? 0; }
export function stepSide(): number { return sidePick; }

export function bodyR(kind: number): number {
  const k = kind & Z_KIND;
  if (k === Z_BRUTE) return 11;
  if (k === Z_KNIGHT) return 12;
  if (k === Z_GAS) return 9;
  if (k === Z_GHOUL || k === Z_SPITTER) return 6;
  if (k === Z_RAT) return 5;
  return 7;
}

export function ringX(): number { return RING[0] ?? 0; }
export function ringY(): number { return RING[1] ?? 0; }

export function placeRing(a: Arena, px: number, py: number, t: number, u: number, jx: number, jy: number): void {
  const spanX = W * 0.62;
  const spanY = H * 0.62;
  let x = px + jx;
  let y = py + jy;
  if (t < 1) { x += (u * 2 - 1) * spanX; y -= spanY; }
  else if (t < 2) { x += spanX; y += (u * 2 - 1) * spanY; }
  else if (t < 3) { x += (u * 2 - 1) * spanX; y += spanY; }
  else { x -= spanX; y += (u * 2 - 1) * spanY; }
  const cx = ARENA_W * 0.5;
  const cy = ARENA_H * 0.5;
  for (let n = 0; n < 8; n++) {
    const inside = x > ARENA_WALL + 8 && y > ARENA_WALL + 8 && x < ARENA_W - ARENA_WALL - 8 && y < ARENA_H - ARENA_WALL - 8;
    if (inside && obstacleAt(a, x, y, 8) < 0) break;
    x = x * 0.72 + cx * 0.28;
    y = y * 0.72 + cy * 0.28;
  }
  x = clampX(x, 8);
  y = clampY(y, 8);
  let pdx = x - px;
  let pdy = y - py;
  let pd = Math.sqrt(pdx * pdx + pdy * pdy);
  if (pd < 96) {
    if (pd < 0.001) { pdx = 1; pdy = 0; pd = 1; }
    x = clampX(px + (pdx / pd) * 96, 8);
    y = clampY(py + (pdy / pd) * 96, 8);
  }
  RING[0] = x;
  RING[1] = y;
}

export function clampX(x: number, r: number): number {
  const lo = ARENA_WALL + r;
  const hi = ARENA_W - ARENA_WALL - r;
  if (x < lo) return lo;
  if (x > hi) return hi;
  return x;
}

export function clampY(y: number, r: number): number {
  const lo = ARENA_WALL + r;
  const hi = ARENA_H - ARENA_WALL - r;
  if (y < lo) return lo;
  if (y > hi) return hi;
  return y;
}

export function obstacleAt(a: Arena, x: number, y: number, r: number): number {
  const n = a.n;
  for (let i = 0; i < n; i++) {
    if (!a.alive[i]) continue;
    let dx = x - (a.x[i] ?? 0);
    let dy = y - (a.y[i] ?? 0);
    if (dx < 0) dx = -dx;
    if (dy < 0) dy = -dy;
    if (dx < (a.hw[i] ?? 0) + r && dy < (a.hh[i] ?? 0) + r) return i;
  }
  return -1;
}

function blocked(a: Arena, x: number, y: number, r: number): boolean {
  if (x < ARENA_WALL + r || y < ARENA_WALL + r) return true;
  if (x > ARENA_W - ARENA_WALL - r || y > ARENA_H - ARENA_WALL - r) return true;
  return obstacleAt(a, x, y, r) >= 0;
}

function commit(lx: number, ly: number, side: number): void {
  sidePick = side;
  STEP[0] = side === 1 ? lx : -lx;
  STEP[1] = side === 1 ? ly : -ly;
}

export function actorStep(a: Arena, x: number, y: number, tx: number, ty: number, r: number, sp: number, side: number): void {
  const dx = tx - x;
  const dy = ty - y;
  const dist = Math.sqrt(dx * dx + dy * dy) || 1;
  let ux = dx / dist;
  let uy = dy / dist;
  const look = r + 12;
  sidePick = 0;
  if (dist > look && blocked(a, x + ux * look, y + uy * look, r)) {
    const lx = -uy;
    const ly = ux;
    const lOk = !blocked(a, x + lx * look, y + ly * look, r);
    const rOk = !blocked(a, x - lx * look, y - ly * look, r);
    if (lOk && rOk) {
      if (side === 1 || side === -1) commit(lx, ly, side);
      else {
        const lpx = x + lx * sp - tx;
        const lpy = y + ly * sp - ty;
        const rpx = x - lx * sp - tx;
        const rpy = y - ly * sp - ty;
        commit(lx, ly, lpx * lpx + lpy * lpy <= rpx * rpx + rpy * rpy ? 1 : -1);
      }
      ux = STEP[0] ?? 0;
      uy = STEP[1] ?? 0;
    } else if (lOk) { commit(lx, ly, 1); ux = lx; uy = ly; }
    else if (rOk) { commit(lx, ly, -1); ux = -lx; uy = -ly; }
    else if (!blocked(a, x + ux * sp, y, r)) uy = 0;
    else if (!blocked(a, x, y + uy * sp, r)) ux = 0;
    else { ux = 0; uy = 0; }
  }
  let nx = clampX(x + ux * sp, r);
  let ny = clampY(y + uy * sp, r);
  if (obstacleAt(a, nx, ny, r) >= 0) {
    if (obstacleAt(a, nx, y, r) < 0) ny = y;
    else if (obstacleAt(a, x, ny, r) < 0) nx = x;
    else if (obstacleAt(a, x, y, r) >= 0) {
      nx = clampX(x + ux * sp, r);
      ny = clampY(y + uy * sp, r);
    } else { nx = x; ny = y; }
  }
  STEP[0] = nx;
  STEP[1] = ny;
}

function crowded(a: Arena, n: number, x: number, y: number, hw: number, hh: number): boolean {
  const cx = ARENA_W * 0.5;
  const cy = ARENA_H * 0.5;
  if (Math.abs(x - cx) < hw + CLEAR && Math.abs(y - cy) < hh + CLEAR) return true;
  for (let i = 0; i < n; i++) {
    const dx = Math.abs(x - (a.x[i] ?? 0));
    const dy = Math.abs(y - (a.y[i] ?? 0));
    if (dx < hw + (a.hw[i] ?? 0) + GAP && dy < hh + (a.hh[i] ?? 0) + GAP) return true;
  }
  return false;
}

function measure(kind: number, rng: Rng): void {
  if (kind === OBS_PIPE) {
    const long = 18 + (nextFloat(rng) * 18 | 0);
    if (nextFloat(rng) < 0.5) { SIZE[0] = long; SIZE[1] = 5; }
    else { SIZE[0] = 5; SIZE[1] = long; }
    return;
  }
  if (kind === OBS_CRATE) {
    const s = 8 + (nextFloat(rng) * 5 | 0);
    SIZE[0] = s;
    SIZE[1] = s;
    return;
  }
  if (kind === OBS_CARRIAGE) {
    if (nextFloat(rng) < 0.7) { SIZE[0] = 24; SIZE[1] = 11; }
    else { SIZE[0] = 11; SIZE[1] = 22; }
    return;
  }
  if (kind === OBS_VENT) { SIZE[0] = 8; SIZE[1] = 6; return; }
  if (kind === OBS_GEAR) { SIZE[0] = 16; SIZE[1] = 15; return; }
  SIZE[0] = 8;
  SIZE[1] = 8;
}

function tryPlace(a: Arena, rng: Rng, kind: number, tries: number): void {
  measure(kind, rng);
  const hw = SIZE[0] ?? 8;
  const hh = SIZE[1] ?? 8;
  const x0 = ARENA_WALL + hw + 2;
  const x1 = ARENA_W - ARENA_WALL - hw - 2;
  const y0 = ARENA_WALL + hh + 2;
  const y1 = ARENA_H - ARENA_WALL - hh - 2;
  if (x1 <= x0 || y1 <= y0 || a.n >= MAX_OBS) return;
  for (let t = 0; t < tries; t++) {
    const x = x0 + nextFloat(rng) * (x1 - x0);
    const y = y0 + nextFloat(rng) * (y1 - y0);
    if (crowded(a, a.n, x, y, hw, hh)) continue;
    const i = a.n;
    a.x[i] = x;
    a.y[i] = y;
    a.hw[i] = hw;
    a.hh[i] = hh;
    a.kind[i] = kind;
    a.hp[i] = kind === OBS_BARREL ? 1 : 0;
    a.alive[i] = 1;
    a.phase[i] = nextFloat(rng) * VENT_CYCLE | 0;
    a.n = i + 1;
    return;
  }
}

export function createArena(seed: number): Arena {
  const rng = createRng((Math.imul(seed >>> 0 || 1, 0x9e3779b1) >>> 0) || 1);
  const a: Arena = {
    x: new Float32Array(MAX_OBS), y: new Float32Array(MAX_OBS),
    hw: new Float32Array(MAX_OBS), hh: new Float32Array(MAX_OBS),
    kind: new Uint8Array(MAX_OBS), hp: new Int16Array(MAX_OBS),
    alive: new Uint8Array(MAX_OBS), phase: new Uint16Array(MAX_OBS), n: 0,
  };
  for (let k = 0; k < PLAN_KIND.length; k++) {
    const kind = PLAN_KIND[k] ?? OBS_CRATE;
    const count = PLAN_N[k] ?? 0;
    for (let c = 0; c < count; c++) tryPlace(a, rng, kind, c === 0 ? 90 : 40);
  }
  return a;
}
