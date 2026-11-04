import { fill, frame, grid, outline, put, type PxFrame } from "../px";

function tank(id: string, bob: number): PxFrame {
  const g = grid(48, 32);
  fill(g, 4, 18 + bob, 40, 8, "x");
  fill(g, 5, 19 + bob, 38, 6, "i");
  for (let i = 0; i < 8; i++) fill(g, 6 + i * 5, 20 + bob, 3, 4, "n");
  fill(g, 8, 8 + bob, 32, 12, "d");
  fill(g, 10, 10 + bob, 28, 8, "b");
  put(g, 12, 11 + bob, "B");
  put(g, 13, 11 + bob, "B");
  fill(g, 28, 4 + bob, 14, 8, "x");
  fill(g, 30, 6 + bob, 16, 3, "w");
  put(g, 44, 6 + bob, "f");
  fill(g, 18, 6 + bob, 6, 4, "c");
  put(g, 20, 7 + bob, "R");
  put(g, 21, 7 + bob, "R");
  outline(g);
  return frame(id, 24, 31, g);
}

export const BOSS_FRAMES: PxFrame[] = [
  tank("tank-0", 0),
  tank("tank-1", 1),
  tank("tank-2", 0),
  tank("tank-3", 1),
];
