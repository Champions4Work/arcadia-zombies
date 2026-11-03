import { doubledScrap, isWon } from "../sim/finale";
import { maxHpOf } from "../sim/progress";
import type { World } from "../sim/types";
import { scrapEarned } from "./scrap";

export const WORKSHOP_KEY = "arcadia.workshop";
export const WORKSHOP_VERSION = 1;
export const SCRAP_CAP = 999999;

export const META_HP = 0;
export const META_DMG = 1;
export const META_SPD = 2;
export const META_GUN = 3;
export const META_REVIVE = 4;
export const META_REROLL = 5;
export const META_N = 6;

export const META_NAMES: readonly string[] = [
  "MAX HP",
  "DAMAGE",
  "SPEED",
  "GUN LEVEL",
  "REVIVE",
  "REROLL",
];

export const META_BLURB: readonly string[] = [
  "PLATE +1",
  "RIVET +1",
  "STRIDE +0.125",
  "GUN START +1",
  "ONCE PER RUN",
  "ONE PER CHOICE",
];

export const META_MAX: readonly number[] = [3, 2, 3, 2, 1, 1];

export const META_COST: readonly (readonly number[])[] = [
  [40, 95, 180],
  [85, 210],
  [36, 85, 160],
  [70, 170],
  [240],
  [130],
];

export const BONUS_HP = 1;
export const BONUS_DMG = 1;
export const BONUS_SPD = 0.125;
export const BONUS_GUN = 1;

export interface Workshop {
  v: number;
  scrap: number;
  ranks: number[];
}

export interface ScrapStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface WorkshopFile {
  shop: Workshop;
  writable: boolean;
}

export function emptyWorkshop(): Workshop {
  return { v: WORKSHOP_VERSION, scrap: 0, ranks: [0, 0, 0, 0, 0, 0] };
}

export function cheapestCost(): number {
  let best = 0;
  for (let i = 0; i < META_N; i++) {
    const c = META_COST[i]?.[0] ?? 0;
    if (c > 0 && (best === 0 || c < best)) best = c;
  }
  return best;
}

export function rackCost(): number {
  let n = 0;
  for (let i = 0; i < META_N; i++) {
    const row = META_COST[i];
    if (!row) continue;
    for (let r = 0; r < row.length; r++) n += row[r] ?? 0;
  }
  return n;
}

export function nextCost(shop: Workshop, id: number): number {
  if (id < 0 || id >= META_N) return -1;
  const rank = shop.ranks[id] ?? 0;
  if (rank >= (META_MAX[id] ?? 0)) return -1;
  const cost = META_COST[id]?.[rank];
  return typeof cost === "number" ? cost : -1;
}

export function tryBuy(shop: Workshop, id: number): boolean {
  const cost = nextCost(shop, id);
  if (cost < 0 || shop.scrap < cost) return false;
  shop.scrap -= cost;
  shop.ranks[id] = (shop.ranks[id] ?? 0) + 1;
  return true;
}

export function awardRun(shop: Workshop, w: World): number {
  if (!w.over || w.meta.banked) return 0;
  w.meta.banked = 1;
  const base = scrapEarned(w.tick, w.rank, w.kills);
  const n = isWon(w) ? doubledScrap(base) : base;
  shop.scrap += n;
  return n;
}

export function applyWorkshop(w: World, shop: Workshop): void {
  const m = w.meta;
  m.hp = (shop.ranks[META_HP] ?? 0) * BONUS_HP;
  m.dmg = (shop.ranks[META_DMG] ?? 0) * BONUS_DMG;
  m.spd = (shop.ranks[META_SPD] ?? 0) * BONUS_SPD;
  m.gun = (shop.ranks[META_GUN] ?? 0) * BONUS_GUN;
  m.revive = shop.ranks[META_REVIVE] ?? 0;
  m.reroll = shop.ranks[META_REROLL] ?? 0;
  m.rerollLeft = 0;
  m.banked = 0;
  w.maxHp = maxHpOf(w);
  w.hp = w.maxHp;
}

function clampCount(n: unknown, max: number): number {
  if (typeof n !== "number" || !Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(max, Math.floor(n)));
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object";
}

export function serializeWorkshop(shop: Workshop): string {
  const ranks: number[] = [];
  for (let i = 0; i < META_N; i++) ranks.push(shop.ranks[i] ?? 0);
  return JSON.stringify({ v: WORKSHOP_VERSION, scrap: shop.scrap | 0, ranks });
}

export function loadWorkshop(store: ScrapStore): WorkshopFile {
  const raw = store.getItem(WORKSHOP_KEY);
  if (!raw) return { shop: emptyWorkshop(), writable: true };
  let data: unknown;
  try { data = JSON.parse(raw); } catch { return { shop: emptyWorkshop(), writable: true }; }
  if (!isRecord(data)) return { shop: emptyWorkshop(), writable: true };
  if (typeof data.v === "number" && data.v > WORKSHOP_VERSION) return { shop: emptyWorkshop(), writable: false };
  if (data.v !== WORKSHOP_VERSION) return { shop: emptyWorkshop(), writable: true };
  const shop = emptyWorkshop();
  shop.scrap = clampCount(data.scrap, SCRAP_CAP);
  if (Array.isArray(data.ranks)) {
    for (let i = 0; i < META_N; i++) shop.ranks[i] = clampCount(data.ranks[i], META_MAX[i] ?? 0);
  }
  return { shop, writable: true };
}

export function saveWorkshop(store: ScrapStore, shop: Workshop, writable: boolean): void {
  if (!writable) return;
  store.setItem(WORKSHOP_KEY, serializeWorkshop(shop));
}
