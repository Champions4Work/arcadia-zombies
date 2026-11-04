import {
  BRASS, BRASS_HI, BRASS_LO, CYAN, FONT_BODY, GLASS, INK, IRON, PANEL, XP,
} from "../shell/theme";
import { PX } from "./palette";
import { blitSheet, blitSheetLean, foeSpriteId, spriteOf } from "./sheet";

export const HERO_LOOK_W = 40;
export const HERO_LOOK_H = 52;
export const HERO_PACK_H = 64;
export const HERO_DRAW_SCALE = 1.25;
export const FOE_TO_HERO = 0.58;
export const BRUTE_TO_HERO = 1.12;

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

export function walkBob(tick: number, moving: boolean): number {
  if (!moving) return 0;
  const frame = (tick >> 3) & 3;
  if (frame === 1) return 2.2;
  if (frame === 3) return 1.8;
  if (frame === 2) return 0.4;
  return 0;
}

export function shambleBob(tick: number, kind: number): number {
  const rate = kind === 2 ? 0.16 : 0.28;
  return Math.sin(tick * rate) * (kind === 2 ? 1.1 : 1.8);
}

export function shambleSway(tick: number, kind: number): number {
  const rate = kind === 2 ? 0.09 : 0.17;
  return Math.sin(tick * rate + 1.7) * (kind === 2 ? 0.035 : 0.07);
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
  ctx.fillStyle = PX.n;
  ctx.fillRect(-8 * s, -3.2 * s, 10 * s, 6.4 * s);
  ctx.fillRect(-3 * s, 2 * s, 3.6 * s, 7 * s);
  ctx.fillStyle = BRASS;
  ctx.fillRect(-1 * s, -2.2 * s, 28 * s, 4.4 * s);
  ctx.fillStyle = BRASS_HI;
  ctx.fillRect(20 * s, -1.6 * s, 10 * s, 3.2 * s);
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
  const bob = walkBob(tick, moving);
  const flip = aimX < 0;
  const s = HERO_DRAW_SCALE;
  const mag = Math.max(0.2, Math.hypot(aimX, aimY));
  const nx = aimX / mag;
  const ny = aimY / mag;
  paintShadow(ctx, x, y, 16 * s, 6 * s);
  ctx.save();
  ctx.fillStyle = "rgba(62,220,220,0.5)";
  ctx.beginPath();
  ctx.ellipse(x, y + 3, 14 * s, 5 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = CYAN;
  ctx.globalAlpha = 0.96;
  ctx.lineWidth = 2.4 * s;
  ctx.stroke();
  ctx.restore();
  paintDiveSuit(ctx, x, y, s, bob, flip, tick, moving);
  paintRifle(ctx, x, y, nx, ny, s, bob);
  if (!shoot) return;
  const mx = x + nx * 36 * s;
  const my = y - 22 * s - bob + ny * 10;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = "rgba(255,110,24,0.98)";
  ctx.beginPath();
  ctx.ellipse(mx, my, 20, 12, Math.atan2(ny, nx), 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,230,110,0.98)";
  ctx.beginPath();
  ctx.ellipse(mx, my, 9, 5.4, Math.atan2(ny, nx), 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#ffe07a";
  ctx.lineWidth = 4.2;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(mx, my);
  ctx.lineTo(mx + nx * 62, my + ny * 62);
  ctx.stroke();
  ctx.restore();
}

function paintDiveSuit(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  bob: number,
  flip: boolean,
  tick: number,
  moving: boolean,
): void {
  const frame = moving ? (tick >> 3) & 3 : 0;
  const liftL = frame === 1 ? 3.2 : frame === 2 ? 1.2 : 0;
  const liftR = frame === 3 ? 3.2 : frame === 2 ? 1.2 : 0;
  ctx.save();
  ctx.translate(x, y - bob);
  if (flip) ctx.scale(-1, 1);
  ctx.fillStyle = "#12100c";
  ctx.beginPath();
  ctx.ellipse(11.2 * s, -19 * s, 5.4 * s, 9.4 * s, 0.22, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#2a2014";
  ctx.beginPath();
  ctx.ellipse(11.2 * s, -19 * s, 4.2 * s, 8 * s, 0.22, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = BRASS_LO;
  ctx.fillRect(7.6 * s, -25.2 * s, 7.6 * s, 1.8 * s);
  ctx.fillRect(7.8 * s, -19.4 * s, 7.2 * s, 1.6 * s);
  ctx.fillRect(8 * s, -13.8 * s, 6.6 * s, 1.6 * s);
  ctx.fillStyle = "rgba(70,230,255,0.55)";
  ctx.beginPath();
  ctx.ellipse(12.2 * s, -19.2 * s, 1.6 * s, 4.2 * s, 0.22, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = BRASS_LO;
  ctx.lineWidth = 1.6 * s;
  ctx.beginPath();
  ctx.arc(6.4 * s, -28.6 * s, 6.8 * s, 0.15, 1.55);
  ctx.stroke();
  ctx.fillStyle = "#1a1008";
  ctx.fillRect(-5.4 * s, -12.4 * s + liftL, 4.6 * s, 13.6 * s - liftL);
  ctx.fillRect(0.8 * s, -12.4 * s + liftR, 4.6 * s, 13.6 * s - liftR);
  ctx.fillStyle = "#3a2418";
  ctx.fillRect(-4.8 * s, -11.6 * s + liftL, 3.4 * s, 9.2 * s - liftL);
  ctx.fillRect(1.2 * s, -11.6 * s + liftR, 3.4 * s, 9.2 * s - liftR);
  ctx.fillStyle = BRASS_LO;
  ctx.fillRect(-5.6 * s, -0.8 * s + liftL, 5 * s, 3.2 * s);
  ctx.fillRect(0.6 * s, -0.8 * s + liftR, 5 * s, 3.2 * s);
  ctx.fillStyle = "#1a1008";
  ctx.beginPath();
  ctx.ellipse(0, -16.4 * s, 6.8 * s, 8.4 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#3a2418";
  ctx.beginPath();
  ctx.ellipse(0.3 * s, -16.8 * s, 5.4 * s, 7.2 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#241610";
  ctx.beginPath();
  ctx.ellipse(-1.6 * s, -16.6 * s, 3.4 * s, 6.2 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = BRASS_LO;
  ctx.fillRect(-4.6 * s, -20.4 * s, 9.2 * s, 2.2 * s);
  ctx.fillRect(-3.8 * s, -15.2 * s, 7.6 * s, 1.6 * s);
  ctx.fillStyle = "#5a3a22";
  ctx.beginPath();
  ctx.ellipse(-7.2 * s, -21.6 * s, 4.2 * s, 3.2 * s, -0.32, 0, Math.PI * 2);
  ctx.ellipse(7.2 * s, -21.6 * s, 4.2 * s, 3.2 * s, 0.32, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#2a1c12";
  ctx.beginPath();
  ctx.ellipse(-7 * s, -21.8 * s, 2.8 * s, 2.1 * s, -0.32, 0, Math.PI * 2);
  ctx.ellipse(7 * s, -21.8 * s, 2.8 * s, 2.1 * s, 0.32, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = BRASS;
  ctx.beginPath();
  ctx.ellipse(0, -24.8 * s, 6.4 * s, 2.4 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = BRASS_LO;
  ctx.fillRect(-5.2 * s, -26.2 * s, 10.4 * s, 2.4 * s);
  ctx.fillStyle = "#5a3a18";
  ctx.beginPath();
  ctx.ellipse(0, -34.2 * s, 10.6 * s, 9.8 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = BRASS_LO;
  ctx.beginPath();
  ctx.ellipse(0, -34.2 * s, 9.8 * s, 9.2 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = BRASS;
  ctx.beginPath();
  ctx.ellipse(0.4 * s, -35.2 * s, 8.2 * s, 7.6 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = BRASS_HI;
  ctx.beginPath();
  ctx.ellipse(-1.6 * s, -38.8 * s, 4.4 * s, 3.2 * s, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.5 * s;
  ctx.beginPath();
  ctx.ellipse(0, -34.2 * s, 10.6 * s, 9.8 * s, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "#0c0806";
  ctx.fillRect(-8.6 * s, -37.2 * s, 17.2 * s, 6.4 * s);
  ctx.fillStyle = "#1a1008";
  ctx.fillRect(-8 * s, -36.4 * s, 16 * s, 4.8 * s);
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(side * 3.4 * s, -34.2 * s, 3.2 * s, 2.6 * s, 0, 0, Math.PI * 2);
    ctx.fillStyle = BRASS;
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(side * 3.4 * s, -34.2 * s, 2.6 * s, 2.1 * s, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#0ad8d0";
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(side * 3.4 * s - 0.7 * s, -34.8 * s, 0.8 * s, 0.55 * s, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#e8ffff";
    ctx.fill();
  }
  ctx.fillStyle = BRASS;
  ctx.fillRect(-1.4 * s, -35.2 * s, 2.8 * s, 1.8 * s);
  ctx.fillStyle = BRASS_HI;
  ctx.beginPath();
  ctx.ellipse(-8.8 * s, -30.4 * s, 0.8 * s, 0.8 * s, 0, 0, Math.PI * 2);
  ctx.ellipse(8.8 * s, -30.4 * s, 0.8 * s, 0.8 * s, 0, 0, Math.PI * 2);
  ctx.ellipse(-6.2 * s, -42.2 * s, 0.7 * s, 0.7 * s, 0, 0, Math.PI * 2);
  ctx.ellipse(6.2 * s, -42.2 * s, 0.7 * s, 0.7 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function paintHitSpark(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.strokeStyle = "rgba(255,140,32,0.95)";
  ctx.lineWidth = 1.6;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x - 5, y);
  ctx.lineTo(x + 5, y);
  ctx.moveTo(x - 2, y - 3.5);
  ctx.lineTo(x + 2, y + 3);
  ctx.moveTo(x + 2, y - 3.5);
  ctx.lineTo(x - 2, y + 3);
  ctx.stroke();
  ctx.fillStyle = "rgba(255,200,70,0.92)";
  ctx.beginPath();
  ctx.ellipse(x, y, 2.4, 1.7, 0, 0, Math.PI * 2);
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
  const bob = shambleBob(tick, kind);
  const sway = shambleSway(tick, kind);
  const id = foeSpriteId(kind, elite);
  const spr = spriteOf(id);
  const scale = foeWorldScale(kind, spr?.["h"] ?? 32);
  paintShadow(ctx, x, y, 5 * scale, 2.1 * scale);
  blitSheetLean(ctx, id, x, y, flip < 0, bob, sway, scale);
  if (kind !== 2) return;
  const destH = foeWorldH(kind);
  const cx = x;
  const cy = y - destH * 0.28 - bob;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = "rgba(255,96,16,0.95)";
  ctx.beginPath();
  ctx.ellipse(cx, cy, destH * 0.14, destH * 0.16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,220,70,0.95)";
  ctx.beginPath();
  ctx.ellipse(cx, cy, destH * 0.06, destH * 0.07, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
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

export function paintBlood(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, age = 1): void {
  const seed = ((x * 13 + y * 7 + s * 17) | 0);
  const n = 5 + (seed & 3);
  const fade = (0.6 + (seed & 3) * 0.05) * Math.max(0.22, Math.min(1, age));
  const span = 5 + (s & 7);
  ctx.fillStyle = "#4a100e";
  for (let i = 0; i < n; i++) {
    const ox = ((seed + i * 19) % (span * 2 + 1)) - span;
    const oy = ((seed + i * 11) % (span + 3)) - (span >> 1);
    const rw = 2.4 + ((seed + i * 5) % Math.max(3, span >> 1));
    const rh = 1.4 + ((seed + i * 3) % Math.max(2, span >> 2));
    ctx.globalAlpha = fade;
    ctx.beginPath();
    ctx.ellipse(x + ox, y + oy, rw, rh, ((seed + i) % 8) * 0.28, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "#2a0808";
  ctx.fillRect(x + 3 + (seed % 3), y + 1, 2, 1);
  ctx.fillRect(x - 4, y + 3, 1, 2);
  ctx.fillRect(x + 1, y - 3, 1, 1);
  ctx.globalAlpha = 1;
}

export function paintCasing(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(((x * 13 + y * 7) % 12) * 0.22);
  ctx.fillStyle = BRASS_LO;
  ctx.fillRect(0, 0, 2.2, 1);
  ctx.fillStyle = BRASS;
  ctx.fillRect(1.5, 0, 0.7, 1);
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
