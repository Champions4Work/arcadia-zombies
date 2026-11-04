import { ARENA_H, ARENA_W } from "../sim/arena";
import { H, W } from "../sim/types";
import { paintGround, VENT_FX_CAP, VENT_PUFFS, ventCount, ventX, ventY } from "./ground";
import { BRASS, cog, COPPER, lit, OUTLINE, rivet, roundRect, STEEL } from "./paint";
import { puffSprite } from "./sprites";

const STAGE = 2;
export const CLOCK_X = 240;
export const CLOCK_Y = 78;
const STACKS = [
  { x: 36, y: 34 },
  { x: 64, y: 22 },
  { x: 98, y: 40 },
];

let yard: HTMLCanvasElement | null = null;

function tone(x: number, y: number): number {
  let n = (x * 374761393 + y * 668265263) | 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return (n >>> 0) % 17;
}

function brick(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, mortar: string, a: string, b: string): void {
  ctx.fillStyle = mortar;
  ctx.fillRect(x, y, w, h);
  const bw = 14;
  const bh = 8;
  for (let row = 0, yy = y + 1; yy < y + h - 1; yy += bh, row++) {
    const ox = row & 1 ? bw / 2 : 0;
    for (let xx = x - bw; xx < x + w; xx += bw) {
      const px = xx + ox;
      if (px + bw - 2 < x || px > x + w) continue;
      const clipL = Math.max(x + 1, px + 1);
      const clipR = Math.min(x + w - 1, px + bw - 2);
      if (clipR <= clipL) continue;
      ctx.fillStyle = tone(px, yy) > 8 ? a : b;
      ctx.fillRect(clipL, yy, clipR - clipL, bh - 2);
    }
  }
}

function windowGlow(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  roundRect(ctx, x, y, w, h, 2);
  const g = ctx.createLinearGradient(x, y, x, y + h);
  g.addColorStop(0, "#ffe29a");
  g.addColorStop(0.6, "#ff9a32");
  g.addColorStop(1, "#c85a14");
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.strokeStyle = "rgba(90,40,10,0.65)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + w / 2, y + 1);
  ctx.lineTo(x + w / 2, y + h - 1);
  ctx.moveTo(x + 1, y + h / 2);
  ctx.lineTo(x + w - 1, y + h / 2);
  ctx.stroke();
}

function chimney(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, bands: number): void {
  brick(ctx, x, y + 8, w, h - 8, "#3a241c", "#a08878", "#7a6458");
  ctx.fillStyle = "#2a1814";
  roundRect(ctx, x - 3, y + 4, w + 6, 10, 2);
  ctx.fill();
  ctx.fillStyle = "#1a1010";
  ctx.fillRect(x + 3, y, w - 6, 8);
  for (let i = 0; i < bands; i++) {
    const yy = y + 18 + i * 16;
    ctx.fillStyle = i & 1 ? "#c84828" : BRASS.mid;
    ctx.fillRect(x - 1, yy, w + 2, 5);
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.fillRect(x - 1, yy, w + 2, 1.4);
  }
  rivet(ctx, x + 2, y + 16, 1.3);
  rivet(ctx, x + w - 2, y + 16, 1.3);
}

function pipe(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, r: number): void {
  ctx.lineCap = "round";
  ctx.strokeStyle = COPPER.edge;
  ctx.lineWidth = r;
  ctx.beginPath();
  ctx.moveTo(x0, y0 + r * 0.12);
  ctx.lineTo(x1, y1 + r * 0.12);
  ctx.stroke();
  ctx.strokeStyle = COPPER.mid;
  ctx.lineWidth = r * 0.72;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  ctx.strokeStyle = COPPER.hi;
  ctx.lineWidth = Math.max(1, r * 0.18);
  ctx.beginPath();
  ctx.moveTo(x0, y0 - r * 0.22);
  ctx.lineTo(x1, y1 - r * 0.22);
  ctx.stroke();
}

function joint(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = lit(ctx, x - r, y - r, r * 2, r * 2, BRASS);
  ctx.fill();
  ctx.lineWidth = 1.4;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  rivet(ctx, x, y, Math.max(1, r * 0.28));
}

