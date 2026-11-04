import { blitSheet, steamFrame } from "../art/sheet";
import { paintShadow } from "../art/look";
import { XP } from "../shell/theme";
import { FEAT_LAMP, groundFeatureAt, groundFeatureCount } from "./ground";

const BUILDINGS = [
  { x: 292, y: 118 },
  { x: 668, y: 118 },
  { x: 268, y: 508 },
  { x: 692, y: 508 },
];

const BELTS = [
  { x: 260, y: 148, w: 90, vert: 0 },
  { x: 258, y: 180, w: 140, vert: 1 },
  { x: 270, y: 580, w: 90, vert: 0 },
  { x: 700, y: 180, w: 140, vert: 1 },
];

const PROPS: { id: string; x: number; y: number }[] = [
  { id: "pipes_blue_tank", x: 292, y: 210 },
  { id: "pipes_blue_tank", x: 668, y: 214 },
  { id: "valve_steam", x: 288, y: 280 },
  { id: "valve_steam", x: 672, y: 286 },
  { id: "crate_stack", x: 276, y: 548 },
  { id: "crate", x: 310, y: 132 },
  { id: "crate_stack", x: 650, y: 132 },
  { id: "crate", x: 680, y: 540 },
  { id: "barrel", x: 300, y: 568 },
  { id: "barrel", x: 660, y: 568 },
  { id: "breakable_boiler", x: 258, y: 400 },
  { id: "breakable_gear_pylon", x: 702, y: 400 },
  { id: "lamp", x: 292, y: 168 },
  { id: "lamp", x: 668, y: 168 },
  { id: "lamp", x: 276, y: 560 },
  { id: "lamp", x: 684, y: 560 },
  { id: "window_lit", x: 276, y: 86 },
  { id: "window_lit", x: 652, y: 86 },
  { id: "window_lit", x: 252, y: 470 },
  { id: "window_lit", x: 708, y: 470 },
];

const POOLS = [
  { x: 292, y: 168 },
  { x: 668, y: 168 },
  { x: 276, y: 560 },
  { x: 684, y: 560 },
  { x: 292, y: 210 },
  { x: 668, y: 214 },
];

export const YARD_CLEAR = { x0: 360, y0: 180, x1: 600, y1: 460 };

function visible(x: number, y: number, camX: number, camY: number, vw: number, vh: number, pad: number): boolean {
  return x >= camX - pad && y >= camY - pad && x <= camX + vw + pad && y <= camY + vh + pad;
}

function lampPool(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  const g = ctx.createRadialGradient(x, y - 16, 2, x, y + 4, 38);
  g.addColorStop(0, "rgba(255,196,80,0.34)");
  g.addColorStop(0.4, "rgba(232,140,48,0.12)");
  g.addColorStop(1, "rgba(10,10,14,0)");
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(x, y + 4, 36, 20, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function arrow(ctx: CanvasRenderingContext2D, x: number, y: number, ang: number, tick: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.globalAlpha = 0.45 + ((tick >> 2) & 1) * 0.28;
  ctx.beginPath();
  ctx.moveTo(7, 0);
  ctx.lineTo(-3.6, 3.2);
  ctx.lineTo(-1, 0);
  ctx.lineTo(-3.6, -3.2);
  ctx.closePath();
  ctx.fillStyle = XP;
  ctx.fill();
  ctx.restore();
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
  }
  const n = groundFeatureCount();
  for (let i = 0; i < n; i++) {
    const f = groundFeatureAt(i);
    if (f.kind !== FEAT_LAMP) continue;
    if (!visible(f.x, f.y, camX, camY, vw, vh, 60)) continue;
    lampPool(ctx, f.x, f.y);
    blitSheet(ctx, "lamp", f.x, f.y);
  }
  for (const b of BUILDINGS) {
    if (!visible(b.x, b.y, camX, camY, vw, vh, 160)) continue;
    paintShadow(ctx, b.x, b.y, 44, 9);
    blitSheet(ctx, "building_wall_door", b.x, b.y);
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
    const midX = belt.vert ? belt.x : belt.x + belt.w * 0.5;
    const midY = belt.vert ? belt.y + belt.w * 0.5 : belt.y;
    ctx.save();
    ctx.translate(midX, midY);
    if (belt.vert) ctx.rotate(Math.PI / 2);
    blitSheet(ctx, "conveyor", 0, 0);
    ctx.restore();
    const ang = belt.vert ? Math.PI / 2 : 0;
    const span = belt.w;
    const off = (tick * 1.4 + i * 20) % 26;
    for (let s = off; s < span; s += 26) {
      const ax = belt.vert ? belt.x : belt.x + s;
      const ay = belt.vert ? belt.y + s : belt.y;
      arrow(ctx, ax, ay, ang, tick);
    }
    const crateT = (tick * 0.9 + i * 40) % span;
    const cx = belt.vert ? belt.x : belt.x + crateT;
    const cy = belt.vert ? belt.y + crateT : belt.y - 8;
    blitSheet(ctx, i & 1 ? "crate_stack" : "crate", cx, cy);
  }
  const steam = steamFrame(tick);
  blitSheet(ctx, steam, 292, 178);
  blitSheet(ctx, steam, 668, 180);
}

export function paintDoorSpawn(ctx: CanvasRenderingContext2D, x: number, y: number, tick: number): void {
  ctx.save();
  ctx.globalAlpha = 0.9;
  blitSheet(ctx, "window_lit", x, y + 4);
  ctx.restore();
  ctx.fillStyle = (tick >> 2 & 1) ? "rgba(232,160,48,0.45)" : "rgba(232,160,48,0.2)";
  ctx.fillRect(x - 6, y - 12, 12, 16);
}
