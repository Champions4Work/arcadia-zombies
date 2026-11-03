import { H, W, type World } from "../sim/types";
import { paintActors, paintBullets, paintFx } from "./actors";
import { drawCards, drawHud } from "./hud";
import { drawSaws, drawShield, drawTesla } from "./progress";
import { LAYER_BACK, LAYER_FRONT, LAYER_HUD, LAYER_MID, paintLayers } from "./plugins";
import { absorbShake, shakePixels } from "./shake";
import { drawStage } from "./stage";

let lastPx = 0;
let lastPy = 0;
let walk = 0;

export function draw(c: CanvasRenderingContext2D, w: World, opts?: { hud?: boolean; shake?: boolean }): void {
  c.imageSmoothingEnabled = true;
  c.imageSmoothingQuality = "high";
  c.lineJoin = "round";
  c.lineCap = "round";
  if (Math.abs(w.px - lastPx) + Math.abs(w.py - lastPy) > 0.2) walk = 8;
  else if (walk > 0) walk--;
  lastPx = w.px;
  lastPy = w.py;
  absorbShake(w.tick, w.events);
  const [sx, sy] = shakePixels(w.tick, opts?.shake !== false);
  c.save();
  if (sx !== 0 || sy !== 0) c.translate(sx, sy);
  drawStage(c, w.tick);
  paintLayers(c, w, LAYER_BACK);
  paintActors(c, w, walk > 0);
  drawSaws(c, w);
  drawShield(c, w);
  paintBullets(c, w);
  drawTesla(c, w);
  paintFx(c, w);
  paintLayers(c, w, LAYER_MID);
  c.restore();
  if (w.hurtCd > 0) {
    const g = c.createRadialGradient(W / 2, H / 2, 60, W / 2, H / 2, 280);
    g.addColorStop(0, "rgba(160,0,0,0)");
    g.addColorStop(1, `rgba(120,0,0,${Math.min(0.4, w.hurtCd / 90)})`);
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);
  }
  paintLayers(c, w, LAYER_FRONT);
  if (w.choosing) {
    c.fillStyle = "rgba(8,6,16,0.42)";
    c.fillRect(0, 0, W, H);
  }
  if (opts?.hud !== false) drawHud(c, w);
  drawCards(c, w);
  if (w.over) {
    c.fillStyle = "rgba(8,4,14,0.5)";
    c.fillRect(0, 0, W, H);
  }
  paintLayers(c, w, LAYER_HUD);
}
