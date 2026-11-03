import { H, W } from "../sim/types";

export const BLIT_ZOMBIES = 96;
export const BLIT_BULLETS = 80;

export function offScreen(x: number, y: number, pad: number, ox = 0, oy = 0): boolean {
  return x < ox - pad || y < oy - pad || x > ox + W + pad || y > oy + H + pad;
}

export function shouldBlitHorde(zombies: number, bullets: number): boolean {
  return zombies >= BLIT_ZOMBIES || bullets >= BLIT_BULLETS;
}