function tower(ctx: CanvasRenderingContext2D): void {
  brick(ctx, 168, 44, 144, 108, "#4a3428", "#c4a48c", "#8d6d58");
  ctx.fillStyle = lit(ctx, 176, 34, 128, 18, BRASS);
  roundRect(ctx, 186, 32, 108, 16, 4);
  ctx.fill();
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(240, 22);
  ctx.lineTo(214, 36);
  ctx.lineTo(266, 36);
  ctx.closePath();
  ctx.fillStyle = BRASS.mid;
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(CLOCK_X, CLOCK_Y, 22, 0, Math.PI * 2);
  ctx.fillStyle = lit(ctx, CLOCK_X - 22, CLOCK_Y - 22, 44, 44, BRASS);
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(CLOCK_X, CLOCK_Y, 16, 0, Math.PI * 2);
  const face = ctx.createRadialGradient(CLOCK_X - 4, CLOCK_Y - 5, 2, CLOCK_X, CLOCK_Y, 16);
  face.addColorStop(0, "#fff8ea");
  face.addColorStop(1, "#f0d7a4");
  ctx.fillStyle = face;
  ctx.fill();
  ctx.strokeStyle = "#3a2414";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
    ctx.moveTo(CLOCK_X + Math.cos(a) * 11, CLOCK_Y + Math.sin(a) * 11);
    ctx.lineTo(CLOCK_X + Math.cos(a) * 14, CLOCK_Y + Math.sin(a) * 14);
  }
  ctx.stroke();
  roundRect(ctx, 214, 108, 52, 40, 8);
  ctx.fillStyle = "#1a120e";
  ctx.fill();
  const arch = ctx.createLinearGradient(214, 108, 266, 148);
  arch.addColorStop(0, "rgba(255,170,60,0.15)");
  arch.addColorStop(1, "rgba(255,120,30,0.55)");
  ctx.fillStyle = arch;
  ctx.fill();
  windowGlow(ctx, 186, 102, 14, 16);
  windowGlow(ctx, 280, 102, 14, 16);
  rivet(ctx, 176, 52, 1.6);
  rivet(ctx, 304, 52, 1.6);
  rivet(ctx, 176, 140, 1.6);
  rivet(ctx, 304, 140, 1.6);
}

function factory(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  brick(ctx, x, y, w, h, "#3e4a56", "#8aa0b0", "#6d8292");
  ctx.fillStyle = lit(ctx, x, y - 8, w, 12, STEEL);
  roundRect(ctx, x - 4, y - 6, w + 8, 10, 2);
  ctx.fill();
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.save();
  ctx.beginPath();
  ctx.rect(x + 2, y + 2, w - 4, h - 4);
  ctx.clip();
  const cols = Math.max(1, (w / 22) | 0);
  const rows = Math.max(1, ((h - 16) / 22) | 0);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) windowGlow(ctx, x + 8 + c * 22, y + 10 + r * 22, 12, 16);
  }
  ctx.restore();
}

function belt(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  roundRect(ctx, x, y, w, h, 4);
  ctx.fillStyle = "#2a241c";
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = BRASS.lo;
  ctx.stroke();
  ctx.fillStyle = "#1a1612";
  roundRect(ctx, x + 4, y + 4, w - 8, h - 8, 2);
  ctx.fill();
  joint(ctx, x + 8, y + h / 2, h * 0.28);
  joint(ctx, x + w - 8, y + h / 2, h * 0.28);
}

