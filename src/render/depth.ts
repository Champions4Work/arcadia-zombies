import { paintShadow } from "../art/look";
import { blitSheet } from "../art/sheet";
import {
  CARGO_LAND, CARGO_RIDE, CARGO_SLIDE, LANE_VENT_N, LANE_X, beltN, beltX, beltY,
  cargoKind, cargoOn, cargoPhase, cargoX, cargoY, lanePropAt, lanePropCount, ventCount, ventX, ventY,
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
  ctx.globalAlpha = 0.55;
  blitSheet(ctx, "decal_hazard", x, y + 10);
  ctx.restore();
}

function paintFeeder(ctx: CanvasRenderingContext2D, w: World, camX: number, camY: number, vw: number, vh: number): void {
  const n = beltN(w);
  for (let i = 0; i < n; i++) {
    const x = beltX(w, i);
    const y = beltY(w, i);
    if (!visible(x, y, camX, camY, vw, vh, 80)) continue;
    ctx.save();
    ctx.translate(x, y);
    if (x >= LANE_X) ctx.scale(-1, 1);
    blitSheet(ctx, "conveyor", 0, 0);
    ctx.restore();
  }
}

function paintCargo(ctx: CanvasRenderingContext2D, w: World, i: number): void {
  const x = cargoX(w, i);
  const y = cargoY(w, i);
  const phase = cargoPhase(w, i);
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.globalAlpha = phase === CARGO_LAND ? 0.86 : 0.58 + ((w.tick >> 2) & 1) * 0.22;
  blitSheet(ctx, "blue_glow", x, y - 8);
  ctx.restore();
  paintShadow(ctx, x, y, 10, 4);
  blitSheet(ctx, cargoKind(w, i) ? "crate_stack" : "crate", x, y);
  if (phase === CARGO_SLIDE || phase === CARGO_RIDE) {
    ctx.save();
    ctx.globalAlpha = 0.8;
    blitSheet(ctx, "blue_glow", x, y - 14);
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
