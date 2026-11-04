import { H, MAX_BULLETS, MAX_ZOMBIES, W, type World } from "../sim/types";
import { paintActors, paintBullets, paintFx, paintPlayer } from "./actors";
import { drawChestGround, drawChestReveal } from "./chestFx";
import { paintArrows, paintDecals, paintProps } from "./arena";
import { markCrowdFx } from "./cast-fx";
import { shouldBlitHorde } from "./cull";
import { paintFps } from "./fps";
import { drawLich } from "./finale";
import { renderHorde } from "./horde-draw";
import { drawJuice } from "./juice";
import { drawWarns } from "./warn";
import { drawCards, drawHud } from "./hud";
import { drawReroll } from "./reroll";
import { drawSaws, drawShield, drawTesla } from "./progress";
import { LAYER_BACK, LAYER_FRONT, LAYER_HUD, LAYER_MID, paintLayers } from "./plugins";
import "./map-events";
import "./boss";
import { absorbShake, shakePixels } from "./shake";
import { drawStageFx, drawYardWindow } from "./stage";
import { paintHurt, paintVeil } from "./veil";
import { paintYardLive } from "./yard-fx";

let lastPx = 0;
let lastPy = 0;
let walk = 0;

function countAlive(flag: Uint8Array, n: number): number {
  let k = 0;
  for (let i = 0; i < n; i++) if (flag[i]) k++;
  return k;
}

export function fieldPlan(horde: boolean, viewW = W, viewH = H): { yard: boolean; sprites: boolean } {
  if (horde && viewW === W && viewH === H) return { yard: true, sprites: false };
  return { yard: true, sprites: false };
}

export function draw(c: CanvasRenderingContext2D, w: World, opts?: { hud?: boolean; shake?: boolean }): void {
  c.imageSmoothingEnabled = false;
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
  markCrowdFx(horde);
  const moving = walk > 0;
  const camX = Math.round(w.arena.camX);
  const camY = Math.round(w.arena.camY);
  const viewW = w.arena.viewW || W;
  const viewH = w.arena.viewH || H;
  c.save();
  c.beginPath();
  c.rect(0, 0, viewW, viewH);
  c.clip();
  if (sx !== 0 || sy !== 0) c.translate(sx, sy);
  c.translate(-camX, -camY);
  const plan = fieldPlan(horde, viewW, viewH);
  if (plan.yard) drawYardWindow(c, camX, camY, viewW, viewH);
  paintYardLive(c, w.tick, camX, camY, viewW, viewH);
  if (plan.sprites) {
    renderHorde(c, w);
    drawStageFx(c, w.tick, camX, camY);
    paintDecals(c, w);
    drawWarns(c, w);
    paintProps(c, w);
    paintPlayer(c, w, moving);
    drawSaws(c, w);
    drawShield(c, w);
    drawTesla(c, w);
    paintFx(c, w);
  } else {
    drawStageFx(c, w.tick, camX, camY);
    paintLayers(c, w, LAYER_BACK);
    paintDecals(c, w);
    drawWarns(c, w);
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
  paintVeil(c, viewW, viewH);
  if ((w.ultBlast ?? 0) > 0) {
    const a = Math.min(0.42, (w.ultBlast ?? 0) * 0.03);
    c.fillStyle = `rgba(239,230,212,${a})`;
    c.fillRect(0, 0, viewW, viewH);
  }
  if (w.hurtCd > 0) paintHurt(c, w.hurtCd, viewW, viewH);
  const vig = c.createRadialGradient(viewW * 0.5, viewH * 0.48, viewH * 0.16, viewW * 0.5, viewH * 0.5, viewH * 0.86);
  vig.addColorStop(0, "rgba(0,0,0,0)");
  vig.addColorStop(0.48, "rgba(8,10,16,0.12)");
  vig.addColorStop(0.74, "rgba(6,8,14,0.46)");
  vig.addColorStop(1, "rgba(4,6,12,0.68)");
  c.fillStyle = vig;
  c.fillRect(0, 0, viewW, viewH);
  paintLayers(c, w, LAYER_FRONT);
  if (w.choosing) {
    c.fillStyle = "rgba(8,6,4,0.42)";
    c.fillRect(0, 0, viewW, viewH);
  }
  if (opts?.hud !== false) drawHud(c, w);
  paintArrows(c, w);
  if (w.over) {
    c.fillStyle = "rgba(8,6,4,0.5)";
    c.fillRect(0, 0, viewW, viewH);
  }
  paintLayers(c, w, LAYER_HUD);
  drawCards(c, w);
  drawReroll(c, w);
  drawChestReveal(c, w);
  paintFps(c);
}