function drawYard(ctx: CanvasRenderingContext2D): void {
  const sky = ctx.createLinearGradient(0, 0, 0, 150);
  sky.addColorStop(0, "#241454");
  sky.addColorStop(0.45, "#6a3478");
  sky.addColorStop(0.78, "#e07068");
  sky.addColorStop(1, "#ffb15a");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, ARENA_W, 160);
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  for (let i = 0; i < 48; i++) {
    const x = (i * 97) % ARENA_W;
    const y = (i * 41) % 70;
    ctx.globalAlpha = 0.35 + (i % 4) * 0.12;
    ctx.fillRect(x, y, i % 5 === 0 ? 2 : 1.2, i % 5 === 0 ? 2 : 1.2);
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = "rgba(255,210,230,0.35)";
  ctx.beginPath();
  ctx.ellipse(80, 28, 36, 12, 0, 0, Math.PI * 2);
  ctx.ellipse(100, 24, 22, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(300, 18, 40, 11, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#3a2458";
  for (let i = 0; i < 9; i++) {
    const bh = 18 + (i % 4) * 10;
    ctx.fillRect(8 + i * 18, 96 - bh, 16, bh);
    if (i % 2 === 0) {
      ctx.fillStyle = "#ffb050";
      ctx.fillRect(12 + i * 18, 100 - bh, 3, 4);
      ctx.fillStyle = "#3a2458";
    }
  }
  paintGround(ctx);
  const sun = ctx.createRadialGradient(400, 36, 8, 340, 90, 220);
  sun.addColorStop(0, "rgba(255,210,140,0.55)");
  sun.addColorStop(1, "rgba(255,160,70,0)");
  ctx.fillStyle = sun;
  ctx.fillRect(0, 0, ARENA_W, 200);
  chimney(ctx, 22, 30, 26, 88, 3);
  chimney(ctx, 54, 16, 22, 96, 4);
  chimney(ctx, 84, 38, 20, 74, 2);
  factory(ctx, 8, 86, 120, 48);
  tower(ctx);
  factory(ctx, 330, 70, 140, 52);
  chimney(ctx, 348, 40, 18, 48, 2);
  pipe(ctx, 112, 112, 168, 102, 8);
  pipe(ctx, 312, 102, 360, 112, 8);
  pipe(ctx, 20, 132, 150, 132, 7);
  pipe(ctx, 330, 124, 470, 118, 7);
  pipe(ctx, 150, 132, 150, 168, 7);
  pipe(ctx, 456, 78, 456, 124, 6);
  joint(ctx, 112, 112, 6);
  joint(ctx, 168, 102, 6);
  joint(ctx, 312, 102, 6);
  joint(ctx, 150, 132, 5);
  joint(ctx, 456, 78, 5);
  joint(ctx, 456, 124, 5);
  belt(ctx, 292, 156, 176, 26);
  belt(ctx, 310, 204, 158, 22);
  belt(ctx, 18, 188, 124, 22);
  const spill = ctx.createRadialGradient(240, 120, 8, 240, 150, 90);
  spill.addColorStop(0, "rgba(255,170,70,0.28)");
  spill.addColorStop(1, "rgba(255,140,40,0)");
  ctx.fillStyle = spill;
  ctx.fillRect(120, 80, 240, 120);
}

function background(): HTMLCanvasElement {
  if (!yard) {
    yard = document.createElement("canvas");
    yard.width = ARENA_W * STAGE;
    yard.height = ARENA_H * STAGE;
    const ctx = yard.getContext("2d");
    if (!ctx) return yard;
    ctx.scale(STAGE, STAGE);
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    drawYard(ctx);
  }
  return yard;
}

function slats(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, tick: number): void {
  ctx.save();
  roundRect(ctx, x + 6, y + 5, w - 12, h - 10, 2);
  ctx.clip();
  const off = (tick * 0.7) % 12;
  ctx.fillStyle = "rgba(232,196,120,0.8)";
  for (let sx = x + off; sx < x + w; sx += 12) ctx.fillRect(sx, y + 5, 3, h - 10);
  ctx.restore();
}

function balloon(ctx: CanvasRenderingContext2D, tick: number): void {
  const y = 30 + Math.sin(tick * 0.02) * 3;
  const x = 404;
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.ellipse(0, 0, 36, 16, 0, 0, Math.PI * 2);
  const g = ctx.createLinearGradient(-20, -16, 16, 16);
  g.addColorStop(0, "#f0c4de");
  g.addColorStop(0.45, "#a84878");
  g.addColorStop(1, "#6a2458");
  ctx.fillStyle = g;
  ctx.fill();
  ctx.lineWidth = 2.2;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  ctx.fillStyle = BRASS.mid;
  ctx.fillRect(-36, -3, 72, 6);
  ctx.strokeRect(-36, -3, 72, 6);
  ctx.beginPath();
  ctx.ellipse(30, 0, 8, 12, 0.4, 0, Math.PI * 2);
  ctx.fillStyle = "#8a3a68";
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = BRASS.hi;
  roundRect(ctx, -14, 14, 28, 10, 2);
  ctx.fill();
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  ctx.fillStyle = "#1c140e";
  ctx.fillRect(-8, 17, 16, 4);
  ctx.strokeStyle = "#3a2414";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-10, 12);
  ctx.lineTo(-12, 16);
  ctx.moveTo(10, 12);
  ctx.lineTo(12, 16);
  ctx.stroke();
  ctx.save();
  ctx.translate(34, 18);
  ctx.rotate(tick * 0.4);
  ctx.strokeStyle = "rgba(255,244,220,0.8)";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-5, 0);
  ctx.lineTo(5, 0);
  ctx.moveTo(0, -5);
  ctx.lineTo(0, 5);
  ctx.stroke();
  ctx.restore();
  ctx.restore();
}

