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
  return sprite(18, 18, 7, 17, (pix) => {
    stamp(pix, 18, 1, 15, 12, 2, SOOT);
    stamp(pix, 18, 2, 7 + bob, 10, 9, KNIGHT);
    stamp(pix, 18, 3, 2 + bob, 8, 6, BRASS);
    stamp(pix, 18, 5, 3 + bob, 3, 2, EMBER_HI);
    stamp(pix, 18, 12, 4 + bob, 5, 11, BRASS);
    stamp(pix, 18, 13, 5 + bob, 3, 9, BRASS_LO);
    stamp(pix, 18, 13, 8 + bob, 3, 2, EMBER);
  });
}

function rat(bob: number): Sprite {
  return sprite(8, 8, 4, 7, (pix) => {
    stamp(pix, 8, 0, 4 + bob, 8, 3, RAT);
    stamp(pix, 8, 1, 2, 4, 3, BRASS_LO);
    stamp(pix, 8, 5, 2, 2, 2, EYE);
  });
}

const GLOW = pack(0xff, 0xf8, 0xe4);
const STEEL_PX = pack(0xc5, 0xcc, 0xd4);
const STEEL_HI = pack(0xf2, 0xf7, 0xfb);
const ACID_PX = pack(0x7a, 0xf6, 0xff);
const BOMB = pack(0x3a, 0x34, 0x2c);
const BOMB_HI = pack(0x6a, 0x60, 0x58);

function rivetTracer(dx: number, dy: number): Sprite {
  return sprite(17, 9, 8, 4, (pix) => {
    stamp(pix, 17, 1, 3, 12, 3, COPPER);
    stamp(pix, 17, 3, 2, 11, 5, EMBER);
    stamp(pix, 17, 6 + dx, 3 + dy, 5, 3, EMBER_HI);
    stamp(pix, 17, 11, 3, 4, 3, GLOW);
  });
}

function pelletTracer(dx: number, dy: number): Sprite {
  return sprite(13, 9, 6, 4, (pix) => {
    stamp(pix, 13, 2, 3, 8, 3, STEEL_PX);
    stamp(pix, 13, 4 + dx, 3 + dy, 4, 3, BRASS);
    stamp(pix, 13, 6, 3, 3, 3, STEEL_HI);
  });
}

function flameBlob(dx: number, dy: number): Sprite {
  return sprite(13, 13, 6, 6, (pix) => {
    stamp(pix, 13, 2, 3, 9, 7, EMBER);
    stamp(pix, 13, 3, 2, 7, 9, EMBER);
    stamp(pix, 13, 4 + dx, 4 + dy, 5, 5, EMBER_HI);
    stamp(pix, 13, 5, 5, 3, 3, GLOW);
  });
}

function harpTracer(dx: number, dy: number): Sprite {
  return sprite(19, 9, 9, 4, (pix) => {
    stamp(pix, 19, 1, 3, 15, 3, STEEL_PX);
    stamp(pix, 19, 2, 2, 14, 5, STEEL_HI);
    stamp(pix, 19, 12 + dx, 3 + dy, 4, 3, BRASS);
    stamp(pix, 19, 15, 3, 3, 3, ACID_PX);
  });
}

function bombBlob(dx: number, dy: number): Sprite {
  return sprite(11, 13, 5, 7, (pix) => {
    stamp(pix, 11, 2, 5, 7, 6, BOMB);
    stamp(pix, 11, 3, 4, 5, 8, BOMB_HI);
    stamp(pix, 11, 4, 6, 3, 3, BRASS);
    stamp(pix, 11, 4 + dx, 1 + dy, 3, 3, (dx + dy) & 1 ? EMBER_HI : EMBER);
  });
}

function gunStamp(gun: number, dx: number, dy: number): Sprite {
  if (gun === 1) return pelletTracer(dx, dy);
  if (gun === 2) return flameBlob(dx, dy);
  if (gun === 3) return harpTracer(dx, dy);
  if (gun === 4) return bombBlob(dx, dy);
  return rivetTracer(dx, dy);
}

let built = false;

export function buildSprites(): void {
  if (built) return;
  zombieSprites.push(
    shambler(0), shambler(1), ghoul(0), ghoul(1), brute(0), brute(1),
    spitter(0), spitter(1), gasbag(0), gasbag(1), knight(0), knight(1), rat(0), rat(1),
  );
  for (let g = 0; g < 5; g++) {
    bulletSprites.push(gunStamp(g, -2, 0), gunStamp(g, 2, 0), gunStamp(g, 0, -2), gunStamp(g, 0, 2));
  }
  built = true;
}

export function zombieSprite(kind: number, bob: number): Sprite {
  const k = kind & 127;
  return zombieSprites[k * 2 + (bob & 1)] ?? zombieSprites[0] ?? EMPTY;
}

export function bulletSprite(vx: number, vy: number, gun = 0): Sprite {
  const dir = Math.abs(vx) >= Math.abs(vy) ? (vx >= 0 ? 1 : 0) : (vy >= 0 ? 3 : 2);
  const g = gun < 0 || gun > 4 ? 0 : gun | 0;
  return bulletSprites[g * 4 + dir] ?? bulletSprites[dir] ?? EMPTY;
}
