import { ARENA_H, ARENA_W } from "../sim/arena";
import { H, W } from "../sim/types";
import { YARD_W, ZONE_N, zoneAt, zoneRow, type ZoneRow } from "../sim/zones";
import { BRASS, cog, COPPER, type Metal, OUTLINE, rivet, STEEL } from "./paint";

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

const COLS = (ARENA_W / TILE) | 0;
const ROWS = (ARENA_H / TILE) | 0;
const FLOOR0 = 7;
const YARD_COLS = (YARD_W / TILE) | 0;

function featBudget(): number {
  let n = 0;
  for (let z = 0; z < ZONE_N; z++) {
    const row = zoneRow(z);
    n += row.pipeN + row.lampN + row.gearN + row.stainN + row.rubbleN;
  }
  return n;
}

function ventBudget(): number {
  let n = 0;
  for (let z = 0; z < ZONE_N; z++) n += zoneRow(z).ventN;
  return n;
}

const MAX_FEAT = featBudget();
const MAX_VENT = ventBudget();
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

function css(n: number): string {
  return `#${(n & 0xffffff).toString(16).padStart(6, "0")}`;
}

function shade(n: number): number {
  const r = (((n >> 16) & 255) * 2 / 3) | 0;
  const g = (((n >> 8) & 255) * 2 / 3) | 0;
  const b = ((n & 255) * 2 / 3) | 0;
  return (r << 16) | (g << 8) | b;
}

function listed(xs: readonly number[], v: number): number {
  for (let i = 0; i < xs.length; i++) if (xs[i] === v) return 1;
  return 0;
}

function onPad(row: ZoneRow, col: number, r: number): number {
  const pads = row.pads;
  for (let i = 0; i < pads.length; i++) {
    const p = pads[i];
    if (!p) continue;
    if (r >= p.row0 && r <= p.row1 && col >= p.col0 && col <= p.col1) return 1;
  }
  return 0;
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

function placeFeat(zone: number, kind: number, count: number, size: (h: number) => { a: number; b: number }): void {
  const x0 = zone * YARD_W + 24;
  const xSpan = YARD_W - 48;
  const y0 = 120;
  const ySpan = ARENA_H - 20 - y0;
  for (let i = 0; i < count; i++) {
    const h = hash(i, kind, zone);
    const spot = size(h);
    add(kind, x0 + (h % xSpan), y0 + ((h >>> 8) % ySpan), spot.a, spot.b);
  }
}

function placeFeatures(zone: number, row: ZoneRow): void {
  placeFeat(zone, FEAT_PIPE, row.pipeN, (h) => ({ a: 70 + (h % 150), b: h & 1 }));
  placeFeat(zone, FEAT_LAMP, row.lampN, (h) => ({ a: 64 + (h % 20), b: 0 }));
  placeFeat(zone, FEAT_GEAR, row.gearN, (h) => ({ a: 11 + (h % 6), b: 6 + (h % 3) }));
  placeFeat(zone, FEAT_STAIN, row.stainN, (h) => ({ a: 10 + (h % 16), b: 6 + ((h >>> 4) % 10) }));
  placeFeat(zone, FEAT_RUBBLE, row.rubbleN, (h) => ({ a: 8 + (h % 10), b: 0 }));
}

function build(): void {
  if (ready) return;
  featN = 0;
  ventN = 0;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const i = r * COLS + c;
      if (r < FLOOR0) {
        cells[i] = KIND_SKY;
        continue;
      }
      const zone = (c * TILE / YARD_W) | 0;
      const row = zoneRow(zone);
      const localC = c - zone * YARD_COLS;
      const h = hash(c, r, zone);
      if (listed(row.railRows, r)) {
        cells[i] = KIND_RAIL_H;
        continue;
      }
      if (listed(row.railCols, localC)) {
        cells[i] = KIND_RAIL_V;
        continue;
      }
      if (onPad(row, localC, r)) {
        cells[i] = (h & 3) === 0 ? KIND_BRASS_W : KIND_BRASS;
        continue;
      }
      if (row.edgeRubble && (localC < 3 || localC > YARD_COLS - 4 || r > 36) && h % 4 === 0) {
        cells[i] = KIND_RUBBLE;
        continue;
      }
      if (row.grateMod > 0 && h % row.grateMod === 0) {
        cells[i] = KIND_GRATE;
        continue;
      }
      const v = hash(c, r) % 17;
      cells[i] = v < 2 ? KIND_COBBLE_W : v < 6 ? KIND_COBBLE_D : KIND_COBBLE;
    }
  }
  const floorN = ROWS - FLOOR0;
  for (let zone = 0; zone < ZONE_N; zone++) {
    const row = zoneRow(zone);
    let placed = 0;
    let salt = 0;
    const guard = YARD_COLS * floorN;
    while (placed < row.ventN && salt < guard) {
      const h = hash(salt, zone, 9);
      const localC = h % YARD_COLS;
      const r = FLOOR0 + ((h >>> 8) % floorN);
      const c = zone * YARD_COLS + localC;
      const i = r * COLS + c;
      const k = cells[i] ?? 0;
      salt++;
      if (k !== KIND_COBBLE && k !== KIND_COBBLE_D && k !== KIND_COBBLE_W) continue;
      cells[i] = KIND_VENT;
      placed++;
    }
    placeFeatures(zone, row);
  }
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (cells[r * COLS + c] !== KIND_VENT) continue;
      addVent(c * TILE + 8, r * TILE + 8);
    }
  }
  ready = 1;
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

