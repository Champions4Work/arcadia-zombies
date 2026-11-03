import {
  ARENA_H, ARENA_W, ARENA_WALL, OBS_BARREL, OBS_CARRIAGE, OBS_CRATE, OBS_GEAR, OBS_PIPE, OBS_VENT,
  VENT_CYCLE,
} from "../sim/arena";
import type { World } from "../sim/types";

const SOOT = "#120c08";
const BRASS = "#c8963e";
const BRASS_HI = "#e8c878";
const BRASS_LO = "#7a5420";
const COPPER = "#b5562f";
const COPPER_HI = "#d4784a";
const EMBER = "#ff7a2a";
const EMBER_HI = "#ffd27a";
const WOOD = "#6b4424";
const WOOD_HI = "#8d6236";
const WOOD_LO = "#3a2414";
const IRON = "#3e3a34";
const IRON_HI = "#8a8478";
const RUST = "#6a2e18";
const STEAM = "#c8c0b0";

function px(c: CanvasRenderingContext2D, x: number, y: number, s: string, w: number, h: number): void {
  c.fillStyle = s;
  c.fillRect(x | 0, y | 0, w, h);
}

function shadow(c: CanvasRenderingContext2D, x: number, y: number, w: number): void {
  c.globalAlpha = 0.4;
  px(c, x - w / 2, y, SOOT, w, 4);
  c.globalAlpha = 1;
}

function pipe(c: CanvasRenderingContext2D, x: number, y: number, hw: number, hh: number): void {
  const horiz = hw >= hh;
  shadow(c, x, y + hh - 2, horiz ? hw * 2 : 14);
  px(c, x - hw, y - hh, IRON, hw * 2, hh * 2);
  if (horiz) {
    px(c, x - hw, y - hh, IRON_HI, hw * 2, 2);
    for (let b = -hw + 4; b < hw - 2; b += 14) px(c, x + b, y - hh - 1, BRASS, 3, hh * 2 + 2);
    px(c, x - hw, y - 1, BRASS_LO, hw * 2, 2);
  } else {
    px(c, x - hw, y - hh, IRON_HI, 2, hh * 2);
    for (let b = -hh + 4; b < hh - 2; b += 14) px(c, x - hw - 1, y + b, BRASS, hw * 2 + 2, 3);
    px(c, x - 1, y - hh, BRASS_LO, 2, hh * 2);
  }
  px(c, x - hw, y - hh, BRASS_HI, 2, 2);
  px(c, x + hw - 2, y + hh - 2, BRASS_LO, 2, 2);
}

function crate(c: CanvasRenderingContext2D, x: number, y: number, hw: number, hh: number): void {
  shadow(c, x, y + hh - 1, hw * 2);
  px(c, x - hw, y - hh, WOOD_LO, hw * 2, hh * 2);
  px(c, x - hw + 1, y - hh + 1, WOOD, hw * 2 - 2, hh * 2 - 2);
  px(c, x - hw + 1, y - hh + 1, WOOD_HI, hw * 2 - 2, 2);
  const planks = hh > 10 ? 4 : 3;
  for (let i = 1; i < planks; i++) px(c, x - hw + 2, y - hh + (i * (hh * 2)) / planks, WOOD_LO, hw * 2 - 4, 1);
  px(c, x - 1, y - hh + 2, WOOD_LO, 2, hh * 2 - 4);
  px(c, x - hw, y - hh, BRASS, 3, 3);
  px(c, x + hw - 3, y - hh, BRASS, 3, 3);
  px(c, x - hw, y + hh - 3, BRASS, 3, 3);
  px(c, x + hw - 3, y + hh - 3, BRASS, 3, 3);
  px(c, x - 1, y - 1, BRASS_HI, 2, 2);
}

