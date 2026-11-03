import { B_ACID, Z_GAS, Z_KNIGHT, Z_RAT, Z_SPITTER } from "../sim/foes";

const SOOT = "#120c08";
const BRASS = "#c8963e";
const BRASS_HI = "#e8c878";
const BRASS_LO = "#7a5420";
const COPPER = "#b5562f";
const COPPER_HI = "#d4784a";
const EMBER = "#ff7a2a";
const EMBER_HI = "#ffd27a";
const ROT = "#3d5a22";
const ROT_HI = "#6a8a38";
const ROT_LO = "#2a3c14";
const ACID = "#8fd84a";
const ACID_HI = "#e7ff9a";
const ACID_LO = "#3f6a14";
const GAS = "#b6e86a";
const ELITE_BOX = [14, 11, 18, 13, 15, 17, 8];

function px(c: CanvasRenderingContext2D, x: number, y: number, s: string, w = 1, h = 1): void {
  c.fillStyle = s;
  c.fillRect(x | 0, y | 0, w, h);
}

function shadow(c: CanvasRenderingContext2D, x: number, y: number, w: number): void {
  c.globalAlpha = 0.45;
  px(c, x - w / 2, y + 6, SOOT, w, 3);
  c.globalAlpha = 1;
}

function spitter(c: CanvasRenderingContext2D, x: number, y: number, tick: number, px0: number, py0: number): void {
  const ix = x | 0;
  const iy = y | 0;
  const bob = tick >> 3 & 1;
  const pulse = tick >> 2 & 1;
  shadow(c, ix, iy, 16);
  px(c, ix - 7, iy + 2 + bob, ROT_LO, 4, 9);
  px(c, ix + 3, iy + 2 + (bob ^ 1), ROT_LO, 4, 9);
  px(c, ix - 8, iy + 9 + bob, ACID_LO, 5, 3);
  px(c, ix + 3, iy + 9 + (bob ^ 1), ACID_LO, 5, 3);
  px(c, ix - 8, iy - 10 + bob, ROT, 16, 14);
  px(c, ix - 6, iy - 8 + bob, ROT_LO, 7, 10);
  px(c, ix - 5, iy - 6 + bob, pulse ? ACID_HI : ACID, 10, 9);
  px(c, ix - 2, iy - 3 + bob, ACID_HI, 4, 4);
  px(c, ix - 1, iy - 2 + bob, "#f4ffd0", 2, 2);
  px(c, ix - 6, iy - 18 + bob, ROT_HI, 12, 9);
  px(c, ix - 4, iy - 16 + bob, ROT_LO, 8, 5);
  px(c, ix + 1, iy - 15 + bob, ACID_HI, 3, 3);
  px(c, ix + 2, iy - 14 + bob, EMBER, 1, 1);
  px(c, ix - 11, iy - 6 + bob, ROT, 4, 8);
  const dx = px0 - x;
  const dy = py0 - y;
  const d = Math.sqrt(dx * dx + dy * dy) || 1;
  const ux = dx / d;
  const uy = dy / d;
  const nx = ix + ux * 12;
  const ny = iy - 12 + bob + uy * 8;
  px(c, nx - 2, ny - 2, BRASS_LO, 7, 5);
  px(c, nx + ux * 5, ny + uy * 3, BRASS, 4, 3);
  px(c, nx + ux * 8, ny + uy * 4, pulse ? ACID_HI : ACID, 3, 3);
  if (pulse) px(c, nx + ux * 10, ny + uy * 6 + 3, ACID, 2, 2);
}

