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

const probe = new Uint8Array(4);
const endian = new Uint32Array(probe.buffer);
endian[0] = 0x01020304;
const little = probe[0] === 4;
const EMPTY: Sprite = { pix: new Uint32Array(1), w: 1, h: 1, ox: 0, oy: 0 };

export function pack(r: number, g: number, b: number, a = 255): number {
  const le = ((a << 24) | (b << 16) | (g << 8) | r) >>> 0;
  if (little) return le;
  return ((r << 24) | (g << 16) | (b << 8) | a) >>> 0;
}

function stamp(pix: Uint32Array, sw: number, x: number, y: number, w: number, h: number, color: number): void {
  for (let yy = 0; yy < h; yy++) {
    const row = (y + yy) * sw + x;
    for (let xx = 0; xx < w; xx++) pix[row + xx] = color;
  }
}

function sprite(w: number, h: number, ox: number, oy: number, draw: (pix: Uint32Array) => void): Sprite {
  const pix = new Uint32Array(w * h);
  draw(pix);
  return { pix, w, h, ox, oy };
}

const ROT = pack(0x3d, 0x5a, 0x22);
const ROT_HI = pack(0x6a, 0x8a, 0x38);
const ROT_LO = pack(0x2a, 0x3c, 0x14);
const BRASS = pack(0xc8, 0x96, 0x3e);
const BRASS_LO = pack(0x7a, 0x54, 0x20);
const COPPER = pack(0xb5, 0x56, 0x2f);
const RUST = pack(0x6a, 0x2e, 0x18);
const EMBER = pack(0xff, 0x7a, 0x2a);
const EMBER_HI = pack(0xff, 0xd2, 0x7a);
const SOOT = pack(0x0a, 0x07, 0x04);
const EYE = pack(0xff, 0x3a, 0x2a);
const SPIT = pack(0x3a, 0xd4, 0xf0);
const GAS = pack(0xc0, 0x6a, 0xe8);
const KNIGHT = pack(0xe0, 0x70, 0x40);
const RAT = pack(0xf0, 0xb0, 0x3a);

function shambler(bob: number): Sprite {
  return sprite(12, 16, 6, 15, (pix) => {
    stamp(pix, 12, 1, 13, 10, 2, SOOT);
    stamp(pix, 12, 1, 8 + bob, 3, 5, ROT_LO);
    stamp(pix, 12, 8, 8 + (bob ^ 1), 3, 5, ROT_LO);
    stamp(pix, 12, 2, 5 + bob, 8, 7, ROT);
    stamp(pix, 12, 3, 1 + bob, 6, 5, ROT_HI);
    stamp(pix, 12, 6, 2 + bob, 2, 2, EMBER);
  });
}

function ghoul(bob: number): Sprite {
  return sprite(10, 16, 5, 15, (pix) => {
    stamp(pix, 10, 1, 13, 8, 2, SOOT);
    stamp(pix, 10, 2, 8 + bob, 2, 5, BRASS_LO);
    stamp(pix, 10, 6, 8 + (bob ^ 1), 2, 5, BRASS_LO);
    stamp(pix, 10, 2, 4 + bob, 6, 7, BRASS);
    stamp(pix, 10, 2, 0 + bob, 6, 5, BRASS_LO);
    stamp(pix, 10, 4, 1 + bob, 2, 2, EYE);
    stamp(pix, 10, 3, 6 + bob, 4, 2, COPPER);
  });
}

function brute(bob: number): Sprite {
  return sprite(18, 18, 9, 17, (pix) => {
    stamp(pix, 18, 2, 15, 14, 2, SOOT);
    stamp(pix, 18, 1, 8 + bob, 16, 8, RUST);
    stamp(pix, 18, 2, 9 + bob, 14, 5, COPPER);
    stamp(pix, 18, 4, 10 + bob, 4, 3, EMBER);
    stamp(pix, 18, 5, 2 + bob, 8, 6, RUST);
    stamp(pix, 18, 7, 3 + bob, 3, 2, EMBER_HI);
  });
}

function spitter(bob: number): Sprite {
  return sprite(12, 16, 6, 15, (pix) => {
    stamp(pix, 12, 1, 13, 10, 2, SOOT);
    stamp(pix, 12, 2, 6 + bob, 8, 8, SPIT);
    stamp(pix, 12, 3, 1 + bob, 6, 5, BRASS_LO);
    stamp(pix, 12, 4, 2 + bob, 2, 2, EYE);
  });
}

function gasbag(bob: number): Sprite {
  return sprite(14, 16, 7, 15, (pix) => {
    stamp(pix, 14, 2, 13, 10, 2, SOOT);
    stamp(pix, 14, 2, 4 + bob, 10, 10, GAS);
    stamp(pix, 14, 4, 6 + bob, 6, 4, EMBER);
  });
}

function knight(bob: number): Sprite {
  return sprite(14, 18, 7, 17, (pix) => {
    stamp(pix, 14, 1, 15, 12, 2, SOOT);
    stamp(pix, 14, 2, 7 + bob, 10, 9, KNIGHT);
    stamp(pix, 14, 3, 2 + bob, 8, 6, BRASS);
    stamp(pix, 14, 5, 3 + bob, 3, 2, EMBER_HI);
  });
}

function rat(bob: number): Sprite {
  return sprite(8, 8, 4, 7, (pix) => {
    stamp(pix, 8, 0, 4 + bob, 8, 3, RAT);
    stamp(pix, 8, 1, 2, 4, 3, BRASS_LO);
    stamp(pix, 8, 5, 2, 2, 2, EYE);
  });
}

function bullet(dx: number, dy: number): Sprite {
  return sprite(9, 9, 4, 4, (pix) => {
    stamp(pix, 9, 4 + dx, 4 + dy, 3, 2, COPPER);
    stamp(pix, 9, 2, 2, 5, 5, EMBER);
    stamp(pix, 9, 3, 3, 3, 3, EMBER_HI);
  });
}

let built = false;

export function buildSprites(): void {
  if (built) return;
  zombieSprites.push(
    shambler(0), shambler(1), ghoul(0), ghoul(1), brute(0), brute(1),
    spitter(0), spitter(1), gasbag(0), gasbag(1), knight(0), knight(1), rat(0), rat(1),
  );
  bulletSprites.push(bullet(-2, 0), bullet(2, 0), bullet(0, -2), bullet(0, 2));
  built = true;
}

export function zombieSprite(kind: number, bob: number): Sprite {
  const k = kind & 127;
  return zombieSprites[k * 2 + (bob & 1)] ?? zombieSprites[0] ?? EMPTY;
}

export function bulletSprite(vx: number, vy: number): Sprite {
  const i = Math.abs(vx) >= Math.abs(vy) ? (vx >= 0 ? 1 : 0) : (vy >= 0 ? 3 : 2);
  return bulletSprites[i] ?? bulletSprites[0] ?? EMPTY;
}
