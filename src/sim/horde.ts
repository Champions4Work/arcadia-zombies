import { H, MAX_BULLETS, MAX_ZOMBIES, W, type World } from "./types";

export const HORDE_ZOMBIES = 1500;
export const HORDE_BULLETS = 1000;
const POCKET = 120;

export function fillHorde(w: World, zombies = HORDE_ZOMBIES, bullets = HORDE_BULLETS): void {
  const zN = Math.min(zombies, MAX_ZOMBIES);
  const bN = Math.min(bullets, MAX_BULLETS);
  const cols = 40;
  const rows = Math.ceil(zN / cols);
  const z = w.zombies;
  for (let i = 0; i < zN; i++) {
    const c = i % cols;
    const r = (i / cols) | 0;
    let x = (c + 0.5) * (W / cols);
    let y = (r + 0.5) * (H / rows);
    const dx = x - w.px;
    const dy = y - w.py;
    if (dx * dx + dy * dy < POCKET * POCKET) {
      x = dx < 0 ? 16 : W - 16;
      y = Math.min(H - 16, Math.max(24, y));
    }
    const kind = i % 3;
    z.x[i] = x;
    z.y[i] = y;
    z.kind[i] = kind;
    z.hp[i] = 8000;
    z.vx[i] = 0.02;
    z.vy[i] = 0;
    z.alive[i] = 1;
  }
  for (let i = zN; i < MAX_ZOMBIES; i++) z.alive[i] = 0;
  const b = w.bullets;
  const bCols = 40;
  for (let j = 0; j < bN; j++) {
    const c = j % bCols;
    const r = (j / bCols) | 0;
    b.x[j] = (c + 0.5) * (W / bCols);
    b.y[j] = (r + 0.5) * (H / Math.ceil(bN / bCols));
    const dir = j & 3;
    b.vx[j] = dir === 0 ? 5 : dir === 1 ? -5 : 0;
    b.vy[j] = dir === 2 ? 5 : dir === 3 ? -5 : 0;
    b.alive[j] = 1;
    b.hp[j] = 0;
    b.kind[j] = 0;
    w.bHit[j] = -1;
    w.bPierce[j] = 0;
    w.bLife[j] = 0;
    w.bGun[j] = 0;
    w.bRad[j] = 0;
  }
  for (let j = bN; j < MAX_BULLETS; j++) b.alive[j] = 0;
  w.toSpawn = 0;
  w.spawnCd = 99999;
  w.fireCd = 2;
  w.hurtCd = 90;
  w.wave = Math.max(w.wave, 6);
  w.over = false;
  w.choosing = 0;
}
