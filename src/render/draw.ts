import { H, MAX_BULLETS, MAX_ZOMBIES, W, type World } from "../sim/types";
import { paintActors, paintBullets, paintFx, paintPlayer } from "./actors";
import { drawChestGround, drawChestReveal } from "./chestFx";
import { paintArrows, paintDecals, paintProps } from "./arena";
import { shouldBlitHorde } from "./cull";
import { paintFps } from "./fps";
import { drawLich } from "./finale";
import { renderHorde } from "./horde-draw";
import { drawJuice } from "./juice";
import { drawCards, drawHud } from "./hud";
import { drawReroll } from "./reroll";
import { drawSaws, drawShield, drawTesla } from "./progress";
import { LAYER_BACK, LAYER_FRONT, LAYER_HUD, LAYER_MID, paintLayers } from "./plugins";
import "./map-events";
import "./boss";
import { absorbShake, shakePixels } from "./shake";
import { drawStage } from "./stage";

let lastPx = 0;
let lastPy = 0;
let walk = 0;
let yard: HTMLCanvasElement | null = null;

function countAlive(flag: Uint8Array, n: number): number {
  let k = 0;
  for (let i = 0; i < n; i++) if (flag[i]) k++;
  return k;
}

function hordeYard(): HTMLCanvasElement {
  if (yard) return yard;
  const g = document.createElement("canvas");
  g.width = W;
  g.height = H;
  yard = g;
  return g;
}

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
  const horde = shouldBlitHorde(
    countAlive(w.zombies.alive, MAX_ZOMBIES),
    countAlive(w.bullets.alive, MAX_BULLETS),
  );
  const moving = walk > 0;
  const camX = Math.round(w.arena.camX);
  const camY = Math.round(w.arena.camY);
  c.save();
  if (sx !== 0 || sy !== 0) c.translate(sx, sy);
  c.translate(-camX, -camY);
  if (horde) {
    renderHorde(c, w, hordeYard());
    paintDecals(c, w);
    paintProps(c, w);
    paintPlayer(c, w, moving);
    drawSaws(c, w);
    drawShield(c, w);
    drawTesla(c, w);
    paintFx(c, w);
  } else {
    drawStage(c, w.tick);
    paintLayers(c, w, LAYER_BACK);
    paintDecals(c, w);
    paintActors(c, w, moving);
    drawSaws(c, w);
    drawShield(c, w);
    paintBullets(c, w);
    drawTesla(c, w);
    paintFx(c, w);
  }
  drawJuice(c);
  paintLayers(c, w, LAYER_MID);
  drawLich(c, w);
  drawChestGround(c, w);
  c.restore();
  const vig = c.createRadialGradient(W / 2, H * 0.55, 90, W / 2, H * 0.5, 300);
  vig.addColorStop(0, "rgba(0,0,0,0)");
  vig.addColorStop(1, "rgba(16,8,24,0.28)");
  c.fillStyle = vig;
  c.fillRect(0, 0, W, H);
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
  paintArrows(c, w);
  drawCards(c, w);
  drawReroll(c, w);
  drawChestReveal(c, w);
  if (w.over) {
    c.fillStyle = "rgba(8,4,14,0.5)";
    c.fillRect(0, 0, W, H);
  }
  paintLayers(c, w, LAYER_HUD);
  paintFps(c);
}
