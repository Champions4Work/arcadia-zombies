import type { World } from "../sim/types";

export interface Glyph {
  w: number;
  h: number;
  draw(ctx: CanvasRenderingContext2D, x: number, y: number, tick: number, flip: number, hp: number): void;
}

export type BulletPaint = (ctx: CanvasRenderingContext2D, x: number, y: number, vx: number, vy: number, tick: number) => void;
export type FxPaint = (ctx: CanvasRenderingContext2D, x: number, y: number, age: number, a: number, tick: number) => void;
export type LayerPaint = (ctx: CanvasRenderingContext2D, w: World) => void;

export const LAYER_BACK = 10;
export const LAYER_MID = 20;
export const LAYER_FRONT = 30;
export const LAYER_HUD = 40;

const zombies: (Glyph | undefined)[] = [];
const zombieFallback = new Map<number, Glyph>();
const bullets: (BulletPaint | undefined)[] = [];
const fxs: (FxPaint | undefined)[] = [];
const layers: { z: number; fn: LayerPaint }[] = [];

export function registerZombie(kind: number, glyph: Glyph): void {
  zombies[kind] = glyph;
}

export function registerBullet(kind: number, paint: BulletPaint): void {
  bullets[kind] = paint;
}

export function registerFx(kind: number, paint: FxPaint): void {
  fxs[kind] = paint;
}

export function registerLayer(z: number, fn: LayerPaint): void {
  layers.push({ z, fn });
}

export function zombieGlyph(kind: number, fallback: (kind: number) => Glyph): Glyph {
  return zombies[kind] ?? zombieFallback.get(kind) ?? remember(kind, fallback);
}

function remember(kind: number, fallback: (kind: number) => Glyph): Glyph {
  const g = fallback(kind);
  zombieFallback.set(kind, g);
  return g;
}

export function bulletPaint(kind: number, fallback: BulletPaint): BulletPaint {
  return bullets[kind] ?? fallback;
}

export function fxPaint(kind: number, fallback: FxPaint): FxPaint {
  return fxs[kind] ?? fallback;
}

export function paintLayers(ctx: CanvasRenderingContext2D, w: World, z: number): void {
  for (let i = 0; i < layers.length; i++) {
    const layer = layers[i];
    if (layer && layer.z === z) layer.fn(ctx, w);
  }
}
