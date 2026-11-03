import {
  CRATE_FALL, DROP_LIVE, fogCover, GEAR_N, gearOn, gearX, gearY, MAP_DROP, MAP_FOG, MAP_GEAR, MAP_LIVE, MAP_VENT,
  MAP_WARN, mapBanner, mapBannerKind, mapKind, mapLabel, mapLife, mapPhase, mapX, mapY, VENT_LIVE, WARN_TICKS,
} from "../sim/map-events";
import { H, W, type World } from "../sim/types";
import { BRASS, cog, font, lit, OUTLINE, roundRect } from "./paint";
import { LAYER_HUD, LAYER_MID, registerLayer } from "./plugins";

function ink(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, color: string): void {
  ctx.font = font(size, 800);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  ctx.lineWidth = 3;
  ctx.strokeStyle = OUTLINE;
  ctx.strokeText(text, x, y);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

function ring(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, width: number): void {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

function reticle(ctx: CanvasRenderingContext2D, x: number, y: number, tick: number, color: string): void {
  const pulse = 18 + (tick % 20);
  ring(ctx, x, y, pulse, color, 3);
  ring(ctx, x, y, 10, color, 2);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tick * 0.05);
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  for (let i = 0; i < 4; i++) {
    ctx.rotate(Math.PI / 2);
    ctx.beginPath();
    ctx.moveTo(22, 0);
    ctx.lineTo(34, 0);
    ctx.stroke();
  }
  ctx.restore();
}

function steam(ctx: CanvasRenderingContext2D, w: World): void {
  if (mapKind(w) !== MAP_VENT) return;
  const x = mapX(w);
  const y = mapY(w);
  if (mapPhase(w) === MAP_WARN) {
    reticle(ctx, x, y, w.tick, "rgba(255,150,40,0.95)");
    return;
  }
  if (mapPhase(w) !== MAP_LIVE) return;
  const age = VENT_LIVE - mapLife(w);
  const span = 28 + age * 1.6;
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = 0.55;
  ctx.beginPath();
  ctx.arc(0, 4, 22 + age * 1.3, 0, Math.PI * 2);
  ctx.fillStyle = "#ff9a32";
  ctx.fill();
  for (let i = 0; i < 6; i++) {
    const t = (age * 0.08 + i * 0.17) % 1;
    ctx.globalAlpha = (1 - t) * 0.9;
    ctx.beginPath();
    ctx.ellipse(Math.sin(i * 1.7 + age * 0.2) * 10, -t * span, 18 + t * 26, 12 + t * 16, 0, 0, Math.PI * 2);
    ctx.fillStyle = i % 2 ? "#fff8ee" : "#ffd27a";
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ring(ctx, 0, 0, 16 + age * 1.4, "#ffe1a8", 4);
  ctx.restore();
}

function airship(ctx: CanvasRenderingContext2D, x: number, y: number, tick: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.ellipse(0, 0, 34, 14, 0, 0, Math.PI * 2);
  const g = ctx.createLinearGradient(-20, -14, 16, 12);
  g.addColorStop(0, "#f6d2e6");
  g.addColorStop(0.5, "#c45a86");
  g.addColorStop(1, "#6e2848");
  ctx.fillStyle = g;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  ctx.fillStyle = BRASS.mid;
  ctx.fillRect(-34, -2, 68, 5);
  roundRect(ctx, -12, 12, 24, 8, 2);
  ctx.fillStyle = BRASS.hi;
  ctx.fill();
  ctx.stroke();
  ctx.save();
  ctx.translate(30, 14);
  ctx.rotate(tick * 0.45);
  ctx.strokeStyle = "#fff4dc";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-5, 0);
  ctx.lineTo(5, 0);
  ctx.moveTo(0, -5);
  ctx.lineTo(0, 5);
  ctx.stroke();
  ctx.restore();
  ctx.restore();
}

function crate(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  roundRect(ctx, x - 16, y - 13, 32, 26, 4);
  ctx.fillStyle = lit(ctx, x - 16, y - 13, 32, 26, BRASS);
  ctx.fill();
  ctx.lineWidth = 2.4;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  ctx.strokeStyle = "#6a3010";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 16, y);
  ctx.lineTo(x + 16, y);
  ctx.moveTo(x, y - 13);
  ctx.lineTo(x, y + 13);
  ctx.stroke();
  ctx.fillStyle = "#d24a3a";
  ctx.fillRect(x - 3, y - 8, 6, 16);
  ctx.fillRect(x - 8, y - 3, 16, 6);
}

