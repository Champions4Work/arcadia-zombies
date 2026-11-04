import { blitSheet, steamFrame } from "../art/sheet";
import { paintShadow } from "../art/look";
import { XP } from "../shell/theme";
import { FEAT_LAMP, groundFeatureAt, groundFeatureCount } from "./ground";

const BUILDINGS = [
  { x: 360, y: 188 },
  { x: 610, y: 200 },
  { x: 400, y: 468 },
  { x: 590, y: 490 },
  { x: 96, y: 248 },
  { x: 240, y: 430 },
];

const BELTS = [
  { x: 350, y: 310, w: 240, vert: 0 },
  { x: 520, y: 210, w: 190, vert: 1 },
  { x: 370, y: 420, w: 220, vert: 0 },
  { x: 220, y: 256, w: 220, vert: 0 },
];

const PROPS: { id: string; x: number; y: number }[] = [
  { id: "pipes_blue_tank", x: 356, y: 286 },
  { id: "pipes_blue_tank", x: 608, y: 348 },
  { id: "valve_steam", x: 404, y: 248 },
  { id: "valve_steam", x: 548, y: 376 },
  { id: "valve_steam", x: 468, y: 176 },
  { id: "crate_stack", x: 428, y: 358 },
  { id: "crate", x: 508, y: 292 },
  { id: "crate", x: 392, y: 404 },
  { id: "crate_stack", x: 562, y: 248 },
  { id: "barrel", x: 448, y: 236 },
  { id: "barrel", x: 534, y: 412 },
  { id: "barrel", x: 412, y: 332 },
  { id: "breakable_boiler", x: 372, y: 352 },
  { id: "breakable_gear_pylon", x: 612, y: 278 },
  { id: "breakable_gear_pylon", x: 424, y: 198 },
  { id: "breakable_boiler", x: 576, y: 388 },
  { id: "lamp", x: 404, y: 304 },
  { id: "lamp", x: 556, y: 318 },
  { id: "lamp", x: 478, y: 196 },
  { id: "lamp", x: 442, y: 442 },
  { id: "lamp", x: 524, y: 178 },
  { id: "window_lit", x: 344, y: 150 },
  { id: "window_lit", x: 594, y: 162 },
  { id: "window_lit", x: 386, y: 430 },
];

const POOLS = [
  { x: 404, y: 304 },
  { x: 556, y: 318 },
  { x: 478, y: 196 },
  { x: 442, y: 442 },
  { x: 524, y: 178 },
  { x: 356, y: 286 },
  { x: 608, y: 348 },
];

function visible(x: number, y: number, camX: number, camY: number, vw: number, vh: number, pad: number): boolean {
  return x >= camX - pad && y >= camY - pad && x <= camX + vw + pad && y <= camY + vh + pad;
}

function lampPool(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, a: number): void {
  const g = ctx.createRadialGradient(x, y - 10, 3, x, y + 8, r);
  g.addColorStop(0, `rgba(255,196,80,${a})`);
  g.addColorStop(0.35, `rgba(232,120,32,${a * 0.45})`);
  g.addColorStop(1, "rgba(16,12,8,0)");
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(x, y + 8, r, r * 0.58, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function arrow(ctx: CanvasRenderingContext2D, x: number, y: number, ang: number, tick: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.globalAlpha = 0.55 + ((tick >> 2) & 1) * 0.4;
  ctx.beginPath();
  ctx.moveTo(8, 0);
  ctx.lineTo(-4, 3.8);
  ctx.lineTo(-1.2, 0);
  ctx.lineTo(-4, -3.8);
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
    if (!visible(pool.x, pool.y, camX, camY, vw, vh, 140)) continue;
    lampPool(ctx, pool.x, pool.y, 118, 0.72);
  }
  const n = groundFeatureCount();
  for (let i = 0; i < n; i++) {
    const f = groundFeatureAt(i);
    if (f.kind !== FEAT_LAMP) continue;
    if (!visible(f.x, f.y, camX, camY, vw, vh, 140)) continue;
    lampPool(ctx, f.x, f.y, 108, 0.64);
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
  blitSheet(ctx, steam, 356, 250);
  blitSheet(ctx, steam, 608, 312);
  blitSheet(ctx, steam, 404, 220);
  blitSheet(ctx, steam, 548, 348);
}

export function paintDoorSpawn(ctx: CanvasRenderingContext2D, x: number, y: number, tick: number): void {
  ctx.save();
  ctx.globalAlpha = 0.9;
  blitSheet(ctx, "window_lit", x, y + 4);
  ctx.restore();
  ctx.fillStyle = (tick >> 2 & 1) ? "rgba(232,160,48,0.45)" : "rgba(232,160,48,0.2)";
  ctx.fillRect(x - 6, y - 12, 12, 16);
}
