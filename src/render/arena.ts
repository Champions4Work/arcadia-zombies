import {
  ARENA_H, ARENA_W, BARREL_HP, MAX_OBS, OB_BOILER, OB_CRATE, OB_GEAR, OB_PIPE, TELE_LIFE,
  arrowTip, edgePoint, showsArrow,
} from "../sim/arena";
import { lichUp, lichX, lichY } from "../sim/finale";
import { H, MAX_ZOMBIES, W, type World } from "../sim/types";
import { paintCrate, paintHealVial } from "./cast";
import { blob, BRASS, cog, COPPER, type Metal, OUTLINE, pill, rivet, STEEL } from "./paint";
import { puffSprite } from "./sprites";

const WOOD: Metal = { hi: "#f0c48a", mid: "#c48448", lo: "#7a4a22", edge: "#3a2010" };
const SCR = new Float32Array(4);
const PROP_ORDER = new Int16Array(MAX_OBS);

function shadow(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number): void {
  ctx.save();
  ctx.globalAlpha = 0.28;
  ctx.fillStyle = "#1c120c";
  ctx.beginPath();
  ctx.ellipse(x, y + 2, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function boiler(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, tick: number, i: number): void {
  shadow(ctx, x, y + r * 0.35, r * 0.9, r * 0.28);
  blob(ctx, x, y, r, r * 0.92, COPPER, 2.4);
  pill(ctx, x, y - r * 0.62, r * 1.7, 5, 0, BRASS, 1.6);
  pill(ctx, x, y + r * 0.55, r * 1.7, 4, 0, BRASS, 1.6);
  rivet(ctx, x - r * 0.55, y - r * 0.55, 1.8);
  rivet(ctx, x + r * 0.55, y - r * 0.55, 1.8);
  blob(ctx, x, y, r * 0.22, r * 0.22, BRASS, 1.4);
  ctx.beginPath();
  ctx.arc(x, y, r * 0.1, 0, Math.PI * 2);
  ctx.fillStyle = (tick + i * 5) >> 3 & 1 ? "#fff1c2" : "#ff7a2a";
  ctx.fill();
  const puff = (tick + i * 13) % 36;
  ctx.globalAlpha = Math.max(0, 0.55 - puff / 70);
  ctx.drawImage(puffSprite(), x - 8, y - r - 10 - puff * 0.45, 16, 16);
  ctx.globalAlpha = 1;
}

function crate(ctx: CanvasRenderingContext2D, x: number, y: number, hw: number, hh: number): void {
  paintCrate(ctx, x, y, hw, hh);
}

function pipe(ctx: CanvasRenderingContext2D, x: number, y: number, hw: number, hh: number): void {
  const hor = hw >= hh;
  shadow(ctx, x, y + (hor ? hh : hh * 0.4), hor ? hw * 0.85 : hw * 0.7, hor ? hh * 0.45 : hh * 0.2);
  if (hor) {
    pill(ctx, x, y, hw * 2, hh * 1.6, 0, STEEL, 2);
    pill(ctx, x - hw + 3, y, 8, hh * 2.1, 0, BRASS, 1.6);
    pill(ctx, x + hw - 3, y, 8, hh * 2.1, 0, BRASS, 1.6);
  } else {
    pill(ctx, x, y, hw * 1.6, hh * 2, 0, STEEL, 2);
    pill(ctx, x, y - hh + 3, hw * 2.1, 8, 0, BRASS, 1.6);
    pill(ctx, x, y + hh - 3, hw * 2.1, 8, 0, BRASS, 1.6);
  }
}

function gearPile(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, tick: number, i: number): void {
  shadow(ctx, x, y + r * 0.45, r, r * 0.28);
  cog(ctx, x - r * 0.28, y + r * 0.08, r * 0.72, tick * 0.01 + i, BRASS, 7, false);
  cog(ctx, x + r * 0.32, y - r * 0.12, r * 0.58, -tick * 0.013, COPPER, 6, false);
}

function barrel(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, hp: number, tick: number): void {
  shadow(ctx, x, y + r * 0.55, r * 0.85, r * 0.28);
  blob(ctx, x, y, r, r * 1.05, WOOD, 2.2);
  pill(ctx, x, y - r * 0.35, r * 1.85, 3.5, 0, BRASS, 1.4);
  pill(ctx, x, y + r * 0.4, r * 1.85, 3.5, 0, BRASS, 1.4);
  ctx.strokeStyle = "#8ed43a";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(x - 3, y - r + 2);
  ctx.lineTo(x + 3, y - r + 2);
  ctx.moveTo(x, y - r - 1);
  ctx.lineTo(x, y - r + 5);
  ctx.stroke();
  if (hp < BARREL_HP) {
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x - 2, y - r * 0.2);
    ctx.lineTo(x + 1, y + r * 0.15);
    ctx.lineTo(x - 1, y + r * 0.45);
    ctx.stroke();
  }
  if ((tick >> 4 & 1) && hp === BARREL_HP) {
    ctx.fillStyle = "#eaffb0";
    ctx.fillRect(x + r * 0.2, y - r * 0.2, 2, 2);
  }
}

export function paintProp(ctx: CanvasRenderingContext2D, w: World, i: number): void {
  const a = w.arena;
  const x = a.obsX[i] ?? 0;
  const y = a.obsY[i] ?? 0;
  const kind = a.obsKind[i] ?? 0;
  const hw = a.obsHW[i] ?? 8;
  const hh = a.obsHH[i] ?? 8;
  const r = a.obsR[i] ?? 0;
  if (kind === OB_BOILER) boiler(ctx, x, y, r || 16, w.tick, i);
  else if (kind === OB_CRATE) crate(ctx, x, y, hw, hh);
  else if (kind === OB_PIPE) pipe(ctx, x, y, hw, hh);
  else if (kind === OB_GEAR) gearPile(ctx, x, y, r || 13, w.tick, i);
  else barrel(ctx, x, y, r || 9, a.obsHp[i] ?? 1, w.tick);
}

export function paintProps(ctx: CanvasRenderingContext2D, w: World): void {
  const a = w.arena;
  let n = 0;
  for (let i = 0; i < a.obsN; i++) if (a.obsAlive[i]) PROP_ORDER[n++] = i;
  for (let i = 1; i < n; i++) {
    const id = PROP_ORDER[i] ?? 0;
    const y = a.obsY[id] ?? 0;
    let j = i;
    while (j > 0 && (a.obsY[PROP_ORDER[j - 1] ?? 0] ?? 0) > y) {
      PROP_ORDER[j] = PROP_ORDER[j - 1] ?? 0;
      j--;
    }
    PROP_ORDER[j] = id;
  }
  for (let i = 0; i < n; i++) paintProp(ctx, w, PROP_ORDER[i] ?? 0);
}

function heal(ctx: CanvasRenderingContext2D, x: number, y: number, tick: number, i: number): void {
  paintHealVial(ctx, x, y, tick, i);
}

function telegraph(ctx: CanvasRenderingContext2D, w: World, i: number): void {
  const a = w.arena;
  edgePoint(a.camX, a.camY, a.teleEdge[i] ?? 0, a.teleU[i] ?? 0.5, SCR);
  const x = SCR[0] ?? 0;
  const y = SCR[1] ?? 0;
  const left = a.teleLeft[i] ?? 0;
  const p = 1 - left / TELE_LIFE;
  const blink = (w.tick >> 2 & 1) === 1;
  const hot = blink ? "#fff1c2" : "#ff7a2a";
  ctx.save();
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = "#140804";
  ctx.beginPath();
  ctx.ellipse(x, y + 2, 16, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = hot;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(x - 14, y);
  ctx.lineTo(x + 14, y);
  ctx.moveTo(x, y - 12);
  ctx.lineTo(x, y + 10);
  ctx.stroke();
  const rad = 18 - p * 7;
  for (let k = 0; k < 8; k++) {
    const ang = k * Math.PI / 4 + p * 0.5;
    ctx.fillStyle = hot;
    ctx.beginPath();
    ctx.arc(x + Math.cos(ang) * rad, y + Math.sin(ang) * rad * 0.5, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
  const rise = p * 18;
  ctx.globalAlpha = 0.85;
  ctx.drawImage(puffSprite(), x - 10, y - 22 - rise, 20, 20);
  ctx.globalAlpha = 1;
  ctx.restore();
}

export function paintDecals(ctx: CanvasRenderingContext2D, w: World): void {
  ctx.save();
  ctx.lineJoin = "round";
  ctx.strokeStyle = BRASS.lo;
  ctx.lineWidth = 10;
  ctx.strokeRect(2, 2, ARENA_W - 4, ARENA_H - 4);
  ctx.strokeStyle = BRASS.mid;
  ctx.lineWidth = 3;
  ctx.strokeRect(8, 8, ARENA_W - 16, ARENA_H - 16);
  const a = w.arena;
  const camX = a.camX;
  const camY = a.camY;
  for (let i = 0; i < a.healAlive.length; i++) {
    if (!a.healAlive[i]) continue;
    const x = a.healX[i] ?? 0;
    const y = a.healY[i] ?? 0;
    if (x < camX - 24 || y < camY - 24 || x > camX + a.viewW + 24 || y > camY + a.viewH + 24) continue;
    heal(ctx, x, y, w.tick, i);
  }
  for (let i = 0; i < a.teleAlive.length; i++) {
    if (!a.teleAlive[i]) continue;
    telegraph(ctx, w, i);
  }
  ctx.restore();
}

function chevron(ctx: CanvasRenderingContext2D, tick: number, fill: string): void {
  ctx.save();
  ctx.translate(SCR[0] ?? 0, SCR[1] ?? 0);
  ctx.rotate(Math.atan2(SCR[3] ?? 0, SCR[2] ?? 1));
  ctx.globalAlpha = 0.8 + ((tick >> 3) & 1) * 0.2;
  ctx.beginPath();
  ctx.moveTo(11, 0);
  ctx.lineTo(-7, 6);
  ctx.lineTo(-3, 0);
  ctx.lineTo(-7, -6);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  ctx.restore();
}

export function paintArrows(ctx: CanvasRenderingContext2D, w: World): void {
  if (w.over || w.choosing) return;
  const camX = Math.round(w.arena.camX);
  const camY = Math.round(w.arena.camY);
  const z = w.zombies;
  for (let i = 0; i < MAX_ZOMBIES; i++) {
    if (!z.alive[i]) continue;
    const kind = z.kind[i] ?? 0;
    const sx = (z.x[i] ?? 0) - camX;
    const sy = (z.y[i] ?? 0) - camY;
    if (!showsArrow(kind, sx, sy, w.arena.viewW || W, w.arena.viewH || H)) continue;
    arrowTip(sx, sy, SCR);
    chevron(ctx, w.tick, "#fff1c2");
  }
  if (!lichUp(w)) return;
  const sx = lichX(w) - camX;
  const sy = lichY(w) - camY;
  if (sx >= 0 && sy >= 0 && sx <= (w.arena.viewW || W) && sy <= (w.arena.viewH || H)) return;
  arrowTip(sx, sy, SCR);
  chevron(ctx, w.tick, "#e4c0ff");
}
