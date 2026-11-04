import { paintShadow } from "../art/look";
import { blitSheet } from "../art/sheet";
import { XP } from "../shell/theme";
import {
  CARGO_LAND, CARGO_RIDE, CARGO_SLIDE, CARGO_UPG, DROP_ALONG, LANE_VENT_N, LANE_X, beltN, beltVert, beltW,
  beltX, beltY, cargoKind, cargoOn, cargoPhase, cargoX, cargoY, lanePropAt, lanePropCount, ventCount, ventX, ventY,
} from "../sim/depth";
import { OB_BARREL, OB_BOILER, OB_CRATE, OB_GEAR } from "../sim/arena";
import { type World } from "../sim/types";
import { LAYER_BACK, LAYER_MID, registerLayer } from "./plugins";

function visible(x: number, y: number, camX: number, camY: number, vw: number, vh: number, pad: number): boolean {
  return x >= camX - pad && y >= camY - pad && x <= camX + vw + pad && y <= camY + vh + pad;
}

function propSprite(kind: number): string {
  if (kind === OB_BOILER) return "breakable_boiler";
  if (kind === OB_GEAR) return "breakable_gear_pylon";
  if (kind === OB_CRATE) return "crate";
  if (kind === OB_BARREL) return "barrel";
  return "crate";
}

function paintLaneVent(ctx: CanvasRenderingContext2D, x: number, y: number, tick: number): void {
  ctx.save();
  ctx.globalAlpha = 0.92;
  blitSheet(ctx, "decal_grate", x, y);
  ctx.globalAlpha = 0.7 + ((tick >> 3) & 1) * 0.18;
  blitSheet(ctx, "decal_vent", x, y);
  ctx.restore();
}

function paintFeeder(ctx: CanvasRenderingContext2D, w: World, camX: number, camY: number, vw: number, vh: number): void {
  const n = beltN(w);
  for (let i = 0; i < n; i++) {
    const x = beltX(w, i);
    const y = beltY(w, i) + (beltVert(w, i) ? DROP_ALONG : 0);
    if (!visible(x, y, camX, camY, vw, vh, 80)) continue;
    const inward = x < LANE_X ? 1 : -1;
    for (let s = 0; s < 3; s++) {
      const tx = x + inward * (28 + s * 36);
      ctx.save();
      ctx.translate(tx, y);
      if (inward < 0) ctx.scale(-1, 1);
      blitSheet(ctx, "conveyor", 0, 0);
      ctx.restore();
    }
  }
}

function paintCargo(ctx: CanvasRenderingContext2D, w: World, i: number): void {
  const x = cargoX(w, i);
  const y = cargoY(w, i);
  const phase = cargoPhase(w, i);
  const upg = cargoKind(w, i) === CARGO_UPG;
  const pulse = 0.62 + ((w.tick >> 2) & 3) * 0.1;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.globalAlpha = phase === CARGO_LAND ? 0.9 : pulse;
  blitSheet(ctx, "blue_glow", x, y - 8);
  if (upg) {
    ctx.globalAlpha = phase === CARGO_LAND ? 0.78 : pulse + 0.12;
    blitSheet(ctx, "blue_glow", x, y - 16);
    const g = ctx.createRadialGradient(x, y - 6, 2, x, y - 6, 42);
    g.addColorStop(0, "rgba(255,228,120,0.72)");
    g.addColorStop(0.45, "rgba(255,196,64,0.28)");
    g.addColorStop(1, "rgba(8,8,12,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(x, y - 6, 38, 28, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  if (phase === CARGO_RIDE) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 0.38 + ((w.tick >> 1) & 1) * 0.14;
    ctx.fillStyle = XP;
    ctx.fillRect(x - 22, y + 10, 44, 6);
    ctx.restore();
  }
  paintShadow(ctx, x, y, 10, 4);
  blitSheet(ctx, upg ? "crate_stack" : "crate", x, y);
  if (phase === CARGO_SLIDE || phase === CARGO_RIDE) {
    ctx.save();
    ctx.globalAlpha = upg ? 0.92 : 0.8;
    blitSheet(ctx, "blue_glow", x, y - 14);
    ctx.restore();
  }
}

function paintRidingCargoBelts(ctx: CanvasRenderingContext2D, w: World, camX: number, camY: number, vw: number, vh: number): void {
  const n = beltN(w);
  for (let b = 0; b < n; b++) {
    if (beltVert(w, b)) continue;
    let riding = false;
    for (let i = 0; i < 2; i++) {
      if (!cargoOn(w, i)) continue;
      if (cargoPhase(w, i) !== CARGO_RIDE) continue;
      if ((cargoY(w, i) - (beltY(w, b) ?? 0)) ** 2 > 4) continue;
      riding = true;
      break;
    }
    if (!riding) continue;
    const x = beltX(w, b);
    const y = beltY(w, b);
    const span = beltW(w, b);
    if (!visible(x, y, camX, camY, vw, vh, span + 40)) continue;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 0.22 + ((w.tick >> 2) & 1) * 0.1;
    ctx.fillStyle = XP;
    ctx.fillRect(x, y - 6, span, 12);
    ctx.restore();
  }
}

function paintLaneProp(ctx: CanvasRenderingContext2D, w: World, slot: number): void {
  const a = w.arena;
  if (!a.obsAlive[slot]) return;
  const x = a.obsX[slot] ?? 0;
  const y = a.obsY[slot] ?? 0;
  paintShadow(ctx, x, y, 12, 4);
  blitSheet(ctx, propSprite(a.obsKind[slot] ?? 0), x, y);
}

function paintDepthFloor(ctx: CanvasRenderingContext2D, w: World): void {
  if (!w.arena) return;
  const camX = w.arena.camX;
  const camY = w.arena.camY;
  const vw = w.arena.viewW;
  const vh = w.arena.viewH;
  const vents = ventCount(w);
  const laneVents = vents < LANE_VENT_N ? vents : LANE_VENT_N;
  for (let i = 0; i < laneVents; i++) {
    const x = ventX(w, i);
    const y = ventY(w, i);
    if (!visible(x, y, camX, camY, vw, vh, 40)) continue;
    paintLaneVent(ctx, x, y, w.tick);
  }
  paintFeeder(ctx, w, camX, camY, vw, vh);
}

function paintDepthLive(ctx: CanvasRenderingContext2D, w: World): void {
  if (!w.arena) return;
  const camX = w.arena.camX;
  const camY = w.arena.camY;
  const vw = w.arena.viewW;
  const vh = w.arena.viewH;
  const n = lanePropCount(w);
  for (let i = 0; i < n; i++) {
    const slot = lanePropAt(w, i);
    if (slot < 0) continue;
    const x = w.arena.obsX[slot] ?? 0;
    const y = w.arena.obsY[slot] ?? 0;
    if (!visible(x, y, camX, camY, vw, vh, 70)) continue;
    paintLaneProp(ctx, w, slot);
  }
  paintRidingCargoBelts(ctx, w, camX, camY, vw, vh);
  for (let i = 0; i < 2; i++) {
    if (!cargoOn(w, i)) continue;
    const x = cargoX(w, i);
    const y = cargoY(w, i);
    if (!visible(x, y, camX, camY, vw, vh, 50)) continue;
    paintCargo(ctx, w, i);
  }
}

registerLayer(LAYER_BACK, paintDepthFloor);
registerLayer(LAYER_MID, paintDepthLive);
