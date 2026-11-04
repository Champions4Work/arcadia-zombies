import { ARENA_H, ARENA_W } from "../sim/arena";
import { H, W } from "../sim/types";
import { blitSheet, tileSheet } from "../art/sheet";
import { BRASS, cog, COPPER, type Metal, OUTLINE, rivet } from "./paint";

export const TILE = 16;
export const KIND_SKY = 0;
export const KIND_COBBLE = 1;
export const KIND_COBBLE_D = 2;
export const KIND_COBBLE_W = 3;
export const KIND_BRASS = 4;
export const KIND_BRASS_W = 5;
export const KIND_GRATE = 6;
export const KIND_RAIL_H = 7;
export const KIND_RAIL_V = 8;
export const KIND_RUBBLE = 9;
export const KIND_VENT = 10;

export const FEAT_PIPE = 0;
export const FEAT_LAMP = 1;
export const FEAT_GEAR = 2;
export const FEAT_STAIN = 3;
export const FEAT_RUBBLE = 4;
export const VENT_FX_CAP = 4;
export const VENT_PUFFS = 2;
export const VENT_SLOW = 0.63;

const COLS = (ARENA_W / TILE) | 0;
const ROWS = (ARENA_H / TILE) | 0;
const FLOOR0 = 7;
const MAX_FEAT = 80;
const MAX_VENT = 16;
const cells = new Uint8Array(COLS * ROWS);
const fk = new Uint8Array(MAX_FEAT);
const fx = new Float32Array(MAX_FEAT);
const fy = new Float32Array(MAX_FEAT);
const fa = new Float32Array(MAX_FEAT);
const fb = new Float32Array(MAX_FEAT);
const vx = new Float32Array(MAX_VENT);
const vy = new Float32Array(MAX_VENT);
let featN = 0;
let ventN = 0;
let ready = 0;

function hash(x: number, y: number, s = 0): number {
  let n = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s, 1442695041);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return n >>> 0;
}

function brassPad(c: number, r: number): number {
  if (r >= 8 && r <= 13 && c >= 9 && c <= 20) return 1;
  if (r >= 10 && r <= 11 && c >= 3 && c <= 52) return 1;
  if (r >= 12 && r <= 18 && c >= 48 && c <= 57) return 1;
  if (r >= 20 && r <= 24 && c >= 2 && c <= 10) return 1;
  if (r >= 20 && r <= 24 && c >= 50 && c <= 58) return 1;
  if (r >= 18 && r <= 22 && c >= 2 && c <= 10) return 1;
  if (r >= 30 && r <= 32 && c >= 16 && c <= 28) return 1;
  return 0;
}

function railH(r: number): number {
  return r === 9 || r === 34 ? 1 : 0;
}

function railV(c: number): number {
  return c === 13 || c === 47 ? 1 : 0;
}

function add(kind: number, x: number, y: number, a: number, b: number): void {
  if (featN >= MAX_FEAT) return;
  const i = featN++;
  fk[i] = kind;
  fx[i] = x;
  fy[i] = y;
  fa[i] = a;
  fb[i] = b;
}

function addVent(x: number, y: number): void {
  if (ventN >= MAX_VENT) return;
  vx[ventN] = x;
  vy[ventN] = y;
  ventN++;
}

function forceVent(c: number, r: number): void {
  if (r < FLOOR0 || railH(r) || railV(c)) return;
  cells[r * COLS + c] = KIND_VENT;
}

