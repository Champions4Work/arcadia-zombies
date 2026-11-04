import {
  BRASS, BRASS_HI, BRASS_LO, CYAN, FONT_BODY, GLASS, INK, IRON, PANEL, STEAM, XP,
} from "../shell/theme";
import { PX } from "./palette";
import { blitSheet, blitSheetLean, foeSpriteId, heroSpriteId, spriteOf } from "./sheet";

export const HERO_LOOK_W = 40;
export const HERO_LOOK_H = 52;
export const HERO_PACK_H = 64;
export const FOE_TO_HERO = 0.45;
export const BRUTE_TO_HERO = 1.3;

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
  paintShadow(ctx, x, y, 14, 5.6);
  ctx.beginPath();
  ctx.ellipse(x, y + 2, 16, 6, 0, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(122,224,212,0.28)";
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x, y + 2, 15, 5.4, 0, 0, Math.PI * 2);
  ctx.strokeStyle = CYAN;
  ctx.globalAlpha = 0.9;
  ctx.lineWidth = 2.2;
  ctx.stroke();
  ctx.globalAlpha = 1;
  blitSheetLean(ctx, heroSpriteId(moving, tick), x, y, flip, bob, lean);
  if (!shoot) return;
  const dir = flip ? -1 : 1;
  const mx = x + dir * 22;
  const my = y - 26 - bob;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = "rgba(255,186,72,0.55)";
  ctx.beginPath();
  ctx.ellipse(mx, my, 18, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PX.F;
  ctx.beginPath();
  ctx.ellipse(mx + dir * 4, my, 12, 5.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = STEAM;
  ctx.beginPath();
  ctx.ellipse(mx + dir * 8, my, 6, 2.4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PX.u;
  ctx.beginPath();
  ctx.ellipse(mx + dir * 10, my, 2.4, 1.2, 0, 0, Math.PI * 2);
  ctx.fill();
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
  ctx.fillStyle = PX.r;
  ctx.globalAlpha = 0.72;
  ctx.beginPath();
  ctx.ellipse(x, y, s * 1.8, s * 0.9, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(x + s, y - 1, 4, 2);
  ctx.fillRect(x - s * 0.6, y + 1, 3, 2);
  ctx.globalAlpha = 1;
}

export function paintCasing(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.save();
  ctx.fillStyle = BRASS;
  ctx.fillRect(x, y, 4, 1.8);
  ctx.fillStyle = BRASS_HI;
  ctx.fillRect(x + 3, y, 1.4, 1.8);
  ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = PX.F;
  ctx.fillRect(x + 1, y - 2, 2, 2);
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