function gasTank(c: CanvasRenderingContext2D, x: number, y: number, tick: number, hp: number): void {
  const ix = x | 0;
  const iy = y | 0;
  const bob = tick >> 4 & 1;
  const blink = tick >> 2 & 1;
  shadow(c, ix, iy, 22);
  px(c, ix - 8, iy + 4 + bob, ROT_LO, 6, 8);
  px(c, ix + 3, iy + 4 + (bob ^ 1), ROT_LO, 6, 8);
  px(c, ix - 9, iy + 10 + bob, SOOT, 7, 3);
  px(c, ix + 3, iy + 10 + (bob ^ 1), SOOT, 7, 3);
  px(c, ix - 9, iy - 8 + bob, ROT, 18, 14);
  px(c, ix - 7, iy - 6 + bob, ROT_LO, 8, 10);
  px(c, ix - 10, iy - 16 + bob, "#6a3018", 20, 12);
  px(c, ix - 8, iy - 14 + bob, COPPER, 16, 8);
  px(c, ix - 10, iy - 12 + bob, BRASS, 20, 2);
  px(c, ix - 10, iy - 8 + bob, BRASS_LO, 20, 2);
  px(c, ix + 8, iy - 18 + bob, BRASS_HI, 3, 6);
  px(c, ix + 7, iy - 20 + bob, BRASS, 5, 3);
  c.globalAlpha = 0.55;
  const leak = tick % 14;
  px(c, ix + 8 + (tick >> 2 & 1), iy - 24 - leak + bob, GAS, 5, 4);
  px(c, ix + 6, iy - 30 - (leak >> 1) + bob, ACID_HI, 4, 3);
  c.globalAlpha = 1;
  px(c, ix - 4, iy - 22 + bob, ROT_HI, 8, 7);
  px(c, ix - 2, iy - 20 + bob, SOOT, 4, 3);
  px(c, ix - 1, iy - 19 + bob, EMBER, 2, 2);
  px(c, ix + 2, iy - 10 + bob, blink ? EMBER : EMBER_HI, 4, 4);
  const pips = Math.min(8, hp);
  for (let p = 0; p < pips; p++) px(c, ix - 8 + p * 3, iy - 18 + bob, p < 3 ? EMBER : BRASS_HI, 2, 2);
}

function knight(c: CanvasRenderingContext2D, x: number, y: number, tick: number, face: number, hp: number): void {
  const ix = x | 0;
  const iy = y | 0;
  const bob = tick >> 4 & 1;
  shadow(c, ix, iy, 20);
  px(c, ix - 7, iy + 3 + bob, "#5a3018", 5, 8);
  px(c, ix + 2, iy + 3 + (bob ^ 1), "#5a3018", 5, 8);
  px(c, ix - 8, iy + 9 + bob, BRASS_LO, 6, 3);
  px(c, ix + 2, iy + 9 + (bob ^ 1), BRASS_LO, 6, 3);
  px(c, ix - 9, iy - 12 + bob, COPPER, 18, 16);
  px(c, ix - 7, iy - 10 + bob, "#8a3e28", 14, 12);
  px(c, ix - 8, iy - 11 + bob, BRASS_HI, 2, 2);
  px(c, ix + 6, iy - 11 + bob, BRASS_HI, 2, 2);
  px(c, ix - 8, iy + 1 + bob, BRASS, 2, 2);
  px(c, ix + 6, iy + 1 + bob, BRASS, 2, 2);
  px(c, ix - 6, iy - 22 + bob, COPPER, 12, 10);
  px(c, ix - 4, iy - 24 + bob, BRASS, 8, 3);
  px(c, ix - 1, iy - 26 + bob, BRASS_HI, 2, 3);
  px(c, ix - 4, iy - 19 + bob, SOOT, 8, 3);
  px(c, ix - 2, iy - 19 + bob, EMBER, 2, 2);
  px(c, ix + 2, iy - 19 + bob, EMBER, 2, 2);
  const sx = Math.cos(face) * 11;
  const sy = Math.sin(face) * 9;
  const hx = ix + sx;
  const hy = iy - 8 + bob + sy;
  px(c, hx - 6, hy - 8, BRASS_LO, 12, 18);
  px(c, hx - 4, hy - 6, COPPER, 8, 14);
  px(c, hx - 5, hy - 7, COPPER_HI, 10, 2);
  px(c, hx - 5, hy + 6, BRASS_HI, 10, 2);
  px(c, hx - 2, hy - 2, BRASS, 4, 4);
  px(c, hx - 1, hy - 1, BRASS_HI, 2, 2);
  const pips = Math.min(8, hp);
  for (let p = 0; p < pips; p++) px(c, ix - 8 + p * 2, iy - 14 + bob, BRASS_HI, 2, 2);
}

