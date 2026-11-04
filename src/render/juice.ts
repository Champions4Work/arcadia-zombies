import { Z_ELITE, Z_KIND, Z_KNIGHT } from "../sim/foes";
import { Z_BRUTE } from "../sim/types";
import { reduceMotionOn } from "./motion";
import { punchShake } from "./shake";
import { resetStains, stampBlood, stampCasing, stainCount, STAIN_LIVE_CAP } from "./stains";

export const NUMBER_CAP = 256;
export const FLASH_CAP = 2048;
export const FLASH_MS = 80;
export const FLASH_SOFT_MS = 28;
export const PLAYER_FLASH_MS = 72;
export const STOP_MAX_MS = 100;
export const PART_CAP = 128;
export const PART_LIVE_CAP = 80;
export const STOP_ELITE_MS = 40;
export const STOP_BOSS_MS = 60;
export const STOP_HURT_MS = 50;
export const STOP_CRIT_MS = 24;
export const SHAKE_CRIT = 1.1;
export const SHAKE_HIT = 0.62;
export const SHAKE_BRUTE = 0.75;
export const BLOOD_SPURT = 4;
export const KNOCK_HIT = 4.2;
export const KNOCK_CRIT = 8;
export const STOP_BUDGET_MS = 100;
export const STOP_WINDOW_MS = 1000;
export const JUICE_DT = 1000 / 60;
export const CRIT_COLOR = "#ffe14a";
export const HIT_COLOR = "#fff4c8";
export const NUMBER_LIFE = 180;
export const GLYPH_CELL = 2;
export const BLOOD_DROP_RX = 7;
export const BLOOD_DROP_RY = 5.4;

const SOOT = "#120c08";
const BRASS = "#c8963e";
const BRASS_HI = "#e8c878";
const COPPER = "#b5562f";
const GLYPH = new Uint16Array([
  0b111101101101111, 0b010010010010010, 0b111001111100111, 0b111001111001111, 0b101101111001001,
  0b111100111001111, 0b111100111101111, 0b111001010010010, 0b111101111101111, 0b111101111001111,
]);

const numX = new Float32Array(NUMBER_CAP);
const numY = new Float32Array(NUMBER_CAP);
const numVx = new Float32Array(NUMBER_CAP);
const numVy = new Float32Array(NUMBER_CAP);
const numLife = new Float32Array(NUMBER_CAP);
const numDmg = new Int16Array(NUMBER_CAP);
const numCrit = new Uint8Array(NUMBER_CAP);
const numOn = new Uint8Array(NUMBER_CAP);
const flash = new Float32Array(FLASH_CAP);
const knockX = new Float32Array(FLASH_CAP);
const knockY = new Float32Array(FLASH_CAP);
const pX = new Float32Array(PART_CAP);
const pY = new Float32Array(PART_CAP);
const pVx = new Float32Array(PART_CAP);
const pVy = new Float32Array(PART_CAP);
const pLife = new Float32Array(PART_CAP);
const pRot = new Float32Array(PART_CAP);
const pSpin = new Float32Array(PART_CAP);
const pGear = new Uint8Array(PART_CAP);
const pOn = new Uint8Array(PART_CAP);

let numCursor = 0;
let numCount = 0;
let pCursor = 0;
let pCount = 0;
let flashScan = 0;
let flashOn = 0;
let stopMs = 0;
let usedMs = 0;
let windowMs = 0;
let showNumbers = true;
let clockOwned = false;
let playerFlash = 0;

export function damageNumbersOn(): boolean {
  return showNumbers;
}

export function setNumbersOn(on: boolean): void {
  showNumbers = on;
}

export function ownJuiceClock(on: boolean): void {
  clockOwned = on;
}

export function juiceClockOwned(): boolean {
  return clockOwned;
}

export function resetJuice(): void {
  numCursor = 0;
  numCount = 0;
  pCursor = 0;
  pCount = 0;
  flashScan = 0;
  flashOn = 0;
  stopMs = 0;
  usedMs = 0;
  windowMs = 0;
  playerFlash = 0;
  numOn.fill(0);
  pOn.fill(0);
  flash.fill(0);
  knockX.fill(0);
  knockY.fill(0);
  resetStains();
}

export function burstCount(slot: number, tick: number): number {
  const m = ((slot | 0) + (tick | 0)) % 3;
  return 4 + (m < 0 ? m + 3 : m);
}

export function numberColor(crit: number): string {
  return crit ? CRIT_COLOR : HIT_COLOR;
}

