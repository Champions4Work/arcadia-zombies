export const ZONE_BRASS = 0;
export const ZONE_BOILER = 1;
export const ZONE_TRAM = 2;
export const ZONE_N = 3;

export const ZONE_WAVE = [1, 5, 7] as const;

const TITLE = ["The Brass District", "Boiler Works", "Tram Depot"] as const;
const CHAPTER = ["Chapter 1", "Chapter 1", "Chapter 1"] as const;

export function zoneAt(wave: number): number {
  const n = wave | 0;
  if (n >= ZONE_WAVE[ZONE_TRAM]) return ZONE_TRAM;
  if (n >= ZONE_WAVE[ZONE_BOILER]) return ZONE_BOILER;
  return ZONE_BRASS;
}

export function zoneTitle(id: number): string {
  return TITLE[id] ?? TITLE[ZONE_BRASS];
}

export function zoneChapter(id: number): string {
  return CHAPTER[id] ?? CHAPTER[ZONE_BRASS];
}

export function zoneTitleAt(wave: number): string {
  return zoneTitle(zoneAt(wave));
}

export function zoneChapterAt(wave: number): string {
  return zoneChapter(zoneAt(wave));
}

export function zoneName(id: number): string {
  return zoneTitle(id);
}
