import { H, MAX_ZOMBIES, W } from "./types";

export const GRID_CELL = 24;
export const GRID_PAD = 32;
export const GRID_COLS = Math.ceil((W + GRID_PAD * 2) / GRID_CELL);
export const GRID_ROWS = Math.ceil((H + GRID_PAD * 2) / GRID_CELL);
export const GRID_CELLS = GRID_COLS * GRID_ROWS;
export const QUERY_REACH = 3;
export const QUERY_SPAN = (QUERY_REACH * 2 + 1) * (QUERY_REACH * 2 + 1);

export const zHead = new Int16Array(GRID_CELLS);
export const zTail = new Int16Array(GRID_CELLS);
export const zNext = new Int16Array(MAX_ZOMBIES);
export const qh = new Int16Array(QUERY_SPAN);
export const qn = new Uint8Array(1);

zHead.fill(-1);
