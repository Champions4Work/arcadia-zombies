import { fill, frame, grid, put, type PxFrame } from "../px";

function tile(id: string, draw: (g: string[][]) => void): PxFrame {
  const g = grid(16, 16);
  draw(g);
  return frame(id, 0, 0, g);
}

export const TILE_FRAMES: PxFrame[] = [
  tile("cobble", (g) => {
    fill(g, 0, 0, 16, 16, "i");
    fill(g, 1, 1, 6, 6, "p");
    fill(g, 8, 2, 7, 5, "s");
    fill(g, 2, 8, 5, 6, "s");
    fill(g, 9, 9, 6, 5, "p");
    put(g, 3, 3, "x");
    put(g, 11, 11, "n");
  }),
  tile("cobble-d", (g) => {
    fill(g, 0, 0, 16, 16, "s");
    fill(g, 2, 2, 5, 5, "i");
    fill(g, 9, 3, 5, 4, "o");
    fill(g, 3, 9, 8, 5, "i");
  }),
  tile("cobble-w", (g) => {
    fill(g, 0, 0, 16, 16, "i");
    fill(g, 1, 1, 14, 14, "p");
    put(g, 4, 4, "n");
    put(g, 12, 10, "n");
  }),
  tile("grate", (g) => {
    fill(g, 0, 0, 16, 16, "s");
    for (let i = 1; i < 16; i += 3) fill(g, i, 1, 1, 14, "x");
    for (let i = 1; i < 16; i += 3) fill(g, 1, i, 14, 1, "x");
  }),
  tile("rail-h", (g) => {
    fill(g, 0, 0, 16, 16, "i");
    fill(g, 0, 6, 16, 4, "n");
    fill(g, 0, 7, 16, 2, "x");
  }),
  tile("rail-v", (g) => {
    fill(g, 0, 0, 16, 16, "i");
    fill(g, 6, 0, 4, 16, "n");
    fill(g, 7, 0, 2, 16, "x");
  }),
  tile("rubble", (g) => {
    fill(g, 0, 0, 16, 16, "i");
    fill(g, 3, 8, 5, 4, "n");
    fill(g, 9, 6, 4, 5, "p");
    put(g, 4, 9, "x");
  }),
  tile("vent", (g) => {
    fill(g, 0, 0, 16, 16, "s");
    fill(g, 3, 3, 10, 10, "x");
    fill(g, 5, 5, 6, 6, "i");
    put(g, 7, 7, "M");
    put(g, 8, 6, "m");
  }),
];

export const PROP_FRAMES: PxFrame[] = [
  tile("pipe", (g) => {
    fill(g, 6, 0, 4, 16, "n");
    fill(g, 7, 0, 2, 16, "d");
    fill(g, 4, 6, 8, 4, "x");
  }),
  tile("lamp", (g) => {
    fill(g, 7, 4, 2, 10, "x");
    fill(g, 5, 2, 6, 4, "d");
    put(g, 7, 3, "B");
    put(g, 8, 3, "y");
  }),
  tile("gear", (g) => {
    fill(g, 4, 4, 8, 8, "d");
    fill(g, 6, 2, 4, 12, "d");
    fill(g, 2, 6, 12, 4, "d");
    fill(g, 6, 6, 4, 4, "i");
    put(g, 5, 5, "b");
  }),
];