function build(): void {
  if (ready) return;
  ready = 1;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const i = r * COLS + c;
      if (r < FLOOR0) {
        cells[i] = KIND_SKY;
        continue;
      }
      if (railH(r)) {
        cells[i] = KIND_RAIL_H;
        continue;
      }
      if (railV(c)) {
        cells[i] = KIND_RAIL_V;
        continue;
      }
      const h = hash(c, r);
      if (brassPad(c, r)) {
        cells[i] = (h & 3) === 0 ? KIND_BRASS_W : KIND_BRASS;
        continue;
      }
      if ((c < 3 || c > 56 || r > 36) && h % 4 === 0) {
        cells[i] = KIND_RUBBLE;
        continue;
      }
      if (h % 61 === 0) {
        cells[i] = KIND_VENT;
        continue;
      }
      if (h % 47 === 0) {
        cells[i] = KIND_GRATE;
        continue;
      }
      const v = h % 17;
      cells[i] = v < 2 ? KIND_COBBLE_W : v < 6 ? KIND_COBBLE_D : KIND_COBBLE;
    }
  }
  forceVent(8, 10);
  forceVent(8, 14);
  forceVent(22, 14);
  forceVent(36, 12);
  forceVent(22, 30);
  forceVent(36, 30);
  forceVent(52, 12);
  forceVent(52, 20);
  forceVent(18, 28);
  forceVent(40, 32);
  add(FEAT_PIPE, 24, 136, 140, 0);
  add(FEAT_PIPE, 164, 136, 90, 1);
  add(FEAT_PIPE, 720, 148, 200, 0);
  add(FEAT_PIPE, 920, 148, 80, 1);
  add(FEAT_PIPE, 40, 220, 180, 0);
  add(FEAT_PIPE, 40, 220, 70, 1);
  add(FEAT_PIPE, 40, 360, 180, 0);
  add(FEAT_PIPE, 780, 300, 110, 1);
  add(FEAT_PIPE, 40, 520, 200, 0);
  add(FEAT_PIPE, 880, 440, 160, 1);
  add(FEAT_LAMP, 56, 148, 72, 0);
  add(FEAT_LAMP, 188, 188, 68, 0);
  add(FEAT_LAMP, 352, 156, 74, 0);
  add(FEAT_LAMP, 332, 208, 70, 0);
  add(FEAT_LAMP, 708, 168, 76, 0);
  add(FEAT_LAMP, 868, 228, 68, 0);
  add(FEAT_LAMP, 248, 368, 80, 0);
  add(FEAT_LAMP, 648, 392, 78, 0);
  add(FEAT_LAMP, 332, 210, 68, 0);
  add(FEAT_LAMP, 628, 210, 68, 0);
  add(FEAT_LAMP, 348, 490, 68, 0);
  add(FEAT_LAMP, 620, 490, 68, 0);
  add(FEAT_GEAR, 120, 210, 14, 8);
  add(FEAT_GEAR, 332, 250, 12, 7);
  add(FEAT_GEAR, 610, 180, 15, 8);
  add(FEAT_GEAR, 790, 340, 13, 6);
  add(FEAT_GEAR, 330, 470, 16, 8);
  add(FEAT_GEAR, 860, 520, 11, 7);
  for (let i = 0; i < 14; i++) {
    const hx = hash(i, 9);
    add(FEAT_STAIN, 40 + (hx % 880), 130 + ((hx >>> 8) % 470), 10 + (hx % 16), 6 + ((hx >>> 4) % 10));
  }
  for (let i = 0; i < 12; i++) {
    const hx = hash(i, 21);
    add(FEAT_RUBBLE, 20 + (hx % 920), 140 + ((hx >>> 7) % 460), 8 + (hx % 10), 0);
  }
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (cells[r * COLS + c] !== KIND_VENT) continue;
      addVent(c * TILE + 8, r * TILE + 8);
    }
  }
}

export function groundCols(): number {
  return COLS;
}

export function groundRows(): number {
  return ROWS;
}

export function groundKind(c: number, r: number): number {
  build();
  if (c < 0 || r < 0 || c >= COLS || r >= ROWS) return KIND_SKY;
  return cells[r * COLS + c] ?? KIND_SKY;
}

export function ventSlow(x: number, y: number): number {
  const k = groundKind((x / TILE) | 0, (y / TILE) | 0);
  if (k === KIND_VENT || k === KIND_GRATE) return VENT_SLOW;
  return 1;
}

export function groundFeatureCount(): number {
  build();
  return featN;
}

export function groundFeatureAt(i: number): { kind: number; x: number; y: number; a: number; b: number } {
  build();
  return { kind: fk[i] ?? 0, x: fx[i] ?? 0, y: fy[i] ?? 0, a: fa[i] ?? 0, b: fb[i] ?? 0 };
}

export function ventCount(): number {
  build();
  return ventN;
}

export function ventX(i: number): number {
  build();
  return vx[i] ?? 0;
}

export function ventY(i: number): number {
  build();
  return vy[i] ?? 0;
}

