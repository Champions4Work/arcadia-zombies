import { paintShadow } from "../art/look";
import { blitSheet } from "../art/sheet";
import {
  CARGO_RIDE, CARGO_SLIDE, CARGO_UPG, DROP_ALONG, LANE_VENT_N, LANE_X, beltN, beltVert, beltX, beltY,
  cargoKind, cargoOn, cargoPhase, cargoX, cargoY, lanePropAt, lanePropCount, ventCount, ventX, ventY,
} from "../sim/depth";
import { OB_BARREL, OB_BOILER, OB_CRATE, OB_GEAR } from "../sim/arena";
import { type World } from "../sim/types";
import { LAYER_BACK, LAYER_MID, registerLayer } from "./plugins";
import { paintVentSteam } from "./yard-fx";

function visible(x: number, y: number, camX: number, camY: number, vw: number, vh: number, pad: number): boolean {
  return x >= camX - pad && y >= camY - pad && x <= camX + vw + pad && y <= camY + vh + pad;
}

function blitScaled(ctx: CanvasRenderingContext2D, id: string, x: number, y: number, sc: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(sc, sc);
  blitSheet(ctx, id, 0, 0);
  ctx.restore();
}

function propSprite(kind: number): string {
  if (kind === OB_BOILER) return "breakable_boiler";
  if (kind === OB_GEAR) return "breakable_gear_pylon";
  if (kind === OB_CRATE) return "crate";
  if (kind === OB_BARREL) return "barrel";
  return "crate";
}

function paintLaneVent(ctx: CanvasRenderingContext2D, x: number, y: number, tick: number): void {
  const sc = 1.36;
  ctx.save();
  ctx.globalAlpha = 0.92;
  blitScaled(ctx, "decal_grate", x, y, sc);
  ctx.globalAlpha = 0.7 + ((tick >> 3) & 1) * 0.18;
  blitScaled(ctx, "decal_vent", x, y, sc);
  ctx.restore();
}

function paintFeeder(ctx: CanvasRenderingContext2D, w: World, camX: number, camY: number, vw: number, vh: number): void {
  const n = beltN(w);
  for (let i = 0; i < n; i++) {
    const bx = beltX(w, i);
    const by = beltY(w, i);
    const vert = beltVert(w, i);
    const anchorY = by + (vert ? DROP_ALONG : 0);
    if (!visible(bx, anchorY, camX, camY, vw, vh, 80)) continue;
    if (vert) {
      const pulse = 0.92 + ((w.tick >> 1) & 1) * 0.08;
      for (let s = 0; s < DROP_ALONG; s += 32) {
        if (!visible(bx, by + s, camX, camY, vw, vh, 48)) continue;
        ctx.save();
        ctx.translate(bx, by + s + 16);
        ctx.rotate(Math.PI * 0.5);
        ctx.globalAlpha = pulse;
        ctx.scale(1.08, 1.08);
        blitSheet(ctx, "conveyor", 0, 0);
        ctx.restore();
      }
      continue;
    }
    const inward = bx < LANE_X ? 1 : -1;
    for (let s = 0; s < 3; s++) {
      const tx = bx + inward * (28 + s * 36);
      ctx.save();
      ctx.translate(tx, by);
      if (inward < 0) ctx.scale(-1, 1);
      ctx.globalAlpha = 0.92 + ((w.tick >> 1) & 1) * 0.08;
      blitSheet(ctx, "conveyor", 0, 0);
      ctx.restore();
    }
  }
}

function paintBeltUpgradeCube(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  tick: number,
  upgrade: boolean,
): void {
  const pulse = 0.82 + ((tick >> 2) & 1) * 0.14;
  const glow = ctx.createRadialGradient(x, y - 8, 0, x, y - 6, 24);
  glow.addColorStop(0, upgrade ? "rgba(255,208,96,0.72)" : "rgba(255,220,140,0.66)");
  glow.addColorStop(0.55, "rgba(240,140,40,0.22)");
  glow.addColorStop(1, "rgba(232,120,32,0)");
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.globalAlpha = pulse * 0.58;
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y - 6, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  paintShadow(ctx, x, y, 14, 4);
  ctx.save();
  ctx.translate(x, y - 20);
  const s = 25;
  ctx.fillStyle = upgrade ? "#f0c878" : "#ffe8a8";
  ctx.beginPath();
  ctx.moveTo(0, -s);
  ctx.lineTo(s, -s * 0.5);
  ctx.lineTo(0, 0);
  ctx.lineTo(-s, -s * 0.5);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = upgrade ? "#8a5a20" : "#a05828";
  ctx.beginPath();
  ctx.moveTo(-s, -s * 0.5);
  ctx.lineTo(0, 0);
  ctx.lineTo(0, s);
  ctx.lineTo(-s, s * 0.5);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = upgrade ? "#e86a20" : "#e0a040";
  ctx.beginPath();
  ctx.moveTo(s, -s * 0.5);
  ctx.lineTo(0, 0);
  ctx.lineTo(0, s);
  ctx.lineTo(s, s * 0.5);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#fff1c2";
  ctx.globalAlpha = 0.55 + ((tick >> 3) & 1) * 0.2;
  ctx.beginPath();
  ctx.arc(-s * 0.22, -s * 0.72, s * 0.16, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = "#0c0a08";
  ctx.lineWidth = 1.35;
  ctx.beginPath();
  ctx.moveTo(0, -s);
  ctx.lineTo(s, -s * 0.5);
  ctx.lineTo(0, 0);
  ctx.lineTo(-s, -s * 0.5);
  ctx.closePath();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-s, -s * 0.5);
  ctx.lineTo(0, 0);
  ctx.lineTo(0, s);
  ctx.lineTo(-s, s * 0.5);
  ctx.closePath();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(s, -s * 0.5);
  ctx.lineTo(0, 0);
  ctx.lineTo(0, s);
  ctx.lineTo(s, s * 0.5);
  ctx.closePath();
  ctx.stroke();
  ctx.globalAlpha = 0.72 + ((tick >> 3) & 1) * 0.18;
  ctx.strokeStyle = "#fff1c2";
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(0, -s);
  ctx.lineTo(s, -s * 0.5);
  ctx.lineTo(0, 0);
  ctx.lineTo(-s, -s * 0.5);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function paintCargo(ctx: CanvasRenderingContext2D, w: World, i: number): void {
  const x = cargoX(w, i);
  const y = cargoY(w, i);
  const phase = cargoPhase(w, i);
  const kind = cargoKind(w, i);
  if (phase === CARGO_SLIDE || phase === CARGO_RIDE) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 0.46 + ((w.tick >> 2) & 1) * 0.12;
    const trail = ctx.createRadialGradient(x, y - 9, 0, x, y - 7, 16);
    trail.addColorStop(0, "rgba(255,196,72,0.44)");
    trail.addColorStop(1, "rgba(240,120,32,0)");
    ctx.fillStyle = trail;
    ctx.beginPath();
    ctx.arc(x, y - 7, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  paintBeltUpgradeCube(ctx, x, y, w.tick, kind === CARGO_UPG);
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
    paintVentSteam(ctx, x, y - 6, w.tick, true);
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
