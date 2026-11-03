import { ARENA_H, ARENA_W } from "./arena";
import { clock, scoreMul, tierAt } from "./difficulty";
import { bulletDmg, sawAngle, sawDamage, sawRadius, shieldReload, teslaPower, teslaRange, upgName } from "./progress";
import {
  EV_HURT, EV_KILL, EV_SHIELD, EV_TESLA, MAX_BULLETS, MAX_ZOMBIES, UPG_COUNT, UPG_SAWS,
  Z_GHOUL, type World,
} from "./types";

export const FINALE_SEC = 1200;
export const FINALE_TICK = FINALE_SEC * 60;
export const NORMAL_BOSS_HP = 120;
export const LICH_HP_MUL = 3;
export const RING_N = 40;
const SUMMON_N = 6;
const RING_LIFE = 150;
const LICH_R2 = 30 * 30;
const RING_HIT_R2 = 6 * 6;
const BODY_R2 = 22 * 22;

interface Lich {
  on: number;
  won: number;
  fought: number;
  endless: number;
  preview: number;
  cue: number;
  hp: number;
  maxHp: number;
  phase: number;
  x: number;
  y: number;
  timer: number;
  spin: number;
  summoned: number;
  kills: number;
  shotX: Float32Array;
  shotY: Float32Array;
  shotVx: Float32Array;
  shotVy: Float32Array;
  shotLife: Int16Array;
  minion: Uint8Array;
  mark: Uint8Array;
}

const bag = new WeakMap<World, Lich>();

function createLich(): Lich {
  return {
    on: 0, won: 0, fought: 0, endless: 0, preview: 0, cue: 0,
    hp: 0, maxHp: 0, phase: 0, x: 0, y: 0, timer: 0, spin: 0, summoned: 0, kills: 0,
    shotX: new Float32Array(RING_N), shotY: new Float32Array(RING_N),
    shotVx: new Float32Array(RING_N), shotVy: new Float32Array(RING_N),
    shotLife: new Int16Array(RING_N), minion: new Uint8Array(MAX_ZOMBIES),
    mark: new Uint8Array(MAX_BULLETS),
  };
}

function of(w: World): Lich {
  let f = bag.get(w);
  if (!f) {
    f = createLich();
    bag.set(w, f);
  }
  return f;
}

export function attachFinale(w: World): void {
  if (!bag.has(w)) bag.set(w, createLich());
}

export function lichMaxHp(): number {
  return NORMAL_BOSS_HP * LICH_HP_MUL;
}

export function doubledScrap(base: number): number {
  if (base <= 0 || !Number.isFinite(base)) return 0;
  return Math.floor(base) * 2;
}

export function runLabel(tick: number): string {
  const now = clock(tick);
  if (tick >= FINALE_TICK) return now;
  return `${now}/20:00`;
}

export function seekSeconds(w: World, seconds: number): void {
  const sec = seconds > 0 ? Math.floor(seconds) : 0;
  w.tick = sec * 60;
  w.rank = tierAt(w.tick);
  w.toSpawn = 0;
  w.spawnCd = 8;
}

export function freshShot(w: World, index: number): void {
  const f = of(w);
  if (index >= 0 && index < f.mark.length) f.mark[index] = 0;
}

export function armDevJump(w: World, seconds: number): void {
  const sec = Number.isFinite(seconds) ? Math.floor(seconds) : 0;
  if (sec <= 0) return;
  seekSeconds(w, sec > FINALE_SEC ? FINALE_SEC : sec);
  const f = of(w);
  f.preview = w.tick < FINALE_TICK ? 1 : 0;
}

export function setRunEndless(w: World, on: boolean): void {
  of(w).endless = on ? 1 : 0;
}

export function isWon(w: World): boolean {
  return of(w).won === 1;
}

export function killCount(w: World): number {
  return of(w).kills;
}

export function tallyKill(w: World): void {
  of(w).kills++;
}

export function lichUp(w: World): boolean {
  return of(w).on === 1;
}

export function lichX(w: World): number {
  return of(w).x;
}

export function lichY(w: World): number {
  return of(w).y;
}

export function lichHp(w: World): number {
  return of(w).hp;
}

export function lichPhase(w: World): number {
  return of(w).phase;
}

export function holdSpawns(w: World): boolean {
  const f = of(w);
  if (f.on === 1) return true;
  return f.preview === 1 && f.fought === 0;
}

export function ringOn(w: World, i: number): boolean {
  return (of(w).shotLife[i] ?? 0) > 0;
}

export function ringX(w: World, i: number): number {
  return of(w).shotX[i] ?? 0;
}

export function ringY(w: World, i: number): number {
  return of(w).shotY[i] ?? 0;
}

export function lichMinion(w: World, i: number): boolean {
  const f = of(w);
  return f.on === 1 && (f.minion[i] ?? 0) === 1;
}

