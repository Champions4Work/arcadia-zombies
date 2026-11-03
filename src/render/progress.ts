import { briarOn, crownOn, haloOn } from "../sim/evolve";
import { sawAngle, sawCount, sawRadius, sawSpin } from "../sim/progress";
import type { World } from "../sim/types";
import { drawCards } from "./hud";
import "./evolve";
import { sawSprite } from "./sprites";

export function drawSaws(c: CanvasRenderingContext2D, w: World): void {
  const n = sawCount(w);
  if (n <= 0) return;
  const spr = sawSprite();
  const rad = sawRadius(w);
  const halo = haloOn(w);
  const size = halo ? 34 : 24;
  for (let s = 0; s < n; s++) {
    const a = sawAngle(w.tick, s, n, sawSpin(w));
    const x = w.px + Math.cos(a) * rad;
    const y = w.py + Math.sin(a) * rad;
    c.save();
    c.translate(x, y);
    c.rotate(w.tick * (halo ? 0.35 : 0.18) + s);
    if (halo) {
      c.fillStyle = "rgba(255,120,30,0.45)";
      c.beginPath();
      c.arc(0, 0, 18, 0, Math.PI * 2);
      c.fill();
    }
    c.drawImage(spr, -size / 2, -size / 2, size, size);
    c.restore();
  }
}

export function drawTesla(c: CanvasRenderingContext2D, w: World): void {
  if (w.teslaFlash <= 0 || w.teslaN <= 0) return;
  c.save();
  c.lineJoin = "round";
  c.lineCap = "round";
  let px = w.px;
  let py = w.py - 28;
  c.beginPath();
  c.moveTo(px, py);
  for (let i = 0; i < w.teslaN; i++) {
    const zi = w.teslaHit[i] ?? -1;
    if (zi < 0 || zi >= w.zombies.x.length) continue;
    const x = w.zombies.x[zi] ?? px;
    const y = (w.zombies.y[zi] ?? py) - 16;
    c.lineTo((px + x) / 2 + Math.sin(w.tick * 1.7 + i * 2) * 8, (py + y) / 2 + Math.cos(w.tick * 1.3 + i) * 6);
    c.lineTo(x, y);
    px = x;
    py = y;
  }
  const crown = crownOn(w);
  c.strokeStyle = crown ? "rgba(255,214,70,0.7)" : "rgba(170,230,255,0.45)";
  c.lineWidth = crown ? 9 : 5;
  c.stroke();
  c.strokeStyle = crown ? "#fff6c0" : "#f7fdff";
  c.lineWidth = crown ? 3 : 1.7;
  c.stroke();
  c.restore();
}

export function drawShield(c: CanvasRenderingContext2D, w: World): void {
  if (briarOn(w) || w.shield <= 0) return;
  c.save();
  c.translate(w.px, w.py - 16);
  c.rotate(w.tick * 0.02);
  c.strokeStyle = "rgba(255,214,130,0.9)";
  c.lineWidth = 2.2;
  c.beginPath();
  c.ellipse(0, 8, 18, 24, 0, 0, Math.PI * 2);
  c.stroke();
  c.strokeStyle = "rgba(255,255,255,0.55)";
  c.lineWidth = 1.4;
  c.beginPath();
  c.ellipse(-5, 2, 7, 11, -0.5, Math.PI * 0.9, Math.PI * 1.7);
  c.stroke();
  c.restore();
}

export { drawCards };

export function drawProgress(c: CanvasRenderingContext2D, w: World): void {
  drawSaws(c, w);
  drawTesla(c, w);
  drawShield(c, w);
  drawCards(c, w);
}
