import {
  GRID_CELL, GRID_COLS, GRID_PAD, GRID_ROWS, QUERY_REACH, qh, qn, zHead, zNext, zTail,
} from "./grid";

export function cellIndex(x: number, y: number): number {
  let cx = Math.floor((x + GRID_PAD) / GRID_CELL);
  let cy = Math.floor((y + GRID_PAD) / GRID_CELL);
  if (cx < 0) cx = 0;
  else if (cx >= GRID_COLS) cx = GRID_COLS - 1;
  if (cy < 0) cy = 0;
  else if (cy >= GRID_ROWS) cy = GRID_ROWS - 1;
  return cy * GRID_COLS + cx;
}

export function rebuildZombieGrid(alive: Uint8Array, xs: Float32Array, ys: Float32Array, n: number): void {
  zHead.fill(-1);
  for (let i = 0; i < n; i++) {
    if (!alive[i]) continue;
    const c = cellIndex(xs[i] ?? 0, ys[i] ?? 0);
    zNext[i] = -1;
    const h = zHead[c] ?? -1;
    if (h < 0) {
      zHead[c] = i;
      zTail[c] = i;
    } else {
      zNext[zTail[c] ?? i] = i;
      zTail[c] = i;
    }
  }
}

export function beginQuery(x: number, y: number): void {
  beginRadiusQuery(x, y, GRID_CELL);
}

export function beginRadiusQuery(x: number, y: number, r: number): void {
  const c0 = cellIndex(x, y);
  const cx = c0 % GRID_COLS;
  const cy = (c0 / GRID_COLS) | 0;
  let span = Math.ceil(r / GRID_CELL);
  if (span > QUERY_REACH) span = QUERY_REACH;
  let n = 0;
  for (let oy = -span; oy <= span; oy++) {
    const yy = cy + oy;
    if (yy < 0 || yy >= GRID_ROWS) continue;
    const row = yy * GRID_COLS;
    for (let ox = -span; ox <= span; ox++) {
      const xx = cx + ox;
      if (xx < 0 || xx >= GRID_COLS) continue;
      const h = zHead[row + xx] ?? -1;
      if (h >= 0) qh[n++] = h;
    }
  }
  qn[0] = n;
}

export function nextQuery(): number {
  let n = qn[0] ?? 0;
  if (n <= 0) return -1;
  let bestK = 0;
  let bestI = qh[0] ?? -1;
  for (let k = 1; k < n; k++) {
    const i = qh[k] ?? -1;
    if (i < bestI) {
      bestI = i;
      bestK = k;
    }
  }
  const nxt = zNext[bestI] ?? -1;
  if (nxt >= 0) qh[bestK] = nxt;
  else {
    n -= 1;
    qh[bestK] = qh[n] ?? -1;
  }
  qn[0] = n;
  return bestI;
}
