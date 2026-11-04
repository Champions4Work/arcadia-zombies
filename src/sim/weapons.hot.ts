import { bulletBlocks } from "./arena.hot";
import { ARENA_H, ARENA_W } from "./arena";
import { emitFx, hurtZombie } from "./combat.hot";
import { fogSight } from "./map-events";
import { freshShot, lichUp, lichX, lichY } from "./finale";
import { bounceBonus, pelletBonus, pierceBonus } from "./evolve";
import { B_ACID, knightBlocks, Z_KIND, Z_KNIGHT } from "./foes";
import { acidTouch } from "./foes.hot";
import { beginQuery, beginRadiusQuery, nextQuery, rebuildZombieGrid } from "./grid.hot";
import { bodyReach, FOE_BODY, foeBodyHit } from "./hit";
import { juiceShot } from "../render/juice";
import { muzzleX, muzzleY } from "./muzzle";
import {
  EV_BOOM, EV_SHOT, EVOL_CANNON, FX_BOOM, FX_FLASH, FX_SPARK, MAX_BULLETS, MAX_ZOMBIES, UPG_PIERCE,
  UPG_RICOCHET, UPG_SHOTGUN, UPG_WPN_FLAME, UPG_WPN_HARP, UPG_WPN_MORT, UPG_WPN_RIVET, UPG_WPN_SHOT,
  WPN_FLAME, WPN_HARP, WPN_MORT, WPN_RIVET, WPN_SHOT, type World,
} from "./types";
import {
  BOMB_FUSE, flameHit, flameJets, flameLife, harpoonDamage, harpoonPierce, mortarDamage, mortarRadius,
  pelletCount, pelletHit, pelletLife, rivetHit, weaponEvery,
} from "./weapons";

const FLAME_R2 = 324;
const BOMB_G = 0.16;

function aimAt(w: World): number {
  if (lichUp(w)) {
    const dx = lichX(w) - w.px;
    const dy = lichY(w) - w.py;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    w.aimX = dx / len;
    w.aimY = dy / len;
    return 1;
  }
  const boss = w.boss;
  if (boss.on) {
    const dx = boss.x - w.px;
    const dy = boss.y - w.py;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    w.aimX = dx / len;
    w.aimY = dy / len;
    return 1;
  }
  const z = w.zombies;
  const sight = fogSight(w);
  let best = -1;
  let bd = sight * sight;
  for (let i = 0; i < MAX_ZOMBIES; i++) {
    if (!z.alive[i]) continue;
    const dx = (z.x[i] ?? 0) - w.px;
    const dy = (z.y[i] ?? 0) - w.py;
    const d = dx * dx + dy * dy;
    if (d < bd) { bd = d; best = i; }
  }
  if (best < 0) return 0;
  const dx = (z.x[best] ?? 0) - w.px;
  const dy = (z.y[best] ?? 0) - w.py;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  w.aimX = dx / len;
  w.aimY = dy / len;
  return 1;
}

function spawnShot(w: World, ux: number, uy: number, speed: number, dmg: number, pierce: number, gun: number, life: number, bounce: number): number {
  const b = w.bullets;
  for (let j = 0; j < MAX_BULLETS; j++) {
    if (b.alive[j]) continue;
    const mx = muzzleX(w.px, ux, uy, gun);
    const my = muzzleY(w.py, ux, uy, gun);
    b.x[j] = mx;
    b.y[j] = my;
    b.vx[j] = ux * speed;
    b.vy[j] = uy * speed;
    b.hp[j] = dmg;
    b.alive[j] = 1;
    b.kind[j] = bounce;
    w.bHit[j] = -1;
    w.bPierce[j] = pierce;
    w.boss.bulletMark[j] = 0;
    w.bLife[j] = life;
    w.bGun[j] = gun;
    w.bRad[j] = 0;
    w.gun = gun;
    freshShot(w, j);
    w.events[EV_SHOT] = 1;
    emitFx(w, FX_FLASH, mx, my, Math.atan2(uy, ux));
    juiceShot(mx, my, ux, uy, w.tick);
    return j;
  }
  return -1;
}

function spray(w: World, ux: number, uy: number, n: number, step: number, speed: number, dmg: number, pierce: number, gun: number, life: number): void {
  const mid = (n - 1) * 0.5;
  for (let s = 0; s < n; s++) {
    const a = (s - mid) * step;
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    spawnShot(w, ux * ca - uy * sa, ux * sa + uy * ca, speed, dmg, pierce, gun, life, 0);
  }
}