export function ringLive(w: World): number {
  const f = of(w);
  let n = 0;
  for (let i = 0; i < RING_N; i++) if ((f.shotLife[i] ?? 0) > 0) n++;
  return n;
}

export function takeCue(w: World): boolean {
  const f = of(w);
  if (f.cue !== 1) return false;
  f.cue = 0;
  return true;
}

export function harmLich(w: World, dmg: number): void {
  const f = of(w);
  if (f.on !== 1 || dmg <= 0) return;
  f.hp -= dmg;
  if (f.hp < 0) f.hp = 0;
}

export function victoryText(w: World, scrapBase = 0): string {
  const lines = [clock(w.tick), `KILLS ${killCount(w)}`];
  let any = false;
  for (let i = 0; i < UPG_COUNT; i++) {
    const lv = w.upgrades[i] ?? 0;
    if (lv <= 0) continue;
    any = true;
    lines.push(`${upgName(i)} LV ${lv}`);
  }
  if (!any) lines.push("NO UPGRADES");
  const scrap = doubledScrap(scrapBase);
  if (scrap > 0) lines.push(`BRASS SCRAP ${scrap}`);
  return lines.join("\n");
}

function phaseOf(hp: number, maxHp: number): number {
  if (maxHp <= 0) return 0;
  const r = hp / maxHp;
  if (r > 2 / 3) return 0;
  if (r > 1 / 3) return 1;
  return 2;
}

function ringEvery(phase: number): number {
  if (phase >= 2) return 56;
  if (phase === 1) return 72;
  return 96;
}

function ringCount(phase: number): number {
  if (phase >= 2) return 8;
  if (phase === 1) return 8;
  return 6;
}

function ringSpeed(phase: number): number {
  if (phase >= 2) return 1.1;
  if (phase === 1) return 0.95;
  return 0.75;
}

function clearShots(f: Lich): void {
  for (let i = 0; i < RING_N; i++) f.shotLife[i] = 0;
}

function clearField(w: World): void {
  const z = w.zombies;
  const f = of(w);
  for (let i = 0; i < MAX_ZOMBIES; i++) {
    z.alive[i] = 0;
    f.minion[i] = 0;
  }
  w.toSpawn = 0;
}

function arrive(w: World): void {
  const f = of(w);
  if (f.fought || w.tick < FINALE_TICK) return;
  f.fought = 1;
  f.on = 1;
  f.preview = 0;
  f.cue = 1;
  f.phase = 0;
  f.maxHp = lichMaxHp();
  f.hp = f.maxHp;
  f.x = ARENA_W / 2;
  f.y = (ARENA_H * 107) / 160;
  f.timer = 36;
  f.spin = 0;
  f.summoned = 0;
  clearShots(f);
  clearField(w);
}

export function watchFinale(w: World): void {
  arrive(w);
}

function freeShot(f: Lich): number {
  for (let i = 0; i < RING_N; i++) if ((f.shotLife[i] ?? 0) <= 0) return i;
  return -1;
}

function emitRing(f: Lich, count: number, speed: number, turn: number): void {
  for (let k = 0; k < count; k++) {
    const i = freeShot(f);
    if (i < 0) return;
    const a = turn + (Math.PI * 2 * k) / count;
    f.shotX[i] = f.x;
    f.shotY[i] = f.y - 16;
    f.shotVx[i] = Math.cos(a) * speed;
    f.shotVy[i] = Math.sin(a) * speed;
    f.shotLife[i] = RING_LIFE;
  }
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
  w.events[EV_HURT] = 1;
  if (w.hp <= 0) w.over = true;
}

function clampLich(f: Lich): void {
  if (f.x < 28) f.x = 28;
  if (f.x > ARENA_W - 28) f.x = ARENA_W - 28;
  if (f.y < 110) f.y = 110;
  if (f.y > ARENA_H - 24) f.y = ARENA_H - 24;
}

function moveLich(w: World, f: Lich): void {
  const dx = w.px - f.x;
  const dy = w.py - f.y;
  const d = Math.sqrt(dx * dx + dy * dy) || 1;
  const sp = f.phase >= 2 ? 0.62 : f.phase === 1 ? 0.44 : 0.28;
  f.x += (dx / d) * sp;
  f.y += (dy / d) * sp;
  clampLich(f);
}

function stepShots(w: World, f: Lich): void {
  for (let i = 0; i < RING_N; i++) {
    let life = f.shotLife[i] ?? 0;
    if (life <= 0) continue;
    const x = (f.shotX[i] ?? 0) + (f.shotVx[i] ?? 0);
    const y = (f.shotY[i] ?? 0) + (f.shotVy[i] ?? 0);
    f.shotX[i] = x;
    f.shotY[i] = y;
    life--;
    f.shotLife[i] = life;
    if (life <= 0 || x < -20 || y < -20 || x > ARENA_W + 20 || y > ARENA_H + 20) {
      f.shotLife[i] = 0;
      continue;
    }
    const dx = w.px - x;
    const dy = w.py - y;
    if (dx * dx + dy * dy < RING_HIT_R2) hurtPlayer(w, 1);
  }
}

