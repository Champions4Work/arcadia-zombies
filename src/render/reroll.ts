import { currentHud, rerollCss } from "../shell/hud-layout";
import { REROLL_H, REROLL_W, REROLL_X, REROLL_Y } from "../sim/reroll";
import type { World } from "../sim/types";

export function drawReroll(c: CanvasRenderingContext2D, w: World): void {
  if (!w.choosing || w.meta.rerollLeft <= 0) return;
  const layout = currentHud();
  const box = layout ? rerollCss(layout.view) : { x: REROLL_X, y: REROLL_Y, w: REROLL_W, h: REROLL_H };
  c.save();
  if (layout) {
    const dpr = c.canvas.width / Math.max(1, layout.view.w);
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  c.fillStyle = "#3a2a1a";
  c.fillRect(box.x, box.y, box.w, box.h);
  c.strokeStyle = "#c8963e";
  c.lineWidth = 2;
  c.strokeRect(box.x + 1, box.y + 1, box.w - 2, box.h - 2);
  c.fillStyle = "#e8c878";
  c.font = "bold 12px monospace";
  c.textAlign = "center";
  c.fillText("R  REROLL", box.x + box.w / 2, box.y + 23);
  c.textAlign = "left";
  c.restore();
}
