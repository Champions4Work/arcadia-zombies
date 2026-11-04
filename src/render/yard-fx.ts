import { blitSheet, steamFrame } from "../art/sheet";
import { paintShadow } from "../art/look";
import { INK, XP } from "../shell/theme";
import { BELTS } from "../sim/belts";
import { FEAT_LAMP, groundFeatureAt, groundFeatureCount } from "./ground";

interface YardMark {
  id: string;
  x: number;
  y: number;
}

const BUILDINGS = [
  { x: 360, y: 96 },
  { x: 480, y: 90 },
  { x: 600, y: 96 },
  { x: 348, y: 200 },
  { x: 612, y: 200 },
  { x: 340, y: 300 },
  { x: 620, y: 300 },
  { x: 348, y: 520 },
  { x: 480, y: 528 },
  { x: 612, y: 520 },
];

const PROPS: readonly YardMark[] = [
  { id: "pipes_blue_tank", x: 348, y: 230 },
  { id: "pipes_blue_tank", x: 348, y: 310 },
  { id: "pipes_blue_tank", x: 348, y: 470 },
  { id: "pipes_blue_tank", x: 400, y: 200 },
  { id: "pipes_blue_tank", x: 612, y: 230 },
  { id: "pipes_blue_tank", x: 612, y: 310 },
  { id: "pipes_blue_tank", x: 612, y: 470 },
  { id: "pipes_blue_tank", x: 560, y: 200 },
  { id: "pipes_blue_tank", x: 568, y: 500 },
  { id: "pipes_blue_tank", x: 430, y: 588 },
  { id: "valve_steam", x: 348, y: 270 },
  { id: "valve_steam", x: 348, y: 430 },
  { id: "valve_steam", x: 400, y: 168 },
  { id: "valve_steam", x: 612, y: 270 },
  { id: "valve_steam", x: 612, y: 430 },
  { id: "valve_steam", x: 560, y: 168 },
  { id: "window_lit", x: 354, y: 58 },
  { id: "window_lit", x: 420, y: 52 },
  { id: "window_lit", x: 474, y: 48 },
  { id: "window_lit", x: 526, y: 52 },
  { id: "window_lit", x: 594, y: 58 },
  { id: "window_lit", x: 338, y: 168 },
  { id: "window_lit", x: 338, y: 248 },
  { id: "window_lit", x: 622, y: 168 },
  { id: "window_lit", x: 622, y: 248 },
  { id: "window_lit", x: 406, y: 508 },
  { id: "window_lit", x: 554, y: 508 },
  { id: "crate", x: 338, y: 128 },
  { id: "crate", x: 400, y: 128 },
  { id: "crate", x: 560, y: 128 },
  { id: "crate", x: 400, y: 448 },
  { id: "crate", x: 560, y: 448 },
  { id: "crate", x: 348, y: 580 },
  { id: "crate", x: 612, y: 580 },
  { id: "crate", x: 400, y: 468 },
  { id: "crate", x: 470, y: 556 },
  { id: "crate_stack", x: 600, y: 128 },
  { id: "crate_stack", x: 338, y: 480 },
  { id: "crate_stack", x: 400, y: 520 },
  { id: "crate_stack", x: 560, y: 520 },
  { id: "crate_stack", x: 480, y: 168 },
  { id: "crate_stack", x: 520, y: 476 },
  { id: "crate_stack", x: 500, y: 600 },
  { id: "barrel", x: 338, y: 540 },
  { id: "barrel", x: 400, y: 400 },
  { id: "barrel", x: 560, y: 400 },
  { id: "barrel", x: 622, y: 540 },
  { id: "barrel", x: 360, y: 448 },
  { id: "barrel", x: 600, y: 448 },
  { id: "barrel", x: 448, y: 492 },
  { id: "barrel", x: 392, y: 540 },
  { id: "barrel", x: 538, y: 548 },
  { id: "breakable_boiler", x: 338, y: 400 },
  { id: "breakable_boiler", x: 400, y: 230 },
  { id: "breakable_boiler", x: 560, y: 470 },
  { id: "breakable_gear_pylon", x: 622, y: 400 },
  { id: "breakable_gear_pylon", x: 560, y: 230 },
  { id: "breakable_gear_pylon", x: 400, y: 470 },
  { id: "lamp", x: 370, y: 140 },
  { id: "lamp", x: 480, y: 132 },
  { id: "lamp", x: 610, y: 140 },
  { id: "lamp", x: 338, y: 350 },
  { id: "lamp", x: 400, y: 350 },
  { id: "lamp", x: 560, y: 350 },
  { id: "lamp", x: 622, y: 350 },
  { id: "lamp", x: 360, y: 500 },
  { id: "lamp", x: 600, y: 500 },
  { id: "lamp", x: 420, y: 460 },
  { id: "lamp", x: 500, y: 520 },
  { id: "lamp", x: 560, y: 580 },
  { id: "pipes_blue_tank", x: 340, y: 360 },
  { id: "pipes_blue_tank", x: 340, y: 440 },
  { id: "pipes_blue_tank", x: 620, y: 360 },
  { id: "pipes_blue_tank", x: 620, y: 440 },
  { id: "valve_steam", x: 340, y: 400 },
  { id: "valve_steam", x: 620, y: 400 },
  { id: "window_lit", x: 340, y: 248 },
  { id: "window_lit", x: 620, y: 248 },
  { id: "window_lit", x: 340, y: 560 },
  { id: "window_lit", x: 620, y: 560 },
  { id: "crate", x: 360, y: 620 },
  { id: "barrel", x: 400, y: 612 },
  { id: "crate_stack", x: 560, y: 616 },
  { id: "barrel", x: 600, y: 608 },
  { id: "breakable_boiler", x: 340, y: 580 },
  { id: "breakable_gear_pylon", x: 620, y: 580 },
];

