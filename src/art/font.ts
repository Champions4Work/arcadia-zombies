import { PX } from "./palette";

const GLYPH: Record<string, readonly string[]> = {
  " ": [".....", ".....", ".....", ".....", ".....", ".....", "....."],
  A: [".BBB.", "B...B", "B...B", "BBBBB", "B...B", "B...B", "B...B"],
  B: ["BBBB.", "B...B", "B...B", "BBBB.", "B...B", "B...B", "BBBB."],
  C: [".BBB.", "B...B", "B....", "B....", "B....", "B...B", ".BBB."],
  D: ["BBBB.", "B...B", "B...B", "B...B", "B...B", "B...B", "BBBB."],
  E: ["BBBBB", "B....", "B....", "BBBB.", "B....", "B....", "BBBBB"],
  F: ["BBBBB", "B....", "B....", "BBBB.", "B....", "B....", "B...."],
  G: [".BBB.", "B...B", "B....", "B.BBB", "B...B", "B...B", ".BBB."],
  H: ["B...B", "B...B", "B...B", "BBBBB", "B...B", "B...B", "B...B"],
  I: ["BBBBB", "..B..", "..B..", "..B..", "..B..", "..B..", "BBBBB"],
  J: ["..BBB", "....B", "....B", "....B", "B...B", "B...B", ".BBB."],
  K: ["B...B", "B..B.", "B.B..", "BB...", "B.B..", "B..B.", "B...B"],
  L: ["B....", "B....", "B....", "B....", "B....", "B....", "BBBBB"],
  M: ["B...B", "BB.BB", "B.B.B", "B...B", "B...B", "B...B", "B...B"],
  N: ["B...B", "BB..B", "B.B.B", "B..BB", "B...B", "B...B", "B...B"],
  O: [".BBB.", "B...B", "B...B", "B...B", "B...B", "B...B", ".BBB."],
  P: ["BBBB.", "B...B", "B...B", "BBBB.", "B....", "B....", "B...."],
  Q: [".BBB.", "B...B", "B...B", "B...B", "B.B.B", "B..B.", ".BB.B"],
  R: ["BBBB.", "B...B", "B...B", "BBBB.", "B.B..", "B..B.", "B...B"],
  S: [".BBBB", "B....", "B....", ".BBB.", "....B", "....B", "BBBB."],
  T: ["BBBBB", "..B..", "..B..", "..B..", "..B..", "..B..", "..B.."],
  U: ["B...B", "B...B", "B...B", "B...B", "B...B", "B...B", ".BBB."],
  V: ["B...B", "B...B", "B...B", "B...B", "B...B", ".B.B.", "..B.."],
  W: ["B...B", "B...B", "B...B", "B...B", "B.B.B", "BB.BB", "B...B"],
  X: ["B...B", "B...B", ".B.B.", "..B..", ".B.B.", "B...B", "B...B"],
  Y: ["B...B", "B...B", ".B.B.", "..B..", "..B..", "..B..", "..B.."],
  Z: ["BBBBB", "....B", "...B.", "..B..", ".B...", "B....", "BBBBB"],
  "0": [".BBB.", "B...B", "B..BB", "B.B.B", "BB..B", "B...B", ".BBB."],
  "1": ["..B..", ".BB..", "..B..", "..B..", "..B..", "..B..", ".BBB."],
  "2": [".BBB.", "B...B", "....B", "...B.", "..B..", ".B...", "BBBBB"],
  "3": [".BBB.", "B...B", "....B", "..BB.", "....B", "B...B", ".BBB."],
  "4": ["...B.", "..BB.", ".B.B.", "B..B.", "BBBBB", "...B.", "...B."],
  "5": ["BBBBB", "B....", "BBBB.", "....B", "....B", "B...B", ".BBB."],
  "6": [".BBB.", "B....", "BBBB.", "B...B", "B...B", "B...B", ".BBB."],
  "7": ["BBBBB", "....B", "...B.", "..B..", ".B...", ".B...", ".B..."],
  "8": [".BBB.", "B...B", "B...B", ".BBB.", "B...B", "B...B", ".BBB."],
  "9": [".BBB.", "B...B", "B...B", ".BBBB", "....B", "....B", ".BBB."],
  ":": [".....", "..B..", ".....", ".....", "..B..", ".....", "....."],
  "/": ["....B", "...B.", "..B..", ".B...", "B....", ".....", "....."],
  "-": [".....", ".....", ".....", "BBBBB", ".....", ".....", "....."],
  "+": [".....", "..B..", "..B..", "BBBBB", "..B..", "..B..", "....."],
  ".": [".....", ".....", ".....", ".....", ".....", ".....", "..B.."],
  "!": ["..B..", "..B..", "..B..", "..B..", ".....", ".....", "..B.."],
  "?": [".BBB.", "B...B", "....B", "...B.", "..B..", ".....", "..B.."],
  "'": ["..B..", "..B..", ".....", ".....", ".....", ".....", "....."],
  "%": ["BB..B", "BB.B.", "..B..", ".B.BB", "B..BB", ".....", "....."],
};

export const FONT_W = 5;
export const FONT_H = 7;
export const FONT_GAP = 1;

export function measurePx(text: string, scale = 1): number {
  const n = text.length;
  if (n <= 0) return 0;
  return n * (FONT_W + FONT_GAP) * scale - FONT_GAP * scale;
}

export function drawPx(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string,
  scale = 1,
  align: CanvasTextAlign = "left",
): void {
  const src = text.toUpperCase();
  const w = measurePx(src, scale);
  let px = x;
  if (align === "center") px = Math.round(x - w / 2);
  if (align === "right") px = Math.round(x - w);
  const s = Math.max(1, scale | 0);
  ctx.fillStyle = color;
  for (let i = 0; i < src.length; i++) {
    const g = GLYPH[src[i] ?? ""] ?? GLYPH["?"]!;
    for (let gy = 0; gy < FONT_H; gy++) {
      const row = g[gy] ?? "";
      for (let gx = 0; gx < FONT_W; gx++) {
        if ((row[gx] ?? ".") === ".") continue;
        ctx.fillRect(px + gx * s, y + gy * s, s, s);
      }
    }
    px += (FONT_W + FONT_GAP) * s;
  }
}

export function wrapPx(text: string, max: number, scale = 1): string[] {
  const words = text.toUpperCase().split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const word of words) {
    const next = cur ? `${cur} ${word}` : word;
    if (measurePx(next, scale) > max && cur) {
      lines.push(cur);
      cur = word;
    } else cur = next;
  }
  if (cur) lines.push(cur);
  return lines;
}

export const FONT_INK = PX.m;
