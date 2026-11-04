import {
  ARENA_H, ARENA_W, BARREL_HP, MAX_OBS, OB_BOILER, OB_CRATE, OB_GEAR, OB_PIPE,
  arrowTip, edgePoint, showsArrow,
} from "../sim/arena";
import { lichUp, lichX, lichY } from "../sim/finale";
import { H, MAX_ZOMBIES, W, type World } from "../sim/types";
import { paintBlood, paintEnergyTank, paintShadow } from "../art/look";
import { blitSheet, steamFrame } from "../art/sheet";
import { paintHealVial } from "./cast";
import { BRASS, OUTLINE } from "./paint";
import { paintStains } from "./stains";
import { paintDoorSpawn } from "./yard-fx";

const SCR = new Float32Array(4);
const PROP_ORDER = new Int16Array(MAX_OBS);

function boiler(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, tick: number, i: number): void {
  paintEnergyTank(ctx, x, y, r, tick + i);
  ctx.globalAlpha = 0.8;
  blitSheet(ctx, steamFrame(tick + i * 7), x + 6, y - r - 8);
  ctx.globalAlpha = 1;
}

function crate(ctx: CanvasRenderingContext2D, x: number, y: number, hw: number): void {
  paintShadow(ctx, x, y, hw * 0.8, 5);
  blitSheet(ctx, hw > 12 ? "crate_stack" : "crate", x, y);
}

function pipe(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  paintShadow(ctx, x, y, 14, 5);
  blitSheet(ctx, "valve_steam", x, y);
}

function gearPile(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, _tick: number, i: number): void {
  paintShadow(ctx, x, y, r, 5);
  blitSheet(ctx, i & 1 ? "breakable_boiler" : "breakable_gear_pylon", x, y);
}

function barrel(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, hp: number, tick: number): void {
  paintShadow(ctx, x, y, r * 0.8, 4);
  blitSheet(ctx, "barrel", x, y);
  if (hp < BARREL_HP) {
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x - 3, y - r * 0.3);
    ctx.lineTo(x + 2, y + r * 0.1);
    ctx.stroke();
  }
  if ((tick >> 4 & 1) && hp === BARREL_HP) {
    ctx.fillStyle = "#eaffb0";
    ctx.fillRect(x + r * 0.15, y - r * 0.2, 2, 2);
  }
}

export function paintProp(ctx: CanvasRenderingContext2D, w: World, i: number): void {
  const a = w.arena;
  const x = a.obsX[i] ?? 0;
  const y = a.obsY[i] ?? 0;
  const kind = a.obsKind[i] ?? 0;
  const hw = a.obsHW[i] ?? 8;
  const r = a.obsR[i] ?? 0;
  if (kind === OB_BOILER) boiler(ctx, x, y, r || 16, w.tick, i);
  else if (kind === OB_CRATE) crate(ctx, x, y, hw);
  else if (kind === OB_PIPE) pipe(ctx, x, y);
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
  paintDoorSpawn(ctx, SCR[0] ?? 0, SCR[1] ?? 0, w.tick + i);
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
  for (let i = 0; i < 12; i++) {
    const hx = 80 + ((i * 97) % (ARENA_W - 160));
    const hy = 140 + ((i * 53) % (ARENA_H - 200));
    if (hx > 420 && hx < 540 && hy > 240 && hy < 400) continue;
    paintBlood(ctx, hx, hy, 4 + (i & 3));
  }
  paintStains(ctx);
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
