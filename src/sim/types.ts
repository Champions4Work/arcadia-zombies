import type { Rng } from "./rng";
export const W = 480;
export const H = 320;
export const MAX_ZOMBIES = 128;
export const MAX_BULLETS = 64;
export interface Input { dx: number; dy: number }
export interface Pool { x: Float32Array; y: Float32Array; vx: Float32Array; vy: Float32Array; hp: Int16Array; alive: Uint8Array }
export interface World {
  rng: Rng; tick: number; px: number; py: number; hp: number; score: number; wave: number;
  toSpawn: number; spawnCd: number; fireCd: number; hurtCd: number; over: boolean;
  zombies: Pool; bullets: Pool; events: Uint8Array
}
export const EV_SHOT = 0;
export const EV_KILL = 1;
export const EV_HURT = 2;
export const EV_WAVE = 3;