export function eachVentFx(
  camX: number,
  camY: number,
  tick: number,
  draw: (x: number, y: number, s: number, t: number) => void,
): number {
  build();
  let n = 0;
  let puffs = 0;
  for (let i = 0; i < ventN; i++) {
    const x = vx[i] ?? 0;
    const y = vy[i] ?? 0;
    if (x < camX - 40 || y < camY - 40 || x > camX + W + 40 || y > camY + H + 40) continue;
    for (let k = 0; k < VENT_PUFFS; k++) {
      const t = ((tick * 0.45 + i * 11 + k * 17) % 50) / 50;
      draw(x + Math.sin(t * 4 + i) * 3, y - 4 - t * 22, 6 + t * 12, t);
      puffs++;
    }
    n++;
    if (n >= VENT_FX_CAP) break;
  }
  return puffs;
}

export function ventFxCount(camX: number, camY: number, tick = 0): number {
  return eachVentFx(camX, camY, tick, () => {});
}

function rail(ctx: CanvasRenderingContext2D, x: number, y: number, vert: number): void {
  ctx.fillStyle = "#1c1610";
  ctx.fillRect(x, y, TILE, TILE);
  ctx.fillStyle = "#7a4a22";
  if (vert) {
    ctx.fillRect(x + 1, y + 1, 4, 14);
    ctx.fillRect(x + 11, y + 1, 4, 14);
    ctx.fillStyle = "#3a3230";
    ctx.fillRect(x + 5, y, 2, TILE);
    ctx.fillRect(x + 9, y, 2, TILE);
    ctx.fillStyle = "#8a8478";
    ctx.fillRect(x + 5, y, 1, TILE);
    ctx.fillStyle = "#8a5a20";
    ctx.fillRect(x + 6, y + 4, 4, 2);
  } else {
    ctx.fillRect(x + 1, y + 1, 14, 4);
    ctx.fillRect(x + 1, y + 11, 14, 4);
    ctx.fillStyle = "#2c2620";
    ctx.fillRect(x, y + 5, TILE, 2);
    ctx.fillRect(x, y + 9, TILE, 2);
    ctx.fillStyle = "#8a8478";
    ctx.fillRect(x, y + 5, TILE, 1);
    ctx.fillStyle = "#8a5a20";
    ctx.fillRect(x + 5, y + 6, 4, 2);
  }
}

function rubbleTile(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.fillStyle = "#2a221c";
  ctx.fillRect(x, y, TILE, TILE);
  const h = hash(x, y, 5);
  ctx.fillStyle = "#5a4a3a";
  ctx.fillRect(x + 2 + (h % 6), y + 3 + ((h >>> 3) % 5), 5, 4);
  ctx.fillStyle = "#8a7462";
  ctx.fillRect(x + 7 + ((h >>> 5) % 4), y + 8, 4, 3);
  ctx.fillStyle = "#5a3a18";
  ctx.fillRect(x + 4 + ((h >>> 7) % 7), y + 6, 2, 2);
}

function pipe(ctx: CanvasRenderingContext2D, x: number, y: number, len: number, vert: number): void {
  const x1 = vert ? x : x + len;
  const y1 = vert ? y + len : y;
  ctx.lineCap = "round";
  ctx.strokeStyle = COPPER.edge;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(x, y + 1);
  ctx.lineTo(x1, y1 + 1);
  ctx.stroke();
  ctx.strokeStyle = COPPER.mid;
  ctx.lineWidth = 5.6;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  ctx.strokeStyle = COPPER.hi;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(x, y - 2);
  ctx.lineTo(x1, y1 - 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, 5, 0, Math.PI * 2);
  ctx.fillStyle = BRASS.mid;
  ctx.fill();
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 1.2;
  ctx.stroke();
  rivet(ctx, x, y, 1.2);
}

function stain(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number): void {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0.3, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(18,12,8,0.32)";
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x - rx * 0.2, y - ry * 0.15, rx * 0.45, ry * 0.35, -0.2, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(80,50,20,0.18)";
  ctx.fill();
}

function rubblePile(ctx: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  const h = hash(x | 0, y | 0, 11);
  for (let i = 0; i < 5; i++) {
    const ox = ((h >>> (i * 3)) & 7) - 3;
    const oy = ((h >>> (i * 2 + 4)) & 5) - 2;
    ctx.fillStyle = i & 1 ? "#6a5848" : "#4e4238";
    ctx.fillRect(x + ox * 2, y + oy * 2, 4 + (i & 2), 3 + (i & 1));
  }
  ctx.fillStyle = "#7a5418";
  ctx.fillRect(x + (s & 3), y - 1, 3, 2);
}

