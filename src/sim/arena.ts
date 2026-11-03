import { createRng, nextFloat, type Rng } from "./rng";
import { Z_ELITE } from "./foes";
import { H, W } from "./types";

export const ARENA_W = W * 2;
export const ARENA_H = H * 2;
export const EDGE_PAD = 10;
export const MAX_OBS = 32;
export const MAX_HEAL = 16;
export const MAX_TELE = 20;
export const OB_BOILER = 0;
export const OB_CRATE = 1;
export const OB_PIPE = 2;
export const OB_GEAR = 3;
export const OB_BARREL = 4;
export const TELE_LIFE = 36;
export const MIN_SPAWN_R = 100;
export const MIN_SPAWN_R2 = MIN_SPAWN_R * MIN_SPAWN_R;
export const SPAWN_MARGIN = 24;
export const SPAWN_INSET = 26;
export const SPAWN_TOP = 58;
export const SPAWN_BOT = 30;
export const PUFF_BARREL = 32;
export const CAM_LERP = 0.15;
export const HEAL_HP = 1;
export const HEAL_R2 = 256;
export const BARREL_HP = 3;
export const CLEAR_R = 104;
export const MINI_X = 402;
export const MINI_Y = 260;
export const MINI_W = 70;
export const MINI_H = 50;

export interface Arena {
  camX: number;
  camY: number;
  obsN: number;
  obsX: Float32Array;
  obsY: Float32Array;
  obsHW: Float32Array;
  obsHH: Float32Array;
  obsR: Float32Array;
  obsKind: Uint8Array;
  obsHp: Int16Array;
  obsAlive: Uint8Array;
  healX: Float32Array;
  healY: Float32Array;
  healAlive: Uint8Array;
  teleEdge: Uint8Array;
  teleU: Float32Array;
  teleKind: Uint8Array;
  teleLeft: Int16Array;
  teleAlive: Uint8Array;
  scratch: Float32Array;
  lastX: number;
  lastY: number;
  lastN: number;
}

const PLAN: readonly number[] = [
  OB_BOILER, OB_BOILER, OB_BOILER, OB_BOILER, OB_BOILER,
  OB_CRATE, OB_CRATE, OB_CRATE, OB_CRATE, OB_CRATE, OB_CRATE, OB_CRATE,
  OB_PIPE, OB_PIPE, OB_PIPE, OB_PIPE, OB_PIPE, OB_PIPE,
  OB_GEAR, OB_GEAR, OB_GEAR, OB_GEAR, OB_GEAR,
  OB_BARREL, OB_BARREL, OB_BARREL, OB_BARREL, OB_BARREL, OB_BARREL,
];

export function clamp(v: number, lo: number, hi: number): number {
  if (v < lo) return lo;
  if (v > hi) return hi;
  return v;
}

export function cameraTarget(px: number, py: number, out: Float32Array): void {
  out[0] = clamp(px - W * 0.5, 0, ARENA_W - W);
  out[1] = clamp(py - H * 0.5, 0, ARENA_H - H);
}

export function hitsProp(
  px: number, py: number, pr: number,
  ox: number, oy: number, hw: number, hh: number, r: number,
): boolean {
  if (r > 0) {
    const dx = px - ox;
    const dy = py - oy;
    const rad = pr + r;
    return dx * dx + dy * dy < rad * rad;
  }
  const dx = Math.abs(px - ox);
  const dy = Math.abs(py - oy);
  if (dx > hw + pr || dy > hh + pr) return false;
  if (dx <= hw || dy <= hh) return true;
  const ex = dx - hw;
  const ey = dy - hh;
  return ex * ex + ey * ey < pr * pr;
}

export function edgePoint(camX: number, camY: number, edge: number, u: number, out: Float32Array): void {
  const side = SPAWN_INSET;
  const uu = clamp(u, 0, 1);
  const spanX = W - side * 2;
  const spanY = H - SPAWN_TOP - SPAWN_BOT;
  let x = camX + W * 0.5;
  let y = camY + H * 0.5;
  if (edge === 0) { x = camX + side + uu * spanX; y = camY + SPAWN_TOP; }
  else if (edge === 1) { x = camX + W - side; y = camY + SPAWN_TOP + uu * spanY; }
  else if (edge === 2) { x = camX + side + uu * spanX; y = camY + H - SPAWN_BOT; }
  else { x = camX + side; y = camY + SPAWN_TOP + uu * spanY; }
  const lo = 12;
  x = clamp(x, Math.max(lo, camX - SPAWN_MARGIN), Math.min(ARENA_W - lo, camX + W + SPAWN_MARGIN));
  y = clamp(y, Math.max(lo, camY - SPAWN_MARGIN), Math.min(ARENA_H - lo, camY + H + SPAWN_MARGIN));
  out[0] = x;
  out[1] = y;
}

