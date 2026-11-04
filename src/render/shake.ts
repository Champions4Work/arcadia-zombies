import { EV_HURT, EV_LEVEL, EV_WAVE } from "../sim/types";

export const SHAKE_CAP = 2;
export const SHAKE_AMP = 0.55;
const LEGACY_HURT = 6;
const LEGACY_BIG = 4;
const AMP_KEEP = 0.3;
const HURT = LEGACY_HURT * AMP_KEEP;
const BIG = LEGACY_BIG * AMP_KEEP;
const DECAY = 0.7;
const STOP = 0.4;

let energy = 0;
let seenTick = -1;
const xy: [number, number] = [0, 0];

export function resetShake(): void {
  energy = 0;
  seenTick = -1;
  xy[0] = 0;
  xy[1] = 0;
}

export function shakeEnergy(): number {
  return energy;
}

export function impulseOf(events: ArrayLike<number>): number {
  let s = 0;
  if ((events[EV_HURT] ?? 0) > 0) s = HURT;
  if ((events[EV_WAVE] ?? 0) > 0 || (events[EV_LEVEL] ?? 0) > 0) s = Math.max(s, BIG);
  return s > SHAKE_CAP ? SHAKE_CAP : s;
}

export function absorbShake(tick: number, events: ArrayLike<number>): void {
  if (tick === seenTick) return;
  seenTick = tick;
  const s = impulseOf(events);
  if (s > energy) energy = s;
}

export function punchShake(amount: number): void {
  if (amount <= 0) return;
  if (amount > energy) energy = amount > SHAKE_CAP ? SHAKE_CAP : amount;
}

function clampAxis(v: number): number {
  if (v > SHAKE_CAP) return SHAKE_CAP;
  if (v < -SHAKE_CAP) return -SHAKE_CAP;
  return v;
}

export function shakeOffset(magnitude: number, tick: number): [number, number] {
  const jx = ((tick * 17) & 3) - 1;
  const jy = ((tick * 13) & 3) - 1;
  xy[0] = clampAxis(jx * magnitude * SHAKE_AMP);
  xy[1] = clampAxis(jy * magnitude * SHAKE_AMP);
  return xy;
}

export function shakePixels(tick: number, enabled: boolean): [number, number] {
  if (!enabled) {
    energy = 0;
    xy[0] = 0;
    xy[1] = 0;
    return xy;
  }
  const s = energy;
  energy *= DECAY;
  if (energy < STOP) energy = 0;
  if (s <= 0) {
    xy[0] = 0;
    xy[1] = 0;
    return xy;
  }
  return shakeOffset(s, tick);
}
