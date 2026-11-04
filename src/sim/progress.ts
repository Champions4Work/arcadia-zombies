import { characterAt, offerCount, PASSIVE_FIRE, PASSIVE_RAGE, PASSIVE_SAW, RAGE_DMG } from "./characters";
import { clock, rarityWeight, tierName } from "./difficulty";
import {
  briarRate, calliopeReach, crownHops, crownOn, crownRate, grantUnion, haloBite, haloBlades,
  haloReach, heartReach, howitzerRate, isUnion, slugBonus, unionReady,
} from "./evolve";
import { hasMod, MOD_GLASS, MOD_NOHEAL, pacedXpNeed } from "./modifiers";
import { nextFloat } from "./rng";
import {
  EV_LEVEL, EVOL_AEGIS, EVOL_CANNON, EVOL_STORM, OFFER_N, UPG_COOLANT, UPG_COUNT, UPG_DMG,
  UPG_FIRE, UPG_HP, UPG_MAX, UPG_MORTAR, UPG_PIERCE, UPG_SAWS, UPG_SHIELD, UPG_SHOTGUN, UPG_SPEED,
  UPG_TESLA, UPG_VENT, UPG_WHISTLE, W, type World,
} from "./types";

export const RARITY_COMMON = 0;
export const RARITY_RARE = 1;
export const RARITY_LEGENDARY = 2;

export const UPG_NAMES: readonly string[] = [
  "TESLA COIL",
  "SCATTER VALVE",
  "SAW GEARS",
  "FIRE RATE",
  "DAMAGE",
  "MAX HP",
  "MOVE SPEED",
  "BOILER VENT",
  "PIERCE RIVET",
  "BOILER SHIELD",
  "SPIKED PLATE",
  "COOLANT",
  "MORTAR",
  "STEAM WHISTLE",
  "RICOCHET",
  "DYNAMO",
  "STORM GEAR",
  "CANNON",
  "AEGIS ENGINE",
  "THUNDER CROWN",
  "GATLING BELLOWS",
  "BUZZSAW HALO",
  "BOILER HEART",
  "BRIAR AEGIS",
  "SIEGE HOWITZER",
  "STEAM CALLIOPE",
  "RIVET GUN",
  "STEAM SHOTGUN",
  "FLAME BOILER",
  "HARPOON",
  "BOMB MORTAR",
];

export const UPG_RARITY: readonly number[] = [
  RARITY_LEGENDARY,
  RARITY_RARE,
  RARITY_RARE,
  RARITY_COMMON,
  RARITY_COMMON,
  RARITY_COMMON,
  RARITY_COMMON,
  RARITY_RARE,
  RARITY_RARE,
  RARITY_RARE,
  RARITY_COMMON,
  RARITY_COMMON,
  RARITY_LEGENDARY,
  RARITY_COMMON,
  RARITY_RARE,
  RARITY_LEGENDARY,
  RARITY_LEGENDARY,
  RARITY_LEGENDARY,
  RARITY_LEGENDARY,
  RARITY_LEGENDARY,
  RARITY_LEGENDARY,
  RARITY_LEGENDARY,
  RARITY_LEGENDARY,
  RARITY_LEGENDARY,
  RARITY_LEGENDARY,
  RARITY_LEGENDARY,
  RARITY_COMMON,
  RARITY_RARE,
  RARITY_RARE,
  RARITY_RARE,
  RARITY_LEGENDARY,
];

export const CARD_W = 176;
export const CARD_H = 180;
export const CARD_Y = 86;
export const CARD_GAP = 16;
export const CARD_X0 = Math.floor((W - (CARD_W * OFFER_N + CARD_GAP * (OFFER_N - 1))) / 2);
export const SAW_HIT_R2 = 81;
export const SAW_SPIN = 0.08;

export function stackRank(lv: number): number {
  if (lv <= 0) return 0;
  if (lv <= 2) return lv;
  if (lv === 3) return 2;
  return 3;
}

