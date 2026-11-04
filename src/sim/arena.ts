import { createRng, nextFloat, type Rng } from "./rng";
import { Z_ELITE } from "./foes";
import { H, W } from "./types";

export const ARENA_W = W * 2;
export const ARENA_H = H * 2;
export const EDGE_PAD = 10;
export const MAX_OBS = 40;
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
export const SPAWN_BOT = 48;
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
export const PROP_CELL = 32;
export const PROP_COLS = Math.ceil(ARENA_W / PROP_CELL);
export const PROP_ROWS = Math.ceil(ARENA_H / PROP_CELL);
export const PROP_CELLS = PROP_COLS * PROP_ROWS;
export const PROP_REACH = 16;
export const PROP_NODES = MAX_OBS * 16;

export function propBreaks(kind: number): boolean {
  return kind === OB_BARREL || kind === OB_BOILER || kind === OB_CRATE || kind === OB_GEAR;
}

export interface Arena {
  camX: number;
  camY: number;
  viewW: number;
  viewH: number;
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
  propHead: Int16Array;
  propNode: Int16Array;
  propNext: Int16Array;
  propOverflow: number;
  lastX: number;
  lastY: number;
  lastN: number;
}

export function indexProps(a: Arena): void {
  const head = a.propHead;
  for (let c = 0; c < PROP_CELLS; c++) head[c] = -1;
  let n = 0;
  let overflow = 0;
  const reach = PROP_REACH;
  const obsN = a.obsN;
  for (let i = 0; i < obsN; i++) {
    if (!a.obsAlive[i]) continue;
    const rad = a.obsR[i] ?? 0;
    const hw = (rad > 0 ? rad : (a.obsHW[i] ?? 0)) + reach;
    const hh = (rad > 0 ? rad : (a.obsHH[i] ?? 0)) + reach;
    const x = a.obsX[i] ?? 0;
    const y = a.obsY[i] ?? 0;
    let x0 = Math.floor((x - hw) / PROP_CELL);
    let y0 = Math.floor((y - hh) / PROP_CELL);
    let x1 = Math.floor((x + hw) / PROP_CELL);
    let y1 = Math.floor((y + hh) / PROP_CELL);
    if (x0 < 0) x0 = 0;
    if (y0 < 0) y0 = 0;
    if (x1 >= PROP_COLS) x1 = PROP_COLS - 1;
    if (y1 >= PROP_ROWS) y1 = PROP_ROWS - 1;
    for (let cy = y0; cy <= y1 && !overflow; cy++) {
      for (let cx = x0; cx <= x1; cx++) {
        if (n >= PROP_NODES) {
          overflow = 1;
          break;
        }
        const cell = cx + cy * PROP_COLS;
        a.propNode[n] = i;
        a.propNext[n] = head[cell] ?? -1;
        head[cell] = n;
        n++;
      }
    }
  }
  a.propOverflow = overflow;
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

export function cameraTarget(px: number, py: number, out: Float32Array, vw = W, vh = H): void {
  const viewW = clamp(vw, 1, ARENA_W);
  const viewH = clamp(vh, 1, ARENA_H);
  out[0] = clamp(px - viewW * 0.5, 0, ARENA_W - viewW);
  out[1] = clamp(py - viewH * 0.5, 0, ARENA_H - viewH);
}

export function snapArenaCamera(
  a: { camX: number; camY: number; viewW: number; viewH: number; scratch: Float32Array },
  px: number,
  py: number,
): void {
  cameraTarget(px, py, a.scratch, a.viewW, a.viewH);
  a.camX = a.scratch[0] ?? 0;
  a.camY = a.scratch[1] ?? 0;
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

export function edgePoint(camX: number, camY: number, edge: number, u: number, out: Float32Array, vw = W, vh = H): void {
  const side = SPAWN_INSET;
  const uu = clamp(u, 0, 1);
  const spanX = vw - side * 2;
  const spanY = vh - SPAWN_TOP - SPAWN_BOT;
  let x = camX + vw * 0.5;
  let y = camY + vh * 0.5;
  if (edge === 0) { x = camX + side + uu * spanX; y = camY + SPAWN_TOP; }
  else if (edge === 1) { x = camX + vw - side; y = camY + SPAWN_TOP + uu * spanY; }
  else if (edge === 2) { x = camX + side + uu * spanX; y = camY + vh - SPAWN_BOT; }
  else { x = camX + side; y = camY + SPAWN_TOP + uu * spanY; }
  const lo = 12;
  x = clamp(x, Math.max(lo, camX - SPAWN_MARGIN), Math.min(ARENA_W - lo, camX + vw + SPAWN_MARGIN));
  y = clamp(y, Math.max(lo, camY - SPAWN_MARGIN), Math.min(ARENA_H - lo, camY + vh + SPAWN_MARGIN));
  out[0] = x;
  out[1] = y;
}

export function spawnHidden(camX: number, camY: number, x: number, y: number): boolean {
  const sx = x - camX;
  const sy = y - camY;
  if (sy < SPAWN_TOP - 2) return true;
  const rdx = sx - 48;
  const rdy = sy - 262;
  if (rdx * rdx + rdy * rdy <= 38 * 38) return true;
  if (sy >= 278 && sx >= 96 && sx <= 380) return true;
  return false;
}

export function showsArrow(kind: number, sx: number, sy: number, vw = W, vh = H): number {
  if ((kind & Z_ELITE) === 0) return 0;
  if (sx >= 0 && sy >= 0 && sx <= vw && sy <= vh) return 0;
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
  const propHead = new Int16Array(PROP_CELLS);
  const propNode = new Int16Array(PROP_NODES);
  const propNext = new Int16Array(PROP_NODES);
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
  const arena: Arena = {
    camX: scratch[0] ?? 0,
    camY: scratch[1] ?? 0,
    viewW: W,
    viewH: H,
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
    propHead,
    propNode,
    propNext,
    propOverflow: 0,
    lastX: 0,
    lastY: 0,
    lastN: 0,
  };
  indexProps(arena);
  return arena;
}
