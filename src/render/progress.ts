import { sawAngle, sawRadius } from "../sim/progress";
import { UPG_SAWS, type World } from "../sim/types";
import { drawCards } from "./hud";
import { sawSprite } from "./sprites";

export function drawSaws(c: CanvasRenderingContext2D, w: World): void {
  const n = w.upgrades[UPG_SAWS] ?? 0;
  if (n <= 0) return;
  const spr = sawSprite();
  const rad = sawRadius(w);
  for (let s = 0; s < n; s++) {
    const a = sawAngle(w.tick, s, n);
    c.save();
    c.translate(w.px + Math.cos(a) * rad, w.py + Math.sin(a) * rad);
    c.rotate(w.tick * 0.18 + s);
    c.drawImage(spr, -12, -12, 24, 24);
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
  c.strokeStyle = "rgba(170,230,255,0.45)";
  c.lineWidth = 5;
  c.stroke();
  c.strokeStyle = "#f7fdff";
  c.lineWidth = 1.7;
  c.stroke();
  c.restore();
}

export function drawShield(c: CanvasRenderingContext2D, w: World): void {
  if (w.shield <= 0) return;
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
