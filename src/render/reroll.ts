import { REROLL_H, REROLL_W, REROLL_X, REROLL_Y } from "../sim/reroll";
import type { World } from "../sim/types";

export function drawReroll(c: CanvasRenderingContext2D, w: World): void {
  if (!w.choosing || w.meta.rerollLeft <= 0) return;
  c.fillStyle = "#3a2a1a";
  c.fillRect(REROLL_X, REROLL_Y, REROLL_W, REROLL_H);
  c.strokeStyle = "#c8963e";
  c.lineWidth = 2;
  c.strokeRect(REROLL_X + 1, REROLL_Y + 1, REROLL_W - 2, REROLL_H - 2);
  c.fillStyle = "#e8c878";
  c.font = "bold 12px monospace";
  c.textAlign = "center";
  c.fillText("R  REROLL", REROLL_X + REROLL_W / 2, REROLL_Y + 23);
  c.textAlign = "left";
}
