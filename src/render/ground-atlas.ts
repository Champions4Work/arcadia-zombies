import { ARENA_H, ARENA_W } from "../sim/arena";
import { H, W } from "../sim/types";
import { zoneAt, zoneRow } from "../sim/zones";
import {
  eachVentFx,
  FEAT_GEAR,
  FEAT_LAMP,
  FEAT_PIPE,
  FEAT_RUBBLE,
  FEAT_STAIN,
  KIND_BRASS,
  KIND_BRASS_W,
  KIND_COBBLE,
  KIND_GRATE,
  KIND_RAIL_H,
  KIND_RAIL_V,
  KIND_RUBBLE,
  KIND_VENT,
  TILE,
  groundCols,
  groundFeatureAt,
  groundFeatureCount,
  groundKind,
  groundRows,
} from "./ground";
import { pack } from "./horde-sprites";

const EDGE = pack(0x18, 0x12, 0x10);
const MORTAR = pack(0x2a, 0x22, 0x1c);
const BRASS = pack(0xc4, 0x90, 0x38);

function packHex(n: number): number {
  return pack((n >> 16) & 255, (n >> 8) & 255, n & 255);
}

function packShade(n: number): number {
  return pack((((n >> 16) & 255) * 2 / 3) | 0, (((n >> 8) & 255) * 2 / 3) | 0, ((n & 255) * 2 / 3) | 0);
}
const BRASS_HI = pack(0xff, 0xf1, 0xc2);
const STEEL = pack(0x8e, 0xa4, 0xb6);
const STEEL_HI = pack(0xf2, 0xf7, 0xfb);
const TIE = pack(0x7a, 0x4a, 0x22);
const PIT = pack(0x0c, 0x08, 0x06);
const GRATE = pack(0x3a, 0x2a, 0x18);
const COPPER = pack(0xe0, 0x70, 0x40);
const LAMP = pack(0xff, 0xb4, 0x46);
const LAMP_DIM = pack(0x8a, 0x58, 0x28);
const pix = new Uint32Array(ARENA_W * ARENA_H);
let ready = 0;

function hash(x: number, y: number, s = 0): number {
  let n = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s, 1442695041);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return n >>> 0;
}

function put(x: number, y: number, color: number): void {
  if (x < 0 || y < 0 || x >= ARENA_W || y >= ARENA_H) return;
  pix[y * ARENA_W + x] = color;
}

function fill(x: number, y: number, w: number, h: number, color: number): void {
  let x0 = x | 0;
  let y0 = y | 0;
  let x1 = x0 + (w | 0);
  let y1 = y0 + (h | 0);
  if (x0 < 0) x0 = 0;
  if (y0 < 0) y0 = 0;
  if (x1 > ARENA_W) x1 = ARENA_W;
  if (y1 > ARENA_H) y1 = ARENA_H;
  for (let yy = y0; yy < y1; yy++) {
    const row = yy * ARENA_W;
    for (let xx = x0; xx < x1; xx++) pix[row + xx] = color;
  }
}

function cobbleField(): void {
  fill(0, 7 * TILE, ARENA_W, ARENA_H - 7 * TILE, MORTAR);
  for (let row = 0, y = 7 * TILE; y < ARENA_H; y += 7, row++) {
    const ox = row & 1 ? 5 : 0;
    for (let x = -8; x < ARENA_W; x += 10) {
      const sx = x + ox;
      const h = hash(sx, y);
      const stone = zoneRow(zoneAt(sx)).stone;
      fill(sx + 1, y + 1, 8 + (h & 1), 5, packHex(stone[h % stone.length] ?? 0x6a5848));
    }
  }
}

function plate(x: number, y: number, worn: number): void {
  const brass = zoneRow(zoneAt(x)).brass;
  fill(x, y, TILE, TILE, pack(0x4a, 0x2c, 0x08));
  fill(x + 1, y + 1, 14, 14, worn ? packShade(brass) : packHex(brass));
  fill(x + 2, y + 2, 12, 2, BRASS_HI);
  put(x + 2, y + 2, BRASS_HI);
  put(x + 13, y + 2, BRASS_HI);
  put(x + 2, y + 13, BRASS_HI);
  put(x + 13, y + 13, BRASS_HI);
}

function rail(x: number, y: number, vert: number): void {
  fill(x, y, TILE, TILE, pack(0x1c, 0x16, 0x10));
  if (vert) {
    fill(x + 1, y + 1, 4, 14, TIE);
    fill(x + 11, y + 1, 4, 14, TIE);
    fill(x + 5, y, 2, TILE, STEEL);
    fill(x + 9, y, 2, TILE, STEEL);
    fill(x + 5, y, 1, TILE, STEEL_HI);
  } else {
    fill(x + 1, y + 1, 14, 4, TIE);
    fill(x + 1, y + 11, 14, 4, TIE);
    fill(x, y + 5, TILE, 2, STEEL);
    fill(x, y + 9, TILE, 2, STEEL);
    fill(x, y + 5, TILE, 1, STEEL_HI);
  }
}

