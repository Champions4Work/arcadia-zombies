import { ARENA_H, ARENA_W } from "./arena";
import type { World } from "./types";

export const CHAPTER_WAVES = 8;
export const HOLD_TICKS = 240 * 60;
export const GATE_X = ARENA_W / 2 + 160;
export const GATE_Y = ARENA_H / 2 - 90;
export const GATE_R = 28;
export const GATE_R2 = GATE_R * GATE_R;

export type ObjectiveId = "gate" | "hold" | "waves";

export interface ObjectiveRow {
  id: ObjectiveId;
  label: string;
  done: boolean;
  clock: string;
}

export function waveFace(w: World): { n: number; of: number } {
  const raw = w.wave | 0;
  const n = raw < 1 ? 1 : raw > CHAPTER_WAVES ? CHAPTER_WAVES : raw;
  return { n, of: CHAPTER_WAVES };
}

export function holdClock(left: number): string {
  const ticks = left > 0 ? left | 0 : 0;
  const s = (ticks / 60) | 0;
  const m = Math.min(99, (s / 60) | 0);
  const r = s % 60;
  return `${m < 10 ? "0" : ""}${m}:${r < 10 ? "0" : ""}${r}`;
}

export function gateOn(w: World): number {
  return w.gate === 1 ? 1 : 0;
}

export function holdLeft(w: World): number {
  return w.holdLeft > 0 ? w.holdLeft | 0 : 0;
}

export function holdDone(w: World): boolean {
  return w.gate === 1 && (w.holdLeft | 0) <= 0;
}

export function wavesDone(w: World): boolean {
  return (w.wave | 0) >= CHAPTER_WAVES;
}

export function objectiveRows(w: World): readonly [ObjectiveRow, ObjectiveRow, ObjectiveRow] {
  const holding = w.gate === 1 && (w.holdLeft | 0) > 0;
  return [
    { id: "gate", label: "Activate the Steam Gate", done: w.gate === 1, clock: "" },
    { id: "hold", label: "Hold the Area", done: holdDone(w), clock: holding ? `(${holdClock(w.holdLeft)})` : "" },
    { id: "waves", label: "Survive All Waves", done: wavesDone(w), clock: "" },
  ];
}

export function stepObjectives(w: World): void {
  if (w.over || w.choosing) return;
  if (w.gate === 0) {
    const dx = w.px - GATE_X;
    const dy = w.py - GATE_Y;
    if (dx * dx + dy * dy <= GATE_R2) {
      w.gate = 1;
      w.holdLeft = HOLD_TICKS;
    }
    return;
  }
  if (w.holdLeft > 0) w.holdLeft--;
}
