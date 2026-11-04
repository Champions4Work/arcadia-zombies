import { blitSheet, steamFrame } from "../art/sheet";
import { paintShadow } from "../art/look";
import { XP } from "../shell/theme";
import { FEAT_LAMP, groundFeatureAt, groundFeatureCount } from "./ground";

const BUILDINGS = [
  { x: 96, y: 248 },
  { x: 620, y: 236 },
  { x: 380, y: 168 },
  { x: 240, y: 430 },
];

const BELTS = [
  { x: 220, y: 256, w: 220, vert: 0 },
  { x: 208, y: 200, w: 180, vert: 1 },
  { x: 420, y: 432, w: 240, vert: 0 },
];

function visible(x: number, y: number, camX: number, camY: number, vw: number, vh: number, pad: number): boolean {
  return x >= camX - pad && y >= camY - pad && x <= camX + vw + pad && y <= camY + vh + pad;
}

function lampPool(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  const g = ctx.createRadialGradient(x, y - 8, 4, x, y + 6, 70);
  g.addColorStop(0, "rgba(240,180,64,0.42)");
  g.addColorStop(0.45, "rgba(180,100,24,0.16)");
  g.addColorStop(1, "rgba(16,12,8,0)");
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(x, y + 6, 70, 42, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function arrow(ctx: CanvasRenderingContext2D, x: number, y: number, ang: number, tick: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.globalAlpha = 0.5 + ((tick >> 2) & 1) * 0.4;
  ctx.beginPath();
  ctx.moveTo(7, 0);
  ctx.lineTo(-4, 3.6);
  ctx.lineTo(-1.2, 0);
  ctx.lineTo(-4, -3.6);
  ctx.closePath();
  ctx.fillStyle = XP;
  ctx.fill();
  ctx.restore();
}

export function paintYardLive(
  ctx: CanvasRenderingContext2D,
  tick: number,
  camX: number,
  camY: number,
  vw: number,
  vh: number,
): void {
  for (const b of BUILDINGS) {
    if (!visible(b.x, b.y, camX, camY, vw, vh, 140)) continue;
    paintShadow(ctx, b.x, b.y, 40, 8);
    blitSheet(ctx, "building_wall_door", b.x, b.y);
  }
  const n = groundFeatureCount();
  for (let i = 0; i < n; i++) {
    const f = groundFeatureAt(i);
    if (f.kind !== FEAT_LAMP) continue;
    if (!visible(f.x, f.y, camX, camY, vw, vh, 80)) continue;
    lampPool(ctx, f.x, f.y);
    blitSheet(ctx, "lamp", f.x, f.y);
  }
  for (let i = 0; i < BELTS.length; i++) {
    const belt = BELTS[i];
    if (!belt) continue;
    if (!visible(belt.x, belt.y, camX, camY, vw, vh, 200)) continue;
    blitSheet(ctx, "conveyor", belt.x + belt.w * 0.5, belt.y);
    const ang = belt.vert ? Math.PI / 2 : 0;
    const span = belt.w;
    const off = (tick * 1.4 + i * 20) % 28;
    for (let s = off; s < span; s += 28) {
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
  blitSheet(ctx, steam, 96, 200);
  blitSheet(ctx, steam, 620, 190);
}

export function paintDoorSpawn(ctx: CanvasRenderingContext2D, x: number, y: number, tick: number): void {
  ctx.save();
  ctx.globalAlpha = 0.85;
  blitSheet(ctx, "building_wall_door", x, y + 8);
  ctx.restore();
  ctx.fillStyle = (tick >> 2 & 1) ? "rgba(232,160,48,0.4)" : "rgba(232,160,48,0.18)";
  ctx.fillRect(x - 8, y - 14, 16, 18);
}