export function xpNeed(level: number): number {
  const n = level < 0 ? 0 : level;
  if (n <= 3) return 8 + n * 6;
  const late = n - 3;
  return 32 + late * 16 + late * late * 4;
}

export function fireEvery(w: World): number {
  const base = 12 - (stackRank(w.upgrades[UPG_FIRE] ?? 0) + w.meta.gun) * 2;
  if (characterAt(w.charId).passive !== PASSIVE_FIRE) return Math.max(3, base);
  return Math.max(3, Math.round(base * 100 / 130));
}

export function moveSpeed(w: World): number {
  return 2 + stackRank(w.upgrades[UPG_SPEED] ?? 0) * 0.4 + characterAt(w.charId).speed + w.meta.spd;
}

export function maxHpOf(w: World): number {
  const base = hasMod(w.mods, MOD_GLASS) ? 1 : 5 + characterAt(w.charId).hp;
  return base + w.meta.hp + (w.upgrades[UPG_HP] ?? 0);
}

export function bulletDmg(w: World): number {
  const row = characterAt(w.charId);
  let dmg = 1 + stackRank(w.upgrades[UPG_DMG] ?? 0) + (w.upgrades[EVOL_CANNON] ?? 0) + row.dmg + slugBonus(w) + w.meta.dmg;
  if (row.passive === PASSIVE_RAGE && w.hp * 2 <= w.maxHp) dmg += RAGE_DMG;
  return dmg;
}

export function sawRadius(w: World): number {
  return 26 + stackRank(w.upgrades[UPG_SAWS] ?? 0) * 8 + haloReach(w);
}

export function sawCount(w: World): number {
  return stackRank(w.upgrades[UPG_SAWS] ?? 0) + haloBlades(w);
}

export function sawDamage(w: World): number {
  return 1 + (w.upgrades[EVOL_STORM] ?? 0) + haloBite(w);
}

export function sawSpin(w: World): number {
  return characterAt(w.charId).passive === PASSIVE_SAW ? SAW_SPIN * 1.5 : SAW_SPIN;
}

export function sawAngle(tick: number, i: number, n: number, spin = SAW_SPIN): number {
  return tick * spin + i * ((Math.PI * 2) / n);
}

export function cardFrame(i: number, slots: number): { x: number; y: number; w: number; h: number } {
  if (slots <= OFFER_N) {
    return { x: CARD_X0 + i * (CARD_W + CARD_GAP), y: CARD_Y, w: CARD_W, h: CARD_H };
  }
  const gap = 8;
  const w = Math.floor((W - gap * (slots - 1)) / slots);
  const row = w * slots + gap * (slots - 1);
  const x0 = Math.floor((W - row) / 2);
  return { x: x0 + i * (w + gap), y: CARD_Y, w, h: CARD_H };
}

export function offerId(w: World, slot: number): number {
  if (slot >= 0 && slot < OFFER_N) return w.offers[slot] ?? -1;
  if (slot === OFFER_N) return w.offerExtra;
  return -1;
}

export function teslaEvery(w: World): number {
  const base = 54 - stackRank(w.upgrades[UPG_TESLA] ?? 0) * 6 - crownRate(w);
  return Math.max(crownOn(w) ? 8 : 18, base);
}

export function teslaRange(w: World): number {
  return 64 + stackRank(w.upgrades[UPG_TESLA] ?? 0) * 20 + (w.upgrades[EVOL_STORM] ?? 0) * 12;
}

export function teslaChain(w: World): number {
  return 40 + stackRank(w.upgrades[UPG_TESLA] ?? 0) * 14;
}

export function teslaPower(w: World): number {
  return stackRank(w.upgrades[UPG_TESLA] ?? 0) + (w.upgrades[EVOL_STORM] ?? 0) + crownHops(w);
}

export function shieldReload(w: World): number {
  return Math.max(40, 180 - (w.upgrades[UPG_SHIELD] ?? 0) * 20 - (w.upgrades[EVOL_AEGIS] ?? 0) * 24 - briarRate(w));
}