export function numberCount(): number {
  return numCount;
}

export function particleCount(): number {
  return pCount;
}

export function stopRemaining(): number {
  return stopMs;
}

export function stopUsed(): number {
  return usedMs;
}

export function enemyFlash(slot: number): number {
  if (slot < 0 || slot >= FLASH_CAP) return 0;
  return flash[slot] ?? 0;
}

export function enemyFlashAlpha(slot: number): number {
  if (slot < 0 || slot >= FLASH_CAP) return 0;
  const t = flash[slot] ?? 0;
  if (t <= 0) return 0;
  const a = t / FLASH_MS;
  return a > 1 ? 1 : a;
}

export function playerFlashMs(): number {
  return playerFlash;
}

export function playerFlashAlpha(): number {
  if (playerFlash <= 0) return 0;
  const t = playerFlash / PLAYER_FLASH_MS;
  return t > 1 ? 1 : t;
}

export function flashesLive(): number {
  return flashOn;
}

export function hitKnockX(slot: number): number {
  if (slot < 0 || slot >= FLASH_CAP) return 0;
  const t = flash[slot] ?? 0;
  if (t <= 0) return 0;
  return (knockX[slot] ?? 0) * (t / FLASH_MS);
}

export function hitKnockY(slot: number): number {
  if (slot < 0 || slot >= FLASH_CAP) return 0;
  const t = flash[slot] ?? 0;
  if (t <= 0) return 0;
  return (knockY[slot] ?? 0) * (t / FLASH_MS);
}

export function numberScale(slot: number): number {
  void slot;
  return 1;
}

export function glyphCell(): number {
  return GLYPH_CELL;
}

export function numberY(i: number): number {
  return numY[i] ?? 0;
}

export function lastNumberCrit(): number {
  const i = numCursor === 0 ? NUMBER_CAP - 1 : numCursor - 1;
  return numCrit[i] ?? 0;
}

export function lastNumberValue(): number {
  const i = numCursor === 0 ? NUMBER_CAP - 1 : numCursor - 1;
  return numDmg[i] ?? 0;
}

function grant(ms: number): void {
  if (ms <= 0 || reduceMotionOn()) return;
  const room = STOP_BUDGET_MS - usedMs;
  if (room <= 0) return;
  const g = ms < room ? ms : room;
  usedMs += g;
  const next = stopMs + g;
  const cap = STOP_MAX_MS < STOP_BUDGET_MS ? STOP_MAX_MS : STOP_BUDGET_MS;
  stopMs = next > cap ? cap : next;
}

function spawnNumber(x: number, y: number, dmg: number, crit: boolean): void {
  const i = numCursor;
  numCursor = i + 1 < NUMBER_CAP ? i + 1 : 0;
  if (numOn[i] === 0) numCount++;
  numOn[i] = 1;
  numX[i] = x;
  numY[i] = y;
  numVx[i] = ((i % 5) - 2) * 5;
  numVy[i] = crit ? -110 : -88;
  numLife[i] = NUMBER_LIFE;
  numDmg[i] = dmg;
  numCrit[i] = crit ? 1 : 0;
}

function spawnPart(x: number, y: number, vx: number, vy: number, gear: number): void {
  if (pCount >= PART_LIVE_CAP && gear !== 0) return;
  if (pCount >= PART_LIVE_CAP - 2 && gear === 0 && (pCursor & 1) === 0) return;
  const i = pCursor;
  pCursor = i + 1 < PART_CAP ? i + 1 : 0;
  if (pOn[i] === 0) pCount++;
  pOn[i] = 1;
  pX[i] = x;
  pY[i] = y;
  pVx[i] = vx;
  pVy[i] = vy;
  pLife[i] = gear === 2 ? 280 : 460;
  pRot[i] = 0;
  pSpin[i] = gear === 1 ? 11 : 4;
  pGear[i] = gear;
}

function spawnBlood(x: number, y: number, slot: number, tick: number): void {
  if (pCount >= PART_LIVE_CAP - BLOOD_SPURT) return;
  const base = ((((slot | 0) * 13 + (tick | 0)) % 628) / 100);
  for (let k = 0; k < BLOOD_SPURT; k++) {
    const a = base + (k * 0.7) - 0.9;
    spawnPart(x, y - 8, Math.cos(a) * (22 + k * 6), Math.sin(a) * 16 - 28, 2);
  }
}

