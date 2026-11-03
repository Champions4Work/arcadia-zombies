export const SCRAP_TIME_NUM = 4;
export const SCRAP_TIME_DEN = 1200;
export const SCRAP_PER_TIER = 3;
export const SCRAP_PER_KILL = 1;

export function scrapEarned(ticks: number, rank: number, kills: number): number {
  const t = typeof ticks === "number" && Number.isFinite(ticks) && ticks > 0 ? Math.floor(ticks) : 0;
  const r = typeof rank === "number" && Number.isFinite(rank) && rank > 0 ? Math.floor(rank) : 0;
  const k = typeof kills === "number" && Number.isFinite(kills) && kills > 0 ? Math.floor(kills) : 0;
  return Math.floor((t * SCRAP_TIME_NUM) / SCRAP_TIME_DEN) + r * SCRAP_PER_TIER + k * SCRAP_PER_KILL;
}
