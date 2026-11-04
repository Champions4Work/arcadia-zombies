import { blitSheet, steamFrame } from "../art/sheet";
import { paintShadow } from "../art/look";
import { BRASS, BRASS_HI, BRASS_LO, DANGER, INK, XP } from "../shell/theme";
import { FEAT_LAMP, groundFeatureAt, groundFeatureCount } from "./ground";

const BUILDINGS = [
  { x: 368, y: 214 },
  { x: 480, y: 212 },
  { x: 592, y: 214 },
];

const BELTS = [
  { x: 296, y: 420, w: 368, vert: 0 },
];

const PIPE_RUNS = [
  { x: 296, y: 232, len: 368, vert: 0 },
];

const BELT_H = 72;
const GLASS_AT = [0.22, 0.5, 0.78];
const VALVE = { x: 424, y: 232 };
const BUILD_SCALE = 1.28;
const TANK_SCALE = 1.2;

const PROPS: { id: string; x: number; y: number }[] = [
  { id: "window_lit", x: 348, y: 196 },
  { id: "window_lit", x: 412, y: 192 },
  { id: "window_lit", x: 476, y: 196 },
  { id: "window_lit", x: 540, y: 192 },
  { id: "lamp", x: 360, y: 208 },
  { id: "lamp", x: 480, y: 204 },
  { id: "lamp", x: 600, y: 208 },
  { id: "crate_stack", x: 332, y: 340 },
  { id: "crate_stack", x: 340, y: 368 },
  { id: "barrel", x: 336, y: 386 },
  { id: "crate", x: 332, y: 428 },
  { id: "valve_steam", x: 334, y: 468 },
  { id: "decal_vent", x: 336, y: 450 },
  { id: "barrel", x: 332, y: 508 },
  { id: "crate_stack", x: 336, y: 548 },
  { id: "pipes_blue_tank", x: 334, y: 596 },
  { id: "crate", x: 332, y: 636 },
  { id: "crate_stack", x: 628, y: 340 },
  { id: "crate_stack", x: 620, y: 368 },
  { id: "barrel", x: 632, y: 386 },
  { id: "crate", x: 628, y: 428 },
  { id: "valve_steam", x: 630, y: 468 },
  { id: "decal_vent", x: 632, y: 450 },
  { id: "barrel", x: 628, y: 508 },
  { id: "crate_stack", x: 632, y: 548 },
  { id: "pipes_blue_tank", x: 630, y: 596 },
  { id: "crate", x: 628, y: 636 },
];

const TANKS = [
  { x: 320, y: 588 },
  { x: 640, y: 588 },
];

const POOLS = [
  { x: 360, y: 208 },
  { x: 480, y: 204 },
  { x: 600, y: 208 },
];

const STEAM_VENTS = [
  { x: 360, y: 226 },
  { x: 424, y: 232 },
  { x: 520, y: 226 },
];

export const YARD_CLEAR = { x0: 352, y0: 318, x1: 608, y1: 638 };
export const PHONE_CAM = { x0: 300, y0: 0, x1: 660, y1: 780 };

function visible(x: number, y: number, camX: number, camY: number, vw: number, vh: number, pad: number): boolean {
  return x >= camX - pad && y >= camY - pad && x <= camX + vw + pad && y <= camY + vh + pad;
}

