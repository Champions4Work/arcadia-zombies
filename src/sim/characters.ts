import { OFFER_N, type World } from "./types";

export const PASSIVE_SAW = 0;
export const PASSIVE_FIRE = 1;
export const PASSIVE_CARD = 2;
export const PASSIVE_RAGE = 3;
export const RAGE_DMG = 2;

export const CHAR_TINKER = 0;
export const CHAR_GUNSLINGER = 1;
export const CHAR_ALCHEMIST = 2;
export const CHAR_BRUTE = 3;

export const SURVIVOR_KEY = "arcadia.survivor";
export const BEST_WAVE_KEY = "arcadia.bestWave";

export interface Character {
  id: string;
  name: string;
  startUpg: number;
  hp: number;
  speed: number;
  dmg: number;
  passive: number;
  unlockWave: number;
  line1: string;
  line2: string;
}

const TINKER: Character = {
  id: "tinker",
  name: "Tinker",
  startUpg: -1,
  hp: 0,
  speed: 0,
  dmg: 0,
  passive: PASSIVE_SAW,
  unlockWave: 0,
  line1: "Saws orbit faster.",
  line2: "Same kit, tighter gears.",
};

export const CHARACTERS: readonly Character[] = [
  TINKER,
  {
    id: "gunslinger",
    name: "Gunslinger",
    startUpg: -1,
    hp: -1,
    speed: 0,
    dmg: 0,
    passive: PASSIVE_FIRE,
    unlockWave: 5,
    line1: "+30% fire rate.",
    line2: "Starts one HP lower.",
  },
  {
    id: "alchemist",
    name: "Alchemist",
    startUpg: -1,
    hp: 0,
    speed: 0,
    dmg: 0,
    passive: PASSIVE_CARD,
    unlockWave: 8,
    line1: "Drafts show one extra card.",
    line2: "Choose 1 of 3.",
  },
  {
    id: "brute",
    name: "Brute",
    startUpg: -1,
    hp: 3,
    speed: -0.5,
    dmg: 0,
    passive: PASSIVE_RAGE,
    unlockWave: 12,
    line1: "+3 HP, slower steps.",
    line2: "More damage at low HP.",
  },
];

export interface Kv {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function characterAt(index: number): Character {
  return CHARACTERS[index] ?? TINKER;
}

export function characterIndex(id: string | null): number {
  if (!id) return -1;
  for (let i = 0; i < CHARACTERS.length; i++) {
    if (CHARACTERS[i]?.id === id) return i;
  }
  return -1;
}

export function offerCount(w: World): number {
  return characterAt(w.charId).passive === PASSIVE_CARD ? OFFER_N + 1 : OFFER_N;
}

export function isUnlocked(index: number, bestWave: number): boolean {
  const row = CHARACTERS[index];
  if (!row) return false;
  return bestWave >= row.unlockWave;
}

export function readWave(raw: string | null): number {
  const n = Math.floor(Number(raw));
  return n > 0 ? n : 0;
}

export function noteWave(best: number, wave: number): number {
  const a = best > 0 ? Math.floor(best) : 0;
  const b = wave > 0 ? Math.floor(wave) : 0;
  return a > b ? a : b;
}

export function loadRoster(store: Kv): { index: number; bestWave: number } {
  const bestWave = readWave(store.getItem(BEST_WAVE_KEY));
  const index = characterIndex(store.getItem(SURVIVOR_KEY));
  return { index: isUnlocked(index, bestWave) ? index : CHAR_TINKER, bestWave };
}

export function saveRoster(store: Kv, index: number, bestWave: number): void {
  const prev = loadRoster(store);
  const wave = noteWave(prev.bestWave, bestWave);
  const want = isUnlocked(index, wave) ? index : prev.index;
  const pick = isUnlocked(want, wave) ? want : CHAR_TINKER;
  store.setItem(SURVIVOR_KEY, characterAt(pick).id);
  store.setItem(BEST_WAVE_KEY, String(wave));
}
