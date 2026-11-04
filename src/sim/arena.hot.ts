import {
  ARENA_H, ARENA_W, CAM_LERP, EDGE_PAD, HEAL_HP, HEAL_R2, MAX_HEAL, MAX_TELE, MIN_SPAWN_R2,
  OB_BARREL, OB_BOILER, OB_CRATE, OB_GEAR, PROP_CELL, PROP_COLS, PROP_REACH, PROP_ROWS, PUFF_BARREL, SPAWN_BOT, SPAWN_INSET, SPAWN_MARGIN, SPAWN_TOP, TELE_LIFE, cameraTarget, edgePoint, hitsProp, spawnHidden,
  type Arena,
} from "./arena";
import { scaleSpeed, scaleThreat } from "./director";
import { finaleBlocksBoss } from "./finale";
import { foeHp, foePack, foeSpeed, Z_ELITE, Z_GAS, Z_KIND, Z_KNIGHT, Z_RAT, Z_SPITTER } from "./foes";
import { pacedSpeed } from "./modifiers";
import { nextFloat } from "./rng";
import {
  FX_PUFF, FX_SPARK, MAX_FX, MAX_ZOMBIES, TELE_BOSS, Z_BRUTE, Z_GHOUL, type World,
} from "./types";

function emitFx(w: World, kind: number, x: number, y: number, a: number): void {
  const i = w.fxHead;
  w.fxKind[i] = kind;
  w.fxX[i] = x;
  w.fxY[i] = y;
  w.fxA[i] = a;
  w.fxTick[i] = w.tick;
  w.fxHead = i + 1 < MAX_FX ? i + 1 : 0;
}

function bodyR(kind: number): number {
  const k = kind & Z_KIND;
  if (k === Z_BRUTE || k === Z_KNIGHT) return 13;
  if (k === Z_GAS) return 11;
  if (k === Z_GHOUL || k === Z_RAT) return 7;
  return 9;
}

function propHit(a: Arena, x: number, y: number, rad: number): number {
  if (a.propOverflow || rad > PROP_REACH) {
    const n = a.obsN;
    for (let i = 0; i < n; i++) {
      if (!a.obsAlive[i]) continue;
      if (hitsProp(x, y, rad, a.obsX[i] ?? 0, a.obsY[i] ?? 0, a.obsHW[i] ?? 0, a.obsHH[i] ?? 0, a.obsR[i] ?? 0)) return i;
    }
    return -1;
  }
  let cx = (x / PROP_CELL) | 0;
  let cy = (y / PROP_CELL) | 0;
  if (x < 0) cx = 0;
  else if (cx >= PROP_COLS) cx = PROP_COLS - 1;
  if (y < 0) cy = 0;
  else if (cy >= PROP_ROWS) cy = PROP_ROWS - 1;
  let node = a.propHead[cx + cy * PROP_COLS] ?? -1;
  let best = -1;
  while (node >= 0) {
    const i = a.propNode[node] ?? 0;
    node = a.propNext[node] ?? -1;
    if (!a.obsAlive[i]) continue;
    if (!hitsProp(x, y, rad, a.obsX[i] ?? 0, a.obsY[i] ?? 0, a.obsHW[i] ?? 0, a.obsHH[i] ?? 0, a.obsR[i] ?? 0)) continue;
    if (best < 0 || i < best) best = i;
  }
  return best;
}

export function blocked(w: World, x: number, y: number, rad: number): boolean {
  const a = w.arena;
  if (a.propOverflow !== 0 || rad > PROP_REACH) return propHit(a, x, y, rad) >= 0;
  let cx = (x / PROP_CELL) | 0;
  let cy = (y / PROP_CELL) | 0;
  if (x < 0) cx = 0;
  else if (cx >= PROP_COLS) cx = PROP_COLS - 1;
  if (y < 0) cy = 0;
  else if (cy >= PROP_ROWS) cy = PROP_ROWS - 1;
  if ((a.propHead[cx + cy * PROP_COLS] ?? -1) < 0) return false;
  return propHit(a, x, y, rad) >= 0;
}

function canBreak(kind: number): boolean {
  return kind === OB_BARREL || kind === OB_BOILER || kind === OB_GEAR || kind === OB_CRATE;
}

