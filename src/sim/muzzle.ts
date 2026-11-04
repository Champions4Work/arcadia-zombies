import { WPN_FLAME, WPN_HARP, WPN_MORT, WPN_SHOT } from "./types";

export const MUZZLE_HAND_X = 3;
export const MUZZLE_HAND_Y = -32;
export const MUZZLE_RIVET = 3;
export const MUZZLE_SHOT = 3;
export const MUZZLE_FLAME = 3;
export const MUZZLE_HARP = 5;
export const MUZZLE_MORT = 3;

export function muzzleAlong(gun: number): number {
  if (gun === WPN_HARP) return MUZZLE_HARP;
  if (gun === WPN_SHOT) return MUZZLE_SHOT;
  if (gun === WPN_FLAME) return MUZZLE_FLAME;
  if (gun === WPN_MORT) return MUZZLE_MORT;
  return MUZZLE_RIVET;
}

export function muzzleX(px: number, aimX: number, aimY: number, gun: number): number {
  const len = Math.sqrt(aimX * aimX + aimY * aimY) || 1;
  const ux = aimX / len;
  const flip = aimX < 0 ? -1 : 1;
  return px + flip * MUZZLE_HAND_X + ux * muzzleAlong(gun);
}

export function muzzleY(py: number, aimX: number, aimY: number, gun: number): number {
  const len = Math.sqrt(aimX * aimX + aimY * aimY) || 1;
  const uy = aimY / len;
  return py + MUZZLE_HAND_Y + uy * muzzleAlong(gun);
}
