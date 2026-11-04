import { DASH_CD, DASH_IFRAME, DASH_PUSH, DASH_TICKS } from "./dash";
import { slidePlayer } from "./arena.hot";
import { punchShake } from "../render/shake";
import { type Input, type World } from "./types";

export function tryDash(w: World, input: Input): void {
  if ((input.dash ?? 0) !== 1) return;
  if (w.over || w.choosing || (w.dashT ?? 0) > 0 || (w.dashCd ?? 0) > 0) return;
  let dx = input.dx;
  let dy = input.dy;
  if (dx === 0 && dy === 0) {
    dx = w.aimX;
    dy = w.aimY;
  }
  const len = Math.hypot(dx, dy);
  if (len < 0.12) return;
  w.dashUx = dx / len;
  w.dashUy = dy / len;
  w.dashT = DASH_TICKS;
  w.dashCd = 0;
  if ((w.hurtCd ?? 0) < DASH_IFRAME) w.hurtCd = DASH_IFRAME;
  punchShake(0.28);
}

export function stepDash(w: World): boolean {
  const t = w.dashT ?? 0;
  if (t <= 0) {
    const cd = w.dashCd ?? 0;
    if (cd > 0) w.dashCd = cd - 1;
    return false;
  }
  slidePlayer(w, w.dashUx, w.dashUy, DASH_PUSH);
  const next = t - 1;
  w.dashT = next;
  if (next === 0) w.dashCd = DASH_CD;
  return true;
}
