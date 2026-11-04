import { fill, frame, grid, outline, put, type PxFrame } from "../px";

function bolt(id: string, dx: number, dy: number, mid: string, hi: string): PxFrame {
  const g = grid(12, 8);
  fill(g, 2 + dx, 3 + dy, 8, 2, mid);
  put(g, 3 + dx, 3 + dy, hi);
  put(g, 9 + dx, 3 + dy, "u");
  outline(g);
  return frame(id, 6, 4, g);
}

function blob(id: string, mid: string, hi: string): PxFrame {
  const g = grid(10, 10);
  fill(g, 3, 3, 5, 5, mid);
  fill(g, 4, 2, 3, 7, mid);
  put(g, 5, 4, hi);
  outline(g);
  return frame(id, 5, 5, g);
}

export const SHOT_FRAMES: PxFrame[] = [
  bolt("rivet-0", 0, 0, "c", "e"),
  bolt("rivet-1", 1, 0, "c", "F"),
  bolt("rivet-2", 0, -1, "c", "e"),
  bolt("rivet-3", 0, 1, "c", "e"),
  bolt("pellet-0", 0, 0, "w", "W"),
  bolt("pellet-1", 1, 0, "w", "B"),
  bolt("pellet-2", 0, -1, "w", "W"),
  bolt("pellet-3", 0, 1, "w", "W"),
  blob("flame-0", "f", "F"),
  blob("flame-1", "e", "u"),
  blob("flame-2", "f", "F"),
  blob("flame-3", "e", "u"),
  bolt("harp-0", 0, 0, "W", "a"),
  bolt("harp-1", 1, 0, "W", "G"),
  bolt("harp-2", 0, -1, "W", "a"),
  bolt("harp-3", 0, 1, "W", "a"),
  blob("bomb-0", "x", "b"),
  blob("bomb-1", "x", "f"),
  blob("bomb-2", "x", "b"),
  blob("bomb-3", "x", "f"),
  blob("acid-0", "a", "G"),
  blob("acid-1", "g", "a"),
];

export const FX_FRAMES: PxFrame[] = [
  blob("puff-0", "M", "u"),
  blob("spark-0", "F", "u"),
  blob("boom-0", "f", "F"),
];