function breakProp(w: World, i: number): void {
  const a = w.arena;
  if (!a.obsAlive[i]) return;
  a.obsAlive[i] = 0;
  const x = a.obsX[i] ?? 0;
  const y = a.obsY[i] ?? 0;
  emitFx(w, FX_SPARK, x, y, 0);
  emitFx(w, FX_PUFF, x, y, PUFF_BARREL);
  if ((a.obsKind[i] ?? 0) !== OB_BARREL) return;
  for (let k = 0; k < MAX_HEAL; k++) {
    if (a.healAlive[k]) continue;
    a.healX[k] = x;
    a.healY[k] = y;
    a.healAlive[k] = 1;
    return;
  }
}

function harmProp(w: World, i: number, dmg: number): void {
  const a = w.arena;
  if (!canBreak(a.obsKind[i] ?? 0)) return;
  a.obsHp[i] = (a.obsHp[i] ?? 1) - (dmg > 0 ? dmg : 1);
  if ((a.obsHp[i] ?? 0) <= 0) breakProp(w, i);
}

export function bulletBlocks(w: World, bx: number, by: number, dmg: number): boolean {
  const i = propHit(w.arena, bx, by, 2);
  if (i < 0) return false;
  harmProp(w, i, dmg);
  return true;
}

export function cutProps(w: World, x: number, y: number): void {
  const a = w.arena;
  for (let i = 0; i < a.obsN; i++) {
    if (!a.obsAlive[i] || !canBreak(a.obsKind[i] ?? 0)) continue;
    if (!hitsProp(x, y, 6, a.obsX[i] ?? 0, a.obsY[i] ?? 0, a.obsHW[i] ?? 0, a.obsHH[i] ?? 0, a.obsR[i] ?? 0)) continue;
    harmProp(w, i, 1);
  }
}

function shove(w: World, x: number, y: number, rad: number): void {
  const a = w.arena;
  let cx = x;
  let cy = y;
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < a.obsN; i++) {
      if (!a.obsAlive[i]) continue;
      const ox = a.obsX[i] ?? 0;
      const oy = a.obsY[i] ?? 0;
      const r = a.obsR[i] ?? 0;
      const hw = a.obsHW[i] ?? 0;
      const hh = a.obsHH[i] ?? 0;
      if (r > 0) {
        const dx = cx - ox;
        const dy = cy - oy;
        const rads = rad + r;
        const d2 = dx * dx + dy * dy;
        if (d2 >= rads * rads) continue;
        const d = Math.sqrt(d2) || 1;
        cx = ox + (dx / d) * (rads + 0.25);
        cy = oy + (dy / d) * (rads + 0.25);
      } else {
        const dx = cx - ox;
        const dy = cy - oy;
        const penX = hw + rad - Math.abs(dx);
        const penY = hh + rad - Math.abs(dy);
        if (penX <= 0 || penY <= 0) continue;
        if (penX < penY) cx += (dx < 0 ? -penX : penX) + (dx < 0 ? -0.25 : 0.25);
        else cy += (dy < 0 ? -penY : penY) + (dy < 0 ? -0.25 : 0.25);
      }
    }
  }
  if (cx < rad + 4) cx = rad + 4;
  if (cy < rad + 4) cy = rad + 4;
  if (cx > ARENA_W - rad - 4) cx = ARENA_W - rad - 4;
  if (cy > ARENA_H - rad - 4) cy = ARENA_H - rad - 4;
  a.scratch[0] = cx;
  a.scratch[1] = cy;
}

function slide(w: World, x: number, y: number, tx: number, ty: number, rad: number, pad: number): void {
  const a = w.arena;
  let mx = x;
  let my = y;
  let open = 0;
  const nx = tx < pad ? pad : tx > ARENA_W - pad ? ARENA_W - pad : tx;
  const ny = ty < pad ? pad : ty > ARENA_H - pad ? ARENA_H - pad : ty;
  if (!blocked(w, nx, ny, rad)) {
    mx = nx;
    my = ny;
    open = 1;
  } else if (!blocked(w, nx, y, rad)) {
    mx = nx;
    if (!blocked(w, mx, ny, rad)) my = ny;
  } else if (!blocked(w, x, ny, rad)) {
    my = ny;
  }
  if (!open && blocked(w, mx, my, rad)) {
    if (!blocked(w, x, y, rad)) {
      mx = x;
      my = y;
    } else {
      shove(w, mx, my, rad);
      mx = a.scratch[0] ?? x;
      my = a.scratch[1] ?? y;
    }
  }
  a.scratch[0] = mx;
  a.scratch[1] = my;
}

