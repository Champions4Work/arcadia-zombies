import { ARENA_H, ARENA_W } from "../sim/arena";
import { H, W } from "../sim/types";
import { blitSheet, sheetsReady, steamFrame } from "../art/sheet";
import { eachVentFx, groundZone, paintGround } from "./ground";

const STAGE = 2;
export const CLOCK_X = 240;
export const CLOCK_Y = 78;

let yard: HTMLCanvasElement | null = null;
let yardPacked = 0;
let yardZone = -1;

export function bindStage(id: number): void {
  if (yardZone === id) return;
  yardZone = id;
  yard = null;
}

function drawYard(ctx: CanvasRenderingContext2D): void {
  const sky = ctx.createLinearGradient(0, 0, 0, 180);
  sky.addColorStop(0, "#120820");
  sky.addColorStop(0.35, "#2a1028");
  sky.addColorStop(0.62, "#3a1810");
  sky.addColorStop(1, "#1a100c");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, ARENA_W, 180);
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const rays = ctx.createLinearGradient(ARENA_W * 0.72, 0, ARENA_W * 0.38, 220);
  rays.addColorStop(0, "rgba(255,190,110,0.16)");
  rays.addColorStop(0.4, "rgba(255,140,60,0.05)");
  rays.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = rays;
  ctx.fillRect(0, 0, ARENA_W, 220);
  ctx.restore();
  ctx.fillStyle = "rgba(244,228,210,0.22)";
  for (let i = 0; i < 36; i++) {
    const x = (i * 97) % ARENA_W;
    const y = (i * 41) % 70;
    ctx.globalAlpha = 0.08 + (i % 4) * 0.04;
    ctx.fillRect(x, y, i % 5 === 0 ? 2 : 1.2, i % 5 === 0 ? 2 : 1.2);
  }
  ctx.globalAlpha = 1;
  paintGround(ctx);
}

function background(): HTMLCanvasElement {
  if (!yard) {
    yard = document.createElement("canvas");
    yard.width = ARENA_W * STAGE;
    yard.height = ARENA_H * STAGE;
    const ctx = yard.getContext("2d");
    if (!ctx) return yard;
    ctx.scale(STAGE, STAGE);
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    drawYard(ctx);
  }
  return yard;
}

function ventSteam(ctx: CanvasRenderingContext2D, tick: number, camX: number, camY: number): void {
  eachVentFx(camX, camY, tick, (x, y, _s, t) => {
    ctx.globalAlpha = (1 - t) * 0.55;
    blitSheet(ctx, steamFrame(tick + ((t * 12) | 0)), x, y);
    ctx.globalAlpha = 1;
  });
}

export function drawStageFx(ctx: CanvasRenderingContext2D, tick: number, camX: number, camY: number): void {
  ventSteam(ctx, tick, camX, camY);
}

export function drawYardWindow(ctx: CanvasRenderingContext2D, camX: number, camY: number, vw = W, vh = H): void {
  const z = groundZone();
  if (yardZone !== z) {
    yardZone = z;
    yard = null;
  }
  if (sheetsReady() && yardPacked === 0) {
    yard = null;
    yardPacked = 1;
  }
  const src = background();
  ctx.drawImage(src, camX * STAGE, camY * STAGE, vw * STAGE, vh * STAGE, camX, camY, vw, vh);
}

export function drawStage(ctx: CanvasRenderingContext2D, tick: number, camX = 0, camY = 0): void {
  drawYardWindow(ctx, camX, camY);
  drawStageFx(ctx, tick, camX, camY);
}
