export const WON_KEY = "arcadia.won";
export const ENDLESS_KEY = "arcadia.endless";

export interface Crown {
  won: boolean;
  endless: boolean;
}

export interface CrownStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function loadCrown(store: CrownStore): Crown {
  const won = store.getItem(WON_KEY) === "1";
  return { won, endless: won && store.getItem(ENDLESS_KEY) === "1" };
}

export function saveCrown(store: CrownStore, crown: Crown): void {
  store.setItem(WON_KEY, crown.won ? "1" : "0");
  store.setItem(ENDLESS_KEY, crown.won && crown.endless ? "1" : "0");
}

export function markWon(crown: Crown): Crown {
  if (crown.won) return crown;
  return { won: true, endless: false };
}

export function toggleEndless(crown: Crown): Crown {
  if (!crown.won) return crown;
  return { won: true, endless: !crown.endless };
}

export function jumpSeconds(search: string): number {
  const q = search.startsWith("?") ? search.slice(1) : search;
  const raw = new URLSearchParams(q).get("t");
  if (!raw) return 0;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.floor(n);
}