export function slideUnit(w: World, i: number, ux: number, uy: number, sp: number, rad: number): void {
  const z = w.zombies;
  const x = z.x[i] ?? 0;
  const y = z.y[i] ?? 0;
  slide(w, x, y, x + ux * sp, y + uy * sp, rad, rad + 2);
  z.x[i] = w.arena.scratch[0] ?? x;
  z.y[i] = w.arena.scratch[1] ?? y;
}

export function slidePlayer(w: World, dx: number, dy: number, sp: number): void {
  let x = w.px;
  let y = w.py;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len > 0) {
    x += (dx / Math.max(1, len)) * sp;
    y += (dy / Math.max(1, len)) * sp;
  }
  slide(w, w.px, w.py, x, y, 8, EDGE_PAD);
  w.px = w.arena.scratch[0] ?? w.px;
  w.py = w.arena.scratch[1] ?? w.py;
}

export function updateCamera(w: World): void {
  const a = w.arena;
  cameraTarget(w.px, w.py, a.scratch, a.viewW, a.viewH);
  const tx = a.scratch[0] ?? 0;
  const ty = a.scratch[1] ?? 0;
  a.camX += (tx - a.camX) * CAM_LERP;
  a.camY += (ty - a.camY) * CAM_LERP;
  if (Math.abs(tx - a.camX) < 0.04) a.camX = tx;
  if (Math.abs(ty - a.camY) < 0.04) a.camY = ty;
}

function sideClear(w: World, x: number, y: number, ux: number, uy: number, look: number, rad: number): number {
  let n = 0;
  if (!blocked(w, x + ux * look, y + uy * look, rad)) n += 3;
  if (!blocked(w, x + ux * look * 2, y + uy * look * 2, rad)) n += 2;
  if (!blocked(w, x + ux * look * 3, y + uy * look * 3, rad)) n += 1;
  return n;
}

export function chaseZombie(w: World, i: number): void {
  const z = w.zombies;
  const kind = z.kind[i] ?? 0;
  const rad = bodyR(kind);
  const x = z.x[i] ?? 0;
  const y = z.y[i] ?? 0;
  const sp = z.vx[i] ?? 0;
  const dx = w.px - x;
  const dy = w.py - y;
  const d = Math.sqrt(dx * dx + dy * dy) || 1;
  let ux = dx / d;
  let uy = dy / d;
  const look = rad + 14;
  if (blocked(w, x + ux * look, y + uy * look, rad)) {
    const lx = -uy;
    const ly = ux;
    const lClear = sideClear(w, x, y, lx, ly, look, rad);
    const rClear = sideClear(w, x, y, -lx, -ly, look, rad);
    if (lClear > rClear) { ux = lx; uy = ly; }
    else if (rClear > lClear) { ux = -lx; uy = -ly; }
    else if ((i & 1) === 0) { ux = lx; uy = ly; }
    else { ux = -lx; uy = -ly; }
  }
  slide(w, x, y, x + ux * sp, y + uy * sp, rad, rad + 2);
  z.x[i] = w.arena.scratch[0] ?? x;
  z.y[i] = w.arena.scratch[1] ?? y;
}

function pointOK(w: World, x: number, y: number): boolean {
  const dx = x - w.px;
  const dy = y - w.py;
  if (dx * dx + dy * dy < MIN_SPAWN_R2) return false;
  const camX = w.arena.camX;
  const camY = w.arena.camY;
  if (x < camX - SPAWN_MARGIN || x > camX + w.arena.viewW + SPAWN_MARGIN) return false;
  if (y < camY - SPAWN_MARGIN || y > camY + w.arena.viewH + SPAWN_MARGIN) return false;
  if (spawnHidden(camX, camY, x, y)) return false;
  return true;
}

function keepClear(w: World, i: number): void {
  const a = w.arena;
  edgePoint(a.camX, a.camY, a.teleEdge[i] ?? 0, a.teleU[i] ?? 0.5, a.scratch, a.viewW, a.viewH);
  if (pointOK(w, a.scratch[0] ?? 0, a.scratch[1] ?? 0)) return;
  let bestE = a.teleEdge[i] ?? 0;
  let bestD = -1;
  for (let e = 0; e < 4; e++) {
    edgePoint(a.camX, a.camY, e, 0.5, a.scratch, a.viewW, a.viewH);
    const ex = (a.scratch[0] ?? 0) - w.px;
    const ey = (a.scratch[1] ?? 0) - w.py;
    const d2 = ex * ex + ey * ey;
    if (d2 > bestD) { bestD = d2; bestE = e; }
  }
  a.teleEdge[i] = bestE;
  const u = a.teleU[i] ?? 0.5;
  a.teleU[i] = u < 0.18 || u > 0.82 ? 0.5 : u;
}

