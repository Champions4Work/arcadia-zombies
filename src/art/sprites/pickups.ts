import { fill, frame, grid, outline, put, type PxFrame } from "../px";

function gem(id: string, mid: string, hi: string): PxFrame {
  const g = grid(8, 8);
  fill(g, 3, 1, 2, 6, mid);
  fill(g, 2, 2, 4, 4, mid);
  put(g, 3, 2, hi);
  outline(g);
  return frame(id, 4, 7, g);
}

function chest(id: string, open: boolean): PxFrame {
  const g = grid(16, 16);
  fill(g, 2, 7, 12, 7, "d");
  fill(g, 3, 8, 10, 5, "b");
  fill(g, 2, open ? 3 : 5, 12, 5, "n");
  fill(g, 3, open ? 4 : 6, 10, 3, "c");
  put(g, 7, 9, "B");
  put(g, 8, 9, "B");
  if (open) {
    fill(g, 6, 6, 4, 3, "y");
    put(g, 7, 6, "u");
  }
  outline(g);
  return frame(id, 8, 15, g);
}

export const LOOT_FRAMES: PxFrame[] = [
  gem("xp-0", "y", "B"),
  gem("xp-1", "b", "y"),
  gem("hp-0", "h", "G"),
  chest("chest-0", false),
  chest("chest-1", true),
];