export function fireRivet(w: World): void {
  if (!aimAt(w)) return;
  const lv = w.upgrades[UPG_WPN_RIVET] ?? 1;
  const pierce = (w.upgrades[UPG_PIERCE] ?? 0) + (w.upgrades[EVOL_CANNON] ?? 0) + pierceBonus(w);
  const bounce = (w.upgrades[UPG_RICOCHET] ?? 0) + bounceBonus(w);
  const ux = w.aimX;
  const uy = w.aimY;
  spawnShot(w, ux, uy, 5, 0, pierce, WPN_RIVET, 0, bounce);
  if (lv >= 5) {
    const ca = Math.cos(0.12);
    const sa = Math.sin(0.12);
    spawnShot(w, ux * ca - uy * sa, ux * sa + uy * ca, 5, 0, pierce, WPN_RIVET, 0, bounce);
  }
  const n = (w.upgrades[UPG_SHOTGUN] ?? 0) + (w.upgrades[EVOL_CANNON] ?? 0) + pelletBonus(w);
  for (let s = 1; s <= n; s++) {
    const a = s * 0.28;
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    spawnShot(w, ux * ca - uy * sa, ux * sa + uy * ca, 5, 0, pierce, WPN_RIVET, 0, bounce);
    spawnShot(w, ux * ca + uy * sa, -ux * sa + uy * ca, 5, 0, pierce, WPN_RIVET, 0, bounce);
  }
}

function fireShotgun(w: World, lv: number): void {
  if (!aimAt(w)) return;
  spray(w, w.aimX, w.aimY, pelletCount(lv), 0.18, 3.3, pelletHit(w), 0, WPN_SHOT, pelletLife(lv));
}

function fireFlame(w: World, lv: number): void {
  if (!aimAt(w)) return;
  spray(w, w.aimX, w.aimY, flameJets(lv), 0.2, 2, flameHit(w), 0, WPN_FLAME, flameLife(lv));
}

function fireHarpoon(w: World, lv: number): void {
  if (!aimAt(w)) return;
  spawnShot(w, w.aimX, w.aimY, 3.2 + lv * 0.15, harpoonDamage(w, lv), harpoonPierce(lv), WPN_HARP, 0, 0);
}

function fireMortar(w: World, lv: number): void {
  if (!aimAt(w)) return;
  const j = spawnShot(w, w.aimX, w.aimY, 2.1, mortarDamage(w, lv), 0, WPN_MORT, BOMB_FUSE, 0);
  if (j < 0) return;
  w.bRad[j] = mortarRadius(lv);
  w.bullets.vy[j] = (w.bullets.vy[j] ?? 0) - 2.2;
}

function ready(w: World, idx: number, lv: number): number {
  if (lv <= 0) return 0;
  const left = w.wpnCd[idx] ?? 0;
  if (left > 0) {
    w.wpnCd[idx] = left - 1;
    return 0;
  }
  w.wpnCd[idx] = weaponEvery(w, idx, lv);
  return 1;
}

export function tickWeapons(w: World): void {
  const shot = w.upgrades[UPG_WPN_SHOT] ?? 0;
  if (ready(w, WPN_SHOT, shot)) fireShotgun(w, shot);
  const flame = w.upgrades[UPG_WPN_FLAME] ?? 0;
  if (ready(w, WPN_FLAME, flame)) fireFlame(w, flame);
  const harp = w.upgrades[UPG_WPN_HARP] ?? 0;
  if (ready(w, WPN_HARP, harp)) fireHarpoon(w, harp);
  const mort = w.upgrades[UPG_WPN_MORT] ?? 0;
  if (ready(w, WPN_MORT, mort)) fireMortar(w, mort);
}

function explode(w: World, j: number, x: number, y: number): number {
  const b = w.bullets;
  const z = w.zombies;
  const dmg = (b.hp[j] ?? 0) || 1;
  const r = w.bRad[j] ?? 0;
  const r2 = r * r;
  w.events[EV_BOOM] = 1;
  emitFx(w, FX_BOOM, x, y, r);
  beginRadiusQuery(x, y, r);
  for (;;) {
    const i = nextQuery();
    if (i < 0) break;
    if (!z.alive[i]) continue;
    const dx = (z.x[i] ?? 0) - x;
    const dy = (z.y[i] ?? 0) - y;
    if (dx * dx + dy * dy <= r2) {
      hurtZombie(w, i, dmg);
      if (w.over) return 1;
    }
  }
  return 0;
}

