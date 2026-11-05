import { paintShadow } from "../art/look";

export const BELT_CUBE_SCALE = 1.65;
export const PHONE_CHEVRON_CARGO_DX = 4;
export const PHONE_CHEVRON_CARGO_DY = 30;

export function paintBeltUpgradeCube(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  tick: number,
  upgrade: boolean,
  scale = BELT_CUBE_SCALE,
): void {
  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;
  const side = 18 * scale;
  const top = y - 12 * scale;
  const left = x - side * 0.5;
  const haloR = 26 * scale;
  const glow = ctx.createRadialGradient(x, y - 8 * scale, 0, x, y - 6 * scale, haloR);
  glow.addColorStop(0, "rgba(255,220,110,0.85)");
  glow.addColorStop(0.5, "rgba(240,170,50,0.45)");
  glow.addColorStop(1, "rgba(232,120,32,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y - 6 * scale, haloR, 0, Math.PI * 2);
  ctx.fill();
  paintShadow(ctx, x, y, 8 * scale, 2.5 * scale);
  ctx.fillStyle = upgrade ? "#f0d080" : "#ffe8a8";
  ctx.fillRect(left, top, side, side);
  ctx.fillStyle = upgrade ? "#e86a20" : "#e0a040";
  ctx.fillRect(left + side * 0.55, top + side * 0.1, side * 0.45, side * 0.82);
  ctx.fillStyle = upgrade ? "#a05828" : "#c89840";
  ctx.fillRect(left, top + side * 0.55, side * 0.5, side * 0.42);
  ctx.strokeStyle = "#fff1c2";
  ctx.lineWidth = 1.5 * scale;
  ctx.strokeRect(left, top, side, side);
  ctx.restore();
}
