import {
  EVOL_AEGIS, EVOL_CANNON, EVOL_STORM, UNION_BELLOWS, UNION_BRIAR, UNION_CALLIOPE,
  UNION_CROWN, UNION_HALO, UNION_HEART, UNION_HOWITZER, UPG_COOLANT, UPG_DMG, UPG_DYNAMO,
  UPG_FIRE, UPG_HP, UPG_MAX, UPG_MORTAR, UPG_PIERCE, UPG_RICOCHET, UPG_SAWS, UPG_SHIELD,
  UPG_SHOTGUN, UPG_SPEED, UPG_SPIKES, UPG_TESLA, UPG_VENT, UPG_WHISTLE, type World,
} from "./types";

export interface UnionSpec {
  id: number;
  weapon: number;
  passive: number;
  hint: string;
  recipe: string;
  effect: string;
}

export interface LegacySpec {
  id: number;
  recipe: string;
  effect: string;
}

export const WEAPON_IDS: readonly number[] = [
  UPG_TESLA, UPG_SHOTGUN, UPG_SAWS, UPG_VENT, UPG_SHIELD, UPG_MORTAR, UPG_WHISTLE,
];

export const PASSIVE_IDS: readonly number[] = [
  UPG_FIRE, UPG_DMG, UPG_HP, UPG_SPEED, UPG_PIERCE, UPG_SPIKES, UPG_COOLANT, UPG_RICOCHET, UPG_DYNAMO,
];

export const UNIONS: readonly UnionSpec[] = [
  {
    id: UNION_CROWN, weapon: UPG_TESLA, passive: UPG_DYNAMO,
    hint: "TESLA MAX + DYNAMO",
    recipe: "TESLA COIL max + DYNAMO",
    effect: "Crown lightning chains farther and strikes harder.",
  },
  {
    id: UNION_BELLOWS, weapon: UPG_SHOTGUN, passive: UPG_RICOCHET,
    hint: "SHOTGUN + RICOCHET",
    recipe: "STEAM SHOTGUN max + RICOCHET",
    effect: "A gatling of heavy slugs that bounce and pierce.",
  },
  {
    id: UNION_HALO, weapon: UPG_SAWS, passive: UPG_DMG,
    hint: "SAWS MAX + DAMAGE",
    recipe: "SAW GEARS max + DAMAGE",
    effect: "A wider halo of hotter buzzsaws.",
  },
  {
    id: UNION_HEART, weapon: UPG_VENT, passive: UPG_COOLANT,
    hint: "VENT MAX + COOLANT",
    recipe: "BOILER VENT max + COOLANT",
    effect: "The boiler pulse reaches farther and mends brass.",
  },
  {
    id: UNION_BRIAR, weapon: UPG_SHIELD, passive: UPG_SPIKES,
    hint: "SHIELD MAX + SPIKES",
    recipe: "BOILER SHIELD max + SPIKED PLATE",
    effect: "A spiked aegis with two extra charges.",
  },
  {
    id: UNION_HOWITZER, weapon: UPG_MORTAR, passive: UPG_FIRE,
    hint: "MORTAR + FIRE RATE",
    recipe: "MORTAR max + FIRE RATE",
    effect: "Three siege shells, faster and heavier.",
  },
  {
    id: UNION_CALLIOPE, weapon: UPG_WHISTLE, passive: UPG_SPEED,
    hint: "WHISTLE MAX + SPEED",
    recipe: "STEAM WHISTLE max + MOVE SPEED",
    effect: "Calliope steam slows a wider ring and scalds it.",
  },
];

export const LEGACY_UNIONS: readonly LegacySpec[] = [
  { id: EVOL_STORM, recipe: "TESLA COIL LV2 + SAW GEARS LV2", effect: "Storm gear widens the coil and the saws." },
  { id: EVOL_CANNON, recipe: "STEAM SHOTGUN LV2 + PIERCE RIVET LV2", effect: "Cannon adds pellets, pierce, and rivet damage." },
  { id: EVOL_AEGIS, recipe: "BOILER SHIELD LV2 + BOILER VENT LV2", effect: "Aegis reloads faster and vents harder." },
];

