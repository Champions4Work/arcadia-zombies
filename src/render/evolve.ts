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
  const y = (w.py - 78) | 0;
  px(c, x - 16, y, BRASS, 32, 6);
  for (let i = 0; i < 5; i++) px(c, x - 16 + i * 8, y - 16, i === 2 ? CROWN : BRASS, 5, 18);
  c.fillStyle = ARC;
  c.beginPath();
  c.arc(x, y - 18, 4, 0, Math.PI * 2);
  c.fill();
  const pulse = 0.9 + 0.1 * Math.sin(w.tick * 0.16);
  const halo = c.createRadialGradient(w.px, w.py - 30, 8, w.px, w.py - 30, 44 * pulse);
  halo.addColorStop(0, "rgba(255,220,90,0.38)");
  halo.addColorStop(1, "rgba(255,220,90,0)");
  c.fillStyle = halo;
  c.beginPath();
  c.arc(w.px, w.py - 30, 44 * pulse, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = "rgba(255,220,90,0.95)";
  c.lineWidth = 3.2;
  c.beginPath();
  c.arc(w.px, w.py - 30, 32 * pulse, 0, Math.PI * 2);
  c.stroke();
  c.strokeStyle = "rgba(255,246,192,0.55)";
  c.lineWidth = 1.4;
  c.beginPath();
  c.arc(w.px, w.py - 30, 38 * pulse, 0, Math.PI * 2);
  c.stroke();
  if (w.teslaFlash <= 0) return;
  c.strokeStyle = CROWN;
  c.lineWidth = 4;
  c.beginPath();
  c.arc(w.px, w.py - 30, 40, 0, Math.PI * 2);
  c.stroke();
}

function heart(c: CanvasRenderingContext2D, w: World): void {
  const p = (w.tick % 40) / 40;
  const g = c.createRadialGradient(w.px, w.py - 16, 4, w.px, w.py - 16, 22 + p * 20);
  g.addColorStop(0, "rgba(255,180,90,0.4)");
  g.addColorStop(1, "rgba(255,180,90,0)");
  c.fillStyle = g;
  c.beginPath();
  c.arc(w.px, w.py - 16, 22 + p * 20, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = HEART;
  c.lineWidth = 2.4;
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
  c.lineWidth = hot ? 4 : 2;
  c.beginPath();
  c.arc(w.px, w.py - 24, 34, 0, Math.PI * 2);
  c.stroke();
  for (let i = 0; i < 10; i++) {
    const a = w.tick * 0.04 + i * (Math.PI / 5);
    px(c, w.px + Math.cos(a) * 34 - 3, w.py - 24 + Math.sin(a) * 34 - 3, hot ? EMBER : "#6a3018", 7, 7);
  }
}

function howitzer(c: CanvasRenderingContext2D, w: World): void {
  const x = (w.px + 18) | 0;
  const y = (w.py - 40) | 0;
  const kick = w.tick % 20 < 4 ? 6 : 0;
  px(c, x, y, "#5a3810", 22, 12);
  px(c, x + 16 + kick, y + 3, "#1c120c", 18, 6);
  px(c, x + 4, y + 3, EMBER, 6, 6);
  px(c, x - 4, y - 6, BRASS, 10, 6);
  c.strokeStyle = EMBER;
  c.lineWidth = 3;
  c.globalAlpha = 0.7;
  c.beginPath();
  c.arc(w.px, w.py - 20, 78, -0.7, 0.45);
  c.stroke();
  if (kick) {
    const g = c.createRadialGradient(x + 28, y + 6, 1, x + 28, y + 6, 16);
    g.addColorStop(0, "rgba(255,230,160,0.9)");
    g.addColorStop(1, "rgba(255,80,20,0)");
    c.fillStyle = g;
    c.beginPath();
    c.arc(x + 28, y + 6, 16, 0, Math.PI * 2);
    c.fill();
  }
  c.globalAlpha = 1;
}

function calliope(c: CanvasRenderingContext2D, w: World): void {
  const x = (w.px - 18) | 0;
  const y = (w.py - 78) | 0;
  for (let i = 0; i < 5; i++) {
    const h = 16 + ((w.tick >> 2) + i * 3) % 10;
    px(c, x + i * 7, y - h, i % 2 ? BRASS : "#d4784a", 5, h + 14);
  }
  const p = (w.tick % 28) / 28;
  const ring = c.createRadialGradient(w.px, w.py - 20, 8, w.px, w.py - 20, 24 + p * 70);
  ring.addColorStop(0, "rgba(215,255,246,0.28)");
  ring.addColorStop(1, "rgba(215,255,246,0)");
  c.fillStyle = ring;
  c.beginPath();
  c.arc(w.px, w.py - 20, 24 + p * 70, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = STEAM;
  c.lineWidth = 3;
  c.globalAlpha = 0.85 * (1 - p);
  c.beginPath();
  c.arc(w.px, w.py - 20, 20 + p * 70, 0, Math.PI * 2);
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
