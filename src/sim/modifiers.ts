export const MOD_DOUBLE = 1;
export const MOD_GLASS = 2;
export const MOD_NOHEAL = 4;
export const MOD_FAST = 8;
export const MOD_GEAR = 16;
export const MOD_MASK = MOD_DOUBLE | MOD_GLASS | MOD_NOHEAL | MOD_FAST | MOD_GEAR;

export const MODS_KEY = "arcadia.mods";

export interface ModDef {
  bit: number;
  name: string;
  blurb: string;
  mul: number;
}

export const MOD_LIST: readonly ModDef[] = [
  { bit: MOD_DOUBLE, name: "Double Horde", blurb: "Twice the dead, closing in twice as fast.", mul: 150 },
  { bit: MOD_GLASS, name: "Glass Cannon", blurb: "One heart. Rivets hit twice as hard.", mul: 200 },
  { bit: MOD_NOHEAL, name: "No Healing", blurb: "The boiler never mends.", mul: 150 },
  { bit: MOD_FAST, name: "Fast Zombies", blurb: "The dead close faster.", mul: 140 },
  { bit: MOD_GEAR, name: "Gear Rush", blurb: "Levels arrive in half the scrap.", mul: 80 },
];

export interface ModStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function clampMods(n: number): number {
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.floor(n) & MOD_MASK;
}

export function hasMod(mods: number, bit: number): boolean {
  return (clampMods(mods) & bit) !== 0;
}

export function toggleMod(mods: number, bit: number): number {
  const b = bit & MOD_MASK;
  if (b === 0) return clampMods(mods);
  return clampMods(mods) ^ b;
}

export function scoreHundredths(mods: number): number {
  let m = 100;
  const bits = clampMods(mods);
  for (let i = 0; i < MOD_LIST.length; i++) {
    const mod = MOD_LIST[i];
    if (!mod || (bits & mod.bit) === 0) continue;
    m = Math.round((m * mod.mul) / 100);
  }
  return m;
}

export function scoreLabel(mods: number): string {
  const h = scoreHundredths(mods);
  const whole = (h / 100) | 0;
  const frac = h % 100;
  const tens = (frac / 10) | 0;
  const ones = frac % 10;
  return `×${whole}.${tens}${ones}`;
}

export function scoreBanner(mods: number): string {
  return `SCORE ${scoreLabel(mods)}`;
}

export function modNames(mods: number): string {
  const bits = clampMods(mods);
  let text = "";
  for (let i = 0; i < MOD_LIST.length; i++) {
    const mod = MOD_LIST[i];
    if (!mod || (bits & mod.bit) === 0) continue;
    text = text.length > 0 ? `${text} · ${mod.name}` : mod.name;
  }
  return text;
}

export function applyScore(base: number, mods: number): number {
  const h = scoreHundredths(mods);
  if (h === 100) return base;
  return Math.max(0, Math.round((base * h) / 100));
}

export function hordeBudget(base: number, mods: number): number {
  return hasMod(mods, MOD_DOUBLE) ? base * 2 : base;
}

export function hordeGap(base: number, mods: number): number {
  if (!hasMod(mods, MOD_DOUBLE)) return base;
  const n = base >> 1;
  return n < 1 ? 1 : n;
}

export function pacedSpeed(speed: number, mods: number): number {
  return hasMod(mods, MOD_FAST) ? speed * 1.5 : speed;
}

export function cannonHit(dmg: number, mods: number): number {
  return hasMod(mods, MOD_GLASS) ? dmg * 2 : dmg;
}

export function pacedXpNeed(need: number, mods: number): number {
  if (!hasMod(mods, MOD_GEAR)) return need;
  const n = need >> 1;
  return n < 1 ? 1 : n;
}

export function loadMods(store: ModStore): number {
  return clampMods(Number(store.getItem(MODS_KEY)));
}

export function saveMods(store: ModStore, mods: number): void {
  store.setItem(MODS_KEY, String(clampMods(mods)));
}
