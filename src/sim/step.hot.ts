import {
  bulletDmg, COG_PULL, fireEvery, magnetR, moveSpeed, PICKUP_R2,
  SAW_HIT_R2, sawAngle, sawRadius, shieldReload, takeXp, teslaChain, teslaEvery,
  teslaRange, tryPick,
} from "./progress";
import { nextFloat } from "./rng";
import {
  EV_HURT, EV_KILL, EV_SHIELD, EV_SHOT, EV_TESLA, EV_WAVE, FX_FLASH, FX_PUFF, FX_SPARK,
  H, MAX_BULLETS, MAX_COGS, MAX_FX, MAX_ZOMBIES, UPG_PIERCE, UPG_SAWS, UPG_SHIELD,
  UPG_SHOTGUN, UPG_TESLA, W, Z_BRUTE, Z_GHOUL, type Input, type World,
} from "./types";
const BULLET_SPEED = 5;
function emitFx(w: World, kind: number, x: number, y: number, a: number): void {
  const i = w.fxHead;
  w.fxKind[i] = kind;
  w.fxX[i] = x;
  w.fxY[i] = y;
  w.fxA[i] = a;
  w.fxTick[i] = w.tick;
  w.fxHead = i + 1 < MAX_FX ? i + 1 : 0;
}
function pickKind(w: World): number {
  const r = nextFloat(w.rng);
  if (w.wave <= 1) {
    if (r < 0.7) return 0;
    if (r < 0.92) return 1;
    return 2;
  }
  if (w.wave <= 3) {
    if (r < 0.5) return 0;
    if (r < 0.82) return 1;
    return 2;
  }
  if (r < 0.35) return 0;
  if (r < 0.75) return 1;
  return 2;
}
function hitR2(kind: number): number {
  if (kind === Z_BRUTE) return 220;
  if (kind === Z_GHOUL) return 72;
  return 100;
}
function touchR2(kind: number): number {
  if (kind === Z_BRUTE) return 280;
  if (kind === Z_GHOUL) return 110;
  return 150;
}
function killScore(kind: number, wave: number): number {
  if (kind === Z_GHOUL) return 20 * wave;
  if (kind === Z_BRUTE) return 40 * wave;
  return 10 * wave;
}
function dropCog(w: World, x: number, y: number): void {
  const c = w.cogs;
  for (let k = 0; k < MAX_COGS; k++) {
    if (c.alive[k]) continue;
    c.x[k] = x;
    c.y[k] = y;
    c.alive[k] = 1;
    return;
  }
  takeXp(w, 1);
}
function killZombie(w: World, i: number): void {
  const z = w.zombies;
  const kind = z.kind[i] ?? 0;
  z.alive[i] = 0;
  w.score += killScore(kind, w.wave);
  w.events[EV_KILL] = 1;
  emitFx(w, FX_PUFF, z.x[i] ?? 0, z.y[i] ?? 0, kind);
  dropCog(w, z.x[i] ?? 0, z.y[i] ?? 0);
}
function hurtZombie(w: World, i: number, dmg: number): void {
  const z = w.zombies;
  z.hp[i] = (z.hp[i] ?? 1) - dmg;
  emitFx(w, FX_SPARK, z.x[i] ?? 0, z.y[i] ?? 0, 0);
  if ((z.hp[i] ?? 0) <= 0) killZombie(w, i);
}
function spawnZombie(w: World): void {
  const z = w.zombies;
  for (let i = 0; i < MAX_ZOMBIES; i++) {
    if (z.alive[i]) continue;
    const t = nextFloat(w.rng) * 4;
    const u = nextFloat(w.rng);
    z.x[i] = t < 1 ? u * W : t < 2 ? W + 8 : t < 3 ? u * W : -8;
    z.y[i] = t < 1 ? -8 : t < 2 ? u * H : t < 3 ? H + 8 : u * H;
    const kind = pickKind(w);
    z.kind[i] = kind;
    if (kind === Z_GHOUL) {
      z.hp[i] = 1;
      z.vx[i] = 1.15 + w.wave * 0.05 + nextFloat(w.rng) * 0.25;
    } else if (kind === Z_BRUTE) {
      z.hp[i] = 3 + (w.wave >> 1);
      z.vx[i] = 0.2 + w.wave * 0.015 + nextFloat(w.rng) * 0.06;
    } else {
      z.hp[i] = 1 + (w.wave >> 2);
      z.vx[i] = 0.38 + w.wave * 0.03 + nextFloat(w.rng) * 0.12;
    }
    z.alive[i] = 1;
    return;
  }
}
function shootDir(w: World, ux: number, uy: number): void {
  const b = w.bullets;
  for (let j = 0; j < MAX_BULLETS; j++) {
    if (b.alive[j]) continue;
    w.aimX = ux;
    w.aimY = uy;
    b.x[j] = w.px;
    b.y[j] = w.py;
    b.vx[j] = ux * BULLET_SPEED;
    b.vy[j] = uy * BULLET_SPEED;
    b.alive[j] = 1;
    w.bHit[j] = -1;
    w.bPierce[j] = w.upgrades[UPG_PIERCE] ?? 0;
    w.events[EV_SHOT] = 1;
    emitFx(w, FX_FLASH, w.px + ux * 11, w.py + uy * 7, Math.atan2(uy, ux));
    return;
  }
}
function fire(w: World): void {
  const z = w.zombies;
  let best = -1;
  let bd = 1e12;
  for (let i = 0; i < MAX_ZOMBIES; i++) {
    if (!z.alive[i]) continue;
    const dx = (z.x[i] ?? 0) - w.px;
    const dy = (z.y[i] ?? 0) - w.py;
    const d = dx * dx + dy * dy;
    if (d < bd) { bd = d; best = i; }
  }
  if (best < 0) return;
  const dx = (z.x[best] ?? 0) - w.px;
  const dy = (z.y[best] ?? 0) - w.py;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  shootDir(w, ux, uy);
  const n = w.upgrades[UPG_SHOTGUN] ?? 0;
  for (let s = 1; s <= n; s++) {
    const a = s * 0.28;
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    shootDir(w, ux * ca - uy * sa, ux * sa + uy * ca);
    shootDir(w, ux * ca + uy * sa, -ux * sa + uy * ca);
  }
}
function zap(w: World): void {
  const z = w.zombies;
  const lvl = w.upgrades[UPG_TESLA] ?? 0;
  const firstR2 = teslaRange(w) * teslaRange(w);
  const hopR2 = teslaChain(w) * teslaChain(w);
  for (let i = 0; i < MAX_ZOMBIES; i++) w.zMark[i] = 0;
  w.teslaN = 0;
  let cx = w.px;
  let cy = w.py;
  let lim = firstR2;
  for (let hop = 0; hop < lvl; hop++) {
    let best = -1;
    let bd = lim;
    for (let i = 0; i < MAX_ZOMBIES; i++) {
      if (!z.alive[i] || w.zMark[i]) continue;
      const dx = (z.x[i] ?? 0) - cx;
      const dy = (z.y[i] ?? 0) - cy;
      const d = dx * dx + dy * dy;
      if (d < bd) { bd = d; best = i; }
    }
    if (best < 0) break;
    w.zMark[best] = 1;
    if (w.teslaN < 8) {
      w.teslaHit[w.teslaN] = best;
      w.teslaN++;
    }
    hurtZombie(w, best, lvl);
    cx = z.x[best] ?? 0;
    cy = z.y[best] ?? 0;
    lim = hopR2;
  }
  if (w.teslaN > 0) {
    w.events[EV_TESLA] = 1;
    w.teslaFlash = 8;
  }
}
function spinSaws(w: World): void {
  const n = w.upgrades[UPG_SAWS] ?? 0;
  if (n <= 0 || (w.tick & 3) !== 0) return;
  const z = w.zombies;
  const r = sawRadius(w);
  for (let s = 0; s < n; s++) {
    const a = sawAngle(w.tick, s, n);
    const sx = w.px + Math.cos(a) * r;
    const sy = w.py + Math.sin(a) * r;
    for (let i = 0; i < MAX_ZOMBIES; i++) {
      if (!z.alive[i]) continue;
      const dx = (z.x[i] ?? 0) - sx;
      const dy = (z.y[i] ?? 0) - sy;
      if (dx * dx + dy * dy < SAW_HIT_R2) hurtZombie(w, i, 1);
    }
  }
}
function pullCogs(w: World): void {
  const c = w.cogs;
  const mag = magnetR(w);
  const mag2 = mag * mag;
  for (let k = 0; k < MAX_COGS; k++) {
    if (!c.alive[k]) continue;
    const dx = w.px - (c.x[k] ?? 0);
    const dy = w.py - (c.y[k] ?? 0);
    const d2 = dx * dx + dy * dy;
    if (d2 < PICKUP_R2) {
      c.alive[k] = 0;
      takeXp(w, 1);
      continue;
    }
    if (d2 < mag2) {
      const d = Math.sqrt(d2) || 1;
      c.x[k] = (c.x[k] ?? 0) + (dx / d) * COG_PULL;
      c.y[k] = (c.y[k] ?? 0) + (dy / d) * COG_PULL;
    }
  }
}
export function step(w: World, input: Input): void {
  w.events.fill(0);
  if (w.over) return;
  if (w.choosing) {
    tryPick(w, input.pick ?? 0);
    return;
  }
  w.tick++;
  if (w.teslaFlash > 0) w.teslaFlash--;
  const len = Math.sqrt(input.dx * input.dx + input.dy * input.dy);
  const sp = moveSpeed(w);
  if (len > 0) {
    w.px += (input.dx / Math.max(1, len)) * sp;
    w.py += (input.dy / Math.max(1, len)) * sp;
  }
  w.px = Math.min(W - 10, Math.max(10, w.px));
  w.py = Math.min(H - 10, Math.max(18, w.py));
  const z = w.zombies;
  let alive = 0;
  for (let i = 0; i < MAX_ZOMBIES; i++) if (z.alive[i]) alive++;
  if (alive === 0 && w.toSpawn === 0) { w.wave++; w.toSpawn = 3 + w.wave * 2; w.events[EV_WAVE] = 1; }
  if (w.toSpawn > 0 && --w.spawnCd <= 0) { spawnZombie(w); w.toSpawn--; w.spawnCd = Math.max(8, 40 - w.wave * 3); }
  if (--w.fireCd <= 0) { fire(w); w.fireCd = fireEvery(w); }
  if (w.hurtCd > 0) w.hurtCd--;
  const cap = w.upgrades[UPG_SHIELD] ?? 0;
  if (cap > 0 && w.shield < cap && --w.shieldCd <= 0) {
    w.shield++;
    w.shieldCd = shieldReload(w);
  }
  for (let i = 0; i < MAX_ZOMBIES; i++) {
    if (!z.alive[i]) continue;
    const kind = z.kind[i] ?? 0;
    const dx = w.px - (z.x[i] ?? 0);
    const dy = w.py - (z.y[i] ?? 0);
    const d2 = dx * dx + dy * dy;
    const d = Math.sqrt(d2) || 1;
    const zsp = z.vx[i] ?? 0;
    z.x[i] = (z.x[i] ?? 0) + (dx / d) * zsp;
    z.y[i] = (z.y[i] ?? 0) + (dy / d) * zsp;
    if (d2 < touchR2(kind) && w.hurtCd === 0) {
      w.hurtCd = 45;
      if (w.shield > 0) {
        w.shield--;
        w.shieldCd = shieldReload(w);
        w.events[EV_SHIELD] = 1;
      } else {
        w.hp -= kind === Z_BRUTE ? 2 : 1;
        w.events[EV_HURT] = 1;
        if (w.hp <= 0) { w.over = true; return; }
      }
    }
  }
  const b = w.bullets;
  const dmg = bulletDmg(w);
  for (let j = 0; j < MAX_BULLETS; j++) {
    if (!b.alive[j]) continue;
    const bx = (b.x[j] ?? 0) + (b.vx[j] ?? 0);
    const by = (b.y[j] ?? 0) + (b.vy[j] ?? 0);
    b.x[j] = bx;
    b.y[j] = by;
    if (bx < -10 || by < -10 || bx > W + 10 || by > H + 10) { b.alive[j] = 0; continue; }
    for (let i = 0; i < MAX_ZOMBIES; i++) {
      if (!z.alive[i]) continue;
      if (w.bHit[j] === i) continue;
      const kind = z.kind[i] ?? 0;
      const dx = (z.x[i] ?? 0) - bx;
      const dy = (z.y[i] ?? 0) - by;
      if (dx * dx + dy * dy < hitR2(kind)) {
        w.bHit[j] = i;
        hurtZombie(w, i, dmg);
        if ((w.bPierce[j] ?? 0) > 0) w.bPierce[j] = (w.bPierce[j] ?? 1) - 1;
        else { b.alive[j] = 0; break; }
      }
    }
  }
  if ((w.upgrades[UPG_TESLA] ?? 0) > 0 && --w.teslaCd <= 0) {
    zap(w);
    w.teslaCd = teslaEvery(w);
  }
  spinSaws(w);
  pullCogs(w);
}
