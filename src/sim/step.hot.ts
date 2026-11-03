import {
  ARENA_H, ARENA_W, ARENA_WALL, BLAST_R2, OBS_BARREL, OBS_VENT, PLAYER_R, VENT_CYCLE, VENT_REACH,
  actorStep, bodyR, clampX, clampY, obstacleAt, stepSide, stepX, stepY,
} from "./arena";
import { scaledDmg, spawnEvery, tierAt } from "./difficulty";
import {
  B_ACID, foeContact, foeHitR2, foeKillXp, foeScore, foeTouchR2, GAS_FUSE_R2, knightBlocks,
  Z_ELITE, Z_GAS, Z_KIND, Z_KNIGHT, Z_SPITTER,
} from "./foes";
import { acidTouch, detonateGas, spawnWaveFoe, tickKnight, tickSpitter } from "./foes.hot";
import {
  bulletDmg, fireEvery, healEvery, mortarEvery, moveSpeed, SAW_HIT_R2, sawAngle, sawDamage,
  sawRadius, shieldReload, takeXp, teslaChain, teslaEvery, teslaPower, teslaRange, tryPick,
  ventEvery, ventRange, whistleRange,
} from "./progress";
import {
  EV_BOOM, EV_HURT, EV_KILL, EV_RANK, EV_SAW, EV_SHIELD, EV_SHOT, EV_TESLA, EV_WAVE, FX_FLASH, FX_PUFF, FX_SPARK,
  FX_XP, MAX_BULLETS, MAX_FX, MAX_ZOMBIES, UPG_COOLANT, UPG_DYNAMO, UPG_MORTAR, UPG_PIERCE, UPG_RICOCHET,
  UPG_SAWS, UPG_SHIELD, UPG_SHOTGUN, UPG_SPIKES, UPG_TESLA, UPG_VENT, UPG_WHISTLE, Z_BRUTE,
  EVOL_AEGIS, EVOL_CANNON, type Input, type World,
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
function killZombie(w: World, i: number): void {
  const z = w.zombies;
  const raw = z.kind[i] ?? 0;
  const x = z.x[i] ?? 0;
  const y = z.y[i] ?? 0;
  z.alive[i] = 0;
  w.score += foeScore(raw, w.wave, w.rank);
  w.events[EV_KILL] = 1;
  emitFx(w, FX_PUFF, x, y, raw & Z_KIND);
  const xp = foeKillXp(raw, w.rank);
  emitFx(w, FX_XP, x, y - 8, xp);
  const dyn = w.upgrades[UPG_DYNAMO] ?? 0;
  if (dyn > 0) w.fireCd = Math.max(0, w.fireCd - dyn * 3);
  takeXp(w, xp);
  if ((raw & Z_KIND) === Z_GAS) detonateGas(w, x, y, (raw & Z_ELITE) !== 0 ? 1 : 0);
}
function hurtZombie(w: World, i: number, dmg: number): void {
  const z = w.zombies;
  z.hp[i] = (z.hp[i] ?? 1) - dmg;
  emitFx(w, FX_SPARK, z.x[i] ?? 0, z.y[i] ?? 0, 0);
  if ((z.hp[i] ?? 0) <= 0) killZombie(w, i);
}
function pulseAt(w: World, x: number, y: number, r: number, dmg: number): void {
  const z = w.zombies;
  const r2 = r * r;
  for (let i = 0; i < MAX_ZOMBIES; i++) {
    if (!z.alive[i]) continue;
    const dx = (z.x[i] ?? 0) - x;
    const dy = (z.y[i] ?? 0) - y;
    if (dx * dx + dy * dy < r2) {
      hurtZombie(w, i, dmg);
      if (w.over) return;
    }
  }
}
function harmPlayer(w: World, dmg: number): boolean {
  w.hurtCd = 45;
  if (w.shield > 0) {
    w.shield--;
    w.shieldCd = shieldReload(w);
    w.events[EV_SHIELD] = 1;
    const aegis = w.upgrades[EVOL_AEGIS] ?? 0;
    if (aegis > 0) {
      pulseAt(w, w.px, w.py, 52 + aegis * 8, aegis + 1);
      if (w.over) return true;
    }
    return false;
  }
  w.hp -= dmg;
  w.events[EV_HURT] = 1;
  const spikes = w.upgrades[UPG_SPIKES] ?? 0;
  if (spikes > 0) {
    thorns(w, spikes);
    if (w.over) return true;
  }
  if (w.hp <= 0) { w.over = true; return true; }
  return false;
}
function blast(w: World, i: number): void {
  const a = w.arena;
  if (!(a.alive[i] ?? 0) || (a.kind[i] ?? 0) !== OBS_BARREL) return;
  a.alive[i] = 0;
  const x = a.x[i] ?? 0;
  const y = a.y[i] ?? 0;
  w.events[EV_BOOM] = 1;
  emitFx(w, FX_FLASH, x, y, 0);
  emitFx(w, FX_PUFF, x, y, Z_BRUTE);
  const z = w.zombies;
  for (let k = 0; k < MAX_ZOMBIES; k++) {
    if (!z.alive[k]) continue;
    const dx = (z.x[k] ?? 0) - x;
    const dy = (z.y[k] ?? 0) - y;
    if (dx * dx + dy * dy < BLAST_R2) hurtZombie(w, k, 8);
  }
  const pdx = w.px - x;
  const pdy = w.py - y;
  if (!w.over && w.hurtCd === 0 && pdx * pdx + pdy * pdy < BLAST_R2) harmPlayer(w, 2);
  for (let j = 0; j < a.n; j++) {
    if (j === i || !(a.alive[j] ?? 0) || (a.kind[j] ?? 0) !== OBS_BARREL) continue;
    const dx = (a.x[j] ?? 0) - x;
    const dy = (a.y[j] ?? 0) - y;
    if (dx * dx + dy * dy < BLAST_R2) blast(w, j);
  }
}
function tickVents(w: World): void {
  const a = w.arena;
  const z = w.zombies;
  for (let i = 0; i < a.n; i++) {
    if ((a.kind[i] ?? 0) !== OBS_VENT || !(a.alive[i] ?? 0)) continue;
    if (((w.tick + (a.phase[i] ?? 0)) % VENT_CYCLE) !== 0) continue;
    const vx = a.x[i] ?? 0;
    const vy = a.y[i] ?? 0;
    const pdx = w.px - vx;
    const pdy = w.py - vy;
    const reach = PLAYER_R + VENT_REACH;
    if (!w.over && w.hurtCd === 0 && pdx * pdx + pdy * pdy < reach * reach) {
      if (harmPlayer(w, scaledDmg(1, w.rank))) return;
    }
    for (let k = 0; k < MAX_ZOMBIES; k++) {
      if (!z.alive[k]) continue;
      const dx = (z.x[k] ?? 0) - vx;
      const dy = (z.y[k] ?? 0) - vy;
      const rad = bodyR(z.kind[k] ?? 0) + VENT_REACH;
      if (dx * dx + dy * dy < rad * rad) hurtZombie(w, k, 1);
    }
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
    b.hp[j] = 0;
    b.kind[j] = w.upgrades[UPG_RICOCHET] ?? 0;
    w.bHit[j] = -1;
    w.bPierce[j] = (w.upgrades[UPG_PIERCE] ?? 0) + (w.upgrades[EVOL_CANNON] ?? 0);
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
  const n = (w.upgrades[UPG_SHOTGUN] ?? 0) + (w.upgrades[EVOL_CANNON] ?? 0);
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
  const power = teslaPower(w);
  const firstR2 = teslaRange(w) * teslaRange(w);
  const hopR2 = teslaChain(w) * teslaChain(w);
  for (let i = 0; i < MAX_ZOMBIES; i++) w.zMark[i] = 0;
  w.teslaN = 0;
  let cx = w.px;
  let cy = w.py;
  let lim = firstR2;
  for (let hop = 0; hop < power; hop++) {
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
    hurtZombie(w, best, power);
    if (w.over) return;
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
  const dmg = sawDamage(w);
  for (let s = 0; s < n; s++) {
    const a = sawAngle(w.tick, s, n);
    const sx = w.px + Math.cos(a) * r;
    const sy = w.py + Math.sin(a) * r;
    for (let i = 0; i < MAX_ZOMBIES; i++) {
      if (!z.alive[i]) continue;
      const dx = (z.x[i] ?? 0) - sx;
      const dy = (z.y[i] ?? 0) - sy;
      if (dx * dx + dy * dy < SAW_HIT_R2) {
        w.events[EV_SAW] = 1;
        hurtZombie(w, i, dmg);
        if (w.over) return;
      }
    }
  }
}
function ventPulse(w: World): void {
  const lvl = w.upgrades[UPG_VENT] ?? 0;
  if (lvl <= 0) return;
  pulseAt(w, w.px, w.py, ventRange(w), lvl + (w.upgrades[EVOL_AEGIS] ?? 0));
  emitFx(w, FX_FLASH, w.px, w.py, 0);
}
function mortarShot(w: World): void {
  const lvl = w.upgrades[UPG_MORTAR] ?? 0;
  if (lvl <= 0) return;
  const z = w.zombies;
  let best = -1;
  let bd = -1;
  for (let i = 0; i < MAX_ZOMBIES; i++) {
    if (!z.alive[i]) continue;
    const dx = (z.x[i] ?? 0) - w.px;
    const dy = (z.y[i] ?? 0) - w.py;
    const d = dx * dx + dy * dy;
    if (d > bd) { bd = d; best = i; }
  }
  if (best < 0) return;
  hurtZombie(w, best, 2 + lvl);
  if (w.over) return;
  emitFx(w, FX_SPARK, z.x[best] ?? 0, z.y[best] ?? 0, 0);
}
function thorns(w: World, dmg: number): void {
  const z = w.zombies;
  const r2 = 46 * 46;
  for (let i = 0; i < MAX_ZOMBIES; i++) {
    if (!z.alive[i]) continue;
    const dx = (z.x[i] ?? 0) - w.px;
    const dy = (z.y[i] ?? 0) - w.py;
    if (dx * dx + dy * dy < r2) {
      hurtZombie(w, i, dmg);
      if (w.over) return;
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
  if (w.rankFlash > 0) w.rankFlash--;
  if (w.banner > 0) w.banner--;
  const next = tierAt(w.tick);
  if (next > w.rank) {
    w.rank = next;
    w.rankFlash = 36;
    w.banner = 150;
    w.events[EV_RANK] = 1;
  }
  if (w.teslaFlash > 0) w.teslaFlash--;
  const len = Math.sqrt(input.dx * input.dx + input.dy * input.dy);
  const sp = moveSpeed(w);
  let mx = w.px;
  let my = w.py;
  if (len > 0) {
    const sc = sp / Math.max(1, len);
    mx += input.dx * sc;
    my += input.dy * sc;
  }
  mx = clampX(mx, PLAYER_R);
  my = clampY(my, PLAYER_R);
  if (obstacleAt(w.arena, mx, w.py, PLAYER_R) < 0) w.px = mx;
  if (obstacleAt(w.arena, w.px, my, PLAYER_R) < 0) w.py = my;
  const z = w.zombies;
  let alive = 0;
  for (let i = 0; i < MAX_ZOMBIES; i++) if (z.alive[i]) alive++;
  if (alive === 0 && w.toSpawn === 0) {
    w.wave++;
    w.toSpawn = 4 + w.wave * 2 + w.rank;
    w.events[EV_WAVE] = 1;
  }
  if (w.toSpawn > 0 && --w.spawnCd <= 0) {
    spawnWaveFoe(w);
    w.toSpawn--;
    w.spawnCd = spawnEvery(w.rank);
  }
  if (--w.fireCd <= 0) { fire(w); w.fireCd = fireEvery(w); }
  if (w.hurtCd > 0) w.hurtCd--;
  const cool = w.upgrades[UPG_COOLANT] ?? 0;
  if (cool > 0 && w.hp < w.maxHp && --w.healCd <= 0) {
    w.hp++;
    w.healCd = healEvery(w);
  }
  const cap = w.upgrades[UPG_SHIELD] ?? 0;
  if (cap > 0 && w.shield < cap && --w.shieldCd <= 0) {
    w.shield++;
    w.shieldCd = shieldReload(w);
  }
  const whistle = w.upgrades[UPG_WHISTLE] ?? 0;
  const wr = whistle > 0 ? whistleRange(w) : 0;
  const wr2 = wr * wr;
  for (let i = 0; i < MAX_ZOMBIES; i++) {
    if (!z.alive[i]) continue;
    const raw = z.kind[i] ?? 0;
    const kind = raw & Z_KIND;
    if (kind === Z_SPITTER) tickSpitter(w, i);
    else {
      const dx = w.px - (z.x[i] ?? 0);
      const dy = w.py - (z.y[i] ?? 0);
      const d2 = dx * dx + dy * dy;
      let zsp = z.vx[i] ?? 0;
      if (whistle > 0 && d2 < wr2) zsp *= 0.62;
      actorStep(w.arena, z.x[i] ?? 0, z.y[i] ?? 0, w.px, w.py, bodyR(kind), zsp, w.zSide[i] ?? 0);
      z.x[i] = stepX();
      z.y[i] = stepY();
      w.zSide[i] = stepSide();
      if (kind === Z_KNIGHT) tickKnight(w, i);
    }
    const tx = w.px - (z.x[i] ?? 0);
    const ty = w.py - (z.y[i] ?? 0);
    const td2 = tx * tx + ty * ty;
    if (kind === Z_GAS && td2 < GAS_FUSE_R2) {
      killZombie(w, i);
      if (w.over) return;
      continue;
    }
    if (td2 < foeTouchR2(raw) && w.hurtCd === 0) {
      if (harmPlayer(w, scaledDmg(foeContact(raw), w.rank))) return;
    }
  }
  tickVents(w);
  if (w.over) return;
  const b = w.bullets;
  const dmg = bulletDmg(w);
  for (let j = 0; j < MAX_BULLETS; j++) {
    if (!b.alive[j]) continue;
    let bx = (b.x[j] ?? 0) + (b.vx[j] ?? 0);
    let by = (b.y[j] ?? 0) + (b.vy[j] ?? 0);
    let left = b.kind[j] ?? 0;
    if (left > 0 && (bx < ARENA_WALL || bx > ARENA_W - ARENA_WALL)) {
      b.vx[j] = -(b.vx[j] ?? 0);
      bx = bx < ARENA_WALL ? ARENA_WALL + 2 : ARENA_W - ARENA_WALL - 2;
      left--;
    }
    if (left > 0 && (by < ARENA_WALL || by > ARENA_H - ARENA_WALL)) {
      b.vy[j] = -(b.vy[j] ?? 0);
      by = by < ARENA_WALL ? ARENA_WALL + 2 : ARENA_H - ARENA_WALL - 2;
      left--;
    }
    b.kind[j] = left;
    b.x[j] = bx;
    b.y[j] = by;
    if (bx < ARENA_WALL || by < ARENA_WALL || bx > ARENA_W - ARENA_WALL || by > ARENA_H - ARENA_WALL) {
      b.alive[j] = 0;
      continue;
    }
    const obs = obstacleAt(w.arena, bx, by, 2);
    if (obs >= 0) {
      if ((w.arena.kind[obs] ?? 0) === OBS_BARREL) {
        w.arena.hp[obs] = (w.arena.hp[obs] ?? 1) - dmg;
        if ((w.arena.hp[obs] ?? 0) <= 0) blast(w, obs);
      }
      b.alive[j] = 0;
      if (w.over) return;
      continue;
    }
    if ((b.hp[j] ?? 0) === B_ACID) {
      const hit = acidTouch(w, bx, by);
      if (hit > 0) b.alive[j] = 0;
      if (hit === 2) return;
      continue;
    }
    for (let i = 0; i < MAX_ZOMBIES; i++) {
      if (!z.alive[i]) continue;
      if (w.bHit[j] === i) continue;
      const raw = z.kind[i] ?? 0;
      const zx = z.x[i] ?? 0;
      const zy = z.y[i] ?? 0;
      const dx = zx - bx;
      const dy = zy - by;
      if (dx * dx + dy * dy < foeHitR2(raw)) {
        if ((raw & Z_KIND) === Z_KNIGHT && knightBlocks(z.vy[i] ?? 0, zx, zy, bx, by)) {
          b.alive[j] = 0;
          emitFx(w, FX_SPARK, bx, by, 0);
          break;
        }
        w.bHit[j] = i;
        hurtZombie(w, i, dmg);
        if (w.over) return;
        if ((w.bPierce[j] ?? 0) > 0) w.bPierce[j] = (w.bPierce[j] ?? 1) - 1;
        else { b.alive[j] = 0; break; }
      }
    }
  }
  if ((w.upgrades[UPG_TESLA] ?? 0) > 0 && --w.teslaCd <= 0) {
    zap(w);
    if (w.over) return;
    w.teslaCd = teslaEvery(w);
  }
  if ((w.upgrades[UPG_VENT] ?? 0) > 0 && --w.ventCd <= 0) {
    ventPulse(w);
    if (w.over) return;
    w.ventCd = ventEvery(w);
  }
  if ((w.upgrades[UPG_MORTAR] ?? 0) > 0 && --w.mortarCd <= 0) {
    mortarShot(w);
    if (w.over) return;
    w.mortarCd = mortarEvery(w);
  }
  spinSaws(w);
}