export function juiceShot(x: number, y: number, ux: number, uy: number, tick: number): void {
  const side = ((tick | 0) & 1) === 0 ? 1 : -1;
  spawnPart(x, y, -uy * 42 * side + ux * 8, ux * 42 * side - 22, 0);
  spawnPart(x, y, -uy * 26 * side - ux * 6, ux * 26 * side - 14, 0);
  if (stainCount() < STAIN_LIVE_CAP) {
    const bx = x - uy * 11 * side + ux * 5;
    const by = y + ux * 11 * side + uy * 4 + 6;
    stampCasing(bx, by, tick);
  }
}

export function juicePlayerHurt(): void {
  grant(STOP_HURT_MS);
  playerFlash = reduceMotionOn() ? FLASH_SOFT_MS : PLAYER_FLASH_MS;
  punchShake(0.38);
}

function killStop(raw: number, killed: boolean): number {
  if (!killed) return 0;
  const kind = raw & Z_KIND;
  if (kind === Z_BRUTE || kind === Z_KNIGHT) return STOP_BOSS_MS;
  if ((raw & Z_ELITE) !== 0) return STOP_ELITE_MS;
  return 0;
}

export function juiceHit(
  slot: number,
  x: number,
  y: number,
  dmg: number,
  kind: number,
  killed: boolean,
  tick: number,
  ox = x,
  oy = y,
): void {
  const dealt = dmg > 0 ? dmg | 0 : 0;
  const body = kind & Z_KIND;
  const elite = (kind & Z_ELITE) !== 0;
  const boss = body === Z_BRUTE || body === Z_KNIGHT;
  const crit = killed && (elite || boss);
  if (showNumbers) spawnNumber(x, y - 14, dealt, crit);
  if (dealt > 0 && stainCount() < STAIN_LIVE_CAP) stampBlood(x, y, slot + tick);
  if (dealt > 0 && !killed) spawnBlood(x, y, slot, tick);
  if (dealt >= 3 && !killed) grant(STOP_CRIT_MS);
  if (crit) punchShake(SHAKE_CRIT);
  else if (boss && dealt > 0) punchShake(SHAKE_BRUTE);
  else if (dealt > 0) punchShake(SHAKE_HIT);
  if (slot >= 0 && slot < FLASH_CAP) {
    if ((flash[slot] ?? 0) <= 0) flashOn++;
    flash[slot] = reduceMotionOn() ? FLASH_SOFT_MS : FLASH_MS;
    if (slot + 1 > flashScan) flashScan = slot + 1;
    const dx = x - ox;
    const dy = y - oy;
    const d = Math.sqrt(dx * dx + dy * dy) || 1;
    const force = crit ? KNOCK_CRIT : KNOCK_HIT;
    knockX[slot] = (dx / d) * force;
    knockY[slot] = (dy / d) * force;
  }
  if (!killed) return;
  let n = burstCount(slot, tick);
  if (pCount >= PART_LIVE_CAP - 4) n = n < 3 ? n : 3;
  const base = ((((slot | 0) * 17 + (tick | 0)) % 628) / 100);
  for (let k = 0; k < n; k++) {
    const a = base + (k * 6.283185307179586) / n;
    const sp = 52 + k * 8;
    spawnPart(x, y, Math.cos(a) * sp, Math.sin(a) * sp - 16, (k & 1) ^ 1);
  }
  grant(killStop(kind, killed));
}

export function juiceFrame(dt: number): boolean {
  windowMs += dt;
  while (windowMs >= STOP_WINDOW_MS) {
    windowMs -= STOP_WINDOW_MS;
    usedMs = 0;
  }
  if (stopMs <= 0) return false;
  stopMs = stopMs > dt ? stopMs - dt : 0;
  return true;
}

export function tickJuice(dt: number): void {
  const scale = dt * 0.001;
  if (playerFlash > 0) {
    playerFlash = playerFlash > dt ? playerFlash - dt : 0;
  }
  if (flashOn > 0) {
    for (let i = 0; i < flashScan; i++) {
      const t = flash[i] ?? 0;
      if (t <= 0) continue;
      const next = t > dt ? t - dt : 0;
      flash[i] = next;
      if (next === 0) {
        flashOn--;
        knockX[i] = 0;
        knockY[i] = 0;
      }
    }
  }
  if (numCount > 0) {
    for (let i = 0; i < NUMBER_CAP; i++) {
      if (numOn[i] === 0) continue;
      numX[i] = (numX[i] ?? 0) + (numVx[i] ?? 0) * scale;
      numY[i] = (numY[i] ?? 0) + (numVy[i] ?? 0) * scale;
      const life = (numLife[i] ?? 0) - dt;
      if (life <= 0) {
        numOn[i] = 0;
        numCount--;
      } else numLife[i] = life;
    }
  }
  if (pCount > 0) {
    for (let i = 0; i < PART_CAP; i++) {
      if (pOn[i] === 0) continue;
      pX[i] = (pX[i] ?? 0) + (pVx[i] ?? 0) * scale;
      pY[i] = (pY[i] ?? 0) + (pVy[i] ?? 0) * scale;
      pRot[i] = (pRot[i] ?? 0) + (pSpin[i] ?? 0) * scale;
      const life = (pLife[i] ?? 0) - dt;
      if (life <= 0) {
        pOn[i] = 0;
        pCount--;
      } else pLife[i] = life;
    }
  }
}

