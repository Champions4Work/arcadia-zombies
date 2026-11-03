import { ARENA_H, ARENA_W } from "../sim/arena";
import { BRASS, cog, COPPER } from "./paint";
let yard: HTMLCanvasElement | null = null;
function bake(): HTMLCanvasElement {
  if (yard) return yard;
  const c = document.createElement("canvas");
  c.width = ARENA_W;
  c.height = ARENA_H;
  const g = c.getContext("2d");
  yard = c;
  if (!g) return c;
  g.fillStyle = "#241454";
  g.fillRect(0, 0, ARENA_W, 150);
  g.fillStyle = "#e07068";
  g.fillRect(0, 110, ARENA_W, 40);
  g.fillStyle = "#2c3238";
  g.fillRect(0, 150, ARENA_W, ARENA_H - 150);
  for (let y = 168; y < ARENA_H; y += 52) {
    for (let x = 12; x < ARENA_W; x += 68) {
      g.fillStyle = (x + y) & 64 ? "#4a545e" : "#5c6770";
      g.fillRect(x, y, 52, 36);
    }
  }
  return c;
}
export function drawStage(ctx: CanvasRenderingContext2D, tick: number): void {
  ctx.drawImage(bake(), 0, 0);
  cog(ctx, 180, 240, 16, tick * 0.012, BRASS, 8, false);
  cog(ctx, 400, 200, 13, -tick * 0.015, COPPER, 7, false);
}
