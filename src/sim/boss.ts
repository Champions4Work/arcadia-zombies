import { xpNeed } from "./progress";
import { MAX_BULLETS, type Boss, type World } from "./types";
export const BOSS_BEHEMOTH = 0;
export const BOSS_WITCH = 1;
export const BOSS_GEAR = 2;
export const BOSS_KINDS = 3;
export const BOSS_EVERY = 7200;
export const BOSS_WARN = 180;
export const MAX_BOSS_SHOTS = 16;
export const MAX_CLOUDS = 6;
const NAMES = ["IRON BEHEMOTH", "STEAM WITCH", "GEARLORD"];
export function bossName(kind: number): string {
  return NAMES[kind] ?? "BOSS";
}
export function patternCount(kind: number): number {
  if (kind === BOSS_WITCH || kind === BOSS_GEAR) return 3;
  return 2;
}
export function bossTier(w: World): number {
  return w.rank | 0;
}
export function bossMaxHp(kind: number, rank: number, index: number): number {
  const base = kind === BOSS_WITCH ? 84 : kind === BOSS_GEAR ? 96 : 120;
  const rk = rank > 0 ? rank : 0;
  const ix = index > 0 ? index : 0;
  return base + rk * 48 + ix * 20;
}
export function bossXp(level: number, rank: number): number {
  const rk = rank > 0 ? rank : 0;
  return xpNeed(level) + 6 + rk;
}
export function bossScore(wave: number, rank: number): number {
  const wv = wave > 0 ? wave : 1;
  const rk = rank > 0 ? rank : 0;
  return 300 * wv * (rk + 1);
}
export function bossSlowFactor(rank: number): number {
  const rk = rank > 0 ? rank : 0;
  const f = 0.58 - rk * 0.06;
  return f < 0.28 ? 0.28 : f;
}
export function createBoss(): Boss {
  return {
    on: 0, pending: 0, kind: 0, n: 0, hp: 0, maxHp: 0,
    x: 0, y: 0, vx: 0, vy: 0, phase: 0, mode: 0, timer: 0, warn: 0,
    aimX: 1, aimY: 0, slam: 0, slamHit: 0, slow: 0, tier: 0, tele: 0,
    shotX: new Float32Array(MAX_BOSS_SHOTS), shotY: new Float32Array(MAX_BOSS_SHOTS),
    shotVx: new Float32Array(MAX_BOSS_SHOTS), shotVy: new Float32Array(MAX_BOSS_SHOTS),
    shotR: new Float32Array(MAX_BOSS_SHOTS), shotLife: new Int16Array(MAX_BOSS_SHOTS),
    shotKind: new Uint8Array(MAX_BOSS_SHOTS),
    cloudX: new Float32Array(MAX_CLOUDS), cloudY: new Float32Array(MAX_CLOUDS),
    cloudR: new Float32Array(MAX_CLOUDS), cloudLife: new Int16Array(MAX_CLOUDS),
    bulletMark: new Uint8Array(MAX_BULLETS),
  };
}
