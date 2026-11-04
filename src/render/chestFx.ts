import { blitAtlas } from "../art/atlas";
import { hudInk, pixelBox } from "../art/chrome";
import { CHEST_SLOTS, chestGoldAt, chestLanded, MAX_CHESTS } from "../sim/chest";
import { upgName } from "../sim/progress";
import { H, UPG_COUNT, W, type World } from "../sim/types";
import { drawRewardCard } from "./cards";
import { drawIcon, rarityTint } from "./icons";
import { BRASS_HI, BRASS_LO, COPPER, INK, PANEL, SOOT } from "../shell/theme";

export const CONT_W = 168;
export const CONT_H = 30;
export const CONT_Y = 262;

export function chestSkipKey(key: string, repeat: boolean): boolean {
  if (repeat) return false;
  const k = key.toLowerCase();
  if (k === "escape" || k === "m") return false;
  if (k === "w" || k === "a" || k === "s" || k === "d") return false;
  if (k.startsWith("arrow")) return false;
  return true;
}

export function continueRect(): { x: number; y: number; w: number; h: number } {
  return { x: (W - CONT_W) / 2, y: CONT_Y, w: CONT_W, h: CONT_H };
}

export function chestContinueHit(x: number, y: number): boolean {
  const r = continueRect();
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

function rect(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, col: string): void {
  c.fillStyle = col;
  c.fillRect(x | 0, y | 0, w | 0, h | 0);
}

function settled(t: number, dur: number, slot: number, n: number): boolean {
  const u = n <= 1 ? 0 : slot / (n - 1);
  return t >= dur * (0.35 + 0.36 * u);
}

function groundChest(c: CanvasRenderingContext2D, x: number, y: number, tick: number): void {
  blitAtlas(c, (tick >> 4) & 1 ? "chest-1" : "chest-0", x, y, 2);
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

function prizeFrame(i: number, n: number): { x: number; y: number; w: number; h: number } {
  const gap = n >= 5 ? 4 : n >= 3 ? 6 : 10;
  const cw = n >= 5 ? 86 : n >= 4 ? 104 : n === 3 ? 132 : 200;
  const ch = n >= 5 ? 148 : 168;
  const total = n * cw + (n - 1) * gap;
  const x0 = (W - total) / 2;
  return { x: x0 + i * (cw + gap), y: 86, w: cw, h: ch };
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
  pixelBox(c, x, y, sw, sh, SOOT);
  if (done) {
    c.save();
    c.globalAlpha = 0.35 + ((w.chestT >> 2) & 1) * 0.2;
    c.strokeStyle = rarityTint(shown);
    c.lineWidth = 2;
    c.strokeRect(x + 2, y + 2, sw - 4, sh - 4);
    c.restore();
  }
  rect(c, x + 3, y + 3, sw - 6, sh - 6, done ? BRASS_LO : SOOT);
  drawIcon(c, shown, x + sw / 2, y + sh / 2 - 10, done ? 14 : 11);
  hudInk(c, upgName(shown), x + sw / 2, y + sh / 2 + 18, done ? BRASS_HI : COPPER, 1, "center");
}

function drawContinue(c: CanvasRenderingContext2D, tick: number): void {
  const r = continueRect();
  const pulse = (tick >> 3) & 1;
  pixelBox(c, r.x, r.y, r.w, r.h, pulse ? BRASS_HI : BRASS_LO, INK);
  hudInk(c, "CONTINUE", r.x + r.w / 2, r.y + 10, INK, 2, "center");
}

export function drawChestReveal(c: CanvasRenderingContext2D, w: World): void {
  if (!w.chestOpen) return;
  c.fillStyle = "rgba(8,6,4,0.78)";
  c.fillRect(0, 0, W, H);
  const n = w.chestCount;
  pixelBox(c, 18, 22, W - 36, 286, PANEL);
  const age = burstAge(w);
  if (age >= 0) {
    for (let i = 0; i < 8; i++) {
      rect(c, 36 + i * 52, 72 + (i & 1) * 18, 4, 4, i & 1 ? BRASS_HI : COPPER);
    }
  }
  hudInk(c, "BRASS CHEST", W / 2, 42, BRASS_HI, 2, "center");
  hudInk(c, n === 1 ? "1 GEAR" : `${n} GEARS`, W / 2, 62, COPPER, 1, "center");
  if (chestLanded(w)) {
    for (let i = 0; i < n && i < CHEST_SLOTS; i++) {
      const f = prizeFrame(i, n);
      drawRewardCard(c, f.x, f.y, f.w, f.h, w.chestPrize[i] ?? -1, w);
    }
    drawContinue(c, w.chestT);
    return;
  }
  const gap = n >= 5 ? 6 : 8;
  const sw = n >= 5 ? 76 : n >= 4 ? 100 : n === 3 ? 124 : 200;
  const total = n * sw + (n - 1) * gap;
  const x0 = (W - total) / 2;
  for (let i = 0; i < n && i < CHEST_SLOTS; i++) drawSlot(c, w, i, x0 + i * (sw + gap), 96, sw, 96);
  hudInk(c, "SPINNING", W / 2, 240, COPPER, 1, "center");
  blitAtlas(c, "chest-1", W / 2, 268, 2);
}
