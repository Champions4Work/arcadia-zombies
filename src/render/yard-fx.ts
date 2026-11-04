import { blitSheet, steamFrame } from "../art/sheet";
import { paintShadow } from "../art/look";
import { BRASS, BRASS_HI, BRASS_LO, DANGER, INK, XP } from "../shell/theme";
import { ZONE_BOILER, ZONE_BRASS, ZONE_TRAM } from "../sim/zones";
import { FEAT_LAMP, groundFeatureAt, groundFeatureCount } from "./ground";

const BUILDINGS = [
  { x: 368, y: 214 },
  { x: 480, y: 212 },
  { x: 592, y: 214 },
];

const BELTS = [
  { x: 336, y: 188, w: 288, vert: 0 },
  { x: 300, y: 552, w: 360, vert: 0 },
];

const PIPE_RUNS = [
  { x: 296, y: 232, len: 368, vert: 0 },
];

const BELT_H = 36;
const GLASS_AT = [0.22, 0.5, 0.78];
const VALVE = { x: 424, y: 232 };
const VALVE_B = { x: 560, y: 232 };
const BUILD_SCALE = 1.48;
const TANK_SCALE = 1.55;

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
  { id: "crate", x: 344, y: 292 },
  { id: "crate_stack", x: 338, y: 268 },
  { id: "barrel", x: 348, y: 250 },
  { id: "crate", x: 616, y: 292 },
  { id: "crate_stack", x: 622, y: 268 },
  { id: "barrel", x: 612, y: 250 },
];