function supply(ctx: CanvasRenderingContext2D, w: World): void {
  const kind = mapKind(w);
  if (kind !== MAP_DROP && mapBannerKind(w) !== MAP_DROP) return;
  const phase = mapPhase(w);
  const x = mapX(w);
  const y = mapY(w);
  if (phase === MAP_WARN) {
    const t = 1 - mapLife(w) / WARN_TICKS;
    const left = w.arena.camX;
    const sx = left - 80 + (x - left + 80) * Math.min(1, Math.max(0, t));
    airship(ctx, sx, w.arena.camY + 42, w.tick);
    reticle(ctx, x, y, w.tick, "rgba(255,214,120,0.95)");
    ctx.globalAlpha = 0.35;
    ctx.beginPath();
    ctx.ellipse(x, y + 6, 16, 6, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#1a120c";
    ctx.fill();
    ctx.globalAlpha = 1;
    return;
  }
  if (phase !== MAP_LIVE || kind !== MAP_DROP) return;
  const flown = DROP_LIVE - mapLife(w);
  const sx = x + Math.min(220, flown * 3.2);
  if (sx < w.arena.camX + W + 70) airship(ctx, sx, w.arena.camY + 36, w.tick);
  const fall = Math.min(1, flown / CRATE_FALL);
  const top = w.arena.camY + 40;
  crate(ctx, x, top + (y - top) * fall);
}

function fog(ctx: CanvasRenderingContext2D, w: World): void {
  const cover = fogCover(w);
  if (cover <= 0) return;
  const g = ctx.createRadialGradient(w.px, w.py, 28, w.px, w.py, 240);
  g.addColorStop(0, `rgba(214,224,230,${cover * 0.18})`);
  g.addColorStop(0.4, `rgba(168,180,190,${cover * 0.5})`);
  g.addColorStop(1, `rgba(86,98,110,${cover * 0.78})`);
  ctx.fillStyle = g;
  ctx.fillRect(w.arena.camX, w.arena.camY, W, H);
  ctx.fillStyle = "rgba(232,238,242,0.45)";
  for (let i = 0; i < 6; i++) {
    const x = w.arena.camX + ((i * 90 + w.tick * (0.4 + i * 0.05)) % (W + 80) - 40);
    const y = w.arena.camY + 70 + (i * 37) % 180;
    ctx.beginPath();
    ctx.ellipse(x, y, 46, 16, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function gears(ctx: CanvasRenderingContext2D, w: World): void {
  const phase = mapPhase(w);
  const kind = mapKind(w);
  if (kind === MAP_GEAR && phase === MAP_WARN) {
    const spots = [36, 108, 372, 444];
    for (let i = 0; i < spots.length; i++) {
      const x = w.arena.camX + (spots[i] ?? 0);
      const y = w.arena.camY + 70 + Math.sin(w.tick * 0.09 + i) * 8;
      cog(ctx, x, y, 10, w.tick * 0.06 + i, BRASS, 6, true);
    }
  }
  for (let i = 0; i < GEAR_N; i++) {
    if (!gearOn(w, i)) continue;
    cog(ctx, gearX(w, i), gearY(w, i), 12, w.tick * 0.08 + i, BRASS, 7, true);
  }
}

function banner(ctx: CanvasRenderingContext2D, w: World): void {
  const left = mapBanner(w);
  const kind = mapBannerKind(w);
  if (left <= 0 || kind <= 0 || w.over || w.choosing) return;
  const live = mapPhase(w) === MAP_WARN ? 0 : 1;
  const text = mapLabel(kind, live);
  const bw = 196;
  const bh = 26;
  const x = (W - bw) / 2;
  const y = 124;
  const flash = live === 0 && ((w.tick >> 2) & 1) === 0;
  roundRect(ctx, x, y, bw, bh, 8);
  ctx.fillStyle = OUTLINE;
  ctx.fill();
  roundRect(ctx, x + 2, y + 2, bw - 4, bh - 4, 6);
  ctx.fillStyle = lit(ctx, x, y, bw, bh, BRASS);
  ctx.fill();
  roundRect(ctx, x + 5, y + 5, bw - 10, bh - 10, 4);
  ctx.fillStyle = flash ? "#4a2410" : "#1a2744";
  ctx.fill();
  ink(ctx, text, W / 2, y + bh / 2 + 1, 12, flash ? "#ffb060" : "#fff6df");
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}

function minimapFog(ctx: CanvasRenderingContext2D, w: World): void {
  if (fogCover(w) < 0.5 || w.choosing) return;
  ctx.beginPath();
  ctx.arc(48, 262, 26, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(170,182,192,0.82)";
  ctx.fill();
}

function paintYard(ctx: CanvasRenderingContext2D, w: World): void {
  const kind = mapKind(w);
  if (kind === MAP_VENT) steam(ctx, w);
  if (kind === MAP_DROP || mapBannerKind(w) === MAP_DROP) supply(ctx, w);
  gears(ctx, w);
  if (kind === MAP_FOG) fog(ctx, w);
}

registerLayer(LAYER_MID, paintYard);
registerLayer(LAYER_HUD, (ctx, w) => {
  banner(ctx, w);
  minimapFog(ctx, w);
});