function pickOpen(w: World, edge: number, u: number): void {
  const a = w.arena;
  let bestX = 0;
  let bestY = 0;
  let best = 0;
  for (let k = 0; k < 6; k++) {
    const uu = u + k * 0.137;
    const wrapped = uu - Math.floor(uu);
    edgePoint(a.camX, a.camY, edge, wrapped, a.scratch, a.viewW, a.viewH);
    const x = a.scratch[0] ?? 0;
    const y = a.scratch[1] ?? 0;
    if (!pointOK(w, x, y)) continue;
    if (!best) { bestX = x; bestY = y; best = 1; }
    if (blocked(w, x, y, 11)) continue;
    a.scratch[0] = x;
    a.scratch[1] = y;
    return;
  }
  if (best) {
    const cx = a.camX + a.viewW * 0.5;
    const cy = a.camY + a.viewH * 0.5;
    const nx = bestX + (cx - bestX) * 0.2;
    const ny = bestY + (cy - bestY) * 0.2;
    if (pointOK(w, nx, ny) && !blocked(w, nx, ny, 11)) {
      a.scratch[0] = nx;
      a.scratch[1] = ny;
      return;
    }
    a.scratch[0] = bestX;
    a.scratch[1] = bestY;
    return;
  }
  edgePoint(a.camX, a.camY, edge, 0.5, a.scratch, a.viewW, a.viewH);
  if (pointOK(w, a.scratch[0] ?? 0, a.scratch[1] ?? 0)) return;
  let farX = a.scratch[0] ?? 0;
  let farY = a.scratch[1] ?? 0;
  let farD = -1;
  for (let e = 0; e < 4; e++) {
    edgePoint(a.camX, a.camY, e, 0.5, a.scratch, a.viewW, a.viewH);
    const sx = a.scratch[0] ?? 0;
    const sy = a.scratch[1] ?? 0;
    if (!pointOK(w, sx, sy)) continue;
    const dx = sx - w.px;
    const dy = sy - w.py;
    const d2 = dx * dx + dy * dy;
    if (d2 > farD) { farD = d2; farX = sx; farY = sy; }
  }
  a.scratch[0] = farX;
  a.scratch[1] = farY;
}

export function queueSpawn(w: World, kind: number): void {
  const a = w.arena;
  let slot = -1;
  for (let i = 0; i < MAX_TELE; i++) {
    if (!a.teleAlive[i]) { slot = i; break; }
  }
  if (slot < 0) return;
  let edge = 0;
  let u = 0.5;
  let found = 0;
  for (let n = 0; n < 8; n++) {
    const e = (nextFloat(w.rng) * 4) | 0;
    const uu = nextFloat(w.rng);
    edgePoint(a.camX, a.camY, e, uu, a.scratch, a.viewW, a.viewH);
    const x = a.scratch[0] ?? 0;
    const y = a.scratch[1] ?? 0;
    if (!pointOK(w, x, y)) continue;
    if (blocked(w, x, y, 11)) continue;
    edge = e;
    u = uu;
    found = 1;
    break;
  }
  if (!found) {
    let bestD = -1;
    for (let e = 0; e < 4; e++) {
      edgePoint(a.camX, a.camY, e, 0.5, a.scratch, a.viewW, a.viewH);
      const dx = (a.scratch[0] ?? 0) - w.px;
      const dy = (a.scratch[1] ?? 0) - w.py;
      const d2 = dx * dx + dy * dy;
      if (d2 > bestD) { bestD = d2; edge = e; }
    }
    u = 0.22 + nextFloat(w.rng) * 0.56;
  }
  a.teleEdge[slot] = edge;
  a.teleU[slot] = u;
  a.teleKind[slot] = kind;
  a.teleLeft[slot] = TELE_LIFE + 1;
  a.teleAlive[slot] = 1;
  keepClear(w, slot);
}