const DECALS: readonly YardMark[] = [
  { id: "decal_vent", x: 400, y: 256 },
  { id: "decal_vent", x: 560, y: 256 },
  { id: "decal_vent", x: 340, y: 250 },
  { id: "decal_vent", x: 620, y: 250 },
  { id: "decal_vent", x: 340, y: 470 },
  { id: "decal_vent", x: 620, y: 470 },
  { id: "decal_vent", x: 440, y: 432 },
  { id: "decal_vent", x: 520, y: 432 },
  { id: "decal_grate", x: 420, y: 300 },
  { id: "decal_grate", x: 540, y: 300 },
  { id: "decal_grate", x: 354, y: 600 },
  { id: "decal_grate", x: 606, y: 600 },
  { id: "decal_hazard", x: 400, y: 300 },
  { id: "decal_hazard", x: 560, y: 300 },
  { id: "decal_hazard", x: 460, y: 248 },
  { id: "decal_hazard", x: 500, y: 248 },
];

const STEAM_VENTS = [
  { x: 348, y: 188 },
  { x: 348, y: 268 },
  { x: 348, y: 348 },
  { x: 348, y: 428 },
  { x: 400, y: 160 },
  { x: 400, y: 256 },
  { x: 560, y: 160 },
  { x: 560, y: 256 },
  { x: 612, y: 188 },
  { x: 612, y: 268 },
  { x: 612, y: 348 },
  { x: 612, y: 428 },
];

const TANKS = PROPS.filter((p) => p.id === "pipes_blue_tank");
const POOLS = PROPS.filter((p) => p.id === "lamp");

export const YARD_CLEAR = { x0: 418, y0: 248, x1: 542, y1: 392 };
export const PHONE_CAM = { x0: 332, y0: 0, x1: 628, y1: 640 };

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

function countIn(
  items: readonly { x: number; y: number }[],
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): number {
  let n = 0;
  for (const item of items) {
    if (item.x >= x0 && item.x <= x1 && item.y >= y0 && item.y <= y1) n++;
  }
  return n;
}

export function yardPropHits(x0: number, y0: number, x1: number, y1: number): number {
  return countIn(BUILDINGS, x0, y0, x1, y1) + countIn(BELTS, x0, y0, x1, y1) + countIn(PROPS, x0, y0, x1, y1);
}

export function yardFillHits(x0: number, y0: number, x1: number, y1: number): number {
  return yardPropHits(x0, y0, x1, y1) + countIn(DECALS, x0, y0, x1, y1) + countIn(STEAM_VENTS, x0, y0, x1, y1);
}

export function yardKindHits(id: string, x0: number, y0: number, x1: number, y1: number): number {
  let n = 0;
  if (id === "building_wall_door") n += countIn(BUILDINGS, x0, y0, x1, y1);
  if (id === "conveyor") n += countIn(BELTS, x0, y0, x1, y1);
  for (const p of PROPS) {
    if (p.id === id && p.x >= x0 && p.x <= x1 && p.y >= y0 && p.y <= y1) n++;
  }
  for (const d of DECALS) {
    if (d.id === id && d.x >= x0 && d.x <= x1 && d.y >= y0 && d.y <= y1) n++;
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
  for (const decal of DECALS) {
    if (!visible(decal.x, decal.y, camX, camY, vw, vh, 40)) continue;
    blitSheet(ctx, decal.id, decal.x, decal.y);
  }
  for (const pool of POOLS) {
    if (!visible(pool.x, pool.y, camX, camY, vw, vh, 60)) continue;
    lampPool(ctx, pool.x, pool.y);
    lampRay(ctx, pool.x, pool.y);
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
  const steam = steamFrame(tick);
  for (const vent of STEAM_VENTS) {
    if (!visible(vent.x, vent.y, camX, camY, vw, vh, 40)) continue;
    steamPuff(ctx, vent.x, vent.y, tick);
    blitSheet(ctx, steam, vent.x, vent.y);
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
