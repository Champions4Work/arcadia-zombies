import {
  bellowsOn, briarOn, calliopeOn, crownOn, heartOn, howitzerOn,
} from "../sim/evolve";
import type { World } from "../sim/types";
import { LAYER_MID, registerLayer } from "./plugins";

const BRASS = "#e8c878";
const EMBER = "#ff7a2a";
const CROWN = "#fff3a0";
const ARC = "#7af6ff";
const HEART = "#ffb45a";
const STEAM = "#d7fff6";

function px(c: CanvasRenderingContext2D, x: number, y: number, s: string, w = 1, h = 1): void {
  c.fillStyle = s;
  c.fillRect(x | 0, y | 0, w, h);
}

function crown(c: CanvasRenderingContext2D, w: World): void {
  const x = w.px | 0;
  const y = (w.py - 20) | 0;
  px(c, x - 11, y - 6, BRASS, 22, 4);
  for (let i = 0; i < 5; i++) px(c, x - 11 + i * 5, y - 14, i === 2 ? CROWN : BRASS, 3, 9);
  px(c, x - 2, y - 16, ARC, 4, 4);
  px(c, x - 1, y - 15, "#ffffff", 2, 2);
  if (w.teslaFlash <= 0) return;
  c.strokeStyle = CROWN;
  c.lineWidth = 3;
  c.beginPath();
  c.arc(w.px, w.py, 24, 0, Math.PI * 2);
  c.stroke();
  c.strokeStyle = ARC;
  c.lineWidth = 1;
  c.beginPath();
  c.arc(w.px, w.py, 30, 0, Math.PI * 2);
  c.stroke();
}

function heart(c: CanvasRenderingContext2D, w: World): void {
  const p = (w.tick % 40) / 40;
  c.strokeStyle = HEART;
  c.lineWidth = 2;
  c.globalAlpha = 1 - p;
  c.beginPath();
  c.arc(w.px, w.py, 16 + p * 48, 0, Math.PI * 2);
  c.stroke();
  c.globalAlpha = 1;
  px(c, w.px - 4, w.py - 26, "#d4784a", 8, 8);
  px(c, w.px - 2, w.py - 24, "#fff0c8", 4, 4);
}

export function drawBriar(c: CanvasRenderingContext2D, w: World): void {
  const hot = w.shield > 0;
  c.strokeStyle = hot ? BRASS : "#6a5428";
  c.lineWidth = hot ? 3 : 1;
  c.beginPath();
  c.arc(w.px, w.py, 18, 0, Math.PI * 2);
  c.stroke();
  c.fillStyle = hot ? EMBER : "#6a3018";
  for (let i = 0; i < 8; i++) {
    const a = w.tick * 0.03 + i * (Math.PI / 4);
    px(c, w.px + Math.cos(a) * 18 - 2, w.py + Math.sin(a) * 18 - 2, hot ? EMBER : "#6a3018", 4, 4);
  }
}

function howitzer(c: CanvasRenderingContext2D, w: World): void {
  const x = (w.px + 14) | 0;
  const y = (w.py - 6) | 0;
  const kick = w.tick % 24 < 4 ? 3 : 0;
  px(c, x, y, "#7a5420", 16, 8);
  px(c, x + 12 + kick, y + 2, "#120c08", 10, 4);
  px(c, x + 2, y + 2, EMBER, 4, 4);
  px(c, x - 2, y - 4, BRASS, 6, 4);
  c.strokeStyle = EMBER;
  c.globalAlpha = 0.45;
  c.beginPath();
  c.arc(w.px, w.py, 70, -0.6, 0.6);
  c.stroke();
  c.globalAlpha = 1;
}

function calliope(c: CanvasRenderingContext2D, w: World): void {
  const x = (w.px - 16) | 0;
  const y = (w.py - 28) | 0;
  for (let i = 0; i < 4; i++) {
    const h = 10 + ((w.tick >> 2) + i) % 5;
    px(c, x + i * 4, y - h, i % 2 ? BRASS : "#d4784a", 3, h + 8);
  }
  const p = (w.tick % 28) / 28;
  c.strokeStyle = STEAM;
  c.lineWidth = 2;
  c.globalAlpha = 1 - p;
  c.beginPath();
  c.arc(w.px, w.py, 12 + p * 64, 0, Math.PI * 2);
  c.stroke();
  c.globalAlpha = 0.55;
  c.beginPath();
  c.arc(w.px, w.py, 8 + ((p + 0.45) % 1) * 64, 0, Math.PI * 2);
  c.stroke();
  c.globalAlpha = 1;
}

function slugs(c: CanvasRenderingContext2D, w: World): void {
  const b = w.bullets;
  for (let i = 0; i < b.alive.length; i++) {
    if (!b.alive[i] || (b.hp[i] ?? 0) !== 0) continue;
    const x = b.x[i] ?? 0;
    const y = b.y[i] ?? 0;
    c.save();
    c.translate(x, y);
    c.rotate(Math.atan2(b.vy[i] ?? 0, b.vx[i] || 1));
    c.fillStyle = "#7a4a12";
    c.fillRect(-18, -6, 36, 12);
    c.fillStyle = BRASS;
    c.fillRect(-14, -4, 28, 8);
    c.fillStyle = CROWN;
    c.fillRect(-4, -2, 10, 4);
    c.fillStyle = EMBER;
    c.fillRect(10, -2, 8, 4);
    c.restore();
  }
}

export function drawUnions(c: CanvasRenderingContext2D, w: World): void {
  if (crownOn(w)) crown(c, w);
  if (heartOn(w)) heart(c, w);
  if (briarOn(w)) drawBriar(c, w);
  if (howitzerOn(w)) howitzer(c, w);
  if (calliopeOn(w)) calliope(c, w);
  if (bellowsOn(w)) slugs(c, w);
}

registerLayer(LAYER_MID, drawUnions);
