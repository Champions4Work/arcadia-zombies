export const GUIDE_KEY = "arcadia.howto";
export const GUIDE_TITLE = "How to play";
export const GUIDE_SKIP = "Skip";

export interface GuideLine {
  title: string;
  body: string;
}

export const GUIDE_LINES: readonly GuideLine[] = [
  { title: "Move", body: "WASD or arrows. Drag the stick on a touch screen." },
  { title: "Auto-fire", body: "The brass automaton fires on its own. You only steer." },
  { title: "Level-up cards", body: "Each level offers two cards. Press 1 or 2, or tap one." },
  { title: "Gears", body: "Pair a maxed weapon with its gear to forge a union." },
];

export interface GuideStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function guideSeen(raw: string | null): boolean {
  return raw === "1";
}

export function loadGuideSeen(store: GuideStore): boolean {
  try { return guideSeen(store.getItem(GUIDE_KEY)); } catch { return false; }
}

export function saveGuideSeen(store: GuideStore): void {
  try { store.setItem(GUIDE_KEY, "1"); } catch { return; }
}
