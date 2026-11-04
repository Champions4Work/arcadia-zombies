import { blitSheet } from "../art/sheet";
import { paintShadow } from "../art/look";
import { INK, XP } from "../shell/theme";
import { FEAT_LAMP, groundFeatureAt, groundFeatureCount } from "./ground";

const BUILDINGS = [
  { x: 380, y: 100 },
  { x: 500, y: 94 },
  { x: 620, y: 100 },
  { x: 350, y: 200 },
  { x: 610, y: 200 },
  { x: 355, y: 510 },
  { x: 605, y: 510 },
];

const BELTS = [
  { x: 360, y: 168, w: 90, vert: 0 },
  { x: 530, y: 168, w: 90, vert: 0 },
  { x: 348, y: 210, w: 120, vert: 1 },
  { x: 612, y: 210, w: 120, vert: 1 },
];

const PROPS: { id: string; x: number; y: number }[] = [
  { id: "pipes_blue_tank", x: 348, y: 230 },
  { id: "pipes_blue_tank", x: 348, y: 310 },
  { id: "pipes_blue_tank", x: 612, y: 230 },
  { id: "pipes_blue_tank", x: 612, y: 310 },
  { id: "valve_steam", x: 348, y: 270 },
  { id: "valve_steam", x: 612, y: 270 },
  { id: "window_lit", x: 354, y: 58 },
  { id: "window_lit", x: 474, y: 52 },
  { id: "window_lit", x: 594, y: 58 },
  { id: "window_lit", x: 406, y: 62 },
  { id: "window_lit", x: 526, y: 56 },
  { id: "window_lit", x: 338, y: 168 },
  { id: "window_lit", x: 622, y: 168 },
  { id: "crate", x: 338, y: 128 },
  { id: "crate_stack", x: 600, y: 128 },
  { id: "crate_stack", x: 338, y: 480 },
  { id: "crate", x: 600, y: 480 },
  { id: "barrel", x: 338, y: 540 },
  { id: "barrel", x: 622, y: 540 },
  { id: "breakable_boiler", x: 338, y: 400 },
  { id: "crate", x: 338, y: 448 },
  { id: "breakable_gear_pylon", x: 622, y: 400 },
  { id: "barrel", x: 622, y: 448 },
  { id: "lamp", x: 380, y: 140 },
  { id: "lamp", x: 500, y: 132 },
  { id: "lamp", x: 620, y: 140 },
  { id: "lamp", x: 338, y: 350 },
  { id: "lamp", x: 622, y: 350 },
  { id: "lamp", x: 350, y: 500 },
  { id: "lamp", x: 610, y: 500 },
  { id: "crate", x: 400, y: 468 },
  { id: "barrel", x: 448, y: 492 },
  { id: "crate_stack", x: 520, y: 476 },
  { id: "pipes_blue_tank", x: 568, y: 500 },
  { id: "barrel", x: 392, y: 540 },
  { id: "crate", x: 470, y: 556 },
  { id: "barrel", x: 538, y: 548 },
  { id: "pipes_blue_tank", x: 430, y: 588 },
  { id: "crate_stack", x: 500, y: 600 },
  { id: "lamp", x: 420, y: 460 },
  { id: "lamp", x: 500, y: 520 },
  { id: "lamp", x: 560, y: 580 },
];

const TANKS = [
  { x: 348, y: 230 },
  { x: 348, y: 310 },
  { x: 612, y: 230 },
  { x: 612, y: 310 },
  { x: 568, y: 500 },
  { x: 430, y: 588 },
];

const POOLS = [
  { x: 380, y: 140 },
  { x: 500, y: 132 },
  { x: 620, y: 140 },
  { x: 338, y: 350 },
  { x: 622, y: 350 },
  { x: 350, y: 500 },
  { x: 610, y: 500 },
  { x: 420, y: 460 },
  { x: 500, y: 520 },
  { x: 560, y: 580 },
];

