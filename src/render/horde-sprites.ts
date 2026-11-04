import { atlasSprite, buildAtlas, foeFrameId, packRgba, shotFrameId } from "../art/atlas";
import { H, MAX_ZOMBIES, W } from "../sim/types";

export interface Sprite {
  pix: Uint32Array;
  w: number;
  h: number;
  ox: number;
  oy: number;
}

export const Y_BIAS = 48;
export const Y_SLOTS = H + Y_BIAS * 2;
export const bg = new Uint32Array(W * H);
export const yHead = new Int32Array(Y_SLOTS);
export const yNext = new Int16Array(MAX_ZOMBIES);
export const zombieSprites: Sprite[] = [];
export const bulletSprites: Sprite[] = [];

const EMPTY: Sprite = { pix: new Uint32Array(1), w: 1, h: 1, ox: 0, oy: 0 };

export function pack(r: number, g: number, b: number, a = 255): number {
  return packRgba(r, g, b, a);
}

function take(id: string): Sprite {
  const s = atlasSprite(id);
  return { pix: s.pix, w: s.w, h: s.h, ox: s.ox, oy: s.oy };
}

let built = false;

export function buildSprites(): void {
  if (built) return;
  buildAtlas();
  for (let k = 0; k < 7; k++) {
    zombieSprites.push(take(foeFrameId(k, 0, false)), take(foeFrameId(k, 1, false)));
    zombieSprites.push(take(foeFrameId(k, 0, true)), take(foeFrameId(k, 1, true)));
  }
  for (let g = 0; g < 5; g++) {
    for (let d = 0; d < 4; d++) bulletSprites.push(take(shotFrameId(g, d)));
  }
  built = true;
}

export function zombieSprite(kind: number, bob: number): Sprite {
  const k = kind & 127;
  const elite = (kind & 0x80) !== 0 ? 2 : 0;
  return zombieSprites[k * 4 + elite + (bob & 1)] ?? zombieSprites[0] ?? EMPTY;
}

export function bulletSprite(vx: number, vy: number, gun = 0): Sprite {
  const dir = Math.abs(vx) >= Math.abs(vy) ? (vx >= 0 ? 1 : 0) : (vy >= 0 ? 3 : 2);
  const g = gun < 0 || gun > 4 ? 0 : gun | 0;
  return bulletSprites[g * 4 + dir] ?? bulletSprites[dir] ?? EMPTY;
}
