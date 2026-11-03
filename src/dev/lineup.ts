import {
  B_ACID, foeHp, Z_ELITE, Z_GAS, Z_KIND, Z_KNIGHT, Z_RAT, Z_SPITTER,
} from "../sim/foes";
import { MAX_BULLETS, MAX_ZOMBIES, type World } from "../sim/types";

const ROW = [Z_SPITTER, Z_GAS, Z_KNIGHT, Z_RAT];

export function lineup(w: World): void {
  w.toSpawn = 0;
  w.spawnCd = 99999;
  w.fireCd = 99999;
  w.wave = 8;
  w.hurtCd = 0;
  w.over = false;
  w.choosing = 0;
  w.px = 36;
  w.py = 292;
  w.aimX = 1;
  w.aimY = 0;
  const z = w.zombies;
  for (let i = 0; i < MAX_ZOMBIES; i++) z.alive[i] = 0;
  let n = 0;
  for (let elite = 0; elite < 2; elite++) {
    for (let k = 0; k < ROW.length; k++) {
      const base = ROW[k] ?? Z_SPITTER;
      const raw = elite ? base | Z_ELITE : base;
      const pack = base === Z_RAT ? 4 : 1;
      for (let p = 0; p < pack; p++) {
        const i = n++;
        z.alive[i] = 1;
        z.kind[i] = raw;
        z.x[i] = 70 + k * 100 + (base === Z_RAT ? (p - 1.5) * 14 : 0);
        z.y[i] = (elite ? 230 : 130) + (base === Z_RAT ? (p & 1) * 10 : 0);
        z.vx[i] = 0;
        z.vy[i] = base === Z_KNIGHT ? Math.PI : base === Z_SPITTER ? 40 : 0;
        z.hp[i] = foeHp(raw & Z_KIND, 8, elite === 1);
      }
    }
  }
  const b = w.bullets;
  for (let j = 0; j < MAX_BULLETS; j++) b.alive[j] = 0;
  b.alive[0] = 1;
  b.kind[0] = 0;
  b.hp[0] = B_ACID;
  b.x[0] = 118;
  b.y[0] = 108;
  b.vx[0] = -1.4;
  b.vy[0] = 0.2;
}

export function rush(w: World): void {
  w.wave = 10;
  w.rank = 4;
  w.toSpawn = 48;
  w.spawnCd = 0;
  w.hp = w.maxHp;
  w.over = false;
  w.choosing = 0;
}