export function ventEvery(w: World): number {
  return Math.max(22, 78 - stackRank(w.upgrades[UPG_VENT] ?? 0) * 10);
}

export function ventRange(w: World): number {
  return 32 + stackRank(w.upgrades[UPG_VENT] ?? 0) * 14 + (w.upgrades[EVOL_AEGIS] ?? 0) * 8 + heartReach(w);
}

export function mortarEvery(w: World): number {
  return Math.max(16, 96 - stackRank(w.upgrades[UPG_MORTAR] ?? 0) * 12 - howitzerRate(w));
}

export function healEvery(w: World): number {
  return Math.max(40, 190 - stackRank(w.upgrades[UPG_COOLANT] ?? 0) * 26);
}

export function whistleRange(w: World): number {
  return 34 + (w.upgrades[UPG_WHISTLE] ?? 0) * 16 + calliopeReach(w);
}

export function upgName(id: number): string {
  return UPG_NAMES[id] ?? "";
}

export function rarityName(rarity: number): string {
  if (rarity >= RARITY_LEGENDARY) return "LEGENDARY";
  if (rarity === RARITY_RARE) return "RARE";
  return "COMMON";
}

export function cardSlot(x: number, y: number, slots = OFFER_N): number {
  const n = slots < 1 ? OFFER_N : slots;
  if (y < CARD_Y || y > CARD_Y + CARD_H) return 0;
  for (let i = 0; i < n; i++) {
    const f = cardFrame(i, n);
    if (x >= f.x && x <= f.x + f.w) return i + 1;
  }
  return 0;
}

export function evolutionReady(w: World, id: number): boolean {
  if (id === EVOL_STORM) return (w.upgrades[UPG_TESLA] ?? 0) >= 2 && (w.upgrades[UPG_SAWS] ?? 0) >= 2;
  if (id === EVOL_CANNON) return (w.upgrades[UPG_SHOTGUN] ?? 0) >= 2 && (w.upgrades[UPG_PIERCE] ?? 0) >= 2;
  if (id === EVOL_AEGIS) return (w.upgrades[UPG_SHIELD] ?? 0) >= 2 && (w.upgrades[UPG_VENT] ?? 0) >= 2;
  return true;
}

export function offerable(w: World, id: number): boolean {
  if (id < 0 || id >= UPG_COUNT) return false;
  if (id === UPG_COOLANT && hasMod(w.mods, MOD_NOHEAL)) return false;
  const legacy = evolutionReady(w, id);
  if (isUnion(id)) return unionReady(w, id, legacy);
  if ((w.upgrades[id] ?? 0) >= UPG_MAX) return false;
  return legacy;
}

export function canUpgrade(w: World): boolean {
  for (let i = 0; i < UPG_COUNT; i++) {
    if (offerable(w, i)) return true;
  }
  return false;
}

export function applyUpgrade(w: World, id: number): void {
  if (id < 0 || id >= UPG_COUNT) return;
  if (grantUnion(w, id, evolutionReady(w, id))) return;
  const lv = w.upgrades[id] ?? 0;
  if (lv >= UPG_MAX) return;
  w.upgrades[id] = lv + 1;
  if (id === UPG_HP) {
    w.maxHp = maxHpOf(w);
    if (!hasMod(w.mods, MOD_NOHEAL)) w.hp = w.maxHp;
  }
  if (id === UPG_SHIELD) {
    w.shield = w.upgrades[UPG_SHIELD] ?? 0;
    w.shieldCd = shieldReload(w);
  }
  if (id === UPG_VENT) w.ventCd = ventEvery(w);
  if (id === UPG_COOLANT) w.healCd = healEvery(w);
  if (id === UPG_MORTAR) w.mortarCd = mortarEvery(w);
}

function rarityOf(id: number): number {
  return UPG_RARITY[id] ?? RARITY_COMMON;
}

