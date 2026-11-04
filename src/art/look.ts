import {
  BRASS, BRASS_HI, BRASS_LO, CYAN, FONT_BODY, GLASS, INK, IRON, PANEL, XP,
} from "../shell/theme";
import { PX } from "./palette";
import { blitSheet, blitSheetLean, foeSpriteId, heroSpriteId, spriteOf } from "./sheet";

export const HERO_LOOK_W = 40;
export const HERO_LOOK_H = 52;
export const HERO_PACK_H = 64;
export const HERO_DRAW_SCALE = 1.25;
export const FOE_TO_HERO = 0.78;
export const BRUTE_TO_HERO = 0.98;

export function foeWorldScale(kind: number, sprH: number): number {
  const dest = (kind === 2 ? BRUTE_TO_HERO : FOE_TO_HERO) * HERO_PACK_H;
  return dest / Math.max(1, sprH);
}

export function foeWorldH(kind: number): number {
  return (kind === 2 ? BRUTE_TO_HERO : FOE_TO_HERO) * HERO_PACK_H;
}

export function hudType(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: number,
  color: string,
  align: CanvasTextAlign = "left",
): void {
  ctx.font = `600 ${size}px ${FONT_BODY}`;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

export function brassFrame(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r = 10,
): void {
  round(ctx, x, y, w, h, r);
  ctx.fillStyle = BRASS_LO;
  ctx.fill();
  round(ctx, x + 1.5, y + 1.5, w - 3, h - 3, Math.max(2, r - 1));
  ctx.fillStyle = GLASS;
  ctx.fill();
  ctx.strokeStyle = BRASS;
  ctx.lineWidth = 1.2;
  ctx.stroke();
}

export function glassDisc(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, lit = false): void {
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = lit ? PANEL : GLASS;
  ctx.fill();
  ctx.strokeStyle = lit ? BRASS_HI : BRASS;
  ctx.lineWidth = 1.6;
  ctx.stroke();
}

export function ringMeter(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  t: number,
  col: string,
): void {
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = IRON;
  ctx.lineWidth = 5.4;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0, Math.min(1, t)));
  ctx.strokeStyle = col;
  ctx.lineWidth = 5.4;
  ctx.lineCap = "round";
  ctx.stroke();
  ctx.lineCap = "butt";
}

