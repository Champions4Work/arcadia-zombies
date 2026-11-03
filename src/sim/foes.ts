import { killXp, mixWeight, scaledHp, scoreMul, speedScale } from "./difficulty";
import { nextFloat } from "./rng";
import { Z_BRUTE, Z_GHOUL, Z_SHAMBLER, type World } from "./types";

export const KIND_N = 7;
export const Z_SPITTER = 3;
export const Z_GAS = 4;
export const Z_KNIGHT = 5;
export const Z_RAT = 6;
export const Z_ELITE = 0x80;
export const Z_KIND = 0x7f;
export const B_ACID = 1;
export const TIER_N = 4;
export const TIER_RANK = [0, 1, 2, 3];
export const ELITE_PER_MILLE = [0, 45, 120, 220];
export const ELITE_STEP = 40;
export const ELITE_CAP = 480;
export const ELITE_XP = 3;
export const XP_EXTRA = [0, 0, 0, 1, 2, 2, 0];
export const RAT_PACK = 4;
export const SPIT_FAR_R2 = 115 * 115;
export const SPIT_NEAR_R2 = 58 * 58;
export const SPIT_MAX_R2 = 176 * 176;
export const SPIT_CD = 78;
export const SPIT_CD_ELITE = 50;
export const ACID_SPEED = 2.35;
export const ACID_HIT_R2 = 144;
export const ACID_DMG = 1;
export const GAS_FUSE_R2 = 32 * 32;
export const GAS_BLAST_R2 = 56 * 56;
export const GAS_BLAST_R2_ELITE = 72 * 72;
export const GAS_DMG = 2;
export const KNIGHT_TURN = 0.022;
export const KNIGHT_TURN_ELITE = 0.015;
export const KNIGHT_ARC = 0.25;

export const HP_BASE = [1, 1, 3, 2, 3, 5, 1];
export const SPD_BASE = [0.46, 1.22, 0.22, 0.52, 0.42, 0.28, 1.35];
export const SPD_JITTER = [0.1, 0.2, 0.05, 0.08, 0.05, 0.04, 0.2];
export const HIT_R2 = [100, 72, 220, 64, 150, 260, 36];
export const TOUCH_R2 = [150, 110, 280, 90, 100, 200, 40];
export const SCORE_W = [10, 20, 40, 30, 35, 50, 8];
export const CONTACT = [1, 1, 2, 1, 0, 1, 1];
export const PACK: number[] = [1, 1, 1, 1, 1, 1, RAT_PACK];
export const SPAWN_W: number[] = [
  70, 22, 8, 0, 0, 0, 0,
  44, 22, 12, 12, 0, 0, 10,
  28, 18, 12, 12, 10, 10, 10,
  16, 14, 10, 14, 14, 16, 16,
];

export function tierForRank(rank: number): number {
  let tier = 0;
  const r = rank < 0 ? 0 : rank;
  for (let i = 0; i < TIER_N; i++) {
    if (r >= (TIER_RANK[i] ?? 0)) tier = i;
  }
  return tier;
}

export function eliteChance(rank: number): number {
  const tier = tierForRank(rank);
  const base = ELITE_PER_MILLE[tier] ?? 0;
  const extra = rank > tier ? (rank - tier) * ELITE_STEP : 0;
  const n = base + extra;
  return n > ELITE_CAP ? ELITE_CAP : n;
}

function rowWeight(rank: number, kind: number): number {
  if (kind === Z_SHAMBLER || kind === Z_GHOUL || kind === Z_BRUTE) return mixWeight(rank, kind);
  return SPAWN_W[tierForRank(rank) * KIND_N + kind] ?? 0;
}

export function rollKind(w: World): number {
  const rank = w.rank;
  let sum = 0;
  for (let i = 0; i < KIND_N; i++) sum += rowWeight(rank, i);
  let r = nextFloat(w.rng) * (sum || 1);
  let kind = 0;
  for (let i = 0; i < KIND_N; i++) {
    r -= rowWeight(rank, i);
    if (r < 0) {
      kind = i;
      break;
    }
  }
  const gate = (nextFloat(w.rng) * 1000) | 0;
  const elite = gate < eliteChance(rank) ? Z_ELITE : 0;
  return kind | elite;
}

export function foeHp(kind: number, rank: number, elite: boolean): number {
  const scaled = scaledHp(HP_BASE[kind] ?? 1, rank);
  if (!elite) return scaled;
  return scaled * 2 + 2;
}

export function foeKillXp(raw: number, rank: number): number {
  const kind = raw & Z_KIND;
  const classic = kind === Z_GHOUL || kind === Z_BRUTE ? kind : Z_SHAMBLER;
  let xp = killXp(classic, rank) + (XP_EXTRA[kind] ?? 0);
  if ((raw & Z_ELITE) !== 0) xp += ELITE_XP;
  return xp;
}

export function foeScore(raw: number, wave: number, rank: number): number {
  const s = (SCORE_W[raw & Z_KIND] ?? 10) * wave * scoreMul(rank);
  return (raw & Z_ELITE) !== 0 ? s * 2 : s;
}

export function foeHitR2(raw: number): number {
  const r = HIT_R2[raw & Z_KIND] ?? 100;
  return (raw & Z_ELITE) !== 0 ? (r * 1.6) | 0 : r;
}

export function foeTouchR2(raw: number): number {
  const r = TOUCH_R2[raw & Z_KIND] ?? 150;
  return (raw & Z_ELITE) !== 0 ? (r * 1.6) | 0 : r;
}

export function foeContact(raw: number): number {
  return CONTACT[raw & Z_KIND] ?? 1;
}

export function foePack(raw: number): number {
  return PACK[raw & Z_KIND] ?? 1;
}

export function foeSpeed(kind: number, rank: number, jitter: number): number {
  const base = (SPD_BASE[kind] ?? 0.46) + jitter * (SPD_JITTER[kind] ?? 0);
  return base * speedScale(rank);
}

export function knightBlocks(face: number, zx: number, zy: number, bx: number, by: number): boolean {
  const sx = bx - zx;
  const sy = by - zy;
  const sl2 = sx * sx + sy * sy;
  if (sl2 < 1) return true;
  const fx = Math.cos(face);
  const fy = Math.sin(face);
  const dot = sx * fx + sy * fy;
  if (dot <= 0) return false;
  return dot * dot > KNIGHT_ARC * sl2;
}