export function spawnHidden(camX: number, camY: number, x: number, y: number): boolean {
  const sx = x - camX;
  const sy = y - camY;
  if (sy < SPAWN_TOP - 2) return true;
  if (sx > MINI_X - 20 && sy > MINI_Y - 16) return true;
  return false;
}

export function showsArrow(kind: number, sx: number, sy: number): number {
  if ((kind & Z_ELITE) === 0) return 0;
  if (sx >= 0 && sy >= 0 && sx <= W && sy <= H) return 0;
  return 1;
}

export function arrowTip(sx: number, sy: number, out: Float32Array): void {
  const left = 18;
  const right = W - 18;
  const top = 42;
  const bot = H - 66;
  let x = sx;
  let y = sy;
  if (x < left) x = left;
  if (x > right) x = right;
  if (y < top) y = top;
  if (y > bot) y = bot;
  const dx = sx - W * 0.5;
  const dy = sy - H * 0.5;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  out[0] = x;
  out[1] = y;
  out[2] = dx / len;
  out[3] = dy / len;
}

export function miniDot(wx: number, wy: number, out: Float32Array): void {
  out[0] = MINI_X + 2 + (wx / ARENA_W) * (MINI_W - 4);
  out[1] = MINI_Y + 2 + (wy / ARENA_H) * (MINI_H - 4);
}

interface Spec { hw: number; hh: number; r: number; hp: number }

function measure(kind: number, rng: Rng): Spec {
  if (kind === OB_BOILER) return { hw: 14, hh: 16, r: 16, hp: 1 };
  if (kind === OB_CRATE) {
    const s = 11 + (nextFloat(rng) * 4 | 0);
    return { hw: s, hh: s, r: 0, hp: 1 };
  }
  if (kind === OB_PIPE) {
    if (nextFloat(rng) < 0.5) return { hw: 36, hh: 7, r: 0, hp: 1 };
    return { hw: 7, hh: 34, r: 0, hp: 1 };
  }
  if (kind === OB_GEAR) return { hw: 13, hh: 13, r: 13, hp: 1 };
  return { hw: 8, hh: 10, r: 9, hp: BARREL_HP };
}

function extent(spec: Spec): number {
  return spec.r > 0 ? spec.r : Math.max(spec.hw, spec.hh);
}

function separated(
  x: number, y: number, hw: number, hh: number, r: number,
  ox: number, oy: number, ohw: number, ohh: number, orad: number, pad: number,
): boolean {
  if (r > 0 && orad > 0) {
    const dx = x - ox;
    const dy = y - oy;
    const rad = r + orad + pad;
    return dx * dx + dy * dy >= rad * rad;
  }
  const ahw = (r > 0 ? r : hw) + pad;
  const ahh = (r > 0 ? r : hh) + pad;
  const bhw = orad > 0 ? orad : ohw;
  const bhh = orad > 0 ? orad : ohh;
  return Math.abs(x - ox) >= ahw + bhw || Math.abs(y - oy) >= ahh + bhh;
}

function fits(
  x: number, y: number, spec: Spec, px: number, py: number,
  obsX: Float32Array, obsY: Float32Array, obsHW: Float32Array, obsHH: Float32Array, obsR: Float32Array, n: number,
): boolean {
  const ex = spec.r > 0 ? spec.r : spec.hw;
  const ey = spec.r > 0 ? spec.r : spec.hh;
  if (x < ex + 20 || y < ey + 20 || x > ARENA_W - ex - 20 || y > ARENA_H - ey - 20) return false;
  if (!separated(x, y, spec.hw, spec.hh, spec.r, px, py, CLEAR_R, CLEAR_R, 0, 0)) return false;
  for (let i = 0; i < n; i++) {
    if (!separated(
      x, y, spec.hw, spec.hh, spec.r,
      obsX[i] ?? 0, obsY[i] ?? 0, obsHW[i] ?? 0, obsHH[i] ?? 0, obsR[i] ?? 0, 8,
    )) return false;
  }
  return true;
}

