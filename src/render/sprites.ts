import { blitAtlas, heroFrameId } from "../art/atlas";
import { bakeActor, bakeRaw } from "./paint";
import {
  BRUTE, drawCreep, drawHero, fallbackSpec, GHOUL, HERO_H, HERO_W, SHAMBLER, type CreepSpec,
} from "./cast";

export {
  BRUTE, drawCreep, drawHero, fallbackSpec, GHOUL, HERO_H, HERO_W, SHAMBLER, type CreepSpec,
};

export function heroFrames(id = 0, pose = 0): HTMLCanvasElement[] {
  return [0, 1, 2, 3].map((frame) => bakeActor(HERO_W, HERO_H, (ctx) => {
    blitAtlas(ctx, heroFrameId(id, pose, frame), HERO_W / 2, HERO_H - 2, 2, false);
  }));
}

export function paintShadow(ctx: CanvasRenderingContext2D, x: number, y: number, w: number): void {
  const h = w * 0.38;
  ctx.fillStyle = "#080604";
  ctx.globalAlpha = 0.45;
  ctx.fillRect(x - w / 2, y - h * 0.3, w, h * 0.6);
  ctx.globalAlpha = 1;
}

export function puffSprite(): HTMLCanvasElement {
  return bakeRaw(16, 16, (ctx) => blitAtlas(ctx, "puff-0", 8, 8, 1, false));
}

export function sawSprite(): HTMLCanvasElement {
  return bakeRaw(16, 16, (ctx) => blitAtlas(ctx, "icon-saw", 0, 0, 1, false));
}

export function starSprite(): HTMLCanvasElement {
  return bakeRaw(16, 16, (ctx) => blitAtlas(ctx, "spark-0", 8, 8, 1, false));
}

export function gearSprite(): HTMLCanvasElement {
  return bakeRaw(16, 16, (ctx) => blitAtlas(ctx, "icon-gear", 0, 0, 1, false));
}

export function gunSprite(): HTMLCanvasElement {
  return bakeRaw(16, 16, (ctx) => blitAtlas(ctx, "icon-rivet", 0, 0, 1, false));
}

export function boltSprite(): HTMLCanvasElement {
  return bakeRaw(12, 8, (ctx) => blitAtlas(ctx, "rivet-1", 6, 4, 1, false));
}