function armFoe(w: World, i: number, raw: number, x: number, y: number): void {
  const z = w.zombies;
  const kind = raw & Z_KIND;
  const elite = (raw & Z_ELITE) !== 0;
  z.x[i] = x;
  z.y[i] = y;
  z.kind[i] = raw;
  z.hp[i] = scaleThreat(foeHp(kind, w.rank, elite), w);
  z.vx[i] = pacedSpeed(scaleSpeed(foeSpeed(kind, w.rank, nextFloat(w.rng)), w), w.mods);
  z.alive[i] = 1;
  if (kind === Z_SPITTER) z.vy[i] = (nextFloat(w.rng) * 36) | 0;
  else if (kind === Z_KNIGHT) z.vy[i] = Math.atan2(w.py - y, w.px - x);
  else z.vy[i] = 0;
}

function packPoint(w: World, x: number, y: number, s: number): void {
  const a = w.arena;
  let px = x;
  let py = y;
  if (s > 0) {
    px += (nextFloat(w.rng) - 0.5) * 16;
    py += (nextFloat(w.rng) - 0.5) * 16;
  }
  const loX = a.camX + SPAWN_INSET;
  const hiX = a.camX + a.viewW - SPAWN_INSET;
  const loY = a.camY + SPAWN_TOP;
  const hiY = a.camY + a.viewH - SPAWN_BOT;
  if (px < loX) px = loX;
  if (px > hiX) px = hiX;
  if (py < loY) py = loY;
  if (py > hiY) py = hiY;
  a.scratch[2] = px;
  a.scratch[3] = py;
}

function materialize(w: World, slot: number, x: number, y: number): boolean {
  const z = w.zombies;
  const raw = w.arena.teleKind[slot] ?? 0;
  if (raw === TELE_BOSS) {
    if (finaleBlocksBoss(w) || w.boss.on) return true;
    w.boss.x = x;
    w.boss.y = y;
    w.boss.pending = 2;
    emitFx(w, FX_PUFF, x, y, 4);
    return true;
  }
  const pack = foePack(raw);
  let placed = 0;
  for (let s = 0; s < pack; s++) {
    let slotI = -1;
    for (let i = 0; i < MAX_ZOMBIES; i++) {
      if (!z.alive[i]) { slotI = i; break; }
    }
    if (slotI < 0) break;
    packPoint(w, x, y, s);
    const px = w.arena.scratch[2] ?? x;
    const py = w.arena.scratch[3] ?? y;
    armFoe(w, slotI, raw, px, py);
    w.arena.lastX = px;
    w.arena.lastY = py;
    w.arena.lastN++;
    placed++;
  }
  if (placed === 0) return false;
  emitFx(w, FX_PUFF, x, y, raw & Z_KIND);
  return true;
}

export function tickTelegraphs(w: World): void {
  const a = w.arena;
  for (let i = 0; i < MAX_TELE; i++) {
    if (!a.teleAlive[i]) continue;
    keepClear(w, i);
    a.teleLeft[i] = (a.teleLeft[i] ?? 1) - 1;
    if ((a.teleLeft[i] ?? 0) > 0) continue;
    pickOpen(w, a.teleEdge[i] ?? 0, a.teleU[i] ?? 0.5);
    const x = a.scratch[0] ?? w.px;
    const y = a.scratch[1] ?? w.py;
    if (!materialize(w, i, x, y)) {
      a.teleLeft[i] = 1;
      continue;
    }
    a.teleAlive[i] = 0;
  }
}

export function teleCount(w: World): number {
  let n = 0;
  const a = w.arena.teleAlive;
  for (let i = 0; i < MAX_TELE; i++) if (a[i]) n++;
  return n;
}

export function pickupHeals(w: World): void {
  const a = w.arena;
  if (w.hp >= w.maxHp) return;
  for (let k = 0; k < MAX_HEAL; k++) {
    if (!a.healAlive[k]) continue;
    const dx = w.px - (a.healX[k] ?? 0);
    const dy = w.py - (a.healY[k] ?? 0);
    if (dx * dx + dy * dy > HEAL_R2) continue;
    a.healAlive[k] = 0;
    w.hp += HEAL_HP;
    if (w.hp > w.maxHp) w.hp = w.maxHp;
    emitFx(w, FX_SPARK, w.px, w.py, 0);
    if (w.hp >= w.maxHp) return;
  }
}
