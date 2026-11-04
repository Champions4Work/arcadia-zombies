import { Z_BRUTE, Z_GHOUL } from "./types";

export const CURVE = {
  ticks: 30 * 60,
  names: [
    "CALM",
    "SIMMERING",
    "STEAMING",
    "BOILING",
    "OVERPRESSURE",
    "MELTDOWN",
    "CLOCKWORK APOCALYPSE",
  ],
  beyond: [
    "ASH CROWN",
    "GEARSTORM",
    "NULL PRESSURE",
    "LAST WHISTLE",
    "VOID BOILER",
  ],
  spawnBase: 36,
  spawnPer: 6,
  spawnMin: 4,
  hpNum: 100,
  hpPer: 10,
  hpQuad: 36,
  hpLate: 160,
  hpLateAfter: 4,
  dmgNum: 100,
  dmgPer: 35,
  speedNum: 100,
  speedPer: 10,
  xpPer: 1,
  xpCap: 0,
  scoreBase: 1,
  scorePer: 1,
  shambler: 70,
  shamblerPer: 7,
  ghoul: 24,
  ghoulPer: 2,
  brute: 6,
  brutePer: 6,
  common: 78,
  commonPer: 6,
  commonMin: 16,
  rare: 24,
  rarePer: 4,
  legendary: 8,
  legendaryPer: 5,
};

export const MIDGAME = { startMin: 3, endMin: 8 } as const;

export function tickAtMinute(min: number): number {
  return min * 2 * CURVE.ticks;
}

export function tierAt(tick: number): number {
  return Math.floor(Math.max(0, tick) / CURVE.ticks);
}

export function tierFrac(tick: number): number {
  const t = Math.max(0, tick);
  if (t > 0 && t % CURVE.ticks === 0) return 1;
  return (t % CURVE.ticks) / CURVE.ticks;
}

export function tierName(tier: number): string {
  if (tier >= 0 && tier < CURVE.names.length) return CURVE.names[tier] ?? "CALM";
  const i = tier - CURVE.names.length;
  if (i >= 0 && i < CURVE.beyond.length) return CURVE.beyond[i] ?? "EPOCH";
  return `EPOCH ${i - CURVE.beyond.length + 2}`;
}

export function clock(tick: number): string {
  const sec = Math.floor(Math.max(0, tick) / 60);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

export function spawnEvery(tier: number): number {
  return Math.max(CURVE.spawnMin, CURVE.spawnBase - tier * CURVE.spawnPer);
}

export function hpScale(tier: number): number {
  const t = tier < 0 ? 0 : tier;
  const early = CURVE.hpNum + t * CURVE.hpPer + t * t * CURVE.hpQuad;
  if (t <= CURVE.hpLateAfter) return early;
  const late = t - CURVE.hpLateAfter;
  return early + late * late * CURVE.hpLate;
}

export function scaledHp(base: number, tier: number): number {
  return Math.max(1, Math.round(base * hpScale(tier) / 100));
}

export function dmgScale(tier: number): number {
  return CURVE.dmgNum + tier * CURVE.dmgPer;
}

export function scaledDmg(base: number, tier: number): number {
  return Math.max(1, Math.round(base * dmgScale(tier) / 100));
}

export function speedScale(tier: number): number {
  return (CURVE.speedNum + tier * CURVE.speedPer) / 100;
}

export function killXp(kind: number, tier: number): number {
  const base = kind === Z_BRUTE ? 3 : kind === Z_GHOUL ? 2 : 1;
  const steps = tier < CURVE.xpCap ? tier : CURVE.xpCap;
  return base + steps * CURVE.xpPer;
}

export function scoreMul(tier: number): number {
  return CURVE.scoreBase + tier * CURVE.scorePer;
}

export function mixWeight(tier: number, kind: number): number {
  if (kind === Z_BRUTE) return CURVE.brute + tier * CURVE.brutePer;
  if (kind === Z_GHOUL) return CURVE.ghoul + tier * CURVE.ghoulPer;
  return Math.max(4, CURVE.shambler - tier * CURVE.shamblerPer);
}

export function rarityWeight(tier: number, rarity: number): number {
  if (rarity >= 2) return CURVE.legendary + tier * CURVE.legendaryPer;
  if (rarity === 1) return CURVE.rare + tier * CURVE.rarePer;
  return Math.max(CURVE.commonMin, CURVE.common - tier * CURVE.commonPer);
}
