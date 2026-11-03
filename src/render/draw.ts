import { clock, tierFrac, tierName } from "../sim/difficulty";
import { xpNeed } from "../sim/progress";
import {
  FX_FLASH, FX_PUFF, FX_SPARK, FX_XP, H, MAX_BULLETS, MAX_FX, MAX_ZOMBIES, W,
  Z_BRUTE, Z_GHOUL, type World,
} from "../sim/types";
import { drawProgress } from "./progress";
import { absorbShake, shakePixels } from "./shake";

const SOOT = "#120c08";
const GROUT = "#1a120b";
const STONE = ["#3a2416", "#4a2e1a", "#5c3a20", "#2e1c10", "#6a4424"];
const HI = ["#4a3220", "#5c3c24", "#6e4a2c", "#3e2818", "#7a5230"];
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
const RUST = "#6a2e18";
const STEAM = "#c8c0b0";
const GOGGLE = "#7ad0ff";
const ORDER = new Uint16Array(MAX_ZOMBIES + 1);
const VENT_X = [72, 240, 400, 148, 336];
const VENT_Y = [248, 96, 200, 164, 60];
const FONT: Record<string, number> = {
  "0": 0b111101101101111, "1": 0b010010010010010, "2": 0b111001111100111,
  "3": 0b111001111001111, "4": 0b101101111001001, "5": 0b111100111001111,
  "6": 0b111100111101111, "7": 0b111001010010010, "8": 0b111101111101111,
  "9": 0b111101111001111, A: 0b010101111101101, B: 0b110101110101110,
  C: 0b011100100100011, D: 0b110101101101110, E: 0b111100110100111,
  F: 0b111100110100100, G: 0b011100101101011, H: 0b101101111101101,
  I: 0b111010010010111, J: 0b001001001101010, K: 0b101101110101101,
  L: 0b100100100100111, M: 0b101111111101101, N: 0b101111111101101,
  O: 0b010101101101010, P: 0b110101110100100, Q: 0b010101101111001,
  R: 0b110101110101101, S: 0b011100010001110, T: 0b111010010010010,
  U: 0b101101101101111, V: 0b101101101101010, W: 0b101101111111101,
  X: 0b101101010101101, Y: 0b101101010010010, Z: 0b111001010100111,
  " ": 0, ":": 0b000010000010000,
};

function tone(x: number, y: number): number {
  let n = (x * 374761393 + y * 668265263) | 0;
  n = (n ^ (n >>> 13)) * 1274126177;
  return (n >>> 0) % 5;
}

function px(c: CanvasRenderingContext2D, x: number, y: number, s: string, w = 1, h = 1): void {
  c.fillStyle = s;
  c.fillRect(x | 0, y | 0, w, h);
}

function print(c: CanvasRenderingContext2D, x: number, y: number, msg: string, col: string, s = 1): void {
  for (let i = 0; i < msg.length; i++) {
    const bits = FONT[msg.charAt(i)] ?? 0;
    for (let p = 0; p < 15; p++) {
      if (bits & 1 << 14 - p) px(c, x + i * 4 * s + (p % 3) * s, y + (p / 3 | 0) * s, col, s, s);
    }
  }
}

function rivet(c: CanvasRenderingContext2D, x: number, y: number): void {
  px(c, x, y, BRASS_HI, 2, 2);
  px(c, x + 1, y + 1, BRASS_LO, 1, 1);
}

