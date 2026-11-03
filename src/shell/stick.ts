export const STICK_R = 56;

export interface Stick {
  on: boolean;
  x: number;
  y: number;
  dx: number;
  dy: number;
}

export function createStick(): Stick {
  return { on: false, x: 0, y: 0, dx: 0, dy: 0 };
}

export function aimStick(ox: number, oy: number, x: number, y: number, r: number): { dx: number; dy: number } {
  const vx = x - ox;
  const vy = y - oy;
  const len = Math.hypot(vx, vy);
  if (len <= 0 || r <= 0) return { dx: 0, dy: 0 };
  const mag = Math.min(1, len / r);
  return { dx: (vx / len) * mag, dy: (vy / len) * mag };
}

export function pressStick(s: Stick, x: number, y: number): void {
  s.on = true;
  s.x = x;
  s.y = y;
  s.dx = 0;
  s.dy = 0;
}

export function moveStick(s: Stick, x: number, y: number, r = STICK_R): void {
  if (!s.on) return;
  const a = aimStick(s.x, s.y, x, y, r);
  s.dx = a.dx;
  s.dy = a.dy;
}

export function liftStick(s: Stick): void {
  s.on = false;
  s.dx = 0;
  s.dy = 0;
}

export function showRestStick(vw: number, coarse: boolean, hoverNone: boolean): boolean {
  return coarse || hoverNone || vw <= 720;
}
