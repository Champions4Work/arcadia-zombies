import { hudInk, pixelBox } from "../art/chrome";
import { currentHud, rerollCss } from "../shell/hud-layout";
import { BRASS_HI, INK, IRON } from "../shell/theme";
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
  pixelBox(c, box.x, box.y, box.w, box.h, IRON);
  hudInk(c, "R  REROLL", box.x + box.w / 2, box.y + 10, INK, 1, "center");
  hudInk(c, "R  REROLL", box.x + box.w / 2, box.y + 9, BRASS_HI, 1, "center");
  c.restore();
}