function spawnAdd(w: World, x: number, y: number): void {
  const z = w.zombies;
  for (let i = 0; i < MAX_ZOMBIES; i++) {
    if (z.alive[i]) continue;
    z.alive[i] = 1;
    z.kind[i] = Z_GHOUL;
    z.x[i] = x < 16 ? 16 : x > ARENA_W - 16 ? ARENA_W - 16 : x;
    z.y[i] = y < 48 ? 48 : y > ARENA_H - 16 ? ARENA_H - 16 : y;
    z.vx[i] = 0.85;
    z.vy[i] = 0;
    z.hp[i] = 2;
    of(w).minion[i] = 1;
    return;
  }
}

function summon(w: World, f: Lich): void {
  if (f.summoned || f.hp <= 0 || f.hp * 2 > f.maxHp) return;
  f.summoned = 1;
  for (let k = 0; k < SUMMON_N; k++) {
    const a = (Math.PI * 2 * k) / SUMMON_N;
    spawnAdd(w, f.x + Math.cos(a) * 34, f.y + Math.sin(a) * 34);
  }
}

function soakBullets(w: World, f: Lich): void {
  const dmg = bulletDmg(w);
  const b = w.bullets;
  for (let j = 0; j < MAX_BULLETS; j++) {
    if (!b.alive[j]) {
      f.mark[j] = 0;
      continue;
    }
    if (f.on !== 1 || (f.mark[j] ?? 0) !== 0) continue;
    const dx = f.x - (b.x[j] ?? 0);
    const dy = (f.y - 12) - (b.y[j] ?? 0);
    if (dx * dx + dy * dy >= LICH_R2) continue;
    f.mark[j] = 1;
    harmLich(w, dmg);
    if ((w.bPierce[j] ?? 0) > 0) w.bPierce[j] = (w.bPierce[j] ?? 1) - 1;
    else b.alive[j] = 0;
  }
}

function soakSaws(w: World, f: Lich): void {
  const n = w.upgrades[UPG_SAWS] ?? 0;
  if (f.on !== 1 || n <= 0 || (w.tick & 3) !== 0) return;
  const r = sawRadius(w);
  const dmg = sawDamage(w);
  for (let s = 0; s < n; s++) {
    if (f.on !== 1) return;
    const a = sawAngle(w.tick, s, n);
    const dx = f.x - (w.px + Math.cos(a) * r);
    const dy = (f.y - 12) - (w.py + Math.sin(a) * r);
    if (dx * dx + dy * dy < LICH_R2) harmLich(w, dmg);
  }
}

function soakTesla(w: World, f: Lich): void {
  if (f.on !== 1 || !w.events[EV_TESLA]) return;
  const range = teslaRange(w);
  const dx = f.x - w.px;
  const dy = f.y - w.py;
  if (dx * dx + dy * dy > range * range) return;
  harmLich(w, teslaPower(w));
}

function dropMinions(w: World, f: Lich): void {
  const z = w.zombies;
  for (let i = 0; i < MAX_ZOMBIES; i++) {
    if ((f.minion[i] ?? 0) === 0) continue;
    z.alive[i] = 0;
    f.minion[i] = 0;
  }
}

function defeat(w: World, f: Lich): void {
  f.on = 0;
  f.won = 1;
  f.hp = 0;
  clearShots(f);
  dropMinions(w, f);
  tallyKill(w);
  w.score += 500 * scoreMul(w.rank);
  w.events[EV_KILL] = (w.events[EV_KILL] ?? 0) + 1;
  if (f.endless !== 1) w.over = true;
}

export function stepFinale(w: World): void {
  arrive(w);
  const f = of(w);
  if (f.on !== 1 || w.over) return;
  f.phase = phaseOf(f.hp, f.maxHp);
  if (w.banner > 0) {
    stepShots(w, f);
    return;
  }
  moveLich(w, f);
  f.timer--;
  if (f.timer <= 0) {
    const n = ringCount(f.phase);
    const sp = ringSpeed(f.phase);
    emitRing(f, n, sp, f.spin);
    if (f.phase >= 2) emitRing(f, n, sp * 0.62, f.spin + Math.PI / n);
    f.spin += 0.31;
    f.timer = ringEvery(f.phase);
  }
  stepShots(w, f);
  const dx = w.px - f.x;
  const dy = w.py - (f.y - 8);
  if (dx * dx + dy * dy < BODY_R2) hurtPlayer(w, 1);
  if (w.over) return;
  soakBullets(w, f);
  soakSaws(w, f);
  soakTesla(w, f);
  summon(w, f);
  if (f.hp <= 0 && w.hp > 0) defeat(w, f);
}
