import { H, W } from "../sim/types";
import { HURT_SOFT, reduceMotionOn } from "./motion";

let fog: HTMLCanvasElement | null = null;
let hurt: HTMLCanvasElement | null = null;

function sheet(draw: (ctx: CanvasRenderingContext2D) => void): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d");
  if (ctx) draw(ctx);
  return c;
}

function fogSheet(): HTMLCanvasElement {
  if (fog) return fog;
  fog = sheet((ctx) => {
    const wash = ctx.createLinearGradient(0, 0, 0, H);
    wash.addColorStop(0, "rgba(40,16,28,0.14)");
    wash.addColorStop(0.45, "rgba(28,14,12,0.04)");
    wash.addColorStop(1, "rgba(8,8,14,0.16)");
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, W, H);
    const vig = ctx.createRadialGradient(W / 2, H * 0.5, 70, W / 2, H * 0.5, 280);
    vig.addColorStop(0, "rgba(0,0,0,0)");
    vig.addColorStop(0.55, "rgba(18,10,8,0.18)");
    vig.addColorStop(1, "rgba(6,6,12,0.76)");
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);
  });
  return fog;
}

function hurtSheet(): HTMLCanvasElement {
  if (hurt) return hurt;
  hurt = sheet((ctx) => {
    const g = ctx.createRadialGradient(W / 2, H / 2, 60, W / 2, H / 2, 280);
    g.addColorStop(0, "rgba(160,0,0,0)");
    g.addColorStop(1, "rgba(120,0,0,1)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  });
  return hurt;
}

export function paintVeil(ctx: CanvasRenderingContext2D, vw = W, vh = H): void {
  ctx.drawImage(fogSheet(), 0, 0, vw, vh);
}

export function hurtAlpha(cd: number): number {
  if (cd <= 0) return 0;
  const a = cd / 90;
  const cap = a > 0.4 ? 0.4 : a;
  return reduceMotionOn() ? cap * HURT_SOFT : cap;
}

export function paintHurt(ctx: CanvasRenderingContext2D, cd: number, vw = W, vh = H): void {
  const amt = hurtAlpha(cd);
  if (amt <= 0) return;
  ctx.globalAlpha = amt;
  ctx.drawImage(hurtSheet(), 0, 0, vw, vh);
  ctx.globalAlpha = 1;
}