function gear(c: CanvasRenderingContext2D, x: number, y: number, r: number, a: number, col: string): void {
  c.save();
  c.translate(x, y);
  c.rotate(a);
  c.fillStyle = col;
  for (let k = 0; k < 8; k++) {
    c.rotate(Math.PI / 4);
    c.fillRect(-r * 0.18, -r * 1.18, r * 0.36, r * 0.42);
  }
  c.beginPath();
  c.arc(0, 0, r, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = BRASS_HI;
  c.beginPath();
  c.arc(0, 0, r * 0.72, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = col;
  c.beginPath();
  c.arc(0, 0, r * 0.58, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = SOOT;
  c.beginPath();
  c.arc(0, 0, r * 0.28, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = BRASS_HI;
  c.beginPath();
  c.arc(0, 0, r * 0.1, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

function cobble(c: CanvasRenderingContext2D): void {
  c.fillStyle = GROUT;
  c.fillRect(0, 0, W, H);
  for (let ty = 0; ty < H; ty += 10) {
    const ox = ((ty / 10 | 0) & 1) * 5;
    for (let tx = -5; tx < W; tx += 10) {
      const t = tone(tx + ox, ty);
      const base = STONE[t] ?? "#3a2416";
      const hi = HI[t] ?? "#4a3220";
      px(c, tx + ox, ty, base, 9, 9);
      px(c, tx + ox, ty, hi, 9, 1);
      px(c, tx + ox, ty, hi, 1, 9);
      px(c, tx + ox + 1, ty + 8, GROUT, 8, 1);
      if (t === 4) px(c, tx + ox + 3, ty + 3, BRASS_LO, 3, 2);
      if (t === 1) px(c, tx + ox + 2, ty + 5, ROT_LO, 2, 1);
    }
  }
}

function vents(c: CanvasRenderingContext2D, tick: number): void {
  for (let i = 0; i < VENT_X.length; i++) {
    const x = VENT_X[i] ?? 0;
    const y = VENT_Y[i] ?? 0;
    px(c, x - 8, y - 5, BRASS_LO, 16, 11);
    px(c, x - 7, y - 4, BRASS, 14, 9);
    px(c, x - 6, y - 3, SOOT, 12, 7);
    for (let g = -5; g <= 5; g += 2) px(c, x + g, y - 2, BRASS_HI, 1, 5);
    rivet(c, x - 8, y - 5);
    rivet(c, x + 6, y - 5);
    rivet(c, x - 8, y + 4);
    rivet(c, x + 6, y + 4);
    const phase = tick + i * 11;
    const t = phase % 40;
    c.globalAlpha = Math.max(0, 0.5 - t / 90);
    px(c, x - 3 + (phase >> 2 & 1), y - 8 - (t >> 1), STEAM, 6, 4);
    px(c, x - 1 + (phase >> 3 & 1), y - 14 - t, STEAM, 7, 5);
    px(c, x - 2, y - 20 - (t * 1.1 | 0), STEAM, 5, 4);
    c.globalAlpha = 1;
  }
}

function shadow(c: CanvasRenderingContext2D, x: number, y: number, w: number): void {
  c.globalAlpha = 0.45;
  px(c, x - w / 2, y + 6, SOOT, w, 4);
  c.globalAlpha = 1;
}

function shambler(c: CanvasRenderingContext2D, x: number, y: number, tick: number): void {
  const ix = x | 0;
  const iy = y | 0;
  const bob = tick >> 4 & 1;
  const swing = tick >> 3 & 1 ? 3 : 0;
  shadow(c, ix, iy, 18);
  px(c, ix - 12 + swing, iy - 2 + bob, ROT_LO, 5, 12);
  px(c, ix - 13 + swing, iy + 8 + bob, ROT, 4, 4);
  px(c, ix - 8, iy - 8 + bob, ROT, 16, 16);
  px(c, ix - 6, iy - 6 + bob, ROT_LO, 6, 12);
  px(c, ix - 4, iy - 4 + bob, ROT_HI, 5, 6);
  px(c, ix - 5, iy - 18 + bob, ROT_HI, 12, 11);
  px(c, ix - 3, iy - 16 + bob, ROT_LO, 8, 5);
  px(c, ix + 2, iy - 15 + bob, COPPER_HI, 3, 3);
  px(c, ix + 3, iy - 14 + bob, EMBER, 1, 1);
  px(c, ix - 7, iy + 6 + bob, ROT_LO, 5, 7);
  px(c, ix + 2, iy + 6 + (bob ^ 1), ROT_LO, 5, 7);
  px(c, ix + 6, iy - 2 + bob, ROT, 5, 10);
  px(c, ix - 8, iy - 8 + bob, "#4a6a28", 16, 2);
}

function ghoul(c: CanvasRenderingContext2D, x: number, y: number, tick: number): void {
  const ix = x | 0;
  const iy = y | 0;
  const twitch = tick >> 2 & 1;
  shadow(c, ix, iy, 12);
  px(c, ix - 5, iy + 2 + twitch, BRASS_LO, 3, 10);
  px(c, ix + 2, iy + 2 + (twitch ^ 1), BRASS_LO, 3, 10);
  px(c, ix - 6, iy + 10 + twitch, COPPER, 4, 3);
  px(c, ix + 2, iy + 10 + (twitch ^ 1), COPPER, 4, 3);
  px(c, ix - 5, iy - 12 + twitch, BRASS, 10, 16);
  px(c, ix - 3, iy - 9 + twitch, BRASS_LO, 6, 10);
  c.save();
  c.translate(ix, iy - 4 + twitch);
  c.rotate(tick * 0.22);
  px(c, -5, -2, COPPER_HI, 10, 3);
  px(c, -2, -5, COPPER, 3, 10);
  c.restore();
  px(c, ix - 5, iy - 22 + twitch, BRASS, 10, 10);
  px(c, ix - 3, iy - 20 + twitch, SOOT, 6, 5);
  px(c, ix, iy - 19 + twitch, "#ff3a2a", 3, 3);
  px(c, ix + 1, iy - 18 + twitch, EMBER_HI, 1, 1);
  px(c, ix - 8, iy - 10 + twitch, BRASS_LO, 3, 8);
  px(c, ix + 5, iy - 10 + (twitch ^ 1), BRASS_LO, 3, 8);
}

function brute(c: CanvasRenderingContext2D, x: number, y: number, tick: number, hp: number): void {
  const ix = x | 0;
  const iy = y | 0;
  const stomp = tick >> 5 & 1;
  shadow(c, ix, iy, 28);
  px(c, ix - 12, iy + 4 + stomp, RUST, 8, 9);
  px(c, ix + 4, iy + 4 + (stomp ^ 1), RUST, 8, 9);
  px(c, ix - 13, iy + 11 + stomp, SOOT, 9, 3);
  px(c, ix + 4, iy + 11 + (stomp ^ 1), SOOT, 9, 3);
  px(c, ix - 16, iy - 14 + stomp, COPPER, 32, 20);
  px(c, ix - 14, iy - 12 + stomp, RUST, 28, 16);
  px(c, ix - 12, iy - 8 + stomp, SOOT, 8, 8);
  px(c, ix - 10, iy - 6 + stomp, EMBER, 5, 5);
  px(c, ix - 9, iy - 5 + stomp, tick >> 2 & 1 ? EMBER_HI : EMBER, 3, 3);
  for (let r = -12; r <= 10; r += 6) rivet(c, ix + r, iy - 12 + stomp);
  px(c, ix - 17, iy - 6 + stomp, BRASS_LO, 3, 12);
  px(c, ix + 14, iy - 6 + stomp, BRASS_LO, 3, 12);
  px(c, ix - 5, iy - 24 + stomp, RUST, 10, 10);
  px(c, ix - 3, iy - 28 + stomp, BRASS_LO, 6, 5);
  px(c, ix - 4, iy - 26 + stomp, SOOT, 8, 3);
  c.globalAlpha = 0.4;
  px(c, ix - 2 + (tick >> 3 & 1), iy - 34 - (tick % 16 >> 1) + stomp, STEAM, 6, 6);
  c.globalAlpha = 1;
  px(c, ix + 6, iy - 10 + stomp, BRASS, 8, 8);
  px(c, ix + 8, iy - 8 + stomp, SOOT, 4, 4);
  px(c, ix + 9, iy - 7 + stomp, EMBER, 2, 2);
  const pips = Math.min(10, hp);
  for (let p = 0; p < pips; p++) px(c, ix - 12 + p * 3, iy - 16 + stomp, p < 3 ? EMBER : BRASS_HI, 2, 3);
}

function automaton(c: CanvasRenderingContext2D, x: number, y: number, tick: number, ax: number, ay: number, walk: number, flash: number): void {
  const ix = x | 0;
  const iy = y | 0;
  const bob = tick >> 3 & 1;
  const leg = walk ? tick >> 2 & 1 : 0;
  shadow(c, ix, iy, 20);
  px(c, ix - 8, iy + 4 + (leg ? 3 : 0), BRASS_LO, 5, 8);
  px(c, ix + 3, iy + 4 + (leg ? 0 : 3), BRASS_LO, 5, 8);
  px(c, ix - 9, iy + 10 + (leg ? 3 : 0), COPPER, 6, 3);
  px(c, ix + 3, iy + 10 + (leg ? 0 : 3), COPPER, 6, 3);
  px(c, ix - 10, iy - 12 + bob, BRASS, 20, 16);
  px(c, ix - 8, iy - 10 + bob, BRASS_LO, 16, 12);
  const glow = tick >> 2 & 1;
  px(c, ix - 4, iy - 6 + bob, glow ? EMBER_HI : EMBER, 8, 6);
  px(c, ix - 2, iy - 4 + bob, glow ? "#fff3c0" : EMBER_HI, 4, 3);
  rivet(c, ix - 8, iy - 10 + bob);
  rivet(c, ix + 6, iy - 10 + bob);
  rivet(c, ix - 8, iy + 1 + bob);
  rivet(c, ix + 6, iy + 1 + bob);
  px(c, ix - 7, iy - 24 + bob, BRASS, 14, 12);
  px(c, ix - 5, iy - 21 + bob, SOOT, 5, 5);
  px(c, ix + 1, iy - 21 + bob, SOOT, 5, 5);
  px(c, ix - 4, iy - 20 + bob, GOGGLE, 3, 3);
  px(c, ix + 2, iy - 20 + bob, GOGGLE, 3, 3);
  px(c, ix - 3, iy - 19 + bob, "#d8f6ff", 1, 1);
  px(c, ix + 3, iy - 19 + bob, "#d8f6ff", 1, 1);
  px(c, ix - 11, iy - 26 + bob, SOOT, 22, 3);
  px(c, ix - 5, iy - 34 + bob, SOOT, 10, 8);
  px(c, ix - 3, iy - 36 + bob, COPPER, 6, 3);
  px(c, ix - 4, iy - 28 + bob, BRASS_LO, 8, 2);
  const st = tick % 22;
  c.globalAlpha = Math.max(0, 1 - st / 22);
  px(c, ix - 2 + (st >> 3 & 1), iy - 40 - (st >> 1) + bob, STEAM, 5, 4);
  c.globalAlpha = 1;
  const recoil = flash > 0 ? 3 : 0;
  const dx = ax * (12 - recoil) | 0;
  const dy = ay * (8 - recoil) | 0;
  px(c, ix + dx - 3, iy - 6 + bob + dy, BRASS_LO, 9, 6);
  px(c, ix + (dx * 1.35 | 0) - 2, iy - 5 + bob + (dy * 1.3 | 0), SOOT, 8, 4);
  px(c, ix + (dx * 1.35 | 0), iy - 4 + bob + (dy * 1.3 | 0), EMBER, 3, 2);
  px(c, ix - 12, iy - 4 + bob, COPPER, 5, 6);
}

function bullets(c: CanvasRenderingContext2D, w: World): void {
  const b = w.bullets;
  for (let j = 0; j < MAX_BULLETS; j++) {
    if (!b.alive[j]) continue;
    const x = b.x[j] ?? 0;
    const y = b.y[j] ?? 0;
    const vx = b.vx[j] ?? 0;
    const vy = b.vy[j] ?? 0;
    px(c, x - vx * 1.4 - 2, y - vy * 1.4 - 1, COPPER, 5, 3);
    px(c, x - 3, y - 3, EMBER, 6, 6);
    px(c, x - 1, y - 1, EMBER_HI, 3, 3);
  }
}

function fx(c: CanvasRenderingContext2D, w: World): void {
  for (let i = 0; i < MAX_FX; i++) {
    const kind = w.fxKind[i] ?? 0;
    if (!kind) continue;
    const age = w.tick - (w.fxTick[i] ?? 0);
    const x = w.fxX[i] ?? 0;
    const y = w.fxY[i] ?? 0;
    if (kind === FX_FLASH && age < 7) {
      const s = 8 - age;
      c.globalAlpha = 1 - age / 7;
      px(c, x - s * 2, y - 2, EMBER_HI, s * 4, 5);
      px(c, x - 2, y - s * 2, EMBER, 5, s * 4);
      px(c, x - 3, y - 3, "#fff8d0", 7, 7);
      c.globalAlpha = 1;
    } else if (kind === FX_SPARK && age < 10) {
      c.globalAlpha = 1 - age / 10;
      const k = 3 + age * 1.4;
      px(c, x + k, y - k, EMBER_HI, 3, 3);
      px(c, x - k, y - k, EMBER, 3, 3);
      px(c, x + k, y + k * 0.4, BRASS, 3, 3);
      px(c, x - k * 0.5, y + k, COPPER_HI, 3, 3);
      px(c, x, y - k, "#fff3c0", 2, 2);
      c.globalAlpha = 1;
    } else if (kind === FX_XP && age < 24) {
      const rise = age;
      c.globalAlpha = 1 - age / 24;
      const n = Math.max(1, w.fxA[i] ?? 1) | 0;
      const label = `${n} XP`;
      px(c, x - 2, y - rise, EMBER_HI, 5, 1);
      px(c, x, y - 2 - rise, EMBER_HI, 1, 5);
      print(c, x + 6, y - 2 - rise, label, EMBER_HI, 1);
      c.globalAlpha = 1;
    } else if (kind === FX_PUFF && age < 18) {
      const z = w.fxA[i] ?? 0;
      const s = 5 + age;
      c.globalAlpha = 0.6 - age / 36;
      const col = z === Z_GHOUL ? BRASS : z === Z_BRUTE ? STEAM : ROT_HI;
      px(c, x - s, y - s - age, col, s + 6, s + 4);
      px(c, x - s + 4, y - s - 4 - age, z === Z_BRUTE ? STEAM : SOOT, s, s);
      px(c, x + 2, y - age * 1.2, z === Z_GHOUL ? COPPER_HI : col, 4, 4);
      c.globalAlpha = 1;
    }
  }
}

function plate(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  px(c, x, y, SOOT, w, h);
  px(c, x + 1, y + 1, BRASS_LO, w - 2, h - 2);
  px(c, x + 2, y + 2, BRASS, w - 4, h - 4);
  px(c, x + 3, y + 3, "#4a3214", w - 6, h - 6);
  px(c, x + 2, y + 2, BRASS_HI, w - 4, 1);
  rivet(c, x + 3, y + 3);
  rivet(c, x + w - 6, y + 3);
  rivet(c, x + 3, y + h - 6);
  rivet(c, x + w - 6, y + h - 6);
}

function gauge(c: CanvasRenderingContext2D, x: number, y: number, t: number): void {
  c.save();
  c.translate(x, y);
  c.fillStyle = SOOT;
  c.beginPath();
  c.arc(0, 0, 12, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = BRASS;
  c.lineWidth = 2;
  c.beginPath();
  c.arc(0, 0, 10, 0, Math.PI * 2);
  c.stroke();
  c.strokeStyle = BRASS_LO;
  c.lineWidth = 1;
  for (let i = 0; i < 6; i++) {
    const a = Math.PI * 0.7 + i * 0.32;
    c.beginPath();
    c.moveTo(Math.cos(a) * 7, Math.sin(a) * 7);
    c.lineTo(Math.cos(a) * 10, Math.sin(a) * 10);
    c.stroke();
  }
  const ang = Math.PI * 0.75 + (1 - Math.max(0, Math.min(1, t))) * Math.PI * 1.5;
  c.strokeStyle = EMBER;
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(0, 0);
  c.lineTo(Math.cos(ang) * 7, Math.sin(ang) * 7);
  c.stroke();
  c.fillStyle = BRASS_HI;
  c.beginPath();
  c.arc(0, 0, 2, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

function diffBar(c: CanvasRenderingContext2D, w: World): void {
  const name = tierName(w.rank);
  const flash = w.rankFlash > 0 && ((w.tick >> 2) & 1) === 0;
  print(c, 10, 34, name, flash ? "#fff3c0" : BRASS_HI, 1);
  const time = clock(w.tick);
  print(c, W - 14 - time.length * 4, 34, time, flash ? "#fff3c0" : BRASS, 1);
  const x0 = 8;
  const y = 42;
  const bw = W - 16;
  const bh = 12;
  const frac = tierFrac(w.tick);
  px(c, x0, y, "#1a1008", bw, bh);
  const fill = Math.max(flash ? bw : 0, bw * frac | 0);
  if (fill > 0) px(c, x0, y, flash ? "#fff3c0" : EMBER, fill, bh);
  if (fill > 2 && !flash) px(c, x0, y, BRASS_HI, fill, 3);
  px(c, x0, y, flash ? EMBER_HI : BRASS, bw, 1);
  px(c, x0, y + bh - 1, flash ? EMBER_HI : BRASS_LO, bw, 1);
}

function hud(c: CanvasRenderingContext2D, w: World): void {
  plate(c, 4, 4, W - 8, 56);
  gauge(c, 26, 20, w.hp / Math.max(1, w.maxHp));
  print(c, 42, 9, "HP", BRASS_HI, 1);
  const pips = Math.min(8, w.maxHp);
  for (let i = 0; i < pips; i++) {
    const on = i < w.hp;
    px(c, 42 + i * 8, 18, on ? EMBER : SOOT, 7, 7);
    if (on) px(c, 44 + i * 8, 20, EMBER_HI, 3, 3);
  }
  plate(c, 168, 8, 150, 24);
  print(c, 178, 14, `SCORE ${w.score}`, BRASS_HI, 2);
  const need = xpNeed(w.level);
  const t = need <= 0 ? 0 : Math.min(1, w.xp / need);
  px(c, 10, 31, SOOT, 154, 3);
  px(c, 10, 31, BRASS_HI, Math.max(1, 154 * t | 0), 3);
  print(c, 168, 9, `LV ${w.level}`, BRASS, 1);
  c.save();
  c.translate(444, 20);
  c.rotate(w.tick * 0.03);
  c.fillStyle = BRASS_LO;
  for (let k = 0; k < 6; k++) {
    c.rotate(Math.PI / 3);
    c.fillRect(-2, -11, 4, 5);
  }
  c.beginPath();
  c.arc(0, 0, 8, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = SOOT;
  c.beginPath();
  c.arc(0, 0, 4, 0, Math.PI * 2);
  c.fill();
  c.restore();
  print(c, 330, 14, `W${w.wave}`, BRASS, 2);
  if (w.shield > 0) print(c, 330, 8, `SH ${w.shield}`, BRASS_HI, 1);
  diffBar(c, w);
}

function drawBanner(c: CanvasRenderingContext2D, w: World): void {
  if (w.banner <= 0 || w.over) return;
  const name = tierName(w.rank);
  const flash = (w.tick >> 2 & 1) === 0;
  plate(c, 70, 96, 340, 78);
  const title = "RANK UP";
  print(c, (W - title.length * 12) / 2, 112, title, flash ? EMBER_HI : BRASS_HI, 3);
  const scale = name.length > 16 ? 1 : 2;
  print(c, (W - name.length * 4 * scale) / 2, 140, name, flash ? "#fff3c0" : BRASS, scale);
}

function overlay(c: CanvasRenderingContext2D, w: World): void {
  if (!w.over) return;
  c.fillStyle = "rgba(8,4,2,0.74)";
  c.fillRect(0, 0, W, H);
  plate(c, 50, 78, 380, 150);
  print(c, 98, 96, "THE GEARS STOP", BRASS_HI, 3);
  const name = tierName(w.rank);
  const scale = name.length > 18 ? 1 : 2;
  print(c, (W - name.length * 4 * scale) / 2, 122, name, BRASS_HI, scale);
  const time = clock(w.tick);
  print(c, (W - time.length * 8) / 2, 146, time, BRASS, 2);
  const score = `SCORE ${w.score}`;
  print(c, (W - score.length * 8) / 2, 168, score, BRASS, 2);
  print(c, 150, 196, "TAP OR PRESS R", COPPER_HI, 2);
}

function drawZombie(c: CanvasRenderingContext2D, w: World, i: number): void {
  const x = w.zombies.x[i] ?? 0;
  const y = w.zombies.y[i] ?? 0;
  const kind = w.zombies.kind[i] ?? 0;
  if (kind === Z_GHOUL) ghoul(c, x, y, w.tick);
  else if (kind === Z_BRUTE) brute(c, x, y, w.tick, w.zombies.hp[i] ?? 1);
  else shambler(c, x, y, w.tick);
}

let lastPx = 0;
let lastPy = 0;
let walk = 0;

export function draw(c: CanvasRenderingContext2D, w: World, shake = true): void {
  c.imageSmoothingEnabled = false;
  if (Math.abs(w.px - lastPx) + Math.abs(w.py - lastPy) > 0.2) walk = 10;
  else if (walk > 0) walk--;
  lastPx = w.px;
  lastPy = w.py;
  absorbShake(w.tick, w.events);
  const [sx, sy] = shakePixels(w.tick, shake);
  c.save();
  if (sx !== 0 || sy !== 0) c.translate(sx, sy);
  cobble(c);
  gear(c, 56, 78, 30, w.tick * 0.01, BRASS_LO);
  gear(c, 424, 264, 38, -w.tick * 0.008, COPPER);
  gear(c, 408, 62, 20, w.tick * 0.02, BRASS);
  gear(c, 32, 288, 18, -w.tick * 0.015, BRASS_LO);
  vents(c, w.tick);
  px(c, 0, 0, SOOT, W, 6);
  px(c, 0, H - 6, SOOT, W, 6);
  px(c, 0, 0, SOOT, 6, H);
  px(c, W - 6, 0, SOOT, 6, H);
  px(c, 6, 6, BRASS_LO, W - 12, 2);
  px(c, 6, H - 8, BRASS_LO, W - 12, 2);
  let n = 0;
  for (let i = 0; i < MAX_ZOMBIES; i++) if (w.zombies.alive[i]) ORDER[n++] = i;
  ORDER[n++] = 0xffff;
  for (let a = 1; a < n; a++) {
    const key = ORDER[a] ?? 0;
    const ky = key === 0xffff ? w.py : (w.zombies.y[key] ?? 0);
    let b = a - 1;
    while (b >= 0) {
      const o = ORDER[b] ?? 0;
      const oy = o === 0xffff ? w.py : (w.zombies.y[o] ?? 0);
      if (oy <= ky) break;
      ORDER[b + 1] = o;
      b--;
    }
    ORDER[b + 1] = key;
  }
  const flashing = w.hurtCd % 6 < 3;
  let flashAge = 99;
  for (let i = 0; i < MAX_FX; i++) {
    if ((w.fxKind[i] ?? 0) === FX_FLASH) flashAge = Math.min(flashAge, w.tick - (w.fxTick[i] ?? 0));
  }
  for (let k = 0; k < n; k++) {
    const i = ORDER[k] ?? 0;
    if (i === 0xffff) {
      if (flashing) automaton(c, w.px, w.py, w.tick, w.aimX, w.aimY, walk, flashAge < 5 ? 1 : 0);
    } else drawZombie(c, w, i);
  }
  bullets(c, w);
  fx(c, w);
  if (w.hurtCd > 0) {
    c.globalAlpha = Math.min(0.28, w.hurtCd / 90);
    px(c, 0, 0, "#6a1010", W, H);
    c.globalAlpha = 1;
  }
  c.restore();
  drawBanner(c, w);
  drawProgress(c, w);
  hud(c, w);
  overlay(c, w);
}
