import { ARENA_H, ARENA_W } from "../sim/arena";

export const SEE_AXIS = 288;

export interface PlayView {
  viewW: number;
  viewH: number;
}

export function playView(cssW: number, cssH: number): PlayView {
  const w = Math.max(1, cssW);
  const h = Math.max(1, cssH);
  const aspect = w / h;
  let viewW = 0;
  let viewH = 0;
  if (h >= w) {
    viewW = SEE_AXIS;
    viewH = SEE_AXIS / aspect;
  } else {
    viewH = SEE_AXIS;
    viewW = SEE_AXIS * aspect;
  }
  if (viewW > ARENA_W) {
    viewW = ARENA_W;
    viewH = viewW / aspect;
  }
  if (viewH > ARENA_H) {
    viewH = ARENA_H;
    viewW = viewH * aspect;
  }
  return { viewW: Math.max(1, viewW), viewH: Math.max(1, viewH) };
}

export function applyPlayView(
  arena: { viewW: number; viewH: number },
  cssW: number,
  cssH: number,
): PlayView {
  const next = playView(cssW, cssH);
  arena.viewW = next.viewW;
  arena.viewH = next.viewH;
  return next;
}