const SPEC_AT = new Int16Array(32);
SPEC_AT.fill(-1);
for (let i = 0; i < UNIONS.length; i++) {
  const spec = UNIONS[i];
  if (spec) SPEC_AT[spec.id] = i;
}

export function unionSpec(id: number): UnionSpec | null {
  const i = SPEC_AT[id] ?? -1;
  if (i < 0) return null;
  return UNIONS[i] ?? null;
}

export function isUnion(id: number): boolean {
  return (SPEC_AT[id] ?? -1) >= 0;
}

export function unionHint(id: number): string {
  return unionSpec(id)?.hint ?? "";
}

export function unionReady(w: World, id: number, legacyReady: boolean): boolean {
  const spec = unionSpec(id);
  if (!spec || !legacyReady) return false;
  if ((w.upgrades[id] ?? 0) > 0) return false;
  if ((w.upgrades[spec.weapon] ?? 0) < UPG_MAX) return false;
  if ((w.upgrades[spec.passive] ?? 0) < 1) return false;
  return true;
}

export function grantUnion(w: World, id: number, legacyReady: boolean): boolean {
  if (!isUnion(id)) return false;
  if ((w.upgrades[id] ?? 0) > 0) return true;
  if (!unionReady(w, id, legacyReady)) return true;
  w.upgrades[id] = 1;
  if (id === UNION_BRIAR) w.shield = shieldCap(w);
  if (id === UNION_HEART && w.hp < w.maxHp) w.hp++;
  return true;
}

export function crownOn(w: World): boolean {
  return (w.upgrades[UNION_CROWN] ?? 0) > 0;
}

export function bellowsOn(w: World): boolean {
  return (w.upgrades[UNION_BELLOWS] ?? 0) > 0;
}

export function haloOn(w: World): boolean {
  return (w.upgrades[UNION_HALO] ?? 0) > 0;
}

export function heartOn(w: World): boolean {
  return (w.upgrades[UNION_HEART] ?? 0) > 0;
}

export function briarOn(w: World): boolean {
  return (w.upgrades[UNION_BRIAR] ?? 0) > 0;
}

export function howitzerOn(w: World): boolean {
  return (w.upgrades[UNION_HOWITZER] ?? 0) > 0;
}

export function calliopeOn(w: World): boolean {
  return (w.upgrades[UNION_CALLIOPE] ?? 0) > 0;
}

export function crownHops(w: World): number {
  return crownOn(w) ? 3 : 0;
}

export function crownRate(w: World): number {
  return crownOn(w) ? 16 : 0;
}

export function pelletBonus(w: World): number {
  return bellowsOn(w) ? 2 : 0;
}

export function pierceBonus(w: World): number {
  return bellowsOn(w) ? 2 : 0;
}

export function bounceBonus(w: World): number {
  return bellowsOn(w) ? 2 : 0;
}

export function slugBonus(w: World): number {
  return bellowsOn(w) ? 2 : 0;
}

export function haloBlades(w: World): number {
  return haloOn(w) ? 2 : 0;
}

export function haloReach(w: World): number {
  return haloOn(w) ? 14 : 0;
}

export function haloBite(w: World): number {
  return haloOn(w) ? 3 : 0;
}

export function heartReach(w: World): number {
  return heartOn(w) ? 22 : 0;
}

export function heartBite(w: World): number {
  return heartOn(w) ? 2 : 0;
}

export function briarCapBonus(w: World): number {
  return briarOn(w) ? 2 : 0;
}

export function briarRate(w: World): number {
  return briarOn(w) ? 30 : 0;
}

export function shieldCap(w: World): number {
  return (w.upgrades[UPG_SHIELD] ?? 0) + briarCapBonus(w);
}

export function howitzerShells(w: World): number {
  return howitzerOn(w) ? 2 : 0;
}

export function howitzerBite(w: World): number {
  return howitzerOn(w) ? 4 : 0;
}

export function howitzerRate(w: World): number {
  return howitzerOn(w) ? 30 : 0;
}

export function calliopeReach(w: World): number {
  return calliopeOn(w) ? 36 : 0;
}

export function calliopeBite(w: World): number {
  return calliopeOn(w) ? 2 : 0;
}