function forceSpot(
  index: number, spec: Spec, px: number, py: number,
  obsX: Float32Array, obsY: Float32Array, obsHW: Float32Array, obsHH: Float32Array, obsR: Float32Array, n: number,
): { x: number; y: number } {
  const ex = extent(spec);
  let x = px + 180;
  let y = py;
  for (let k = 0; k < 10; k++) {
    const ang = index * 2.399963 + k * 0.7;
    const ring = 188 + k * 36;
    x = clamp(px + Math.cos(ang) * ring, ex + 22, ARENA_W - ex - 22);
    y = clamp(py + Math.sin(ang) * ring, ex + 22, ARENA_H - ex - 22);
    if (fits(x, y, spec, px, py, obsX, obsY, obsHW, obsHH, obsR, n)) return { x, y };
  }
  if (!separated(x, y, spec.hw, spec.hh, spec.r, px, py, CLEAR_R, CLEAR_R, 0, 0)) {
    x = clamp(px + 230, ex + 22, ARENA_W - ex - 22);
    y = clamp(py - 40, ex + 22, ARENA_H - ex - 22);
  }
  return { x, y };
}

export function createArena(seed: number, px: number, py: number): Arena {
  const rng = createRng((seed ^ 0x51ed0b) >>> 0);
  const obsX = new Float32Array(MAX_OBS);
  const obsY = new Float32Array(MAX_OBS);
  const obsHW = new Float32Array(MAX_OBS);
  const obsHH = new Float32Array(MAX_OBS);
  const obsR = new Float32Array(MAX_OBS);
  const obsKind = new Uint8Array(MAX_OBS);
  const obsHp = new Int16Array(MAX_OBS);
  const obsAlive = new Uint8Array(MAX_OBS);
  const scratch = new Float32Array(4);
  cameraTarget(px, py, scratch);
  let n = 0;
  for (let p = 0; p < PLAN.length && n < MAX_OBS; p++) {
    const kind = PLAN[p] ?? OB_CRATE;
    const spec = measure(kind, rng);
    const ex = spec.r > 0 ? spec.r : spec.hw;
    const ey = spec.r > 0 ? spec.r : spec.hh;
    let x = px;
    let y = py;
    let placed = false;
    for (let attempt = 0; attempt < 56; attempt++) {
      x = ex + 22 + nextFloat(rng) * (ARENA_W - (ex + 22) * 2);
      y = ey + 22 + nextFloat(rng) * (ARENA_H - (ey + 22) * 2);
      if (!fits(x, y, spec, px, py, obsX, obsY, obsHW, obsHH, obsR, n)) continue;
      placed = true;
      break;
    }
    if (!placed) {
      const spot = forceSpot(p, spec, px, py, obsX, obsY, obsHW, obsHH, obsR, n);
      x = spot.x;
      y = spot.y;
    }
    obsX[n] = x;
    obsY[n] = y;
    obsHW[n] = spec.hw;
    obsHH[n] = spec.hh;
    obsR[n] = spec.r;
    obsKind[n] = kind;
    obsHp[n] = spec.hp;
    obsAlive[n] = 1;
    n++;
  }
  return {
    camX: scratch[0] ?? 0,
    camY: scratch[1] ?? 0,
    obsN: n,
    obsX, obsY, obsHW, obsHH, obsR, obsKind, obsHp, obsAlive,
    healX: new Float32Array(MAX_HEAL),
    healY: new Float32Array(MAX_HEAL),
    healAlive: new Uint8Array(MAX_HEAL),
    teleEdge: new Uint8Array(MAX_TELE),
    teleU: new Float32Array(MAX_TELE),
    teleKind: new Uint8Array(MAX_TELE),
    teleLeft: new Int16Array(MAX_TELE),
    teleAlive: new Uint8Array(MAX_TELE),
    scratch,
    lastX: 0,
    lastY: 0,
    lastN: 0,
  };
}
