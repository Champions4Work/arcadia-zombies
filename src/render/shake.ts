import { EV_HURT, EV_LEVEL, EV_WAVE } from "../sim/types";
import { reduceMotionOn } from "./motion";

export const SHAKE_CAP = 2;
export const SHAKE_AMP = 0.55;
export const TRAUMA_HURT = 0.7;
export const TRAUMA_BIG = 0.4;
export const TRAUMA_DECAY = 3.2;
export const TRAUMA_STOP = 0.02;
export const SHAKE_DT = 1 / 60;

let trauma = 0;
let clock = 0;
let seenTick = -1;
const xy: [number, number] = [0, 0];

export function resetShake(): void {
  trauma = 0;
  clock = 0;
  seenTick = -1;
  xy[0] = 0;
  xy[1] = 0;
}

export function shakeEnergy(): number {
  return trauma;
}

export function impulseOf(events: ArrayLike<number>): number {
  let s = 0;
  if ((events[EV_HURT] ?? 0) > 0) s = TRAUMA_HURT;
  if ((events[EV_WAVE] ?? 0) > 0 || (events[EV_LEVEL] ?? 0) > 0) s = Math.max(s, TRAUMA_BIG);
  return s > 1 ? 1 : s;
}

export function absorbShake(tick: number, events: ArrayLike<number>): void {
  if (tick === seenTick) return;
  seenTick = tick;
  punchShake(impulseOf(events));
}

export function punchShake(amount: number): void {
  if (amount <= 0 || reduceMotionOn()) return;
  const next = trauma + amount;
  trauma = next > 1 ? 1 : next;
}

function clampAxis(v: number): number {
  if (v > SHAKE_CAP) return SHAKE_CAP;
  if (v < -SHAKE_CAP) return -SHAKE_CAP;
  return v;
}

function axis(seed: number, t: number): number {
  return 0.6 * Math.sin(t * 11 + seed) + 0.4 * Math.sin(t * 23 + seed * 2);
}

export function shakeOffset(magnitude: number, tick: number): [number, number] {
  const t = tick * 0.033;
  const shake = magnitude * magnitude;
  xy[0] = clampAxis(SHAKE_CAP * shake * axis(1, t));
  xy[1] = clampAxis(SHAKE_CAP * shake * axis(2.1, t));
  return xy;
}

export function decayTrauma(dt: number): number {
  if (trauma <= 0) return 0;
  const step = dt > 0 ? dt : SHAKE_DT;
  trauma *= Math.exp(-TRAUMA_DECAY * step);
  if (trauma < TRAUMA_STOP) trauma = 0;
  return trauma;
}

export function shakePixels(tick: number, enabled: boolean, dt = SHAKE_DT): [number, number] {
  if (!enabled || reduceMotionOn()) {
    trauma = 0;
    clock = 0;
    xy[0] = 0;
    xy[1] = 0;
    return xy;
  }
  const s = trauma;
  clock += dt > 0 ? dt : SHAKE_DT;
  decayTrauma(dt);
  if (s <= 0) {
    xy[0] = 0;
    xy[1] = 0;
    return xy;
  }
  return shakeOffset(s, clock * 30);
}
