import { H, MAX_BULLETS, MAX_ZOMBIES, W, type World } from "../sim/types";
import { enemyFlash, flashesLive, hitKnockX, hitKnockY } from "./juice";
import {
  Y_BIAS, Y_SLOTS, bg, bulletSprite, yHead, yNext, zombieSprite, type Sprite,
} from "./horde-sprites";

const FLASH = 0xffffffff;

function blit(frame: Uint32Array, spr: Sprite, dx: number, dy: number): void {
  const sw = spr.w;
  const sh = spr.h;
  const pix = spr.pix;
  if (dx >= 0 && dy >= 0 && dx + sw <= W && dy + sh <= H) {
    for (let y = 0; y < sh; y++) {
      const drow = (dy + y) * W + dx;
      const srow = y * sw;
      for (let x = 0; x < sw; x++) {
        const p = pix[srow + x] ?? 0;
        if (p !== 0) frame[drow + x] = p;
      }
    }
    return;
  }
  let x0 = 0;
  let y0 = 0;
  let x1 = sw;
  let y1 = sh;
  if (dx < 0) x0 = -dx;
  if (dy < 0) y0 = -dy;
  if (dx + sw > W) x1 = W - dx;
  if (dy + sh > H) y1 = H - dy;
  for (let y = y0; y < y1; y++) {
    const drow = (dy + y) * W + dx;
    const srow = y * sw;
    for (let x = x0; x < x1; x++) {
      const p = pix[srow + x] ?? 0;
      if (p !== 0) frame[drow + x] = p;
    }
  }
}

function blitFlip(frame: Uint32Array, spr: Sprite, dx: number, dy: number): void {
  const sw = spr.w;
  const sh = spr.h;
  const pix = spr.pix;
  let x0 = 0;
  let y0 = 0;
  let x1 = sw;
  let y1 = sh;
  if (dx < 0) x0 = -dx;
  if (dy < 0) y0 = -dy;
  if (dx + sw > W) x1 = W - dx;
  if (dy + sh > H) y1 = H - dy;
  for (let y = y0; y < y1; y++) {
    const drow = (dy + y) * W + dx;
    const srow = y * sw;
    for (let x = x0; x < x1; x++) {
      const p = pix[srow + (sw - 1 - x)] ?? 0;
      if (p !== 0) frame[drow + x] = p;
    }
  }
}

function blitFlash(frame: Uint32Array, spr: Sprite, dx: number, dy: number, flip: boolean): void {
  const sw = spr.w;
  const sh = spr.h;
  const pix = spr.pix;
  if (dx >= 0 && dy >= 0 && dx + sw <= W && dy + sh <= H) {
    for (let y = 0; y < sh; y++) {
      const drow = (dy + y) * W + dx;
      const srow = y * sw;
      for (let x = 0; x < sw; x++) {
        const sx = flip ? sw - 1 - x : x;
        if ((pix[srow + sx] ?? 0) !== 0) frame[drow + x] = FLASH;
      }
    }
    return;
  }
  let x0 = 0;
  let y0 = 0;
  let x1 = sw;
  let y1 = sh;
  if (dx < 0) x0 = -dx;
  if (dy < 0) y0 = -dy;
  if (dx + sw > W) x1 = W - dx;
  if (dy + sh > H) y1 = H - dy;
  for (let y = y0; y < y1; y++) {
    const drow = (dy + y) * W + dx;
    const srow = y * sw;
    for (let x = x0; x < x1; x++) {
      const sx = flip ? sw - 1 - x : x;
      if ((pix[srow + sx] ?? 0) !== 0) frame[drow + x] = FLASH;
    }
  }
}

function culled(dx: number, dy: number, sw: number, sh: number): boolean {
  return dx >= W || dy >= H || dx + sw <= 0 || dy + sh <= 0;
}

export function composeHorde(w: World, frame: Uint32Array): void {
  frame.set(bg);
  yHead.fill(-1);
  const camX = Math.round(w.arena.camX);
  const camY = Math.round(w.arena.camY);
  const z = w.zombies;
  const bob = (w.tick >> 4) & 1;
  const base = zombieSprite(0, bob);
  for (let i = 0; i < MAX_ZOMBIES; i++) {
    if (!z.alive[i]) continue;
    const x = (z.x[i] ?? 0) - camX + hitKnockX(i);
    const y = (z.y[i] ?? 0) - camY + hitKnockY(i);
    const kind = z.kind[i] ?? 0;
    const spr = kind === 0 ? base : zombieSprite(kind, bob);
    if (culled((x - spr.ox) | 0, (y - spr.oy) | 0, spr.w, spr.h)) continue;
    let key = y | 0;
    if (key < -Y_BIAS) key = -Y_BIAS;
    else if (key > H + Y_BIAS - 1) key = H + Y_BIAS - 1;
    const slot = key + Y_BIAS;
    yNext[i] = yHead[slot] ?? -1;
    yHead[slot] = i;
  }
  const live = flashesLive();
  for (let slot = 0; slot < Y_SLOTS; slot++) {
    let i = yHead[slot] ?? -1;
    while (i >= 0) {
      const x = (z.x[i] ?? 0) - camX + hitKnockX(i);
      const y = (z.y[i] ?? 0) - camY + hitKnockY(i);
      const spr = zombieSprite(z.kind[i] ?? 0, bob);
      const dx = (x - spr.ox) | 0;
      const dy = (y - spr.oy) | 0;
      const flip = (w.px - (z.x[i] ?? 0)) < 0;
      if (live > 0 && enemyFlash(i) > 0) blitFlash(frame, spr, dx, dy, flip);
      else if (flip) blitFlip(frame, spr, dx, dy);
      else blit(frame, spr, dx, dy);
      i = yNext[i] ?? -1;
    }
  }
  const b = w.bullets;
  for (let j = 0; j < MAX_BULLETS; j++) {
    if (!b.alive[j]) continue;
    const x = (b.x[j] ?? 0) - camX;
    const y = (b.y[j] ?? 0) - camY;
    const spr = bulletSprite(b.vx[j] ?? 0, b.vy[j] ?? 0, w.bGun[j] ?? 0);
    const dx = (x - spr.ox) | 0;
    const dy = (y - spr.oy) | 0;
    if (culled(dx, dy, spr.w, spr.h)) continue;
    blit(frame, spr, dx, dy);
  }
}
