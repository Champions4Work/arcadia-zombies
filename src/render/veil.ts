import { H, W } from "../sim/types";

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
    wash.addColorStop(0, "rgba(48,28,52,0.14)");
    wash.addColorStop(0.42, "rgba(80,40,28,0.04)");
    wash.addColorStop(1, "rgba(16,10,14,0.16)");
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, W, H);
    const vig = ctx.createRadialGradient(W / 2, H * 0.55, 90, W / 2, H * 0.5, 310);
    vig.addColorStop(0, "rgba(0,0,0,0)");
    vig.addColorStop(1, "rgba(16,8,24,0.34)");
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
    g.addColorStop(1, "rgba(120,0,0,0.4)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  });
  return hurt;
}

export function paintVeil(ctx: CanvasRenderingContext2D): void {
  ctx.drawImage(fogSheet(), 0, 0);
}

export function paintHurt(ctx: CanvasRenderingContext2D, amt: number): void {
  if (amt <= 0) return;
  ctx.globalAlpha = amt > 1 ? 1 : amt;
  ctx.drawImage(hurtSheet(), 0, 0);
  ctx.globalAlpha = 1;
}
