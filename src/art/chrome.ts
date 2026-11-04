import { BRASS, BRASS_HI, IRON, PANEL, SOOT } from "../shell/theme";
import { drawPx, measurePx } from "./font";

export function pixelBox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  fill: string = IRON,
  edge: string = BRASS,
): void {
  ctx.fillStyle = edge;
  ctx.fillRect(x | 0, y | 0, w | 0, h | 0);
  ctx.fillStyle = fill;
  ctx.fillRect((x | 0) + 2, (y | 0) + 2, Math.max(0, (w | 0) - 4), Math.max(0, (h | 0) - 4));
}

export function pixelWell(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  pixelBox(ctx, x, y, w, h, SOOT, BRASS);
}

export function hudInk(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string,
  scale = 1,
  align: CanvasTextAlign = "left",
): void {
  drawPx(ctx, text, x, y, color, scale, align);
}

export function fitHudInk(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  max: number,
  color: string,
  align: CanvasTextAlign = "center",
): void {
  let scale = 2;
  while (scale > 1 && measurePx(text, scale) > max) scale -= 1;
  hudInk(ctx, text, x, y, color, scale, align);
}

export function pip(ctx: CanvasRenderingContext2D, x: number, y: number, on: boolean): void {
  ctx.fillStyle = on ? BRASS_HI : PANEL;
  ctx.fillRect(x, y, 4, 4);
  ctx.fillStyle = BRASS;
  ctx.fillRect(x, y, 4, 1);
}
