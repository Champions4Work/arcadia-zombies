import { ARENA_H, ARENA_W } from "../sim/arena";
import { H, W } from "../sim/types";

export const CAM_FOLLOW = 0.12;

export interface Cam { x: number; y: number }

export function createCam(): Cam {
  return { x: 0, y: 0 };
}

function clampCam(v: number, max: number): number {
  if (v < 0) return 0;
  if (v > max) return max;
  return v;
}

export function snapCam(cam: Cam, px: number, py: number): void {
  cam.x = clampCam(px - W / 2, ARENA_W - W);
  cam.y = clampCam(py - H / 2, ARENA_H - H);
}

export function followCam(cam: Cam, px: number, py: number): void {
  const tx = clampCam(px - W / 2, ARENA_W - W);
  const ty = clampCam(py - H / 2, ARENA_H - H);
  cam.x += (tx - cam.x) * CAM_FOLLOW;
  cam.y += (ty - cam.y) * CAM_FOLLOW;
}