const STEAM_VENTS = [
  { x: 348, y: 188 },
  { x: 348, y: 268 },
];

export const YARD_CLEAR = { x0: 368, y0: 188, x1: 588, y1: 428 };
export const PHONE_CAM = { x0: 332, y0: 0, x1: 628, y1: 640 };

function visible(x: number, y: number, camX: number, camY: number, vw: number, vh: number, pad: number): boolean {
  return x >= camX - pad && y >= camY - pad && x <= camX + vw + pad && y <= camY + vh + pad;
}

function lampPool(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  const g = ctx.createRadialGradient(x, y - 10, 2, x, y + 10, 58);
  g.addColorStop(0, "rgba(255,186,96,0.42)");
  g.addColorStop(0.45, "rgba(255,140,48,0.18)");
  g.addColorStop(1, "rgba(10,10,14,0)");
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(x, y + 10, 52, 32, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
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
  const g = ctx.createRadialGradient(x, y - 12, 2, x, y, 84);
  g.addColorStop(0, "rgba(90,245,255,0.96)");
  g.addColorStop(0.4, "rgba(40,200,255,0.55)");
  g.addColorStop(1, "rgba(10,10,14,0)");
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(x, y, 68, 50, 0, 0, Math.PI * 2);
  ctx.fill();
  blitSheet(ctx, "blue_puddle", x, y + 10);
  blitSheet(ctx, "blue_glow", x, y - 8);
  ctx.restore();
}

function steamPuff(ctx: CanvasRenderingContext2D, x: number, y: number, tick: number): void {
  const lift = ((tick * 0.35) % 18);
  ctx.save();
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = "#7a8088";
  ctx.beginPath();
  ctx.ellipse(x, y - 6 - lift * 0.2, 9, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.16;
  ctx.beginPath();
  ctx.ellipse(x + 5, y - 16 - lift * 0.25, 7, 10, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function arrow(ctx: CanvasRenderingContext2D, x: number, y: number, ang: number, tick: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.globalAlpha = 0.82 + ((tick >> 1) & 1) * 0.18;
  ctx.beginPath();
  ctx.moveTo(14, 0);
  ctx.lineTo(-6, 6.5);
  ctx.lineTo(-1.6, 0);
  ctx.lineTo(-6, -6.5);
  ctx.closePath();
  ctx.fillStyle = XP;
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.2;
  ctx.stroke();
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
  for (const b of BUILDINGS) {
    if (!visible(b.x, b.y, camX, camY, vw, vh, 160)) continue;
    doorPool(ctx, b.x, b.y);
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
    const off = (tick * 2.2 + i * 16) % 22;
    for (let s = off; s < span; s += 22) {
      const ax = belt.vert ? belt.x : belt.x + s;
      const ay = belt.vert ? belt.y + s : belt.y;
      arrow(ctx, ax, ay, ang, tick);
    }
    const crateT = (tick * 0.9 + i * 40) % span;
    const cx = belt.vert ? belt.x : belt.x + crateT;
    const cy = belt.vert ? belt.y + crateT : belt.y - 8;
    blitSheet(ctx, i & 1 ? "crate_stack" : "crate", cx, cy);
  }
  for (const vent of STEAM_VENTS) {
    if (!visible(vent.x, vent.y, camX, camY, vw, vh, 40)) continue;
    steamPuff(ctx, vent.x, vent.y, tick);
  }
}

export function paintDoorSpawn(ctx: CanvasRenderingContext2D, x: number, y: number, tick: number): void {
  ctx.save();
  ctx.globalAlpha = 0.9;
  blitSheet(ctx, "window_lit", x, y + 4);
  ctx.restore();
  ctx.fillStyle = (tick >> 2 & 1) ? "rgba(232,160,48,0.45)" : "rgba(232,160,48,0.2)";
  ctx.fillRect(x - 6, y - 12, 12, 16);
}
