import { ARENA_H, ARENA_W } from "../sim/arena";
import { H, W } from "../sim/types";
import { blitSheet, sheetsReady, steamFrame } from "../art/sheet";
import { eachVentFx, paintGround } from "./ground";

const STAGE = 2;
export const CLOCK_X = 240;
export const CLOCK_Y = 78;

let yard: HTMLCanvasElement | null = null;
let yardPacked = 0;

function drawYard(ctx: CanvasRenderingContext2D): void {
  const sky = ctx.createLinearGradient(0, 0, 0, 150);
  sky.addColorStop(0, "#140c18");
  sky.addColorStop(0.45, "#3a1c28");
  sky.addColorStop(0.78, "#8a4030");
  sky.addColorStop(1, "#c86a38");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, ARENA_W, 160);
  ctx.fillStyle = "rgba(255,220,180,0.55)";
  for (let i = 0; i < 36; i++) {
    const x = (i * 97) % ARENA_W;
    const y = (i * 41) % 70;
    ctx.globalAlpha = 0.2 + (i % 4) * 0.08;
    ctx.fillRect(x, y, i % 5 === 0 ? 2 : 1.2, i % 5 === 0 ? 2 : 1.2);
  }
  ctx.globalAlpha = 1;
  paintGround(ctx);
  const sun = ctx.createRadialGradient(520, 20, 6, 420, 80, 280);
  sun.addColorStop(0, "rgba(255,200,96,0.55)");
  sun.addColorStop(0.35, "rgba(255,140,48,0.22)");
  sun.addColorStop(1, "rgba(255,120,32,0)");
  ctx.fillStyle = sun;
  ctx.fillRect(0, 0, ARENA_W, 260);
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
