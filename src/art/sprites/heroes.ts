import { cloneGrid, fill, frame, grid, outline, put, type PxFrame } from "../px";

const W = 16;
const H = 24;

function body(g: string[][], coat: string, hi: string, boot: string, bob: number, step: number): void {
  const y = bob;
  const l = step >= 0 ? 0 : 1;
  const r = step > 0 ? 1 : 0;
  fill(g, 5, 16 + y + l, 3, 5 - l, coat);
  fill(g, 8, 16 + y + r, 3, 5 - r, coat);
  fill(g, 5, 20 + y + l, 3, 2, boot);
  fill(g, 8, 20 + y + r, 3, 2, boot);
  fill(g, 4, 10 + y, 8, 7, coat);
  put(g, 5, 11 + y, hi);
  put(g, 6, 11 + y, hi);
  fill(g, 6, 12 + y, 4, 3, "b");
  put(g, 7, 13 + y, "B");
  fill(g, 5, 5 + y, 6, 5, "M");
  put(g, 6, 6 + y, "u");
  put(g, 9, 6 + y, "k");
  put(g, 10, 6 + y, "g");
  put(g, 6, 8 + y, "r");
  put(g, 7, 8 + y, "r");
}

function tinkerHat(g: string[][], y: number): void {
  fill(g, 4, 2 + y, 8, 3, "b");
  fill(g, 5, 1 + y, 6, 2, "d");
  put(g, 7, 0 + y, "x");
  put(g, 8, 0 + y, "x");
  put(g, 7, 1 + y, "i");
  fill(g, 5, 5 + y, 6, 2, "b");
  put(g, 6, 6 + y, "B");
  put(g, 9, 6 + y, "B");
}

function gunHat(g: string[][], y: number): void {
  fill(g, 2, 4 + y, 12, 2, "n");
  fill(g, 5, 1 + y, 6, 4, "r");
  put(g, 6, 2 + y, "c");
  put(g, 9, 2 + y, "c");
}

function alchHat(g: string[][], y: number): void {
  fill(g, 6, 0 + y, 4, 5, "g");
  fill(g, 7, 1 + y, 2, 3, "a");
  fill(g, 4, 4 + y, 8, 2, "d");
  put(g, 8, 0 + y, "B");
}

function bruteHat(g: string[][], y: number): void {
  fill(g, 4, 1 + y, 8, 5, "x");
  put(g, 3, 2 + y, "w");
  put(g, 12, 2 + y, "w");
  put(g, 3, 1 + y, "d");
  put(g, 12, 1 + y, "d");
  fill(g, 6, 3 + y, 4, 2, "b");
}

function stokerHat(g: string[][], y: number): void {
  fill(g, 4, 3 + y, 8, 3, "r");
  put(g, 5, 3 + y, "c");
  put(g, 10, 3 + y, "c");
  fill(g, 6, 2 + y, 4, 2, "n");
}

function gun(g: string[][], y: number, shoot: boolean): void {
  fill(g, 11, 12 + y, shoot ? 5 : 4, 2, "x");
  put(g, 12, 12 + y, "w");
  if (shoot) {
    put(g, 15, 11 + y, "F");
    put(g, 15, 12 + y, "f");
  }
}

function poseHero(
  id: string,
  hat: (g: string[][], y: number) => void,
  coat: string,
  hi: string,
  boot: string,
  bob: number,
  step: number,
  shoot: boolean,
): PxFrame {
  const g = grid(W, H);
  body(g, coat, hi, boot, bob, step);
  hat(g, bob);
  gun(g, bob, shoot);
  outline(g);
  return frame(id, 8, 23, g);
}

function cycle(
  name: string,
  hat: (g: string[][], y: number) => void,
  coat: string,
  hi: string,
  boot: string,
): PxFrame[] {
  const idle0 = poseHero(`${name}-idle-0`, hat, coat, hi, boot, 0, 0, false);
  const idle1 = poseHero(`${name}-idle-1`, hat, coat, hi, boot, 1, 0, false);
  const walk = [
    poseHero(`${name}-walk-0`, hat, coat, hi, boot, 0, 1, false),
    poseHero(`${name}-walk-1`, hat, coat, hi, boot, 1, 0, false),
    poseHero(`${name}-walk-2`, hat, coat, hi, boot, 0, -1, false),
    poseHero(`${name}-walk-3`, hat, coat, hi, boot, 1, 0, false),
  ];
  const atk = [
    poseHero(`${name}-atk-0`, hat, coat, hi, boot, 0, 0, true),
    poseHero(`${name}-atk-1`, hat, coat, hi, boot, 0, 1, true),
    poseHero(`${name}-atk-2`, hat, coat, hi, boot, 0, 0, true),
    poseHero(`${name}-atk-3`, hat, coat, hi, boot, 0, 0, true),
  ];
  const hit = poseHero(`${name}-hit-0`, hat, coat, hi, boot, 0, 0, false);
  const die = (() => {
    const g = cloneGrid(grid(W, H));
    body(g, coat, hi, boot, 2, 0);
    hat(g, 3);
    outline(g);
    return frame(`${name}-die-0`, 8, 23, g);
  })();
  return [idle0, idle1, ...walk, ...atk, hit, die];
}

export const HERO_FRAMES: PxFrame[] = [
  ...cycle("tinker", tinkerHat, "b", "B", "c"),
  ...cycle("gunslinger", gunHat, "c", "e", "r"),
  ...cycle("alchemist", alchHat, "t", "G", "d"),
  ...cycle("brute", bruteHat, "x", "w", "c"),
  ...cycle("stoker", stokerHat, "n", "c", "r"),
];

export const HERO_NAMES = ["tinker", "gunslinger", "alchemist", "brute", "stoker"] as const;
