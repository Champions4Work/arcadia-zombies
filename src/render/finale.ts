import { lichHp, lichMaxHp, lichPhase, lichUp, lichX, lichY, RING_N, ringOn, ringX, ringY } from "../sim/finale";
import type { World } from "../sim/types";
import { BRASS, cog, COPPER, font, OUTLINE, PURPLE, roundRect, type Metal } from "./paint";

const EYE = ["#7ad0ff", "#ffb15a", "#e4c0ff"];
const GEM: Metal[] = [BRASS, COPPER, PURPLE];

function diamond(ctx: CanvasRenderingContext2D, x: number, y: number, fill: string): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.PI / 4);
  roundRect(ctx, -3.5, -3.5, 7, 7, 1.2);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = 1.4;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  ctx.restore();
}

function robe(ctx: CanvasRenderingContext2D, x: number, y: number, tick: number): void {
  const sway = Math.sin(tick * 0.08) * 2;
  ctx.beginPath();
  ctx.moveTo(x - 16, y - 18);
  ctx.quadraticCurveTo(x - 22 + sway, y + 8, x - 14, y + 22);
  ctx.lineTo(x + 14, y + 22);
  ctx.quadraticCurveTo(x + 22 - sway, y + 8, x + 16, y - 18);
  ctx.closePath();
  ctx.fillStyle = "#2a1840";
  ctx.fill();
  ctx.lineWidth = 2.4;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - 8, y - 14);
  ctx.lineTo(x, y + 16);
  ctx.lineTo(x + 8, y - 14);
  ctx.fillStyle = "#4a2868";
  ctx.fill();
}

function plate(ctx: CanvasRenderingContext2D, x: number, y: number, text: string): void {
  ctx.font = font(11, 800);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = 3;
  ctx.strokeStyle = OUTLINE;
  ctx.strokeText(text, x, y);
  ctx.fillStyle = "#f6eee2";
  ctx.fillText(text, x, y);
}

export function drawLich(ctx: CanvasRenderingContext2D, w: World): void {
  const phase = lichPhase(w);
  const eye = EYE[phase] ?? EYE[0] ?? "#7ad0ff";
  const metal = GEM[phase] ?? BRASS;
  for (let i = 0; i < RING_N; i++) {
    if (!ringOn(w, i)) continue;
    diamond(ctx, ringX(w, i), ringY(w, i), eye);
  }
  if (!lichUp(w)) return;
  const x = lichX(w);
  const y = lichY(w);
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.beginPath();
  ctx.ellipse(x, y + 24, 26, 8, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#120818";
  ctx.fill();
  ctx.restore();
  robe(ctx, x, y, w.tick);
  cog(ctx, x, y - 46, 16, w.tick * 0.02, metal, 8, phase >= 2);
  ctx.beginPath();
  ctx.arc(x, y - 34, 15, 0, Math.PI * 2);
  ctx.fillStyle = metal.mid;
  ctx.fill();
  ctx.lineWidth = 2.6;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y - 34, 11, 0, Math.PI * 2);
  ctx.fillStyle = "#f7f1e4";
  ctx.fill();
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 1.4;
  ctx.stroke();
  const a = w.tick * 0.05;
  ctx.beginPath();
  ctx.moveTo(x, y - 34);
  ctx.lineTo(x + Math.cos(a) * 7, y - 34 + Math.sin(a) * 7);
  ctx.moveTo(x, y - 34);
  ctx.lineTo(x + Math.cos(a * 0.25) * 4, y - 34 + Math.sin(a * 0.25) * 4);
  ctx.strokeStyle = "#1c120c";
  ctx.lineWidth = 1.6;
  ctx.stroke();
  ctx.fillStyle = eye;
  ctx.beginPath();
  ctx.arc(x - 4.2, y - 36, 2.4, 0, Math.PI * 2);
  ctx.arc(x + 4.2, y - 36, 2.4, 0, Math.PI * 2);
  ctx.fill();
  const frac = lichHp(w) / Math.max(1, lichMaxHp());
  roundRect(ctx, x - 22, y - 68, 44, 7, 3);
  ctx.fillStyle = OUTLINE;
  ctx.fill();
  roundRect(ctx, x - 20, y - 66, Math.max(2, 40 * frac), 3, 1.5);
  ctx.fillStyle = eye;
  ctx.fill();
  plate(ctx, x, y + 36, "CLOCKWORK LICH");
}