function cobbleField(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = "#2a221c";
  ctx.fillRect(0, FLOOR0 * TILE, ARENA_W, ARENA_H - FLOOR0 * TILE);
  for (let row = 0, y = FLOOR0 * TILE; y < ARENA_H; y += 7, row++) {
    const ox = row & 1 ? 5 : 0;
    for (let x = -8; x < ARENA_W; x += 10) {
      const sx = x + ox;
      const h = hash(sx, y);
      const stone = zoneRow(zoneAt(sx)).stone;
      ctx.fillStyle = css(stone[h % stone.length] ?? 0x6a5848);
      ctx.fillRect(sx + 1, y + 1, 8 + (h & 1), 5);
      ctx.fillStyle = "rgba(255,236,210,0.12)";
      ctx.fillRect(sx + 1, y + 1, 8, 1);
      ctx.fillStyle = "rgba(0,0,0,0.22)";
      ctx.fillRect(sx + 1, y + 5, 8, 1);
    }
  }
}

function plate(ctx: CanvasRenderingContext2D, x: number, y: number, worn: number): void {
  const brass = zoneRow(zoneAt(x)).brass;
  ctx.fillStyle = "#4a2c08";
  ctx.fillRect(x, y, TILE, TILE);
  ctx.fillStyle = css(worn ? shade(brass) : brass);
  ctx.fillRect(x + 1, y + 1, 14, 14);
  ctx.fillStyle = "rgba(255,241,194,0.38)";
  ctx.fillRect(x + 2, y + 2, 12, 2);
  ctx.fillStyle = "rgba(0,0,0,0.24)";
  ctx.fillRect(x + 2, y + 12, 12, 2);
  if ((hash(x, y) & 3) === 0) {
    ctx.strokeStyle = "rgba(255,241,194,0.16)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 4, y + 4);
    ctx.lineTo(x + 12, y + 12);
    ctx.stroke();
  }
  ctx.fillStyle = "#fff1c2";
  ctx.fillRect(x + 2, y + 2, 1.6, 1.6);
  ctx.fillRect(x + 12, y + 2, 1.6, 1.6);
  ctx.fillRect(x + 2, y + 12, 1.6, 1.6);
  ctx.fillRect(x + 12, y + 12, 1.6, 1.6);
}

function rail(ctx: CanvasRenderingContext2D, x: number, y: number, vert: number): void {
  ctx.fillStyle = "#1c1610";
  ctx.fillRect(x, y, TILE, TILE);
  ctx.fillStyle = "#7a4a22";
  if (vert) {
    ctx.fillRect(x + 1, y + 1, 4, 14);
    ctx.fillRect(x + 11, y + 1, 4, 14);
    ctx.fillStyle = "#c8d4de";
    ctx.fillRect(x + 5, y, 2, TILE);
    ctx.fillRect(x + 9, y, 2, TILE);
    ctx.fillStyle = "#f2f7fb";
    ctx.fillRect(x + 5, y, 1, TILE);
  } else {
    ctx.fillRect(x + 1, y + 1, 14, 4);
    ctx.fillRect(x + 1, y + 11, 14, 4);
    ctx.fillStyle = "#c8d4de";
    ctx.fillRect(x, y + 5, TILE, 2);
    ctx.fillRect(x, y + 9, TILE, 2);
    ctx.fillStyle = "#f2f7fb";
    ctx.fillRect(x, y + 5, TILE, 1);
  }
}

function grate(ctx: CanvasRenderingContext2D, x: number, y: number, vent: number): void {
  ctx.fillStyle = "#1a1410";
  ctx.fillRect(x, y, TILE, TILE);
  ctx.fillStyle = "#3a2a18";
  ctx.fillRect(x + 2, y + 2, 12, 12);
  ctx.fillStyle = css(zoneRow(zoneAt(x)).brass);
  for (let i = 0; i < 4; i++) ctx.fillRect(x + 3, y + 3 + i * 3, 10, 1.2);
  if (!vent) return;
  ctx.fillStyle = "#0c0806";
  ctx.beginPath();
  ctx.ellipse(x + 8, y + 8, 3.2, 2.2, 0, 0, Math.PI * 2);
  ctx.fill();
}

