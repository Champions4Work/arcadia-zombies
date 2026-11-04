import type { World } from "./types";

export const DASH_TICKS = 7;
export const DASH_CD = 42;
export const DASH_PUSH = 5.2;
export const DASH_IFRAME = 10;
export const DASH_KEY = "shift";

export function dashActive(w: World): boolean {
  return (w.dashT ?? 0) > 0;
}
