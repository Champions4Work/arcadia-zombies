import { hexRgb, isPxKey, PX, type PxKey } from "./palette";

export interface PxFrame {
  id: string;
  ox: number;
  oy: number;
  rows: readonly string[];
}

export function grid(w: number, h: number): string[][] {
  const out: string[][] = [];
  for (let y = 0; y < h; y++) {
    const row: string[] = [];
    for (let x = 0; x < w; x++) row.push(".");
    out.push(row);
  }
  return out;
}

export function put(g: string[][], x: number, y: number, c: string): void {
  const row = g[y];
  if (!row || x < 0 || y < 0 || x >= row.length) return;
  row[x] = c;
}

export function fill(g: string[][], x: number, y: number, w: number, h: number, c: string): void {
  for (let yy = 0; yy < h; yy++) {
    for (let xx = 0; xx < w; xx++) put(g, x + xx, y + yy, c);
  }
}

export function cloneGrid(g: string[][]): string[][] {
  return g.map((row) => row.slice());
}

export function outline(g: string[][], ink = "k"): void {
  const h = g.length;
  const w = g[0]?.length ?? 0;
  const mark: boolean[][] = [];
  for (let y = 0; y < h; y++) mark[y] = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const ch = g[y]?.[x] ?? ".";
      if (ch === "." || ch === ink) continue;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = x + dx;
          const ny = y + dy;
          if (ny < 0 || nx < 0 || ny >= h || nx >= w) continue;
          if ((g[ny]?.[nx] ?? ".") === ".") mark[ny]![nx] = true;
        }
      }
    }
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (mark[y]?.[x]) put(g, x, y, ink);
    }
  }
}

export function rowsOf(g: string[][]): string[] {
  return g.map((row) => row.join(""));
}

export function frame(id: string, ox: number, oy: number, g: string[][]): PxFrame {
  return { id, ox, oy, rows: rowsOf(g) };
}

export function frameHits(src: PxFrame): string[] {
  const hits: string[] = [];
  const w = src.rows[0]?.length ?? 0;
  for (let y = 0; y < src.rows.length; y++) {
    const row = src.rows[y] ?? "";
    if (row.length !== w) hits.push(`${src.id}:${y}:width`);
    for (let x = 0; x < row.length; x++) {
      const ch = row[x] ?? "";
      if (!isPxKey(ch)) hits.push(`${src.id}:${y}:${x}:${ch}`);
    }
  }
  return hits;
}

export function decodeRgba(ch: string): [number, number, number, number] {
  const key = isPxKey(ch) ? ch : ".";
  if (key === ".") return [0, 0, 0, 0];
  return hexRgb(PX[key as PxKey]);
}