function grate(x: number, y: number, vent: number): void {
  fill(x, y, TILE, TILE, PIT);
  fill(x + 2, y + 2, 12, 12, GRATE);
  const brass = packHex(zoneRow(zoneAt(x)).brass);
  for (let i = 0; i < 4; i++) fill(x + 3, y + 3 + i * 3, 10, 1, brass);
  if (vent) fill(x + 5, y + 6, 6, 4, PIT);
}

function glow(cx: number, cy: number, r: number): void {
  const r2 = r * r;
  const x0 = Math.max(0, (cx - r) | 0);
  const y0 = Math.max(0, (cy - r * 0.65) | 0);
  const x1 = Math.min(ARENA_W, (cx + r) | 0);
  const y1 = Math.min(ARENA_H, (cy + r * 0.65) | 0);
  for (let y = y0; y < y1; y++) {
    const dy = (y - cy) / 0.62;
    const row = y * ARENA_W;
    for (let x = x0; x < x1; x++) {
      const dx = x - cx;
      const d2 = dx * dx + dy * dy;
      if (d2 >= r2) continue;
      pix[row + x] = d2 < r2 * 0.18 ? LAMP : LAMP_DIM;
    }
  }
}

function stamp(): void {
  if (ready) return;
  ready = 1;
  pix.fill(EDGE);
  cobbleField();
  const cols = groundCols();
  const rows = groundRows();
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const k = groundKind(c, r);
      const x = c * TILE;
      const y = r * TILE;
      if (k === KIND_COBBLE) continue;
      else if (k === KIND_BRASS) plate(x, y, 0);
      else if (k === KIND_BRASS_W) plate(x, y, 1);
      else if (k === KIND_RAIL_H) rail(x, y, 0);
      else if (k === KIND_RAIL_V) rail(x, y, 1);
      else if (k === KIND_GRATE) grate(x, y, 0);
      else if (k === KIND_VENT) grate(x, y, 1);
      else if (k === KIND_RUBBLE) fill(x, y, TILE, TILE, pack(0x3a, 0x32, 0x2c));
    }
  }
  const n = groundFeatureCount();
  for (let i = 0; i < n; i++) {
    const f = groundFeatureAt(i);
    if (f.kind === FEAT_STAIN) fill(f.x - 6, f.y - 4, 12, 8, pack(0x1a, 0x12, 0x0c));
    else if (f.kind === FEAT_PIPE) {
      if (f.b) fill(f.x - 3, f.y, 6, f.a, COPPER);
      else fill(f.x, f.y - 3, f.a, 6, COPPER);
    } else if (f.kind === FEAT_GEAR) fill(f.x - 6, f.y - 6, 12, 12, BRASS);
    else if (f.kind === FEAT_RUBBLE) fill(f.x - 4, f.y - 3, 8, 6, pack(0x5a, 0x4a, 0x3a));
    else if (f.kind === FEAT_LAMP) glow(f.x, f.y, f.a || 70);
  }
}

export function copyGroundWindow(dest: Uint32Array, camX: number, camY: number): void {
  stamp();
  const x0 = camX | 0;
  const y0 = camY | 0;
  for (let y = 0; y < H; y++) {
    const sy = y0 + y;
    const drow = y * W;
    if (sy < 0 || sy >= ARENA_H) {
      dest.fill(EDGE, drow, drow + W);
      continue;
    }
    let x = 0;
    let sx = x0;
    if (sx < 0) {
      const skip = -sx < W ? -sx : W;
      dest.fill(EDGE, drow, drow + skip);
      x = skip;
      sx = 0;
    }
    const copy = W - x < ARENA_W - sx ? W - x : ARENA_W - sx;
    if (copy > 0) dest.set(pix.subarray(sy * ARENA_W + sx, sy * ARENA_W + sx + copy), drow + x);
    const done = x + (copy > 0 ? copy : 0);
    if (done < W) dest.fill(EDGE, drow + done, drow + W);
  }
}

export function yardColor(x: number, y: number): number {
  stamp();
  if (x < 0 || y < 0 || x >= ARENA_W || y >= ARENA_H) return EDGE;
  return pix[y * ARENA_W + x] ?? EDGE;
}

const STEAM = pack(0xff, 0xf8, 0xee);

export function stampVentFx(dest: Uint32Array, camX: number, camY: number, tick: number): number {
  return eachVentFx(camX, camY, tick, (x, y, s) => {
    const x0 = (x - camX - s * 0.5) | 0;
    const y0 = (y - camY - s * 0.5) | 0;
    const x1 = x0 + (s | 0);
    const y1 = y0 + (s | 0);
    for (let yy = y0; yy < y1; yy++) {
      if (yy < 0 || yy >= H) continue;
      const row = yy * W;
      for (let xx = x0; xx < x1; xx++) {
        if (xx < 0 || xx >= W) continue;
        dest[row + xx] = STEAM;
      }
    }
  });
}
