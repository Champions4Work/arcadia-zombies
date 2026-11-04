import { frameHits, type PxFrame } from "./px";
import { BOSS_FRAMES } from "./sprites/boss";
import { FOE_FRAMES } from "./sprites/foes";
import { HERO_FRAMES } from "./sprites/heroes";
import { ICON_FRAMES } from "./sprites/icons";
import { LOOT_FRAMES } from "./sprites/pickups";
import { FX_FRAMES, SHOT_FRAMES } from "./sprites/projectiles";
import { PROP_FRAMES, TILE_FRAMES } from "./sprites/tiles";

export const FRAMES: readonly PxFrame[] = [
  ...HERO_FRAMES,
  ...FOE_FRAMES,
  ...BOSS_FRAMES,
  ...SHOT_FRAMES,
  ...FX_FRAMES,
  ...LOOT_FRAMES,
  ...TILE_FRAMES,
  ...PROP_FRAMES,
  ...ICON_FRAMES,
];

export function catalogHits(): string[] {
  const hits: string[] = [];
  const seen = new Set<string>();
  for (const src of FRAMES) {
    if (seen.has(src.id)) hits.push(`dup:${src.id}`);
    seen.add(src.id);
    hits.push(...frameHits(src));
  }
  return hits;
}
