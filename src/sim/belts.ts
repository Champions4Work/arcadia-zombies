import { dropChest } from "./chest";
import type { World } from "./types";

export interface BeltSpec {
  x: number;
  y: number;
  w: number;
  vert: number;
}

export const BELTS: readonly BeltSpec[] = [
  { x: 340, y: 168, w: 120, vert: 0 },
  { x: 500, y: 168, w: 120, vert: 0 },
  { x: 340, y: 188, w: 180, vert: 1 },
  { x: 620, y: 188, w: 180, vert: 1 },
  { x: 340, y: 448, w: 120, vert: 0 },
  { x: 500, y: 448, w: 120, vert: 0 },
];

export const BELT_DROP_EVERY = 7800;

export function beltEndX(belt: BeltSpec): number {
  return belt.vert ? belt.x : belt.x + belt.w;
}

export function beltEndY(belt: BeltSpec): number {
  return belt.vert ? belt.y + belt.w : belt.y;
}

export function stepBelts(w: World): void {
  if (w.tick <= 0) return;
  if (w.tick % BELT_DROP_EVERY !== 0) return;
  const belt = BELTS[((w.tick / BELT_DROP_EVERY) | 0) % BELTS.length];
  if (!belt) return;
  dropChest(w, beltEndX(belt), beltEndY(belt));
}
