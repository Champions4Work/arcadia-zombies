export const PX = {
  ".": "#00000000",
  "k": "#0c0a08",
  "s": "#100c0a",
  "i": "#1a1612",
  "p": "#241e18",
  "x": "#2c2620",
  "b": "#e0a040",
  "B": "#f0c878",
  "d": "#8a5a20",
  "c": "#b86a38",
  "n": "#3a2a1c",
  "m": "#f4ead8",
  "M": "#c8b8a0",
  "R": "#e24a32",
  "y": "#f0b44a",
  "h": "#3ec8c0",
  "g": "#2a2824",
  "G": "#6a6860",
  "t": "#141210",
  "z": "#0a0908",
  "w": "#8a8478",
  "W": "#d0c8b8",
  "f": "#e86a20",
  "F": "#f0d080",
  "r": "#6a3018",
  "e": "#e8a030",
  "u": "#f4f0e8",
  "o": "#080604",
  "a": "#7ae0d4",
} as const;

export type PxKey = keyof typeof PX;

export const PX_KEYS = Object.keys(PX).join("");

export const SOOT = PX.s;
export const IRON = PX.i;
export const PANEL = PX.p;
export const BRASS = PX.b;
export const BRASS_HI = PX.B;
export const BRASS_LO = PX.d;
export const COPPER = PX.c;
export const BRONZE = PX.n;
export const STEAM = PX.m;
export const STEAM_DIM = PX.M;
export const INK = PX.k;
export const DANGER = PX.R;
export const XP = PX.y;
export const HEALTH = PX.h;
export const VEIL = "#080604cc";
export const GLASS = "#0c0c10ee";
export const CYAN = PX.a;

export function isPxKey(ch: string): ch is PxKey {
  return Object.prototype.hasOwnProperty.call(PX, ch);
}

export function hexRgb(hex: string): [number, number, number, number] {
  const h = hex.replace("#", "");
  if (h.length === 8) {
    return [
      parseInt(h.slice(0, 2), 16),
      parseInt(h.slice(2, 4), 16),
      parseInt(h.slice(4, 6), 16),
      parseInt(h.slice(6, 8), 16),
    ];
  }
  const n = h.length === 3
    ? [h[0]! + h[0]!, h[1]! + h[1]!, h[2]! + h[2]!].join("")
    : h.slice(0, 6);
  return [parseInt(n.slice(0, 2), 16), parseInt(n.slice(2, 4), 16), parseInt(n.slice(4, 6), 16), 255];
}
