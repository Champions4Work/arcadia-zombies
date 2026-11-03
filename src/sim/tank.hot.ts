import { ARENA_H, ARENA_W } from "./arena";
import { MAX_BOSS_SHOTS, MAX_CLOUDS } from "./boss";
import { pacedSpeed } from "./modifiers";
import {
  PHASE_CANNON, PHASE_SCAR, SCAR_LIFE, SHOT_SHELL, TANK_PATTERNS,
  ramSpeed, scarAnchorX, scarAnchorY, scarRadius, shellSpeed, shellsFor,
} from "./tank";
import { type Boss, type World } from "./types";

export function stepTank(w: World): void {
  const b = w.boss;
  if (b.phase === PHASE_SCAR) stepScar(w);
  else if (b.phase === PHASE_CANNON) stepCannon(w);
  else stepRam(w);
}
function stepScar(w: World): void {
  const b = w.boss;
  if (b.mode === 1) {
    crawl(w, 0.16);
    if (b.timer > 0) return;
    dropScar(w, -1);
    dropScar(w, 1);
    settle(b, 44);
    return;
  }
  crawl(w, 0.3);
  if (b.timer <= 0) advance(w, 40);
}
function stepCannon(w: World): void {
  const b = w.boss;
  if (b.mode === 1) {
    crawl(w, 0);
    if (b.timer > 0) return;
    emitShell(w);
    const extra = shellsFor(b.tier) - 1;
    if (extra <= 0) {
      settle(b, 48);
      return;
    }
    b.mode = 2;
    b.timer = extra * 12;
    return;
  }
  if (b.mode === 2) {
    if (b.timer % 12 === 0) emitShell(w);
    if (b.timer <= 0) settle(b, 48);
    return;
  }
  crawl(w, 0.26);
  if (b.timer <= 0) advance(w, 36);
}
function stepRam(w: World): void {
  const b = w.boss;
  if (b.mode === 1) {
    crawl(w, 0.08);
    if (b.timer > 0) return;
    const sp = pacedSpeed(ramSpeed(b.tier), w.mods);
    b.mode = 2;
    b.timer = 14;
    b.vx = b.aimX * sp;
    b.vy = b.aimY * sp;
    b.slam = 0;
    return;
  }
  if (b.mode === 2) {
    b.x += b.vx;
    b.y += b.vy;
    pin(b);
    if (b.timer <= 0) settle(b, 50);
    return;
  }
  crawl(w, 0.28);
  if (b.timer <= 0) advance(w, 34);
}
function settle(b: Boss, ticks: number): void {
  b.mode = 0;
  b.timer = ticks;
  b.vx = 0;
  b.vy = 0;
}
function advance(w: World, wind: number): void {
  const b = w.boss;
  b.phase++;
  if (b.phase >= TANK_PATTERNS) b.phase = 0;
  b.mode = 1;
  b.timer = wind;
  crawl(w, 0);
}
function pin(b: Boss): void {
  if (b.x < 36) b.x = 36;
  if (b.x > ARENA_W - 36) b.x = ARENA_W - 36;
  if (b.y < 48) b.y = 48;
  if (b.y > ARENA_H - 36) b.y = ARENA_H - 36;
}
function crawl(w: World, sp: number): void {
  const b = w.boss;
  const dx = w.px - b.x;
  const dy = w.py - b.y;
  const d = Math.sqrt(dx * dx + dy * dy) || 1;
  b.aimX = dx / d;
  b.aimY = dy / d;
  const v = pacedSpeed(sp, w.mods);
  b.x += b.aimX * v;
  b.y += b.aimY * v;
  pin(b);
}
function emitShell(w: World): void {
  const b = w.boss;
  const speed = pacedSpeed(shellSpeed(b.tier), w.mods);
  for (let i = 0; i < MAX_BOSS_SHOTS; i++) {
    if ((b.shotLife[i] ?? 0) > 0) continue;
    b.shotKind[i] = SHOT_SHELL;
    b.shotX[i] = b.x + b.aimX * 20;
    b.shotY[i] = b.y + b.aimY * 20;
    b.shotVx[i] = b.aimX * speed;
    b.shotVy[i] = b.aimY * speed;
    b.shotR[i] = 0;
    b.shotLife[i] = 96;
    return;
  }
}
function dropScar(w: World, side: number): void {
  const b = w.boss;
  for (let i = 0; i < MAX_CLOUDS; i++) {
    if ((b.cloudLife[i] ?? 0) > 0) continue;
    b.cloudX[i] = scarAnchorX(b.x, b.aimX, b.aimY, side);
    b.cloudY[i] = scarAnchorY(b.y, b.aimX, b.aimY, side);
    b.cloudR[i] = scarRadius(b.tier);
    b.cloudLife[i] = SCAR_LIFE;
    return;
  }
}