function lampPool(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  const g = ctx.createRadialGradient(x, y - 10, 2, x, y + 10, 78);
  g.addColorStop(0, "rgba(255,196,110,0.62)");
  g.addColorStop(0.4, "rgba(255,150,56,0.28)");
  g.addColorStop(1, "rgba(10,10,14,0)");
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(x, y + 10, 72, 44, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function lampRay(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.translate(x, y - 6);
  ctx.rotate(-0.38);
  const g = ctx.createLinearGradient(0, 0, 0, -96);
  g.addColorStop(0, "rgba(255,196,110,0.28)");
  g.addColorStop(0.55, "rgba(255,170,70,0.1)");
  g.addColorStop(1, "rgba(255,160,60,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-7, 0);
  ctx.lineTo(9, 0);
  ctx.lineTo(30, -96);
  ctx.lineTo(-24, -96);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function blitScaled(ctx: CanvasRenderingContext2D, id: string, x: number, y: number, sc: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(sc, sc);
  blitSheet(ctx, id, 0, 0);
  ctx.restore();
}

function paintBrickWall(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = "#2a1812";
  ctx.fillRect(296, 168, 368, 68);
  ctx.fillStyle = "#3a2218";
  for (let row = 0; row < 5; row++) {
    const oy = 172 + row * 12;
    const shift = row & 1 ? 10 : 0;
    for (let col = 0; col < 18; col++) {
      ctx.fillRect(300 + col * 20 + shift, oy, 18, 10);
    }
  }
  const panes = [348, 412, 476, 540];
  for (let i = 0; i < panes.length; i++) {
    const px = panes[i] ?? 348;
    ctx.fillStyle = "#6a3a14";
    ctx.fillRect(px - 14, 178, 28, 34);
    ctx.fillStyle = i & 1 ? "#f0b44a" : "#e08a28";
    ctx.fillRect(px - 11, 182, 10, 12);
    ctx.fillRect(px + 1, 182, 10, 12);
    ctx.fillRect(px - 11, 196, 10, 10);
    ctx.fillRect(px + 1, 196, 10, 10);
    blitSheet(ctx, "window_lit", px, 208);
  }
}

function doorPool(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  const g = ctx.createRadialGradient(x, y + 10, 2, x, y + 20, 48);
  g.addColorStop(0, "rgba(255,176,80,0.34)");
  g.addColorStop(0.5, "rgba(255,130,40,0.14)");
  g.addColorStop(1, "rgba(10,10,14,0)");
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(x, y + 20, 40, 24, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function bluePool(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  const g = ctx.createRadialGradient(x, y - 6, 2, x, y, 28);
  g.addColorStop(0, "rgba(90,245,255,0.7)");
  g.addColorStop(0.5, "rgba(40,200,255,0.28)");
  g.addColorStop(1, "rgba(10,10,14,0)");
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(x, y, 22, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  blitSheet(ctx, "blue_glow", x, y - 6);
  ctx.restore();
}

function paintRedValve(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.save();
  ctx.translate(x, y - 6);
  ctx.fillStyle = "#5a1814";
  ctx.beginPath();
  ctx.arc(0, 0, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = DANGER;
  ctx.beginPath();
  ctx.arc(0, 0, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#7a2018";
  ctx.lineWidth = 3.2;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 4, Math.sin(a) * 4);
    ctx.lineTo(Math.cos(a) * 14, Math.sin(a) * 14);
    ctx.stroke();
  }
  ctx.fillStyle = BRASS;
  ctx.beginPath();
  ctx.arc(0, 0, 4.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function paintCrossPipe(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  len: number,
  tick: number,
): void {
  ctx.fillStyle = "#1a120c";
  ctx.fillRect(x, y - 30, len, 60);
  ctx.fillStyle = "#8a5a20";
  ctx.fillRect(x, y - 24, len, 48);
  ctx.fillStyle = "#e0a040";
  ctx.fillRect(x, y - 18, len, 36);
  ctx.fillStyle = "#f0c878";
  ctx.fillRect(x, y - 20, len, 10);
  ctx.fillStyle = "#0a4a52";
  ctx.fillRect(x + 4, y - 8, len - 8, 16);
  ctx.fillStyle = "#7ae0d4";
  ctx.fillRect(x + 4, y - 5, len - 8, 10);
  for (let i = 0; i < GLASS_AT.length; i++) {
    const t = GLASS_AT[i] ?? 0.5;
    const px = x + len * t;
    const pulse = 0.72 + ((tick + i * 7) & 7) * 0.03;
    ctx.fillStyle = "#0a6a72";
    ctx.beginPath();
    ctx.ellipse(px, y, 28, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = `rgba(70,230,255,${pulse})`;
    ctx.beginPath();
    ctx.ellipse(px, y, 24, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(180,255,255,0.95)";
    ctx.beginPath();
    ctx.ellipse(px, y, 14, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = BRASS_HI;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.ellipse(px, y, 28, 12, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  blitScaled(ctx, "pipes_blue_tank", x + 28, y + 22, TANK_SCALE);
  blitScaled(ctx, "pipes_blue_tank", x + len - 28, y + 22, TANK_SCALE);
  paintRedValve(ctx, VALVE.x, VALVE.y);
}

function steamPuff(ctx: CanvasRenderingContext2D, x: number, y: number, tick: number): void {
  const lift = ((tick * 0.35) % 18);
  ctx.save();
  ctx.globalAlpha = 0.28;
  ctx.fillStyle = "#8a9098";
  ctx.beginPath();
  ctx.ellipse(x, y - 6 - lift * 0.2, 10, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.2;
  ctx.beginPath();
  ctx.ellipse(x + 5, y - 16 - lift * 0.25, 8, 11, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function arrow(ctx: CanvasRenderingContext2D, x: number, y: number, ang: number, tick: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.globalAlpha = 0.82 + ((tick >> 1) & 1) * 0.18;
  ctx.beginPath();
  ctx.moveTo(16, 0);
  ctx.lineTo(-7, 8);
  ctx.lineTo(-2, 0);
  ctx.lineTo(-7, -8);
  ctx.closePath();
  ctx.fillStyle = XP;
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.restore();
}

function paintCrossBelt(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  tick: number,
): void {
  ctx.fillStyle = "#14110e";
  ctx.fillRect(x, y - BELT_H * 0.5, w, BELT_H);
  ctx.fillStyle = "#2a2218";
  ctx.fillRect(x, y - BELT_H * 0.42, w, BELT_H * 0.84);
  ctx.strokeStyle = BRASS_LO;
  ctx.lineWidth = 3;
  ctx.strokeRect(x + 1.5, y - BELT_H * 0.5 + 1.5, w - 3, BELT_H - 3);
  const tile = 64;
  const sc = BELT_H / 48;
  for (let s = 0; s < w; s += tile) {
    ctx.save();
    ctx.translate(x + s + 40, y + 12);
    ctx.scale(sc, sc);
    blitSheet(ctx, "conveyor", 0, 0);
    ctx.restore();
  }
  const off = (tick * 2.2) % 28;
  for (let s = off; s < w; s += 28) {
    arrow(ctx, x + s, y, 0, tick);
  }
  const crateT = (tick * 0.9 + w * 0.42) % w;
  const cx = x + crateT;
  const cy = y - 14;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.globalAlpha = 0.78 + ((tick >> 3) & 1) * 0.2;
  blitSheet(ctx, "blue_glow", cx, cy - 8);
  ctx.restore();
  blitScaled(ctx, "crate", cx, cy, 1.35);
}

export function yardPropHits(x0: number, y0: number, x1: number, y1: number): number {
  let n = 0;
  for (const b of BUILDINGS) {
    if (b.x >= x0 && b.x <= x1 && b.y >= y0 && b.y <= y1) n++;
  }
  for (const belt of BELTS) {
    if (belt.x >= x0 && belt.x <= x1 && belt.y >= y0 && belt.y <= y1) n++;
  }
  for (const p of PROPS) {
    if (p.x >= x0 && p.x <= x1 && p.y >= y0 && p.y <= y1) n++;
  }
  for (const pipe of PIPE_RUNS) {
    if (pipe.x >= x0 && pipe.x <= x1 && pipe.y >= y0 && pipe.y <= y1) n++;
  }
  return n;
}

export function paintYardLive(
  ctx: CanvasRenderingContext2D,
  tick: number,
  camX: number,
  camY: number,
  vw: number,
  vh: number,
): void {
  for (const pool of POOLS) {
    if (!visible(pool.x, pool.y, camX, camY, vw, vh, 60)) continue;
    lampPool(ctx, pool.x, pool.y);
    lampRay(ctx, pool.x, pool.y);
  }
  paintBrickWall(ctx);
  for (const run of PIPE_RUNS) {
    if (!visible(run.x, run.y, camX, camY, vw, vh, run.len + 20)) continue;
    paintCrossPipe(ctx, run.x, run.y, run.len, tick);
  }
  for (const b of BUILDINGS) {
    if (!visible(b.x, b.y, camX, camY, vw, vh, 160)) continue;
    doorPool(ctx, b.x, b.y);
    paintShadow(ctx, b.x, b.y, 52, 11);
    blitScaled(ctx, "building_wall_door", b.x, b.y, BUILD_SCALE);
  }
  for (const tank of TANKS) {
    if (!visible(tank.x, tank.y, camX, camY, vw, vh, 50)) continue;
    bluePool(ctx, tank.x, tank.y);
  }
  const n = groundFeatureCount();
  for (let i = 0; i < n; i++) {
    const f = groundFeatureAt(i);
    if (f.kind !== FEAT_LAMP) continue;
    if (!visible(f.x, f.y, camX, camY, vw, vh, 60)) continue;
    blitSheet(ctx, "lamp", f.x, f.y);
  }
  for (const p of PROPS) {
    if (!visible(p.x, p.y, camX, camY, vw, vh, 90)) continue;
    paintShadow(ctx, p.x, p.y, 12, 4);
    blitSheet(ctx, p.id, p.x, p.y);
  }
  for (let i = 0; i < BELTS.length; i++) {
    const belt = BELTS[i];
    if (!belt) continue;
    if (!visible(belt.x, belt.y, camX, camY, vw, vh, 220)) continue;
    paintCrossBelt(ctx, belt.x, belt.y, belt.w, tick);
  }
  for (const vent of STEAM_VENTS) {
    if (!visible(vent.x, vent.y, camX, camY, vw, vh, 40)) continue;
    ctx.save();
    ctx.globalAlpha = 0.55;
    blitSheet(ctx, steamFrame(tick), vent.x, vent.y - 10);
    ctx.restore();
    steamPuff(ctx, vent.x, vent.y, tick);
  }
}

export function paintDoorSpawn(ctx: CanvasRenderingContext2D, x: number, y: number, tick: number): void {
  blitSheet(ctx, "building_wall_door", x, y);
  blitSheet(ctx, "window_lit", x - 26, y - 36);
  blitSheet(ctx, "lamp", x + 34, y - 18);
  ctx.save();
  ctx.globalAlpha = 0.9;
  blitSheet(ctx, "window_lit", x, y + 4);
  ctx.restore();
  ctx.fillStyle = (tick >> 2 & 1) ? "rgba(232,160,48,0.45)" : "rgba(232,160,48,0.2)";
  ctx.fillRect(x - 8, y - 14, 16, 20);
}
