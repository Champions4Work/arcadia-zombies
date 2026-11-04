import {
  CRATE_FALL, DROP_LIVE, fogCover, GEAR_N, gearOn, gearX, gearY, MAP_DROP, MAP_FOG, MAP_GEAR, MAP_LIVE, MAP_VENT,
  MAP_WARN, mapBanner, mapBannerKind, mapKind, mapLabel, mapLife, mapPhase, mapX, mapY, VENT_LIVE, WARN_TICKS,
} from "../sim/map-events";
import { H, W, type World } from "../sim/types";
import { paintCrate } from "./cast";
import { paintAura } from "./cast-fx";
import { BRASS, cog, font, OUTLINE, roundRect } from "./paint";
import { LAYER_HUD, LAYER_MID, registerLayer } from "./plugins";
import { puffSprite } from "./sprites";

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
  const puff = puffSprite();
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "#ff9a32";
  ctx.globalAlpha = 0.45;
  ctx.fillRect(-14, -6, 28, 16);
  for (let i = 0; i < 4; i++) {
    const t = (age * 0.08 + i * 0.21) % 1;
    const s = 14 + t * 18;
    ctx.globalAlpha = (1 - t) * 0.7;
    ctx.drawImage(puff, Math.sin(i * 1.7 + age * 0.2) * 8 - s / 2, -t * 36 - s / 2, s, s);
  }
  ctx.globalAlpha = 1;
  ring(ctx, 0, 0, 16 + age * 0.4, "#ffe1a8", 3);
  ctx.restore();
}

function airship(ctx: CanvasRenderingContext2D, x: number, y: number, tick: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.ellipse(0, 0, 34, 14, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#c45a86";
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

function crate(ctx: CanvasRenderingContext2D, x: number, y: number, tick: number): void {
  paintAura(ctx, x, y, 22, tick, "rgba(255,200,90,0.55)", "rgba(210,70,50,0.18)");
  paintCrate(ctx, x, y, 16, 13);
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
  crate(ctx, x, top + (y - top) * fall, w.tick);
}

let fogDisk: HTMLCanvasElement | null = null;

function fogPlate(): HTMLCanvasElement {
  if (fogDisk) return fogDisk;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d");
  if (ctx) {
    const g = ctx.createRadialGradient(W * 0.5, H * 0.5, 28, W * 0.5, H * 0.5, 240);
    g.addColorStop(0, "rgba(214,224,230,0.18)");
    g.addColorStop(0.4, "rgba(168,180,190,0.5)");
    g.addColorStop(1, "rgba(86,98,110,0.78)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }
  fogDisk = c;
  return c;
}

export function fogCoverBox(w: World): { x: number; y: number; w: number; h: number } {
  return { x: w.arena.camX, y: w.arena.camY, w: w.arena.viewW || W, h: w.arena.viewH || H };
}

function fog(ctx: CanvasRenderingContext2D, w: World): void {
  const cover = fogCover(w);
  if (cover <= 0) return;
  const box = fogCoverBox(w);
  ctx.globalAlpha = cover;
  ctx.drawImage(fogPlate(), box.x, box.y, box.w, box.h);
  ctx.fillStyle = "rgba(232,238,242,0.45)";
  for (let i = 0; i < 4; i++) {
    const x = w.arena.camX + ((i * 90 + w.tick * (0.4 + i * 0.05)) % (W + 80) - 40);
    const y = w.arena.camY + 70 + (i * 37) % 180;
    ctx.fillRect(x - 40, y - 10, 80, 20);
  }
  ctx.globalAlpha = 1;
}

function gears(ctx: CanvasRenderingContext2D, w: World): void {
  const phase = mapPhase(w);
  const kind = mapKind(w);
  if (kind === MAP_GEAR && phase === MAP_WARN) {
    const spots = [36, 108, 372, 444];
    for (let i = 0; i < spots.length; i++) {
      const x = w.arena.camX + (spots[i] ?? 0);
      const y = w.arena.camY + 70 + Math.sin(w.tick * 0.09 + i) * 8;
      cog(ctx, x, y, 10, w.tick * 0.06 + i, BRASS, 6, false);
    }
  }
  for (let i = 0; i < GEAR_N; i++) {
    if (!gearOn(w, i)) continue;
    cog(ctx, gearX(w, i), gearY(w, i), 12, w.tick * 0.08 + i, BRASS, 7, false);
  }
}

function banner(ctx: CanvasRenderingContext2D, w: World): void {
  const left = mapBanner(w);
  const kind = mapBannerKind(w);
  if (left <= 0 || kind <= 0 || w.over || w.choosing) return;
  const live = mapPhase(w) === MAP_WARN ? 0 : 1;
  const text = mapLabel(kind, live);
  const bw = 108;
  const bh = 14;
  const x = 8;
  const y = 8;
  const flash = live === 0 && ((w.tick >> 2) & 1) === 0;
  roundRect(ctx, x, y, bw, bh, 4);
  ctx.fillStyle = "#121216";
  ctx.fill();
  ctx.strokeStyle = BRASS.mid;
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ink(ctx, text, x + bw / 2, y + bh / 2 + 1, 9, flash ? "#ffb060" : "#fff6df");
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