const FLOOR_DECALS = [
  { id: "decal_grate", x: 400, y: 300 },
  { id: "decal_vent", x: 560, y: 306 },
  { id: "decal_grate", x: 444, y: 372 },
  { id: "decal_vent", x: 516, y: 364 },
  { id: "decal_grate", x: 388, y: 348 },
  { id: "decal_vent", x: 572, y: 344 },
  { id: "decal_grate", x: 430, y: 508 },
  { id: "decal_vent", x: 530, y: 536 },
  { id: "decal_grate", x: 470, y: 604 },
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

const BOILER_BUILDINGS = [
  { x: 360, y: 214 },
  { x: 480, y: 216 },
  { x: 600, y: 214 },
];

const BOILER_BELTS: { x: number; y: number; w: number; vert: number }[] = [];

const BOILER_PIPES: { x: number; y: number; len: number; vert: number }[] = [];

const BOILER_GLOW = [
  { x: 332, y: 340 },
  { x: 628, y: 340 },
  { x: 336, y: 596 },
];

const BOILER_PROPS: { id: string; x: number; y: number }[] = [
  { id: "window_lit", x: 340, y: 196 },
  { id: "window_lit", x: 404, y: 192 },
  { id: "window_lit", x: 468, y: 196 },
  { id: "window_lit", x: 532, y: 192 },
  { id: "window_lit", x: 596, y: 196 },
  { id: "lamp", x: 352, y: 208 },
  { id: "lamp", x: 480, y: 206 },
  { id: "lamp", x: 608, y: 208 },
  { id: "breakable_boiler", x: 332, y: 340 },
  { id: "valve_steam", x: 336, y: 386 },
  { id: "pipes_blue_tank", x: 334, y: 430 },
  { id: "decal_hazard", x: 336, y: 450 },
  { id: "decal_vent", x: 336, y: 478 },
  { id: "barrel", x: 332, y: 508 },
  { id: "valve_steam", x: 334, y: 548 },
  { id: "breakable_boiler", x: 336, y: 596 },
  { id: "crate", x: 332, y: 636 },
  { id: "breakable_boiler", x: 628, y: 340 },
  { id: "valve_steam", x: 630, y: 386 },
  { id: "pipes_blue_tank", x: 630, y: 430 },
  { id: "decal_hazard", x: 632, y: 450 },
  { id: "decal_vent", x: 632, y: 478 },
  { id: "barrel", x: 628, y: 508 },
  { id: "valve_steam", x: 630, y: 548 },
  { id: "breakable_boiler", x: 632, y: 596 },
  { id: "crate", x: 628, y: 636 },
];

const BOILER_TANKS = [
  { x: 320, y: 588 },
  { x: 480, y: 176 },
  { x: 640, y: 588 },
];

const BOILER_POOLS = [
  { x: 352, y: 208 },
  { x: 480, y: 206 },
  { x: 608, y: 208 },
];

const BOILER_STEAM = [
  { x: 332, y: 328 },
  { x: 628, y: 328 },
  { x: 336, y: 584 },
];

const TRAM_BUILDINGS = [
  { x: 340, y: 210 },
  { x: 480, y: 212 },
  { x: 620, y: 210 },
];

const TRAM_BELTS: { x: number; y: number; w: number; vert: number }[] = [];

const TRAM_CARS = [
  { x: 348, y: 500 },
  { x: 612, y: 500 },
];

const TRAM_PIPES: { x: number; y: number; len: number; vert: number }[] = [];

const TRAM_PROPS: { id: string; x: number; y: number }[] = [
  { id: "window_lit", x: 328, y: 188 },
  { id: "window_lit", x: 400, y: 184 },
  { id: "window_lit", x: 480, y: 188 },
  { id: "window_lit", x: 560, y: 184 },
  { id: "window_lit", x: 632, y: 188 },
  { id: "lamp", x: 348, y: 204 },
  { id: "lamp", x: 480, y: 202 },
  { id: "lamp", x: 612, y: 204 },
  { id: "crate_stack", x: 332, y: 340 },
  { id: "crate", x: 336, y: 368 },
  { id: "crate_stack", x: 332, y: 396 },
  { id: "decal_hazard", x: 336, y: 430 },
  { id: "conveyor", x: 334, y: 468 },
  { id: "crate", x: 332, y: 508 },
  { id: "crate_stack", x: 336, y: 548 },
  { id: "lamp", x: 334, y: 596 },
  { id: "crate", x: 332, y: 636 },
  { id: "crate_stack", x: 628, y: 340 },
  { id: "crate", x: 620, y: 368 },
  { id: "crate_stack", x: 628, y: 396 },
  { id: "decal_hazard", x: 632, y: 430 },
  { id: "conveyor", x: 630, y: 468 },
  { id: "crate", x: 628, y: 508 },
  { id: "crate_stack", x: 632, y: 548 },
  { id: "lamp", x: 630, y: 596 },
  { id: "crate", x: 628, y: 636 },
];

const TRAM_TANKS = [
  { x: 320, y: 176 },
  { x: 640, y: 176 },
];

const TRAM_POOLS = [
  { x: 348, y: 204 },
  { x: 480, y: 202 },
  { x: 612, y: 204 },
];

const TRAM_STEAM = [
  { x: 348, y: 488 },
  { x: 612, y: 488 },
];

let yardBound = ZONE_BRASS;

export function bindYard(id: number): void {
  yardBound = id === ZONE_BOILER || id === ZONE_TRAM ? id : ZONE_BRASS;
}

function buildingsOf() {
  if (yardBound === ZONE_BOILER) return BOILER_BUILDINGS;
  if (yardBound === ZONE_TRAM) return TRAM_BUILDINGS;
  return BUILDINGS;
}

function beltsOf() {
  if (yardBound === ZONE_BOILER) return BOILER_BELTS;
  if (yardBound === ZONE_TRAM) return TRAM_BELTS;
  return BELTS;
}

function pipesOf() {
  if (yardBound === ZONE_BOILER) return BOILER_PIPES;
  if (yardBound === ZONE_TRAM) return TRAM_PIPES;
  return PIPE_RUNS;
}

function propsOf() {
  if (yardBound === ZONE_BOILER) return BOILER_PROPS;
  if (yardBound === ZONE_TRAM) return TRAM_PROPS;
  return PROPS;
}

function tanksOf() {
  if (yardBound === ZONE_BOILER) return BOILER_TANKS;
  if (yardBound === ZONE_TRAM) return TRAM_TANKS;
  return TANKS;
}

function poolsOf() {
  if (yardBound === ZONE_BOILER) return BOILER_POOLS;
  if (yardBound === ZONE_TRAM) return TRAM_POOLS;
  return POOLS;
}

function ventsOf() {
  if (yardBound === ZONE_BOILER) return BOILER_STEAM;
  if (yardBound === ZONE_TRAM) return TRAM_STEAM;
  return STEAM_VENTS;
}

function visible(x: number, y: number, camX: number, camY: number, vw: number, vh: number, pad: number): boolean {
  return x >= camX - pad && y >= camY - pad && x <= camX + vw + pad && y <= camY + vh + pad;
}

function lampPool(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  const g = ctx.createRadialGradient(x, y - 6, 2, x, y + 8, 48);
  g.addColorStop(0, "rgba(255,214,140,0.78)");
  g.addColorStop(0.42, "rgba(255,156,54,0.34)");
  g.addColorStop(1, "rgba(10,10,14,0)");
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(x, y + 8, 46, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function skyShafts(ctx: CanvasRenderingContext2D): void {
  const rays = [
    { x: 340, w: 52, lean: 26 },
    { x: 456, w: 68, lean: 6 },
    { x: 572, w: 46, lean: -20 },
  ];
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const ray of rays) {
    const g = ctx.createLinearGradient(ray.x, 148, ray.x + ray.lean, 470);
    g.addColorStop(0, "rgba(255,220,170,0.36)");
    g.addColorStop(0.45, "rgba(255,176,80,0.1)");
    g.addColorStop(1, "rgba(255,150,60,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(ray.x, 148);
    ctx.lineTo(ray.x + ray.w, 148);
    ctx.lineTo(ray.x + ray.w * 0.22 + ray.lean, 470);
    ctx.lineTo(ray.x + ray.lean * 0.25, 470);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function lampRay(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.translate(x, y - 8);
  ctx.rotate(-0.22);
  const g = ctx.createLinearGradient(0, 0, 0, -168);
  g.addColorStop(0, "rgba(255,214,150,0.55)");
  g.addColorStop(0.45, "rgba(255,176,80,0.22)");
  g.addColorStop(1, "rgba(255,160,60,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-8, 0);
  ctx.lineTo(10, 0);
  ctx.lineTo(36, -168);
  ctx.lineTo(-28, -168);
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
  const soot = yardBound === ZONE_BOILER;
  const steel = yardBound === ZONE_TRAM;
  ctx.fillStyle = soot ? "#1a0c08" : steel ? "#141820" : "#2a1812";
  ctx.fillRect(296, 168, 368, 68);
  ctx.fillStyle = soot ? "#4a2414" : steel ? "#2a3844" : "#3a2218";
  for (let row = 0; row < 5; row++) {
    const oy = 172 + row * 12;
    const shift = row & 1 ? 10 : 0;
    for (let col = 0; col < 18; col++) {
      ctx.fillRect(300 + col * 20 + shift, oy, 18, 10);
    }
  }
  const panes = soot ? [340, 404, 468, 532, 596] : steel ? [328, 400, 480, 560, 632] : [348, 412, 476, 540];
  for (let i = 0; i < panes.length; i++) {
    const px = panes[i] ?? 348;
    ctx.fillStyle = soot ? "#7a2a10" : steel ? "#3a4858" : "#6a3a14";
    ctx.fillRect(px - 14, 178, 28, 34);
    ctx.fillStyle = soot
      ? (i & 1 ? "#f8a030" : "#e06018")
      : steel
        ? (i & 1 ? "#c8e8ff" : "#f0c060")
        : (i & 1 ? "#f0b44a" : "#e08a28");
    ctx.fillRect(px - 11, 182, 10, 12);
    ctx.fillRect(px + 1, 182, 10, 12);
    ctx.fillRect(px - 11, 196, 10, 10);
    ctx.fillRect(px + 1, 196, 10, 10);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = i & 1 ? "rgba(255,200,90,0.55)" : "rgba(255,150,50,0.42)";
    ctx.fillRect(px - 11, 182, 22, 24);
    ctx.restore();
    blitSheet(ctx, "window_lit", px, 208);
  }
}

function doorPool(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  const g = ctx.createRadialGradient(x, y + 10, 2, x, y + 20, 48);
  g.addColorStop(0, "rgba(255,176,80,0.25)");
  g.addColorStop(0.5, "rgba(255,130,40,0.12)");
  g.addColorStop(1, "rgba(10,10,14,0)");
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(x, y + 18, 36, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function bluePool(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  const g = ctx.createRadialGradient(x, y - 6, 2, x, y, 42);
  g.addColorStop(0, "rgba(90,245,255,0.82)");
  g.addColorStop(0.45, "rgba(40,200,255,0.36)");
  g.addColorStop(1, "rgba(10,10,14,0)");
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(x, y, 34, 24, 0, 0, Math.PI * 2);
  ctx.fill();
  blitSheet(ctx, "blue_glow", x, y - 6);
  ctx.restore();
}

function paintRedValve(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.save();
  ctx.translate(x, y - 8);
  ctx.fillStyle = "#5a1814";
  ctx.beginPath();
  ctx.arc(0, 0, 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = DANGER;
  ctx.beginPath();
  ctx.arc(0, 0, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#7a2018";
  ctx.lineWidth = 4.2;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 5, Math.sin(a) * 5);
    ctx.lineTo(Math.cos(a) * 19, Math.sin(a) * 19);
    ctx.stroke();
  }
  ctx.fillStyle = BRASS;
  ctx.beginPath();
  ctx.arc(0, 0, 5.4, 0, Math.PI * 2);
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
  ctx.fillRect(x, y - 40, len, 80);
  ctx.fillStyle = "#8a5a20";
  ctx.fillRect(x, y - 34, len, 68);
  ctx.fillStyle = "#e0a040";
  ctx.fillRect(x, y - 26, len, 52);
  ctx.fillStyle = "#f0c878";
  ctx.fillRect(x, y - 28, len, 14);
  ctx.fillStyle = "#0a4a52";
  ctx.fillRect(x + 6, y - 12, len - 12, 24);
  ctx.fillStyle = "#7ae0d4";
  ctx.fillRect(x + 6, y - 8, len - 12, 16);
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = "rgba(90,240,255,0.28)";
  ctx.fillRect(x + 6, y - 6, len - 12, 10);
  ctx.restore();
  for (let i = 0; i < GLASS_AT.length; i++) {
    const t = GLASS_AT[i] ?? 0.5;
    const px = x + len * t;
    const pulse = 0.78 + ((tick + i * 7) & 7) * 0.03;
    ctx.fillStyle = "#0a6a72";
    ctx.beginPath();
    ctx.ellipse(px, y, 36, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = `rgba(70,230,255,${pulse})`;
    ctx.beginPath();
    ctx.ellipse(px, y, 30, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(180,255,255,0.95)";
    ctx.beginPath();
    ctx.ellipse(px, y, 16, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = BRASS_HI;
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.ellipse(px, y, 36, 16, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  blitScaled(ctx, "pipes_blue_tank", x + 28, y + 28, TANK_SCALE);
  blitScaled(ctx, "pipes_blue_tank", x + len - 28, y + 28, TANK_SCALE);
  paintRedValve(ctx, VALVE.x, VALVE.y);
  paintRedValve(ctx, VALVE_B.x, VALVE_B.y);
}

function steamPuff(ctx: CanvasRenderingContext2D, x: number, y: number, tick: number): void {
  const lift = ((tick * 0.28) % 14);
  ctx.save();
  ctx.globalAlpha = 0.16;
  ctx.fillStyle = "#8a9098";
  ctx.beginPath();
  ctx.ellipse(x, y - 4 - lift * 0.16, 7, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.1;
  ctx.beginPath();
  ctx.ellipse(x + 3, y - 12 - lift * 0.2, 5, 8, 0.2, 0, Math.PI * 2);
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
  ctx.fillStyle = "#12161c";
  ctx.fillRect(x, y - BELT_H * 0.5, w, BELT_H);
  ctx.fillStyle = "#1c242c";
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

export const HERO_X = 480;
export const HERO_Y = 320;
export const HERO_R = 120;

function closeToHero(x: number, y: number): boolean {
  const dx = x - HERO_X;
  const dy = y - HERO_Y;
  return dx * dx + dy * dy < HERO_R * HERO_R;
}

export function heroCrowd(): number {
  let n = 0;
  for (const p of propsOf()) {
    if (p.y <= 220) continue;
    if (closeToHero(p.x, p.y)) n++;
  }
  for (const belt of beltsOf()) {
    const x1 = belt.x + belt.w;
    for (let x = belt.x; x <= x1; x += 16) if (closeToHero(x, belt.y)) n++;
  }
  for (const pipe of pipesOf()) {
    if (pipe.y <= 236) continue;
    const x1 = pipe.x + pipe.len;
    for (let x = pipe.x; x <= x1; x += 16) if (closeToHero(x, pipe.y)) n++;
  }
  for (const vent of ventsOf()) if (closeToHero(vent.x, vent.y)) n++;
  for (const tank of tanksOf()) {
    if (tank.y <= 220) continue;
    if (closeToHero(tank.x, tank.y)) n++;
  }
  if (yardBound === ZONE_TRAM) {
    for (const car of TRAM_CARS) if (closeToHero(car.x, car.y)) n++;
  }
  return n;
}

function furnaceGlow(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  const g = ctx.createRadialGradient(x, y - 10, 4, x, y, 64);
  g.addColorStop(0, "rgba(255,150,40,0.62)");
  g.addColorStop(0.45, "rgba(255,90,16,0.24)");
  g.addColorStop(1, "rgba(20,8,0,0)");
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(x, y - 4, 58, 34, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function paintTramCar(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  paintShadow(ctx, x, y, 48, 8);
  blitScaled(ctx, "conveyor", x, y, 1.2);
  blitSheet(ctx, "crate_stack", x - 22, y - 10);
  blitSheet(ctx, "crate_stack", x + 18, y - 10);
  blitSheet(ctx, "window_lit", x - 12, y - 30);
  blitSheet(ctx, "window_lit", x + 14, y - 30);
  blitSheet(ctx, "lamp", x + 30, y - 8);
}

export function yardPropHits(x0: number, y0: number, x1: number, y1: number): number {
  let n = 0;
  for (const b of buildingsOf()) {
    if (b.x >= x0 && b.x <= x1 && b.y >= y0 && b.y <= y1) n++;
  }
  for (const belt of beltsOf()) {
    if (belt.x >= x0 && belt.x <= x1 && belt.y >= y0 && belt.y <= y1) n++;
  }
  for (const p of propsOf()) {
    if (p.x >= x0 && p.x <= x1 && p.y >= y0 && p.y <= y1) n++;
  }
  for (const pipe of pipesOf()) {
    if (pipe.x >= x0 && pipe.x <= x1 && pipe.y >= y0 && pipe.y <= y1) n++;
  }
  if (yardBound === ZONE_TRAM) {
    for (const car of TRAM_CARS) {
      if (car.x >= x0 && car.x <= x1 && car.y >= y0 && car.y <= y1) n++;
    }
  }
  if (yardBound === ZONE_BOILER) {
    for (const glow of BOILER_GLOW) {
      if (glow.x >= x0 && glow.x <= x1 && glow.y >= y0 && glow.y <= y1) n++;
    }
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
  for (const pool of poolsOf()) {
    if (!visible(pool.x, pool.y, camX, camY, vw, vh, 60)) continue;
    lampPool(ctx, pool.x, pool.y);
    lampRay(ctx, pool.x, pool.y);
  }
  paintBrickWall(ctx);
  for (const run of pipesOf()) {
    if (!visible(run.x, run.y, camX, camY, vw, vh, run.len + 20)) continue;
    paintCrossPipe(ctx, run.x, run.y, run.len, tick);
  }
  for (const b of buildingsOf()) {
    if (!visible(b.x, b.y, camX, camY, vw, vh, 160)) continue;
    doorPool(ctx, b.x, b.y);
    paintShadow(ctx, b.x, b.y, 52, 11);
    blitScaled(ctx, "building_wall_door", b.x, b.y, BUILD_SCALE);
  }
  for (const tank of tanksOf()) {
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
  if (yardBound === ZONE_BOILER) {
    for (const glow of BOILER_GLOW) {
      if (!visible(glow.x, glow.y, camX, camY, vw, vh, 80)) continue;
      furnaceGlow(ctx, glow.x, glow.y);
    }
  }
  if (yardBound === ZONE_BRASS) {
    lampPool(ctx, 480, 530);
    for (const decal of FLOOR_DECALS) {
      if (!visible(decal.x, decal.y, camX, camY, vw, vh, 40)) continue;
      blitScaled(ctx, decal.id, decal.x, decal.y, 1.55);
    }
  }
  for (const p of propsOf()) {
    if (!visible(p.x, p.y, camX, camY, vw, vh, 90)) continue;
    paintShadow(ctx, p.x, p.y, 12, 4);
    blitSheet(ctx, p.id, p.x, p.y);
  }
  if (yardBound === ZONE_TRAM) {
    for (const car of TRAM_CARS) {
      if (!visible(car.x, car.y, camX, camY, vw, vh, 90)) continue;
      paintTramCar(ctx, car.x, car.y);
    }
  }
  const belts = beltsOf();
  for (let i = 0; i < belts.length; i++) {
    const belt = belts[i];
    if (!belt) continue;
    if (!visible(belt.x, belt.y, camX, camY, vw, vh, 220)) continue;
    paintCrossBelt(ctx, belt.x, belt.y, belt.w, tick);
  }
  for (const vent of ventsOf()) {
    if (!visible(vent.x, vent.y, camX, camY, vw, vh, 40)) continue;
    ctx.save();
    ctx.globalAlpha = 0.28;
    blitSheet(ctx, steamFrame(tick), vent.x, vent.y - 10);
    ctx.restore();
    steamPuff(ctx, vent.x, vent.y, tick);
  }
  if (yardBound === ZONE_BRASS) skyShafts(ctx);
}

export function paintDoorSpawn(ctx: CanvasRenderingContext2D, x: number, y: number, tick: number): void {
  doorPool(ctx, x, y);
  blitSheet(ctx, "building_wall_door", x, y);
  blitSheet(ctx, "window_lit", x - 26, y - 36);
  blitSheet(ctx, "window_lit", x + 22, y - 34);
  blitSheet(ctx, "lamp", x + 34, y - 18);
  ctx.save();
  ctx.globalAlpha = 0.95;
  blitSheet(ctx, "window_lit", x, y + 4);
  ctx.restore();
  ctx.fillStyle = (tick >> 2 & 1) ? "rgba(255,186,72,0.7)" : "rgba(255,160,48,0.4)";
  ctx.fillRect(x - 10, y - 18, 20, 26);
}