function fog(ctx: CanvasRenderingContext2D): void {
  const haze = ctx.createLinearGradient(0, 100, 0, 280);
  haze.addColorStop(0, "rgba(16,16,22,0.28)");
  haze.addColorStop(0.5, "rgba(20,20,28,0.1)");
  haze.addColorStop(1, "rgba(10,10,14,0)");
  ctx.fillStyle = haze;
  ctx.fillRect(0, 100, ARENA_W, 220);
}

export const HAZARD_MARKS = [
  [8, 10],
  [22, 14],
  [36, 12],
  [22, 30],
  [36, 30],
] as const;

export function paintGround(ctx: CanvasRenderingContext2D): void {
  build();
  ctx.fillStyle = "#24303c";
  ctx.fillRect(0, 108, ARENA_W, ARENA_H - 108);
  tileSheet(ctx, "tile_stone_seamless", 0, FLOOR0 * TILE, ARENA_W, ARENA_H - FLOOR0 * TILE);
  ctx.save();
  ctx.globalAlpha = 0.52;
  ctx.fillStyle = "#24303c";
  ctx.fillRect(0, FLOOR0 * TILE, ARENA_W, ARENA_H - FLOOR0 * TILE);
  ctx.restore();
  ctx.save();
  ctx.strokeStyle = "rgba(36,48,62,0.55)";
  ctx.lineWidth = 1;
  const grout = TILE * 2;
  for (let x = 0; x <= ARENA_W; x += grout) {
    ctx.beginPath();
    ctx.moveTo(x + 0.5, FLOOR0 * TILE);
    ctx.lineTo(x + 0.5, ARENA_H);
    ctx.stroke();
  }
  for (let y = FLOOR0 * TILE; y <= ARENA_H; y += grout) {
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(ARENA_W, y + 0.5);
    ctx.stroke();
  }
  ctx.restore();
  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  ctx.fillStyle = "rgba(16,24,36,0.22)";
  ctx.fillRect(0, FLOOR0 * TILE, ARENA_W, ARENA_H - FLOOR0 * TILE);
  ctx.restore();
  for (let r = FLOOR0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const k = cells[r * COLS + c] ?? KIND_COBBLE;
      const x = c * TILE;
      const y = r * TILE;
      if (k === KIND_COBBLE || k === KIND_COBBLE_D || k === KIND_COBBLE_W) continue;
      else if (k === KIND_BRASS || k === KIND_BRASS_W) {
        tileSheet(ctx, "tile_metal_seamless", x, y, TILE, TILE);
      }
      else if (k === KIND_RAIL_H) rail(ctx, x, y, 0);
      else if (k === KIND_RAIL_V) rail(ctx, x, y, 1);
      else if (k === KIND_GRATE) blitSheet(ctx, "decal_grate", x + 8, y + 14);
      else if (k === KIND_VENT) blitSheet(ctx, "decal_vent", x + 8, y + 14);
      else if (k === KIND_RUBBLE) rubbleTile(ctx, x, y);
    }
  }
  for (let i = 0; i < HAZARD_MARKS.length; i++) {
    const mark = HAZARD_MARKS[i];
    if (!mark) continue;
    blitSheet(ctx, "decal_hazard", mark[0] * TILE + 8, mark[1] * TILE + 14);
  }
  for (let i = 0; i < featN; i++) {
    if (fk[i] !== FEAT_STAIN) continue;
    stain(ctx, fx[i] ?? 0, fy[i] ?? 0, fa[i] ?? 8, fb[i] ?? 5);
  }
  for (let i = 0; i < featN; i++) {
    if (fk[i] !== FEAT_PIPE) continue;
    pipe(ctx, fx[i] ?? 0, fy[i] ?? 0, fa[i] ?? 40, fb[i] ?? 0);
  }
  for (let i = 0; i < featN; i++) {
    if (fk[i] !== FEAT_GEAR) continue;
    const metal: Metal = (i & 1) === 0 ? BRASS : COPPER;
    cog(ctx, fx[i] ?? 0, fy[i] ?? 0, fa[i] ?? 12, (i * 0.4), metal, 7 + (i & 1), false);
  }
  for (let i = 0; i < featN; i++) {
    if (fk[i] !== FEAT_RUBBLE) continue;
    rubblePile(ctx, fx[i] ?? 0, fy[i] ?? 0, fa[i] ?? 8);
  }
  fog(ctx);
  ctx.fillStyle = "rgba(12,8,8,0.22)";
  ctx.fillRect(0, 108, ARENA_W, 10);
}