function digits(n: number): number {
  if (n < 10) return 1;
  if (n < 100) return 2;
  if (n < 1000) return 3;
  return 4;
}

function glyph(c: CanvasRenderingContext2D, x: number, y: number, d: number, s: number): void {
  const bits = GLYPH[d] ?? 0;
  for (let p = 0; p < 15; p++) {
    if (bits & (1 << (14 - p))) c.fillRect((x + (p % 3) * s) | 0, (y + ((p / 3) | 0) * s) | 0, s, s);
  }
}

function drawValue(c: CanvasRenderingContext2D, x: number, y: number, n: number, col: string, s: number): void {
  let v = n | 0;
  if (v < 0) v = 0;
  if (v > 9999) v = 9999;
  let div = 1;
  let probe = v;
  while (probe >= 10 && div < 1000) {
    div *= 10;
    probe = (probe / 10) | 0;
  }
  c.fillStyle = col;
  let rest = v;
  let i = 0;
  while (div >= 1 && i < 4) {
    const d = (rest / div) | 0;
    glyph(c, x + i * 4 * s, y, d, s);
    rest -= d * div;
    div = (div / 10) | 0;
    i++;
  }
}

export function drawJuice(c: CanvasRenderingContext2D): void {
  if (pCount > 0) {
    for (let i = 0; i < PART_CAP; i++) {
      if (pOn[i] === 0) continue;
      const life = pLife[i] ?? 0;
      c.globalAlpha = life > 160 ? 1 : Math.max(0, life / 160);
      const x = pX[i] ?? 0;
      const y = pY[i] ?? 0;
      if ((pGear[i] ?? 0) === 1) {
        c.save();
        c.translate(x | 0, y | 0);
        c.rotate(pRot[i] ?? 0);
        c.fillStyle = "rgba(255,200,80,0.4)";
        c.beginPath();
        c.arc(0, 0, 9, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = BRASS_HI;
        c.fillRect(-2, -8, 4, 16);
        c.fillRect(-8, -2, 16, 4);
        c.fillStyle = BRASS;
        c.fillRect(-4, -4, 8, 8);
        c.restore();
      } else if ((pGear[i] ?? 0) === 2) {
        c.fillStyle = "rgba(160,18,28,0.95)";
        c.beginPath();
        c.ellipse(x, y, BLOOD_DROP_RX, BLOOD_DROP_RY, pRot[i] ?? 0, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = "rgba(210,36,42,0.88)";
        c.fillRect((x - 2) | 0, (y - 3) | 0, 3, 4);
      } else {
        c.fillStyle = "rgba(255,158,46,0.62)";
        c.beginPath();
        c.arc(x, y, 8, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = BRASS;
        c.fillRect((x - 5) | 0, (y - 3) | 0, 11, 7);
        c.fillStyle = COPPER;
        c.fillRect((x - 2) | 0, (y - 1) | 0, 5, 5);
      }
    }
  }
  c.globalAlpha = 1;
  if (!showNumbers || numCount === 0) return;
  const smooth = c.imageSmoothingEnabled;
  c.imageSmoothingEnabled = false;
  for (let i = 0; i < NUMBER_CAP; i++) {
    if (numOn[i] === 0) continue;
    const life = numLife[i] ?? 0;
    const crit = numCrit[i] ?? 0;
    const s = GLYPH_CELL;
    const val = numDmg[i] ?? 0;
    const x = (numX[i] ?? 0) - digits(val) * 2 * s;
    const y = numY[i] ?? 0;
    c.globalAlpha = Math.max(0, life / NUMBER_LIFE);
    drawValue(c, x + s, y + s, val, SOOT, s);
    drawValue(c, x, y, val, numberColor(crit), s);
  }
  c.imageSmoothingEnabled = smooth;
  c.globalAlpha = 1;
}