function carriage(c: CanvasRenderingContext2D, x: number, y: number, hw: number, hh: number, phase: number): void {
  const tilt = ((phase % 5) - 2) * 0.5;
  shadow(c, x, y + hh, hw * 2);
  px(c, x - hw, y - hh + 4, RUST, hw * 2, hh * 2 - 6);
  px(c, x - hw + 2, y - hh + 6, WOOD_LO, hw * 2 - 8, hh - 4);
  px(c, x - hw + 3, y - hh + 7, "#1a120c", (hw - 4), hh - 8);
  px(c, x + 2, y - hh + 6, COPPER, hw - 6, 3);
  px(c, x - hw, y - 2, IRON, hw * 2, 3);
  px(c, x - hw + 2, y - hh + 2 + tilt, BRASS_LO, hw - 2, 3);
  c.fillStyle = SOOT;
  c.beginPath();
  c.arc(x - hw + 6, y + hh - 1, 5, 0, Math.PI * 2);
  c.arc(x + hw - 7, y + hh - 1, 4, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = BRASS_LO;
  c.beginPath();
  c.arc(x - hw + 6, y + hh - 1, 2, 0, Math.PI * 2);
  c.fill();
  px(c, x + hw - 4, y - hh, WOOD, 3, hh);
  px(c, x - 4, y + 1, BRASS, 10, 2);
}

function vent(c: CanvasRenderingContext2D, x: number, y: number, tick: number, phase: number): void {
  shadow(c, x, y + 6, 18);
  px(c, x - 9, y - 6, BRASS_LO, 18, 12);
  px(c, x - 8, y - 5, BRASS, 16, 10);
  px(c, x - 7, y - 4, SOOT, 14, 8);
  for (let g = -6; g <= 6; g += 3) px(c, x + g, y - 3, BRASS_HI, 1, 6);
  px(c, x - 9, y - 6, BRASS_HI, 2, 2);
  px(c, x + 7, y - 6, BRASS_HI, 2, 2);
  const age = (tick + phase) % VENT_CYCLE;
  if (age > VENT_CYCLE - 24) {
    c.globalAlpha = (age - (VENT_CYCLE - 24)) / 36;
    px(c, x - 2, y - 2, EMBER, 4, 3);
    c.globalAlpha = 1;
  }
  if (age < 32) {
    const t = age;
    c.globalAlpha = Math.max(0, 0.55 - t / 70);
    px(c, x - 4 + (tick >> 2 & 1), y - 10 - (t >> 1), STEAM, 8, 5);
    px(c, x - 2 + (tick >> 3 & 1), y - 18 - t, STEAM, 9, 6);
    px(c, x - 6, y - 24 - (t * 0.6 | 0), STEAM, 6, 4);
    c.globalAlpha = 1;
  }
}

function machine(c: CanvasRenderingContext2D, x: number, y: number, tick: number, phase: number): void {
  shadow(c, x, y + 12, 30);
  px(c, x - 16, y - 4, IRON, 32, 16);
  px(c, x - 15, y - 3, "#2a261f", 30, 12);
  px(c, x - 14, y - 2, BRASS_LO, 12, 4);
  px(c, x + 2, y + 2, COPPER, 10, 6);
  px(c, x + 4, y + 4, EMBER, 3, 2);
  const ang = tick * 0.03 + phase * 0.04;
  c.save();
  c.translate(x - 2, y - 2);
  c.rotate(ang);
  c.fillStyle = BRASS;
  for (let k = 0; k < 8; k++) {
    c.rotate(Math.PI / 4);
    c.fillRect(-2, -14, 4, 5);
  }
  c.beginPath();
  c.arc(0, 0, 9, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = BRASS_HI;
  c.beginPath();
  c.arc(0, 0, 4, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = SOOT;
  c.beginPath();
  c.arc(0, 0, 2, 0, Math.PI * 2);
  c.fill();
  c.restore();
  const rod = Math.sin(ang) * 4;
  px(c, x + 6, y - 3 + rod, IRON_HI, 8, 3);
}

function barrel(c: CanvasRenderingContext2D, x: number, y: number, tick: number): void {
  shadow(c, x, y + 8, 16);
  px(c, x - 7, y - 9, COPPER, 14, 18);
  px(c, x - 8, y - 6, BRASS_LO, 16, 3);
  px(c, x - 8, y + 2, BRASS_LO, 16, 3);
  px(c, x - 6, y - 8, COPPER_HI, 3, 14);
  px(c, x - 2, y - 3, SOOT, 5, 5);
  const glow = tick >> 3 & 1;
  px(c, x - 1, y - 2, glow ? EMBER_HI : EMBER, 3, 3);
  px(c, x - 1, y - 11, BRASS, 2, 3);
  c.globalAlpha = 0.7;
  px(c, x - 1, y - 14 - (tick >> 4 & 1), EMBER, 2, 2);
  c.globalAlpha = 1;
}

export function drawWalls(c: CanvasRenderingContext2D): void {
  const t = ARENA_WALL;
  px(c, 0, 0, SOOT, ARENA_W, t);
  px(c, 0, ARENA_H - t, SOOT, ARENA_W, t);
  px(c, 0, 0, SOOT, t, ARENA_H);
  px(c, ARENA_W - t, 0, SOOT, t, ARENA_H);
  px(c, t, 3, "#2c241c", ARENA_W - t * 2, t - 6);
  px(c, 3, t, "#2c241c", t - 6, ARENA_H - t * 2);
  px(c, ARENA_W - t + 3, t, "#2c241c", t - 6, ARENA_H - t * 2);
  px(c, t, ARENA_H - t + 3, "#2c241c", ARENA_W - t * 2, t - 6);
  px(c, t, t, BRASS_LO, ARENA_W - t * 2, 3);
  px(c, t, ARENA_H - t - 3, BRASS_LO, ARENA_W - t * 2, 3);
  px(c, t, t, BRASS_LO, 3, ARENA_H - t * 2);
  px(c, ARENA_W - t - 3, t, BRASS_LO, 3, ARENA_H - t * 2);
  for (let x = t + 4; x < ARENA_W - t; x += 28) {
    px(c, x, 5, BRASS_HI, 3, 3);
    px(c, x, ARENA_H - 8, BRASS_HI, 3, 3);
  }
  for (let y = t + 4; y < ARENA_H - t; y += 28) {
    px(c, 5, y, BRASS_HI, 3, 3);
    px(c, ARENA_W - 8, y, BRASS_HI, 3, 3);
  }
}

export function drawObstacle(c: CanvasRenderingContext2D, w: World, i: number): void {
  const a = w.arena;
  const kind = a.kind[i] ?? 0;
  const x = a.x[i] ?? 0;
  const y = a.y[i] ?? 0;
  const hw = a.hw[i] ?? 0;
  const hh = a.hh[i] ?? 0;
  const phase = a.phase[i] ?? 0;
  if (kind === OBS_PIPE) pipe(c, x, y, hw, hh);
  else if (kind === OBS_CRATE) crate(c, x, y, hw, hh);
  else if (kind === OBS_CARRIAGE) carriage(c, x, y, hw, hh, phase);
  else if (kind === OBS_VENT) vent(c, x, y, w.tick, phase);
  else if (kind === OBS_GEAR) machine(c, x, y, w.tick, phase);
  else if (kind === OBS_BARREL) barrel(c, x, y, w.tick);
}
