import { juicePlayerHurt } from "../render/juice";
import { ARENA_H, ARENA_W, TELE_LIFE } from "./arena";
import { queueSpawn } from "./arena.hot";
import {
  BOSS_BEHEMOTH, BOSS_EVERY, BOSS_GEAR, BOSS_KINDS, BOSS_TANK, BOSS_WARN, BOSS_WITCH, bossMaxHp, bossScore,
  bossSlowFactor, bossTier, bossXp, MAX_BOSS_SHOTS, MAX_CLOUDS, patternCount,
} from "./boss";
import { TANK_BODY_R2, TANK_HURT_R2 } from "./tank";
import { stepTank } from "./tank.hot";
import { finaleBlocksBoss, FINALE_TICK } from "./finale";
import { applyScore, pacedSpeed } from "./modifiers";
import {
  bulletDmg, canUpgrade, rollOffers, sawAngle, sawCount, sawDamage, sawRadius, sawSpin, shieldReload, takeXp,
} from "./progress";
import { nextFloat } from "./rng";
import { plantBossWarn } from "./warn";
import {
  EV_HURT, EV_KILL, EV_LEVEL, EV_SHIELD, EV_SIREN, FX_FLASH, FX_PUFF, FX_SPARK,
  MAX_BULLETS, MAX_FX, MAX_ZOMBIES, TELE_BOSS, Z_GHOUL, type Boss, type World,
} from "./types";
const TELE_LEAD = TELE_LIFE + 1;
function puff(w: World, kind: number, x: number, y: number, a: number): void {
  const i = w.fxHead;
  w.fxKind[i] = kind;
  w.fxX[i] = x;
  w.fxY[i] = y;
  w.fxA[i] = a;
  w.fxTick[i] = w.tick;
  w.fxHead = i + 1 < MAX_FX ? i + 1 : 0;
}
function clearVolley(b: Boss): void {
  for (let i = 0; i < MAX_BOSS_SHOTS; i++) b.shotLife[i] = 0;
  for (let i = 0; i < MAX_CLOUDS; i++) b.cloudLife[i] = 0;
}
function aimAtPlayer(w: World): void {
  const b = w.boss;
  const dx = w.px - b.x;
  const dy = w.py - b.y;
  const d = Math.sqrt(dx * dx + dy * dy) || 1;
  b.aimX = dx / d;
  b.aimY = dy / d;
}
function clampBoss(b: Boss): void {
  if (b.x < 36) b.x = 36;
  if (b.x > ARENA_W - 36) b.x = ARENA_W - 36;
  if (b.y < 48) b.y = 48;
  if (b.y > ARENA_H - 36) b.y = ARENA_H - 36;
}
function chase(w: World, sp: number): void {
  aimAtPlayer(w);
  const b = w.boss;
  const v = pacedSpeed(sp, w.mods);
  b.x += b.aimX * v;
  b.y += b.aimY * v;
  clampBoss(b);
}
function fadeSlam(b: Boss): void {
  if (b.slam <= 0) return;
  b.slam *= 0.8;
  if (b.slam < 3) b.slam = 0;
}
function rest(b: Boss, ticks: number): void {
  b.mode = 0;
  b.timer = ticks;
  b.vx = 0;
  b.vy = 0;
}
function nextPattern(w: World, wind: number): void {
  const b = w.boss;
  const n = patternCount(b.kind);
  b.phase++;
  if (b.phase >= n) b.phase = 0;
  b.mode = 1;
  b.timer = wind;
  aimAtPlayer(w);
  plantBossWarn(w, wind);
}
function hurtPlayer(w: World, dmg: number): void {
  if (w.over || w.hurtCd > 0 || dmg <= 0) return;
  w.hurtCd = 45;
  if (w.shield > 0) {
    w.shield--;
    w.shieldCd = shieldReload(w);
    w.events[EV_SHIELD] = 1;
    return;
  }
  w.hp -= dmg;
  w.hurt += dmg;
  w.events[EV_HURT] = 1;
  juicePlayerHurt();
  if (w.hp <= 0) w.over = true;
}
function touchBoss(w: World, dmg: number, r2: number): void {
  const dx = w.px - w.boss.x;
  const dy = w.py - w.boss.y;
  if (dx * dx + dy * dy < r2) hurtPlayer(w, dmg);
}
function killBoss(w: World): void {
  const b = w.boss;
  if (!b.on) return;
  const tier = b.tier;
  const x = b.x;
  const y = b.y;
  const kind = b.kind;
  b.on = 0;
  b.pending = 0;
  b.warn = 0;
  b.slam = 0;
  b.vx = 0;
  b.vy = 0;
  b.slow = 0;
  clearVolley(b);
  w.score += applyScore(bossScore(w.wave, tier), w.mods);
  w.events[EV_KILL] = 1;
  puff(w, FX_PUFF, x, y, kind + 4);
  takeXp(w, bossXp(w.level, tier));
  if (!w.choosing && canUpgrade(w)) {
    rollOffers(w);
    if ((w.offers[0] ?? -1) >= 0) {
      w.choosing = 1;
      w.events[EV_LEVEL] = 1;
    }
  }
}
export function hurtBoss(w: World, dmg: number): void {
  const b = w.boss;
  if (!b.on || dmg <= 0) return;
  b.hp -= dmg;
  puff(w, FX_SPARK, b.x, b.y - 8, 0);
  if (b.hp <= 0) killBoss(w);
}
function summonGhoul(w: World, x: number, y: number, tier: number): void {
  const z = w.zombies;
  for (let i = 0; i < MAX_ZOMBIES; i++) {
    if (z.alive[i]) continue;
    z.alive[i] = 1;
    z.kind[i] = Z_GHOUL;
    z.x[i] = x < 16 ? 16 : x > ARENA_W - 16 ? ARENA_W - 16 : x;
    z.y[i] = y < 48 ? 48 : y > ARENA_H - 16 ? ARENA_H - 16 : y;
    z.vx[i] = pacedSpeed(1.2 + tier * 0.04, w.mods);
    z.vy[i] = 0;
    z.hp[i] = tier >= 4 ? 2 : 1;
    return;
  }
}
function dropCloud(b: Boss, x: number, y: number, r: number, life: number): void {
  for (let i = 0; i < MAX_CLOUDS; i++) {
    if ((b.cloudLife[i] ?? 0) > 0) continue;
    b.cloudX[i] = x;
    b.cloudY[i] = y;
    b.cloudR[i] = r;
    b.cloudLife[i] = life;
    return;
  }
}
function freeShot(b: Boss): number {
  for (let i = 0; i < MAX_BOSS_SHOTS; i++) if ((b.shotLife[i] ?? 0) <= 0) return i;
  return -1;
}
function emitRadial(w: World, count: number, speed: number, life: number): void {
  const b = w.boss;
  const spin = w.tick * 0.17;
  for (let k = 0; k < count; k++) {
    const i = freeShot(b);
    if (i < 0) return;
    const a = spin + (Math.PI * 2 * k) / count;
    b.shotKind[i] = 0;
    b.shotX[i] = b.x;
    b.shotY[i] = b.y;
    b.shotVx[i] = Math.cos(a) * speed;
    b.shotVy[i] = Math.sin(a) * speed;
    b.shotR[i] = 0;
    b.shotLife[i] = life;
  }
}
function emitOrbit(w: World, count: number, radius: number, spin: number, life: number): void {
  const b = w.boss;
  for (let k = 0; k < count; k++) {
    const i = freeShot(b);
    if (i < 0) return;
    b.shotKind[i] = 1;
    b.shotVx[i] = (Math.PI * 2 * k) / count;
    b.shotVy[i] = spin;
    b.shotR[i] = radius;
    b.shotLife[i] = life;
    b.shotX[i] = b.x;
    b.shotY[i] = b.y;
  }
}
function ringCount(tier: number, base: number): number {
  const n = base + (tier > 0 ? tier >> 1 : 0);
  return n > 8 ? 8 : n;
}
function hitDmg(tier: number, base: number): number {
  return base + (tier > 0 ? tier >> 1 : 0);
}
function stepBehemoth(w: World): void {
  const b = w.boss;
  const tier = b.tier;
  if (b.phase === 0) {
    if (b.mode === 1) {
      chase(w, 0.12);
      if (b.timer <= 0) {
        b.mode = 2;
        b.timer = 26;
        const sp = pacedSpeed(3.3 + tier * 0.28, w.mods);
        b.vx = b.aimX * sp;
        b.vy = b.aimY * sp;
        puff(w, FX_FLASH, b.x, b.y, 0);
      }
      return;
    }
    if (b.mode === 2) {
      b.x += b.vx;
      b.y += b.vy;
      clampBoss(b);
      touchBoss(w, hitDmg(tier, 2), 1200);
      if (b.timer <= 0) rest(b, 36);
      return;
    }
    chase(w, 0.55);
    fadeSlam(b);
    if (b.timer <= 0) nextPattern(w, 32);
    return;
  }
  if (b.mode === 1) {
    chase(w, 0.08);
    if (b.timer <= 0) {
      b.mode = 2;
      b.timer = 46;
      b.slam = 8;
      b.slamHit = 0;
      puff(w, FX_FLASH, b.x, b.y, 1);
    }
    return;
  }
  if (b.mode === 2) {
    const prev = b.slam;
    b.slam = prev + (3.1 + tier * 0.4);
    const dx = w.px - b.x;
    const dy = w.py - b.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (!b.slamHit && d >= prev && d <= b.slam) {
      b.slamHit = 1;
      hurtPlayer(w, hitDmg(tier, 1));
    }
    if (b.timer <= 0) rest(b, 40);
    return;
  }
  chase(w, 0.4);
  fadeSlam(b);
  if (b.timer <= 0) nextPattern(w, 28);
}
function stepWitch(w: World): void {
  const b = w.boss;
  const tier = b.tier;
  if (b.phase === 0) {
    if (b.mode === 1) {
      chase(w, 0.32);
      if (b.timer <= 0) {
        const n = tier >= 3 ? 3 : 2;
        for (let k = 0; k < n; k++) {
          const a = nextFloat(w.rng) * Math.PI * 2;
          summonGhoul(w, b.x + Math.cos(a) * 26, b.y + Math.sin(a) * 26, tier);
        }
        rest(b, 48);
      }
      return;
    }
    chase(w, 0.48);
    if (b.timer <= 0) nextPattern(w, 26);
    return;
  }
  if (b.phase === 1) {
    if (b.mode === 1) {
      chase(w, 0.28);
      if (b.timer <= 0) {
        const r = 30 + tier * 4;
        dropCloud(b, w.px, w.py, r, 160);
        dropCloud(b, (w.px + b.x) * 0.5, (w.py + b.y) * 0.5, r - 6, 140);
        rest(b, 42);
      }
      return;
    }
    chase(w, 0.5);
    if (b.timer <= 0) nextPattern(w, 22);
    return;
  }
  if (b.mode === 1) {
    chase(w, 0.24);
    if (b.timer <= 0) {
      b.mode = 2;
      b.timer = 72;
      dropCloud(b, b.x, b.y, 26 + tier * 3, 100);
    }
    return;
  }
  if (b.mode === 2) {
    chase(w, 0.4);
    if (b.timer % 18 === 0) dropCloud(b, b.x + b.aimX * 18, b.y + b.aimY * 18, 24 + tier * 4, 110);
    if (b.timer <= 0) rest(b, 30);
    return;
  }
  chase(w, 0.46);
  if (b.timer <= 0) nextPattern(w, 20);
}
function stepGear(w: World): void {
  const b = w.boss;
  const tier = b.tier;
  if (b.phase === 0) {
    if (b.mode === 1) {
      chase(w, 0.22);
      if (b.timer <= 0) {
        emitRadial(w, ringCount(tier, 8), 1.55 + tier * 0.12, 100);
        rest(b, 48);
      }
      return;
    }
    chase(w, 0.46);
    if (b.timer <= 0) nextPattern(w, 30);
    return;
  }
  if (b.phase === 1) {
    if (b.mode === 1) {
      chase(w, 0.18);
      if (b.timer <= 0) {
        emitOrbit(w, ringCount(tier, 6), 20, 0.14 + tier * 0.01, 120);
        b.mode = 2;
        b.timer = 80;
      }
      return;
    }
    if (b.mode === 2) {
      chase(w, 0.34);
      if (b.timer <= 0) rest(b, 30);
      return;
    }
    chase(w, 0.46);
    if (b.timer <= 0) nextPattern(w, 26);
    return;
  }
  if (b.mode === 1) {
    chase(w, 0.16);
    if (b.timer <= 0) {
      emitRadial(w, ringCount(tier, 6), 1.15 + tier * 0.08, 110);
      emitRadial(w, ringCount(tier, 6), 2.2 + tier * 0.1, 84);
      rest(b, 50);
    }
    return;
  }
  chase(w, 0.42);
  if (b.timer <= 0) nextPattern(w, 28);
}
function bossHurtR2(kind: number): number {
  if (kind === BOSS_WITCH) return 520;
  if (kind === BOSS_GEAR) return 640;
  if (kind === BOSS_TANK) return TANK_HURT_R2;
  return 1100;
}
function soakBullets(w: World): void {
  const b = w.boss;
  if (!b.on) return;
  const r2 = bossHurtR2(b.kind);
  const dmg = bulletDmg(w);
  const bullets = w.bullets;
  for (let j = 0; j < MAX_BULLETS; j++) {
    if (!b.on || !bullets.alive[j]) continue;
    const dx = b.x - (bullets.x[j] ?? 0);
    const dy = b.y - (bullets.y[j] ?? 0);
    if ((b.bulletMark[j] ?? 0) !== 0) continue;
    if (dx * dx + dy * dy >= r2) continue;
    b.bulletMark[j] = 1;
    hurtBoss(w, dmg);
    if ((w.bPierce[j] ?? 0) > 0) w.bPierce[j] = (w.bPierce[j] ?? 1) - 1;
    else bullets.alive[j] = 0;
  }
}
function soakSaws(w: World): void {
  const b = w.boss;
  const n = sawCount(w);
  if (!b.on || n <= 0 || (w.tick & 3) !== 0) return;
  const r = sawRadius(w);
  const hit = bossHurtR2(b.kind);
  const dmg = sawDamage(w);
  for (let s = 0; s < n; s++) {
    if (!b.on) return;
    const a = sawAngle(w.tick, s, n, sawSpin(w));
    const dx = b.x - (w.px + Math.cos(a) * r);
    const dy = b.y - (w.py + Math.sin(a) * r);
    if (dx * dx + dy * dy < hit) hurtBoss(w, dmg);
  }
}
function stepShots(w: World): void {
  const b = w.boss;
  const dmg = hitDmg(b.tier, 1);
  for (let i = 0; i < MAX_BOSS_SHOTS; i++) {
    let life = b.shotLife[i] ?? 0;
    if (life <= 0) continue;
    if ((b.shotKind[i] ?? 0) === 1) {
      const a = (b.shotVx[i] ?? 0) + (b.shotVy[i] ?? 0);
      b.shotVx[i] = a;
      const r = (b.shotR[i] ?? 0) + 0.45;
      b.shotR[i] = r;
      b.shotX[i] = b.x + Math.cos(a) * r;
      b.shotY[i] = b.y + Math.sin(a) * r;
    } else {
      b.shotX[i] = (b.shotX[i] ?? 0) + (b.shotVx[i] ?? 0);
      b.shotY[i] = (b.shotY[i] ?? 0) + (b.shotVy[i] ?? 0);
    }
    life--;
    b.shotLife[i] = life;
    const x = b.shotX[i] ?? 0;
    const y = b.shotY[i] ?? 0;
    if (life <= 0 || x < -24 || y < -24 || x > ARENA_W + 24 || y > ARENA_H + 24) {
      b.shotLife[i] = 0;
      continue;
    }
    const dx = w.px - x;
    const dy = w.py - y;
    if (dx * dx + dy * dy < 144) hurtPlayer(w, dmg);
  }
}
function playerInCloud(w: World): boolean {
  const b = w.boss;
  for (let i = 0; i < MAX_CLOUDS; i++) {
    if ((b.cloudLife[i] ?? 0) <= 0) continue;
    const dx = w.px - (b.cloudX[i] ?? 0);
    const dy = w.py - (b.cloudY[i] ?? 0);
    const r = b.cloudR[i] ?? 0;
    if (dx * dx + dy * dy < r * r) return true;
  }
  return false;
}
function stepClouds(w: World): void {
  const b = w.boss;
  let inside = 0;
  for (let i = 0; i < MAX_CLOUDS; i++) {
    let life = b.cloudLife[i] ?? 0;
    if (life <= 0) continue;
    life--;
    b.cloudLife[i] = life;
    const dx = w.px - (b.cloudX[i] ?? 0);
    const dy = w.py - (b.cloudY[i] ?? 0);
    const r = b.cloudR[i] ?? 0;
    if (life > 0 && dx * dx + dy * dy < r * r) inside = 1;
  }
  if (inside) b.slow = 20;
  else if (b.slow > 0) b.slow--;
}
function bodyTouch(w: World): void {
  const b = w.boss;
  if (!b.on || w.over) return;
  if (b.kind === BOSS_BEHEMOTH && b.phase === 0 && b.mode === 2) return;
  const r2 = b.kind === BOSS_BEHEMOTH ? 900
    : b.kind === BOSS_WITCH ? 420
    : b.kind === BOSS_TANK ? TANK_BODY_R2
    : 520;
  touchBoss(w, hitDmg(b.tier, 1), r2);
}
function stepFight(w: World): void {
  const b = w.boss;
  if (b.hp <= 0) {
    killBoss(w);
    return;
  }
  if (b.timer > 0) b.timer--;
  if (b.kind === BOSS_TANK) stepTank(w);
  else if (b.kind === BOSS_WITCH) stepWitch(w);
  else if (b.kind === BOSS_GEAR) stepGear(w);
  else stepBehemoth(w);
  if (!b.on || w.over) return;
  soakBullets(w);
  if (!b.on || w.over) return;
  soakSaws(w);
  if (!b.on || w.over) return;
  stepShots(w);
  if (w.over) return;
  stepClouds(w);
  if (!b.on || w.over) return;
  bodyTouch(w);
}
function spawnBoss(w: World): void {
  const b = w.boss;
  const kind = b.n % BOSS_KINDS;
  const tier = bossTier(w);
  const index = b.n;
  b.on = 1;
  b.pending = 0;
  b.tele = 0;
  b.warn = 0;
  b.kind = kind;
  b.tier = tier;
  const hp = bossMaxHp(kind, tier, index);
  b.hp = hp;
  b.maxHp = hp;
  b.n = index + 1;
  b.phase = 0;
  b.mode = 1;
  b.timer = 36;
  b.vx = 0;
  b.vy = 0;
  b.slam = 0;
  b.slamHit = 0;
  b.slow = 0;
  clampBoss(b);
  aimAtPlayer(w);
  plantBossWarn(w, 36);
  clearVolley(b);
  w.events[EV_SIREN] = 1;
  puff(w, FX_PUFF, b.x, b.y, kind + 4);
}
function bossTeleQueued(w: World): boolean {
  const alive = w.arena.teleAlive;
  const kind = w.arena.teleKind;
  for (let i = 0; i < alive.length; i++) {
    if (alive[i] && kind[i] === TELE_BOSS) return true;
  }
  return false;
}
function clearBoss(b: Boss): void {
  b.on = 0;
  b.pending = 0;
  b.tele = 0;
  b.warn = 0;
  b.vx = 0;
  b.vy = 0;
  b.slow = 0;
  clearVolley(b);
}
function clockBoss(w: World): void {
  const b = w.boss;
  if (finaleBlocksBoss(w)) {
    clearBoss(b);
    return;
  }
  const due = (b.n + 1) * BOSS_EVERY;
  if (w.tick < FINALE_TICK && due >= FINALE_TICK) return;
  if (!b.pending && w.tick >= due - BOSS_WARN) {
    b.pending = 1;
    b.tele = 0;
    b.kind = b.n % BOSS_KINDS;
    const lead = due - w.tick;
    b.warn = lead > BOSS_WARN ? BOSS_WARN : lead > 0 ? lead : 1;
    w.events[EV_SIREN] = 1;
    return;
  }
  if (!b.pending) return;
  if (w.tick % 20 === 0) w.events[EV_SIREN] = 1;
  const lead = due - w.tick;
  b.warn = lead > 0 ? lead : 1;
  if (b.tele === 0 && w.tick >= due - TELE_LEAD) {
    queueSpawn(w, TELE_BOSS);
    if (bossTeleQueued(w)) b.tele = 1;
  }
}
export function bossSpeedMul(w: World): number {
  const b = w.boss;
  if (b.slow <= 0 && !playerInCloud(w)) return 1;
  return bossSlowFactor(b.tier);
}
export function stepBoss(w: World): void {
  if (w.over) return;
  const b = w.boss;
  if (finaleBlocksBoss(w)) {
    if (b.on || b.pending) clearBoss(b);
    return;
  }
  if (b.pending === 2) {
    spawnBoss(w);
    return;
  }
  if (b.on) {
    stepFight(w);
    return;
  }
  clockBoss(w);
}
