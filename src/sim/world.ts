import { createRng } from "./rng";
import { H, MAX_BULLETS, MAX_ZOMBIES, W, type Pool, type World } from "./types";
const pool = (n: number): Pool => ({ x: new Float32Array(n), y: new Float32Array(n), vx: new Float32Array(n), vy: new Float32Array(n), hp: new Int16Array(n), alive: new Uint8Array(n) });
export const createWorld = (seed: number): World => ({
  rng: createRng(seed), tick: 0, px: W / 2, py: H / 2, hp: 5, score: 0, wave: 0,
  toSpawn: 0, spawnCd: 0, fireCd: 0, hurtCd: 0, over: false,
  zombies: pool(MAX_ZOMBIES), bullets: pool(MAX_BULLETS), events: new Uint8Array(4),
});