function pickOffer(w: World, n: number, ban: number, ban2 = -1): number {
  let n0 = 0;
  let n1 = 0;
  let n2 = 0;
  const s = w.scratch;
  for (let i = 0; i < n; i++) {
    const id = s[i] ?? 0;
    if (id === ban || id === ban2) continue;
    const r = rarityOf(id);
    if (r >= RARITY_LEGENDARY) n2++;
    else if (r === RARITY_RARE) n1++;
    else n0++;
  }
  const tier = w.rank;
  const w0 = n0 > 0 ? rarityWeight(tier, RARITY_COMMON) : 0;
  const w1 = n1 > 0 ? rarityWeight(tier, RARITY_RARE) : 0;
  const w2 = n2 > 0 ? rarityWeight(tier, RARITY_LEGENDARY) : 0;
  const total = w0 + w1 + w2;
  if (total <= 0) return -1;
  const roll = nextFloat(w.rng) * total;
  const want = roll < w0 ? RARITY_COMMON : roll < w0 + w1 ? RARITY_RARE : RARITY_LEGENDARY;
  const count = want === RARITY_COMMON ? n0 : want === RARITY_RARE ? n1 : n2;
  let k = (nextFloat(w.rng) * count) | 0;
  for (let i = 0; i < n; i++) {
    const id = s[i] ?? 0;
    if (id === ban || id === ban2 || rarityOf(id) !== want) continue;
    if (k === 0) return id;
    k--;
  }
  return -1;
}

export function rollOffers(w: World): void {
  const s = w.scratch;
  let n = 0;
  for (let i = 0; i < UPG_COUNT; i++) {
    if (!offerable(w, i)) continue;
    s[n++] = i;
  }
  let unions = 0;
  for (let i = 0; i < n; i++) {
    if (!isUnion(s[i] ?? -1)) continue;
    const t = s[unions] ?? 0;
    s[unions] = s[i] ?? 0;
    s[i] = t;
    unions++;
  }
  for (let i = 0; i < OFFER_N; i++) w.offers[i] = -1;
  if (unions > 0) {
    const take = unions < OFFER_N ? unions : OFFER_N;
    for (let i = 0; i < take; i++) w.offers[i] = s[i] ?? -1;
    if (take < OFFER_N) w.offers[take] = pickOffer(w, n, w.offers[0] ?? -1);
    return;
  }
  const first = pickOffer(w, n, -1);
  w.offers[0] = first;
  if (OFFER_N > 1) w.offers[1] = pickOffer(w, n, first);
  w.offerExtra = -1;
  if (offerCount(w) > OFFER_N) w.offerExtra = pickOffer(w, n, first, w.offers[1] ?? -1);
}

export function beginLevel(w: World): void {
  if (w.choosing) return;
  const need = pacedXpNeed(xpNeed(w.level), w.mods);
  if (w.xp < need) return;
  if (!canUpgrade(w)) return;
  w.xp -= need;
  w.level++;
  rollOffers(w);
  if ((w.offers[0] ?? -1) < 0) return;
  w.choosing = 1;
  w.meta.rerollLeft = w.meta.reroll;
  w.events[EV_LEVEL] = 1;
}

export function takeXp(w: World, n: number): void {
  w.xp += n;
  beginLevel(w);
}

export function tryPick(w: World, pick: number): boolean {
  if (!w.choosing) return false;
  if (pick < 1 || pick > offerCount(w)) return false;
  const id = offerId(w, pick - 1);
  if (id < 0) return false;
  applyUpgrade(w, id);
  w.choosing = 0;
  for (let i = 0; i < OFFER_N; i++) w.offers[i] = -1;
  w.offerExtra = -1;
  beginLevel(w);
  return true;
}

export function summaryText(w: World): string {
  const lines = [tierName(w.rank), clock(w.tick), `SCORE ${w.score}`];
  let any = false;
  for (let i = 0; i < UPG_COUNT; i++) {
    const lv = w.upgrades[i] ?? 0;
    if (lv <= 0) continue;
    any = true;
    lines.push(`${upgName(i)} LV ${lv}`);
  }
  if (!any) lines.push("NO UPGRADES");
  return lines.join("\n");
}