function round(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

export function paintShadow(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number): void {
  ctx.save();
  ctx.globalAlpha = 0.45;
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.ellipse(x, y + 2, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function paintRifle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  nx: number,
  ny: number,
  s: number,
  bob: number,
): void {
  const hx = x + nx * 9 * s;
  const hy = y - 22 * s - bob + ny * 7;
  ctx.save();
  ctx.translate(hx, hy);
  ctx.rotate(Math.atan2(ny, nx));
  ctx.fillStyle = INK;
  ctx.fillRect(-11 * s, -6 * s, 16 * s, 12 * s);
  ctx.fillRect(-5 * s, 2 * s, 6.4 * s, 12 * s);
  ctx.fillStyle = PX.n;
  ctx.fillRect(-10 * s, -5 * s, 14 * s, 10 * s);
  ctx.fillRect(-4 * s, 3 * s, 5.4 * s, 11 * s);
  ctx.fillStyle = INK;
  ctx.fillRect(-3 * s, -5.2 * s, 44 * s, 10.4 * s);
  ctx.fillStyle = BRASS_HI;
  ctx.fillRect(-2 * s, -4.2 * s, 42 * s, 8.4 * s);
  ctx.fillStyle = "#fff3c8";
  ctx.fillRect(26 * s, -3 * s, 16 * s, 6 * s);
  ctx.fillStyle = INK;
  ctx.fillRect(8 * s, -1.2 * s, 3 * s, 2.4 * s);
  ctx.restore();
}

export function paintSignatureHero(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  aimX: number,
  aimY: number,
  moving: boolean,
  shoot: boolean,
  tick: number,
): void {
  const bob = moving ? Math.sin(tick * 0.35) * 1.6 : 0;
  const lean = Math.max(-0.16, Math.min(0.16, aimX * 0.14));
  const flip = aimX < 0;
  const s = HERO_DRAW_SCALE;
  const mag = Math.max(0.2, Math.hypot(aimX, aimY));
  const nx = aimX / mag;
  const ny = aimY / mag;
  paintShadow(ctx, x, y, 22, 9);
  ctx.save();
  ctx.fillStyle = "rgba(62,200,192,0.28)";
  ctx.beginPath();
  ctx.ellipse(x, y + 3, 14, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = CYAN;
  ctx.globalAlpha = 0.92;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
  ctx.save();
  ctx.fillStyle = "rgba(255,214,130,0.62)";
  ctx.beginPath();
  ctx.ellipse(x, y - 24 * s - bob, 13 * s, 22 * s, lean, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.filter = "brightness(1.65) contrast(1.2) saturate(1.15)";
  blitSheetLean(ctx, heroSpriteId(moving, tick), x, y, flip, bob, lean, s);
  ctx.restore();
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.strokeStyle = "rgba(255,200,96,0.85)";
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.ellipse(x, y - 26 * s - bob, 12 * s, 20 * s, lean, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
  paintRifle(ctx, x, y, nx, ny, s, bob);
  if (!shoot) return;
  const mx = x + nx * 32 * s;
  const my = y - 20 * s - bob + ny * 10;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = "rgba(255,248,220,0.95)";
  ctx.beginPath();
  ctx.ellipse(mx, my, 9.4, 5.2, Math.atan2(ny, nx), 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#f0b44a";
  ctx.lineWidth = 7.2;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(mx, my);
  ctx.lineTo(mx + nx * 48, my + ny * 48);
  ctx.stroke();
  ctx.strokeStyle = "rgba(255,248,220,0.95)";
  ctx.lineWidth = 3.2;
  ctx.beginPath();
  ctx.moveTo(mx, my);
  ctx.lineTo(mx + nx * 36, my + ny * 36);
  ctx.stroke();
  ctx.restore();
}

export function paintZombie(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  kind: number,
  elite: boolean,
  tick: number,
  flip: number,
): void {
  const bob = ((tick >> 3) & 1) * 1.2;
  const id = foeSpriteId(kind, elite);
  const spr = spriteOf(id);
  const scale = foeWorldScale(kind, spr?.["h"] ?? 32);
  paintShadow(ctx, x, y, 5 * scale, 2.1 * scale);
  blitSheetLean(ctx, id, x, y, flip < 0, bob, 0, scale);
}

export function paintMine(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, spikes: number, elite: boolean): void {
  paintShadow(ctx, x, y, r * 0.9, r * 0.35);
  ctx.beginPath();
  ctx.arc(x, y - r * 0.2, r * 0.72, 0, Math.PI * 2);
  ctx.fillStyle = elite ? PX.d : PX.g;
  ctx.fill();
  ctx.strokeStyle = PX.G;
  ctx.lineWidth = 1.4;
  ctx.stroke();
  for (let i = 0; i < spikes; i++) {
    const a = (i / spikes) * Math.PI * 2 - Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a) * r * 0.55, y - r * 0.2 + Math.sin(a) * r * 0.55);
    ctx.lineTo(x + Math.cos(a) * r, y - r * 0.2 + Math.sin(a) * r);
    ctx.strokeStyle = PX.z;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(x, y - r * 0.2, r * 0.18, 0, Math.PI * 2);
  ctx.fillStyle = elite ? XP : PX.x;
  ctx.fill();
}

export function paintTankLook(ctx: CanvasRenderingContext2D, x: number, y: number, ang: number, tick: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  paintShadow(ctx, 0, 0, 28, 10);
  ctx.fillStyle = PX.t;
  ctx.fillRect(-26, -14, 52, 28);
  ctx.fillStyle = PX.g;
  ctx.fillRect(-22, -10, 44, 20);
  ctx.fillStyle = BRASS;
  ctx.fillRect(-8, -12, 16, 4);
  ctx.fillStyle = PX.f;
  ctx.fillRect(18, -4, 16, 8);
  if ((tick >> 2) & 1) {
    ctx.fillStyle = PX.F;
    ctx.fillRect(32, -3, 10, 6);
  }
  ctx.restore();
}

export function paintEnergyTank(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, tick: number): void {
  paintShadow(ctx, x, y, r * 0.9, r * 0.32);
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.globalAlpha = 0.55 + ((tick >> 3) & 1) * 0.2;
  blitSheet(ctx, "blue_glow", x, y - 8);
  ctx.restore();
  blitSheet(ctx, "pipes_blue_tank", x, y);
}

export function paintBlood(ctx: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  ctx.fillStyle = "#7a2218";
  ctx.globalAlpha = 0.82;
  ctx.beginPath();
  ctx.ellipse(x, y, s * 2.2, s * 1.1, 0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#4a120e";
  ctx.fillRect(x + s, y - 1, 5, 2);
  ctx.fillRect(x - s * 0.7, y + 2, 4, 2);
  ctx.globalAlpha = 1;
}

export function paintCasing(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.save();
  ctx.fillStyle = INK;
  ctx.fillRect(x - 1, y - 1, 13, 6.2);
  ctx.fillStyle = BRASS;
  ctx.fillRect(x, y, 11, 4.2);
  ctx.fillStyle = BRASS_HI;
  ctx.fillRect(x + 8, y, 3.2, 4.2);
  ctx.restore();
}

export function paintGlowGem(ctx: CanvasRenderingContext2D, x: number, y: number, col: string): void {
  ctx.beginPath();
  ctx.arc(x, y, 6, 0, Math.PI * 2);
  ctx.fillStyle = col;
  ctx.globalAlpha = 0.35;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.beginPath();
  ctx.arc(x, y, 2.4, 0, Math.PI * 2);
  ctx.fill();
}

export function bakeFoeStamp(kind: number, elite: boolean): { pix: Uint32Array; w: number; h: number; ox: number; oy: number } {
  const w = 20;
  const h = 24;
  const pix = new Uint32Array(w * h);
  const body = elite ? 0xff205a8a : 0xff101214;
  const head = 0xff24282a;
  const eye = 0xff324ae2;
  fillDisc(pix, w, h, 10, 14, 5, body);
  fillDisc(pix, w, h, 10, 7, 4, head);
  pix[7 * w + 8] = eye;
  pix[7 * w + 12] = eye;
  if (elite) {
    for (let x = 6; x < 15; x++) pix[11 * w + x] = 0xff40a0e0;
  }
  if (kind === 6) {
    fillDisc(pix, w, h, 10, 16, 4, body);
  }
  return { pix, w, h, ox: 10, oy: 22 };
}

function fillDisc(pix: Uint32Array, w: number, h: number, cx: number, cy: number, r: number, color: number): void {
  const r2 = r * r;
  for (let y = cy - r; y <= cy + r; y++) {
    if (y < 0 || y >= h) continue;
    for (let x = cx - r; x <= cx + r; x++) {
      if (x < 0 || x >= w) continue;
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= r2) pix[y * w + x] = color;
    }
  }
}

export function heartIcon(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, col: string): void {
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.35);
  ctx.bezierCurveTo(x - s, y - s * 0.2, x - s * 0.35, y - s * 0.85, x, y - s * 0.25);
  ctx.bezierCurveTo(x + s * 0.35, y - s * 0.85, x + s, y - s * 0.2, x, y + s * 0.35);
  ctx.fill();
}