function hands(ctx: CanvasRenderingContext2D, tick: number): void {
  ctx.save();
  ctx.translate(CLOCK_X, CLOCK_Y);
  ctx.strokeStyle = OUTLINE;
  ctx.lineCap = "round";
  ctx.lineWidth = 2.4;
  ctx.rotate(tick * 0.004);
  ctx.beginPath();
  ctx.moveTo(0, 2);
  ctx.lineTo(0, -8);
  ctx.stroke();
  ctx.rotate(tick * 0.02);
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(0, 2);
  ctx.lineTo(0, -13);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, 2.2, 0, Math.PI * 2);
  ctx.fillStyle = BRASS.edge;
  ctx.fill();
  ctx.restore();
}

function smoke(ctx: CanvasRenderingContext2D, tick: number): void {
  const puff = puffSprite();
  for (let s = 0; s < STACKS.length; s++) {
    const stack = STACKS[s];
    if (!stack) continue;
    for (let i = 0; i < 4; i++) {
      const t = ((tick * 0.55 + i * 18 + s * 7) % 72) / 72;
      ctx.globalAlpha = (1 - t) * 0.55;
      const size = 10 + t * 18;
      ctx.drawImage(puff, stack.x + Math.sin(t * 5 + s) * 6 - size / 2, stack.y - 8 - t * 36, size, size);
    }
  }
  ctx.globalAlpha = 1;
}

function embers(ctx: CanvasRenderingContext2D, tick: number): void {
  ctx.fillStyle = "#ffb050";
  for (let i = 0; i < 12; i++) {
    const x = (i * 83 + tick * (0.25 + (i % 3) * 0.12)) % ARENA_W;
    const y = 30 + ((i * 47 + tick * 0.18) % 90);
    ctx.globalAlpha = 0.35 + (i % 3) * 0.15;
    ctx.fillRect(x, y, i % 2 ? 2 : 1.4, i % 2 ? 2 : 1.4);
  }
  ctx.globalAlpha = 1;
}

function spinGears(ctx: CanvasRenderingContext2D, tick: number): void {
  cog(ctx, 168, 232, 16, tick * 0.012, BRASS, 8, false);
  cog(ctx, 248, 270, 13, -tick * 0.016, COPPER, 7, false);
  cog(ctx, 392, 196, 14, tick * 0.009, BRASS, 8, false);
}

function ventSteam(ctx: CanvasRenderingContext2D, tick: number, camX: number, camY: number): void {
  const puff = puffSprite();
  const n = ventCount();
  let drawn = 0;
  for (let i = 0; i < n; i++) {
    const x = ventX(i);
    const y = ventY(i);
    if (x < camX - 40 || y < camY - 40 || x > camX + W + 40 || y > camY + H + 40) continue;
    for (let k = 0; k < VENT_PUFFS; k++) {
      const t = ((tick * 0.45 + i * 11 + k * 17) % 50) / 50;
      ctx.globalAlpha = (1 - t) * 0.38;
      const s = 6 + t * 12;
      ctx.drawImage(puff, x + Math.sin(t * 4 + i) * 3 - s / 2, y - 4 - t * 22, s, s);
    }
    drawn++;
    if (drawn >= VENT_FX_CAP) break;
  }
  ctx.globalAlpha = 1;
}

export function drawStageFx(ctx: CanvasRenderingContext2D, tick: number, camX: number, camY: number): void {
  slats(ctx, 292, 156, 176, 26, tick);
  slats(ctx, 310, 204, 158, 22, tick + 6);
  slats(ctx, 18, 188, 124, 22, tick + 3);
  spinGears(ctx, tick);
  ventSteam(ctx, tick, camX, camY);
  hands(ctx, tick);
  smoke(ctx, tick);
  balloon(ctx, tick);
  embers(ctx, tick);
}

export function drawStage(ctx: CanvasRenderingContext2D, tick: number, camX = 0, camY = 0): void {
  const src = background();
  ctx.drawImage(src, camX * STAGE, camY * STAGE, W * STAGE, H * STAGE, camX, camY, W, H);
  drawStageFx(ctx, tick, camX, camY);
}
