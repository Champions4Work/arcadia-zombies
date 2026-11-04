import { fill, frame, grid, outline, put, type PxFrame } from "../px";

function icon(id: string, draw: (g: string[][]) => void): PxFrame {
  const g = grid(16, 16);
  draw(g);
  outline(g);
  return frame(id, 0, 0, g);
}

export const ICON_FRAMES: PxFrame[] = [
  icon("icon-bolt", (g) => {
    fill(g, 7, 2, 3, 8, "y");
    fill(g, 4, 8, 8, 3, "B");
    put(g, 6, 4, "u");
  }),
  icon("icon-fan", (g) => {
    fill(g, 3, 7, 10, 3, "w");
    fill(g, 10, 5, 4, 7, "W");
    put(g, 12, 7, "u");
  }),
  icon("icon-saw", (g) => {
    fill(g, 4, 4, 8, 8, "w");
    fill(g, 6, 2, 4, 12, "W");
    fill(g, 2, 6, 12, 4, "W");
    fill(g, 6, 6, 4, 4, "i");
  }),
  icon("icon-fire", (g) => {
    fill(g, 5, 4, 6, 8, "f");
    fill(g, 6, 3, 4, 6, "F");
    put(g, 7, 6, "u");
  }),
  icon("icon-rivet", (g) => {
    fill(g, 3, 7, 10, 3, "c");
    fill(g, 10, 6, 4, 5, "e");
    put(g, 12, 7, "F");
  }),
  icon("icon-heart", (g) => {
    fill(g, 3, 4, 4, 4, "h");
    fill(g, 9, 4, 4, 4, "h");
    fill(g, 4, 6, 8, 6, "h");
    put(g, 5, 5, "G");
  }),
  icon("icon-boot", (g) => {
    fill(g, 5, 4, 4, 8, "c");
    fill(g, 5, 10, 8, 3, "r");
  }),
  icon("icon-shield", (g) => {
    fill(g, 4, 3, 8, 10, "b");
    fill(g, 6, 5, 4, 6, "B");
  }),
  icon("icon-spike", (g) => {
    fill(g, 7, 2, 2, 12, "w");
    fill(g, 5, 4, 6, 3, "W");
  }),
  icon("icon-bomb", (g) => {
    fill(g, 5, 5, 6, 7, "x");
    put(g, 8, 4, "f");
    put(g, 7, 7, "b");
  }),
  icon("icon-horn", (g) => {
    fill(g, 3, 6, 10, 4, "d");
    fill(g, 10, 4, 3, 4, "b");
  }),
  icon("icon-gear", (g) => {
    fill(g, 5, 5, 6, 6, "b");
    fill(g, 6, 3, 4, 10, "d");
    fill(g, 3, 6, 10, 4, "d");
    fill(g, 6, 6, 4, 4, "i");
  }),
  icon("icon-crown", (g) => {
    fill(g, 3, 7, 10, 5, "y");
    put(g, 3, 5, "B");
    put(g, 8, 4, "B");
    put(g, 12, 5, "B");
  }),
  icon("icon-ult", (g) => {
    fill(g, 4, 4, 8, 8, "b");
    fill(g, 6, 6, 4, 4, "F");
    put(g, 7, 7, "u");
  }),
];
