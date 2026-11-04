import { slideUnit } from "./arena.hot";
import { scaleThreat } from "./director";
import { scaledDmg } from "./difficulty";
import {
  ACID_DMG, ACID_HIT_R2, ACID_SPEED, B_ACID, GAS_BLAST_R2,
  GAS_BLAST_R2_ELITE, GAS_DMG, KNIGHT_TURN, KNIGHT_TURN_ELITE, SPIT_CD,
  SPIT_CD_ELITE, SPIT_FAR_R2, SPIT_MAX_R2, SPIT_NEAR_R2, Z_ELITE,
} from "./foes";
import { shieldReload } from "./progress";
import { fell } from "./revive";
import { juicePlayerHurt } from "../render/juice";
import { EV_HURT, EV_SHIELD, MAX_BULLETS, type World } from "./types";

function spawnAcid(w: World, x: number, y: number, ux: number, uy: number): boolean {
  const b = w.bullets;
  for (let j = 0; j < MAX_BULLETS; j++) {
    if (b.alive[j]) continue;
    b.x[j] = x + ux * 12;
    b.y[j] = y + uy * 8;
    b.vx[j] = ux * ACID_SPEED;
    b.vy[j] = uy * ACID_SPEED;
    b.alive[j] = 1;
    b.kind[j] = 0;
    b.hp[j] = B_ACID;
    w.bHit[j] = -1;
    w.bPierce[j] = 0;
    w.bLife[j] = 0;
    w.bGun[j] = 0;
    w.bRad[j] = 0;
    return true;
  }
  return false;
}

export function tickSpitter(w: World, i: number): void {
  const z = w.zombies;
  const zx = z.x[i] ?? 0;
  const zy = z.y[i] ?? 0;
  const dx = w.px - zx;
  const dy = w.py - zy;
  const d2 = dx * dx + dy * dy;
  const d = Math.sqrt(d2) || 1;
  const sp = z.vx[i] ?? 0;
  let mx = dx / d;
  let my = dy / d;
  if (d2 < SPIT_NEAR_R2) {
    mx = -mx;
    my = -my;
  } else if (d2 <= SPIT_FAR_R2) {
    const side = ((w.tick + i) & 64) === 0 ? -1 : 1;
    mx = (-dy / d) * side;
    my = (dx / d) * side;
  }
  slideUnit(w, i, mx, my, sp, 8);
  const cd = z.vy[i] ?? 0;
  if (cd > 0) {
    z.vy[i] = cd - 1;
    return;
  }
  if (d2 > SPIT_MAX_R2) return;
  const shot = spawnAcid(w, zx, zy, dx / d, dy / d);
  const elite = ((z.kind[i] ?? 0) & Z_ELITE) !== 0;
  z.vy[i] = shot ? (elite ? SPIT_CD_ELITE : SPIT_CD) : 12;
}

export function tickKnight(w: World, i: number): void {
  const z = w.zombies;
  const want = Math.atan2(w.py - (z.y[i] ?? 0), w.px - (z.x[i] ?? 0));
  let face = z.vy[i] ?? 0;
  let d = want - face;
  const turn = ((z.kind[i] ?? 0) & Z_ELITE) !== 0 ? KNIGHT_TURN_ELITE : KNIGHT_TURN;
  if (d > Math.PI) d -= Math.PI * 2;
  else if (d < -Math.PI) d += Math.PI * 2;
  if (d > turn) d = turn;
  else if (d < -turn) d = -turn;
  face += d;
  if (face > Math.PI) face -= Math.PI * 2;
  else if (face < -Math.PI) face += Math.PI * 2;
  z.vy[i] = face;
}

export function acidTouch(w: World, x: number, y: number): number {
  const dx = x - w.px;
  const dy = y - w.py;
  if (dx * dx + dy * dy >= ACID_HIT_R2) return 0;
  if (w.hurtCd > 0) return 1;
  w.hurtCd = 45;
  if (w.shield > 0) {
    w.shield--;
    w.shieldCd = shieldReload(w);
    w.events[EV_SHIELD] = 1;
    return 1;
  }
  const acid = scaleThreat(scaledDmg(ACID_DMG, w.rank), w);
  w.hp -= acid;
  w.hurt += acid;
  w.events[EV_HURT] = 1;
  juicePlayerHurt();
  if (fell(w)) return 2;
  return 1;
}

export function detonateGas(w: World, x: number, y: number, elite: number): void {
  if (w.over) return;
  const dx = w.px - x;
  const dy = w.py - y;
  const r2 = elite ? GAS_BLAST_R2_ELITE : GAS_BLAST_R2;
  if (dx * dx + dy * dy > r2) return;
  if (w.hurtCd > 0) return;
  w.hurtCd = 45;
  if (w.shield > 0) {
    w.shield--;
    w.shieldCd = shieldReload(w);
    w.events[EV_SHIELD] = 1;
    return;
  }
  const blast = scaleThreat(scaledDmg(GAS_DMG, w.rank), w);
  w.hp -= blast;
  w.hurt += blast;
  w.events[EV_HURT] = 1;
  juicePlayerHurt();
  fell(w);
}