function rat(c: CanvasRenderingContext2D, x: number, y: number, tick: number): void {
  const ix = x | 0;
  const iy = y | 0;
  const scurry = tick >> 2 & 1;
  shadow(c, ix, iy + 2, 10);
  px(c, ix - 6, iy - 1, BRASS_LO, 2, 2);
  px(c, ix + 4, iy - 1, BRASS_LO, 2, 2);
  px(c, ix - 5, iy - 3, BRASS, 10, 6);
  px(c, ix - 3, iy - 5, BRASS_HI, 6, 3);
  px(c, ix - 1, iy - 2, SOOT, 2, 2);
  px(c, ix + 3, iy - 4, COPPER, 5, 4);
  px(c, ix + 6, iy - 3, "#ff3a2a", 2, 2);
  px(c, ix + 7, iy - 5, BRASS_LO, 2, 2);
  px(c, ix - 8, iy + scurry, BRASS_LO, 4, 1);
  px(c, ix - 3, iy + 3, SOOT, 2, 2);
  px(c, ix + 1, iy + 3 + scurry, SOOT, 2, 2);
}

export function drawFoe(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  tick: number,
  kind: number,
  hp: number,
  face: number,
  px0: number,
  py0: number,
): void {
  if (kind === Z_SPITTER) spitter(c, x, y, tick, px0, py0);
  else if (kind === Z_GAS) gasTank(c, x, y, tick, hp);
  else if (kind === Z_KNIGHT) knight(c, x, y, tick, face, hp);
  else if (kind === Z_RAT) rat(c, x, y, tick);
  else shamStandIn(c, x, y, tick);
}

function shamStandIn(c: CanvasRenderingContext2D, x: number, y: number, tick: number): void {
  const ix = x | 0;
  const iy = y | 0;
  const bob = tick >> 4 & 1;
  shadow(c, ix, iy, 12);
  px(c, ix - 4, iy - 8 + bob, ROT, 8, 12);
  px(c, ix - 2, iy - 14 + bob, ROT_HI, 6, 6);
}

export function openElite(c: CanvasRenderingContext2D, x: number, y: number): void {
  c.save();
  c.translate(x, y);
  c.scale(1.34, 1.34);
  c.translate(-x, -y);
}

export function closeElite(c: CanvasRenderingContext2D, x: number, y: number, tick: number, kind: number): void {
  c.restore();
  const r = ELITE_BOX[kind] ?? 14;
  const y0 = (y - r - 6) | 0;
  const x0 = (x - r) | 0;
  const s = r * 2;
  const h = r * 2 + 8;
  const col = (tick >> 2) & 1 ? "#fff1b0" : "#e2b84a";
  const hot = (tick >> 3) & 1 ? "#fff6c8" : "#ff9a3a";
  c.globalAlpha = 0.95;
  px(c, x0, y0, col, s, 2);
  px(c, x0, y0 + h - 2, col, s, 2);
  px(c, x0, y0, col, 2, h);
  px(c, x0 + s - 2, y0, col, 2, h);
  px(c, x0 - 2, y0 - 2, hot, 4, 4);
  px(c, x0 + s - 2, y0 - 2, hot, 4, 4);
  px(c, x0 - 2, y0 + h - 2, hot, 4, 4);
  px(c, x0 + s - 2, y0 + h - 2, hot, 4, 4);
  c.globalAlpha = 1;
}

export function drawAcid(c: CanvasRenderingContext2D, x: number, y: number, vx: number, vy: number): void {
  const ix = x | 0;
  const iy = y | 0;
  px(c, ix - vx * 0.9 - 2, iy - vy * 0.9 - 2, ACID_LO, 5, 5);
  px(c, ix - 3, iy - 3, ACID, 6, 6);
  px(c, ix - 1, iy - 1, ACID_HI, 3, 3);
}

export function drawGasCloud(c: CanvasRenderingContext2D, x: number, y: number, age: number): void {
  const s = 10 + age * 2;
  c.globalAlpha = Math.max(0, 0.72 - age / 18);
  px(c, x - s, y - s, GAS, s * 2, s + 8);
  px(c, x - s * 0.55, y - s - 4, ACID_HI, s, s);
  px(c, x - 6, y - age * 1.4, EMBER, 8, 6);
  px(c, x + 4, y - s * 0.4, ACID_LO, 6, 5);
  c.globalAlpha = 1;
}

export function isAcid(kind: number): boolean {
  return kind === B_ACID;
}
