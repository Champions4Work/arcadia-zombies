import type { Rng } from "./rng";
export const W = 480;
export const H = 320;
export const MAX_ZOMBIES = 128;
export const MAX_BULLETS = 128;
export const MAX_COGS = 128;
export const UPG_COUNT = 10;
export const UPG_MAX = 5;
export const OFFER_N = 3;
export const UPG_TESLA = 0;
export const UPG_SHOTGUN = 1;
export const UPG_SAWS = 2;
export const UPG_FIRE = 3;
export const UPG_DMG = 4;
export const UPG_HP = 5;
export const UPG_SPEED = 6;
export const UPG_MAGNET = 7;
export const UPG_PIERCE = 8;
export const UPG_SHIELD = 9;
export interface Input { dx: number; dy: number; pick?: number }
export interface Pool { x: Float32Array; y: Float32Array; vx: Float32Array; vy: Float32Array; hp: Int16Array; alive: Uint8Array }
export interface World {
  rng: Rng; tick: number; px: number; py: number; hp: number; maxHp: number;
  score: number; wave: number; toSpawn: number; spawnCd: number; fireCd: number;
  hurtCd: number; over: boolean; xp: number; level: number; choosing: number;
  teslaCd: number; teslaN: number; teslaFlash: number; shield: number; shieldCd: number;
  zombies: Pool; bullets: Pool; cogs: Pool; events: Uint8Array;
  upgrades: Uint8Array; offers: Int8Array; scratch: Uint8Array;
  bHit: Int16Array; bPierce: Uint8Array; zMark: Uint8Array; teslaHit: Int16Array;
}
export const EV_SHOT = 0;
export const EV_KILL = 1;
export const EV_HURT = 2;
export const EV_WAVE = 3;
export const EV_LEVEL = 4;
export const EV_TESLA = 5;
export const EV_SHIELD = 6;
export const EV_N = 8;