function rubbleTile(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.fillStyle = "#2a221c";
  ctx.fillRect(x, y, TILE, TILE);
  const h = hash(x, y, 5);
  ctx.fillStyle = "#5a4a3a";
  ctx.fillRect(x + 2 + (h % 6), y + 3 + ((h >>> 3) % 5), 5, 4);
  ctx.fillStyle = "#8a7462";
  ctx.fillRect(x + 7 + ((h >>> 5) % 4), y + 8, 4, 3);
  ctx.fillStyle = "#c49038";
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
  ctx.fillStyle = "#a87828";
  ctx.fillRect(x + (s & 3), y - 1, 3, 2);
}

function lamp(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.fillStyle = "#2a2218";
  ctx.beginPath();
  ctx.ellipse(x, y + 10, 5, 2.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = STEEL.lo;
  ctx.fillRect(x - 1.4, y - 18, 2.8, 26);
  ctx.fillStyle = BRASS.mid;
  ctx.fillRect(x - 4, y - 24, 8, 8);
  ctx.fillStyle = "#ffe29a";
  ctx.fillRect(x - 3, y - 23, 6, 6);
  ctx.fillStyle = "rgba(255,241,194,0.55)";
  ctx.fillRect(x - 2, y - 22, 2, 4);
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 1;
  ctx.strokeRect(x - 4, y - 24, 8, 8);
}

function pool(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  const g = ctx.createRadialGradient(x, y, 4, x, y, r);
  g.addColorStop(0, "rgba(255,180,70,0.3)");
  g.addColorStop(0.45, "rgba(255,140,40,0.12)");
  g.addColorStop(1, "rgba(255,120,30,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(x, y + 6, r, r * 0.62, 0, 0, Math.PI * 2);
  ctx.fill();
}

function fog(ctx: CanvasRenderingContext2D): void {
  const haze = ctx.createLinearGradient(0, 100, 0, 280);
  haze.addColorStop(0, "rgba(48,28,52,0.2)");
  haze.addColorStop(0.4, "rgba(80,40,28,0.06)");
  haze.addColorStop(1, "rgba(20,12,16,0)");
  ctx.fillStyle = haze;
  ctx.fillRect(0, 100, ARENA_W, 220);
  ctx.fillStyle = "rgba(40,24,36,0.08)";
  ctx.beginPath();
  ctx.ellipse(180, 160, 90, 18, 0, 0, Math.PI * 2);
  ctx.ellipse(620, 200, 110, 20, 0, 0, Math.PI * 2);
  ctx.ellipse(400, 420, 140, 24, 0, 0, Math.PI * 2);
  ctx.fill();
}

function fillDirt(ctx: CanvasRenderingContext2D, dirt: readonly [number, number, number], x: number, w: number): void {
  const g = ctx.createLinearGradient(0, 108, 0, ARENA_H);
  g.addColorStop(0, css(dirt[0]));
  g.addColorStop(0.45, css(dirt[1]));
  g.addColorStop(1, css(dirt[2]));
  ctx.fillStyle = g;
  ctx.fillRect(x, 108, w, ARENA_H - 108);
}

export function paintGround(ctx: CanvasRenderingContext2D): void {
  build();
  for (let zone = 0; zone < ZONE_N; zone++) {
    const row = zoneRow(zone);
    fillDirt(ctx, row.dirt, zone * YARD_W, YARD_W);
  }
  cobbleField(ctx);
  for (let r = FLOOR0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const k = cells[r * COLS + c] ?? KIND_COBBLE;
      const x = c * TILE;
      const y = r * TILE;
      if (k === KIND_COBBLE || k === KIND_COBBLE_D || k === KIND_COBBLE_W) continue;
      else if (k === KIND_BRASS) plate(ctx, x, y, 0);
      else if (k === KIND_BRASS_W) plate(ctx, x, y, 1);
      else if (k === KIND_RAIL_H) rail(ctx, x, y, 0);
      else if (k === KIND_RAIL_V) rail(ctx, x, y, 1);
      else if (k === KIND_GRATE) grate(ctx, x, y, 0);
      else if (k === KIND_VENT) grate(ctx, x, y, 1);
      else if (k === KIND_RUBBLE) rubbleTile(ctx, x, y);
    }
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
  for (let i = 0; i < featN; i++) {
    if (fk[i] !== FEAT_LAMP) continue;
    pool(ctx, fx[i] ?? 0, fy[i] ?? 0, fa[i] ?? 70);
  }
  for (let i = 0; i < featN; i++) {
    if (fk[i] !== FEAT_LAMP) continue;
    lamp(ctx, fx[i] ?? 0, fy[i] ?? 0);
  }
  fog(ctx);
  ctx.fillStyle = "rgba(12,8,8,0.22)";
  ctx.fillRect(0, 108, ARENA_W, 10);
}
