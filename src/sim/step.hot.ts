import { nextFloat } from "./rng";
import { EV_HURT, EV_KILL, EV_SHOT, EV_WAVE, H, MAX_BULLETS, MAX_ZOMBIES, W, type Input, type World } from "./types";
const PLAYER_SPEED = 2;
const BULLET_SPEED = 5;
const FIRE_EVERY = 12;
const HIT_R2 = 100;
const TOUCH_R2 = 144;
function spawnZombie(w: World): void {
  const z = w.zombies;
  for (let i = 0; i < MAX_ZOMBIES; i++) {
    if (z.alive[i]) continue;
    const t = nextFloat(w.rng) * 4;
    const u = nextFloat(w.rng);
    z.x[i] = t < 1 ? u * W : t < 2 ? W + 8 : t < 3 ? u * W : -8;
    z.y[i] = t < 1 ? -8 : t < 2 ? u * H : t < 3 ? H + 8 : u * H;
    z.hp[i] = 1 + (w.wave >> 2);
    z.vx[i] = 0.4 + w.wave * 0.05 + nextFloat(w.rng) * 0.3;
    z.alive[i] = 1;
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
  const b = w.bullets;
  for (let j = 0; j < MAX_BULLETS; j++) {
    if (b.alive[j]) continue;
    const dx = (z.x[best] ?? 0) - w.px;
    const dy = (z.y[best] ?? 0) - w.py;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    b.x[j] = w.px; b.y[j] = w.py;
    b.vx[j] = (dx / len) * BULLET_SPEED; b.vy[j] = (dy / len) * BULLET_SPEED;
    b.alive[j] = 1;
    w.events[EV_SHOT] = 1;
    return;
  }
}
export function step(w: World, input: Input): void {
  w.events.fill(0);
  if (w.over) return;
  w.tick++;
  const len = Math.sqrt(input.dx * input.dx + input.dy * input.dy);
  if (len > 0) { w.px += (input.dx / Math.max(1, len)) * PLAYER_SPEED; w.py += (input.dy / Math.max(1, len)) * PLAYER_SPEED; }
  w.px = Math.min(W - 6, Math.max(6, w.px));
  w.py = Math.min(H - 6, Math.max(6, w.py));
  const z = w.zombies;
  let alive = 0;
  for (let i = 0; i < MAX_ZOMBIES; i++) if (z.alive[i]) alive++;
  if (alive === 0 && w.toSpawn === 0) { w.wave++; w.toSpawn = 3 + w.wave * 2; w.events[EV_WAVE] = 1; }
  if (w.toSpawn > 0 && --w.spawnCd <= 0) { spawnZombie(w); w.toSpawn--; w.spawnCd = Math.max(8, 40 - w.wave * 3); }
  if (--w.fireCd <= 0) { fire(w); w.fireCd = FIRE_EVERY; }
  if (w.hurtCd > 0) w.hurtCd--;
  for (let i = 0; i < MAX_ZOMBIES; i++) {
    if (!z.alive[i]) continue;
    const dx = w.px - (z.x[i] ?? 0);
    const dy = w.py - (z.y[i] ?? 0);
    const d2 = dx * dx + dy * dy;
    const d = Math.sqrt(d2) || 1;
    const sp = z.vx[i] ?? 0;
    z.x[i] = (z.x[i] ?? 0) + (dx / d) * sp;
    z.y[i] = (z.y[i] ?? 0) + (dy / d) * sp;
    if (d2 < TOUCH_R2 && w.hurtCd === 0) {
      w.hp--; w.hurtCd = 45; w.events[EV_HURT] = 1;
      if (w.hp <= 0) { w.over = true; return; }
    }
  }
  const b = w.bullets;
  for (let j = 0; j < MAX_BULLETS; j++) {
    if (!b.alive[j]) continue;
    const bx = (b.x[j] ?? 0) + (b.vx[j] ?? 0);
    const by = (b.y[j] ?? 0) + (b.vy[j] ?? 0);
    b.x[j] = bx; b.y[j] = by;
    if (bx < -10 || by < -10 || bx > W + 10 || by > H + 10) { b.alive[j] = 0; continue; }
    for (let i = 0; i < MAX_ZOMBIES; i++) {
      if (!z.alive[i]) continue;
      const dx = (z.x[i] ?? 0) - bx;
      const dy = (z.y[i] ?? 0) - by;
      if (dx * dx + dy * dy < HIT_R2) {
        b.alive[j] = 0;
        z.hp[i] = (z.hp[i] ?? 1) - 1;
        if ((z.hp[i] ?? 0) <= 0) { z.alive[i] = 0; w.score += 10 * w.wave; w.events[EV_KILL] = 1; }
        break;
      }
    }
  }
}
