import { CHEST_SLOTS, chestGoldAt, MAX_CHESTS } from "../sim/chest";
import { upgName } from "../sim/progress";
import { H, UPG_COUNT, W, type World } from "../sim/types";
const SOOT = "#120c08";
const BRASS = "#c8963e";
const BRASS_HI = "#e8c878";
const BRASS_LO = "#7a5420";
const COPPER = "#b5562f";

export function chestSkipKey(key: string, repeat: boolean): boolean {
  if (repeat) return false;
  const k = key.toLowerCase();
  if (k === "escape" || k === "m") return false;
  if (k === "w" || k === "a" || k === "s" || k === "d") return false;
  if (k.startsWith("arrow")) return false;
  return true;
}

function rect(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, col: string): void {
  c.fillStyle = col;
  c.fillRect(x | 0, y | 0, w, h);
}

function settled(t: number, dur: number, slot: number, n: number): boolean {
  const u = n <= 1 ? 0 : slot / (n - 1);
  return t >= dur * (0.35 + 0.36 * u);
}

function groundChest(c: CanvasRenderingContext2D, x: number, y: number, tick: number): void {
  const ix = x | 0;
  const iy = (y | 0) - ((tick >> 4 & 1) << 1);
  rect(c, ix - 16, iy - 12, 32, 26, BRASS_LO);
  rect(c, ix - 14, iy - 10, 28, 16, BRASS);
  rect(c, ix - 14, iy - 20, 28, 10, BRASS_HI);
  rect(c, ix - 4, iy - 5, 8, 6, SOOT);
}

export function drawChestGround(c: CanvasRenderingContext2D, w: World): void {
  for (let i = 0; i < MAX_CHESTS; i++) {
    if (!w.chestOn[i]) continue;
    groundChest(c, w.chestX[i] ?? 0, w.chestY[i] ?? 0, w.tick + i * 5);
  }
}

function burstAge(w: World): number {
  if (!w.chestOpen) return -1;
  const g = chestGoldAt(w.chestDur);
  return w.chestT >= g ? w.chestT - g : -1;
}

function drawSlot(
  c: CanvasRenderingContext2D,
  w: World,
  slot: number,
  x: number,
  y: number,
  sw: number,
  sh: number,
): void {
  const n = w.chestCount;
  const done = settled(w.chestT, w.chestDur, slot, n);
  const prize = w.chestPrize[slot] ?? -1;
  const shown = done ? prize : (w.chestT * 2 + slot * 5) % UPG_COUNT;
  rect(c, x, y, sw, sh, SOOT);
  rect(c, x + 3, y + 3, sw - 6, sh - 6, done ? BRASS_LO : SOOT);
  c.fillStyle = done ? BRASS_HI : COPPER;
  c.font = `bold ${n >= 5 ? 8 : 11}px monospace`;
  c.textAlign = "center";
  c.textBaseline = "middle";
  if (done) {
    c.fillText(upgName(shown), x + sw / 2, y + sh / 2 - 6);
    c.fillStyle = BRASS_HI;
    c.fillText(`LV ${w.upgrades[shown] ?? 0}`, x + sw / 2, y + sh / 2 + 12);
  } else c.fillText(upgName(shown), x + sw / 2, y + sh / 2);
}

export function drawChestReveal(c: CanvasRenderingContext2D, w: World): void {
  if (!w.chestOpen) return;
  c.fillStyle = "rgba(8,4,2,0.78)";
  c.fillRect(0, 0, W, H);
  const n = w.chestCount;
  rect(c, 18, 28, W - 36, 262, BRASS_LO);
  rect(c, 24, 34, W - 48, 250, "#2a1c10");
  const age = burstAge(w);
  if (age >= 0) for (let i = 0; i < 8; i++) rect(c, 36 + i * 52, 88 + (i & 1) * 78, 4, 4, i & 1 ? BRASS_HI : COPPER);
  c.fillStyle = BRASS_HI;
  c.font = "bold 20px monospace";
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.fillText("BRASS CHEST", W / 2, 58);
  c.font = "bold 12px monospace";
  c.fillText(n === 1 ? "1 GEAR" : `${n} GEARS`, W / 2, 80);
  const gap = n >= 5 ? 6 : 8;
  const sw = n >= 5 ? 76 : n >= 4 ? 100 : n === 3 ? 124 : 200;
  const total = n * sw + (n - 1) * gap;
  const x0 = (W - total) / 2;
  for (let i = 0; i < n && i < CHEST_SLOTS; i++) drawSlot(c, w, i, x0 + i * (sw + gap), 100, sw, 86);
  c.fillStyle = COPPER;
  c.fillText("TAP OR ANY KEY", W / 2, 248);
}
