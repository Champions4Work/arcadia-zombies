import { foeHitR2 } from "./foes";

export const FOE_BODY = 34;

export function bodyReach(zx: number, zy: number, bx: number, by: number, r2: number): number {
  const top = zy - FOE_BODY;
  const cy = by < top ? top : by > zy ? zy : by;
  const dx = zx - bx;
  const dy = cy - by;
  return dx * dx + dy * dy < r2 ? 1 : 0;
}

export function foeBodyHit(raw: number, zx: number, zy: number, bx: number, by: number): number {
  return bodyReach(zx, zy, bx, by, foeHitR2(raw));
}