function bounceRivet(w: World, j: number, bx: number, by: number): number {
  const b = w.bullets;
  let left = b.kind[j] ?? 0;
  let x = bx;
  let y = by;
  if (left > 0 && (x < 2 || x > ARENA_W - 2)) {
    b.vx[j] = -(b.vx[j] ?? 0);
    x = x < 2 ? 2 : ARENA_W - 2;
    left--;
  }
  if (left > 0 && (y < 2 || y > ARENA_H - 2)) {
    b.vy[j] = -(b.vy[j] ?? 0);
    y = y < 2 ? 2 : ARENA_H - 2;
    left--;
  }
  b.kind[j] = left;
  b.x[j] = x;
  b.y[j] = y;
  return x < -24 || y < -24 || x > ARENA_W + 24 || y > ARENA_H + 24 ? 1 : 0;
}

export function tickProjectiles(w: World): number {
  const b = w.bullets;
  const z = w.zombies;
  rebuildZombieGrid(z.alive, z.x, z.y, MAX_ZOMBIES);
  for (let j = 0; j < MAX_BULLETS; j++) {
    if (!b.alive[j]) continue;
    const gun = w.bGun[j] ?? 0;
    if (gun === WPN_MORT) b.vy[j] = (b.vy[j] ?? 0) + BOMB_G;
    let bx = (b.x[j] ?? 0) + (b.vx[j] ?? 0);
    let by = (b.y[j] ?? 0) + (b.vy[j] ?? 0);
    if (gun === WPN_RIVET) {
      if (bounceRivet(w, j, bx, by)) {
        b.alive[j] = 0;
        continue;
      }
      bx = b.x[j] ?? bx;
      by = b.y[j] ?? by;
    } else {
      b.x[j] = bx;
      b.y[j] = by;
      if (gun !== WPN_MORT && (bx < -24 || by < -24 || bx > ARENA_W + 24 || by > ARENA_H + 24)) {
        b.alive[j] = 0;
        continue;
      }
    }
    if (gun === WPN_RIVET && (b.hp[j] ?? 0) === B_ACID) {
      const hit = acidTouch(w, bx, by);
      if (hit > 0) b.alive[j] = 0;
      if (hit === 2) return 1;
      continue;
    }
    const life = w.bLife[j] ?? 0;
    if (life > 0) {
      const next = life - 1;
      w.bLife[j] = next;
      if (next === 0) {
        const ended = gun === WPN_MORT ? explode(w, j, bx, by) : 0;
        b.alive[j] = 0;
        if (ended) return 1;
        continue;
      }
    }
    if (gun === WPN_FLAME) {
      if (((w.tick + j) & 3) !== 0) continue;
      const dmg = (b.hp[j] ?? 0) || 1;
      beginQuery(bx, by + (FOE_BODY >> 1));
      for (;;) {
        const i = nextQuery();
        if (i < 0) break;
        if (!z.alive[i]) continue;
        if (bodyReach(z.x[i] ?? 0, z.y[i] ?? 0, bx, by, FLAME_R2)) {
          hurtZombie(w, i, dmg);
          if (w.over) return 1;
        }
      }
      continue;
    }
    if (gun === WPN_MORT) {
      beginQuery(bx, by + (FOE_BODY >> 1));
      for (;;) {
        const i = nextQuery();
        if (i < 0) break;
        if (!z.alive[i]) continue;
        const raw = z.kind[i] ?? 0;
        if (foeBodyHit(raw, z.x[i] ?? 0, z.y[i] ?? 0, bx, by)) {
          const ended = explode(w, j, bx, by);
          b.alive[j] = 0;
          if (ended) return 1;
          break;
        }
      }
      continue;
    }
    const dmg = gun === WPN_RIVET ? rivetHit(w) : ((b.hp[j] ?? 0) || 1);
    beginQuery(bx, by + (FOE_BODY >> 1));
    for (;;) {
      const i = nextQuery();
      if (i < 0) break;
      if (!z.alive[i] || w.bHit[j] === i) continue;
      const raw = z.kind[i] ?? 0;
      const zx = z.x[i] ?? 0;
      const zy = z.y[i] ?? 0;
      if (foeBodyHit(raw, zx, zy, bx, by)) {
        if ((raw & Z_KIND) === Z_KNIGHT && knightBlocks(z.vy[i] ?? 0, zx, zy, bx, by)) {
          b.alive[j] = 0;
          emitFx(w, FX_SPARK, bx, by, Math.atan2(b.vy[j] ?? 0, b.vx[j] || 1));
          break;
        }
        w.bHit[j] = i;
        hurtZombie(w, i, dmg);
        if (w.over) return 1;
        if ((w.bPierce[j] ?? 0) > 0) w.bPierce[j] = (w.bPierce[j] ?? 1) - 1;
        else {
          b.alive[j] = 0;
          break;
        }
      }
    }
    if (b.alive[j] && bulletBlocks(w, bx, by, dmg)) b.alive[j] = 0;
  }
  return 0;
}
