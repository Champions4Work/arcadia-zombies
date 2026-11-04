import { bakeActor, bakeRaw, blob, BRASS, cog, COPPER, pill, type Metal } from "./paint";
import {
  BRUTE, drawCreep, drawHero, fallbackSpec, GHOUL, HERO_H, HERO_W, SHAMBLER, type CreepSpec,
} from "./cast";

export {
  BRUTE, drawCreep, drawHero, fallbackSpec, GHOUL, HERO_H, HERO_W, SHAMBLER, type CreepSpec,
};

const creepSheets = new Map<string, HTMLCanvasElement[]>();
const heroSheets = new Map<string, HTMLCanvasElement[]>();
let shadow: HTMLCanvasElement | null = null;
let gun: HTMLCanvasElement | null = null;
let bolt: HTMLCanvasElement | null = null;
let gear: HTMLCanvasElement | null = null;
let saw: HTMLCanvasElement | null = null;
const STEEL_SAW: Metal = { hi: "#f4f7fa", mid: "#c5ced6", lo: "#7d8b98", edge: "#2c3842" };
let puff: HTMLCanvasElement | null = null;
let star: HTMLCanvasElement | null = null;

function frames(w: number, h: number, draw: (ctx: CanvasRenderingContext2D, frame: number) => void): HTMLCanvasElement[] {
  return [0, 1, 2, 3].map((frame) => bakeActor(w, h, (ctx) => draw(ctx, frame)));
}

export function heroFrames(id = 0, pose = 0): HTMLCanvasElement[] {
  const key = `${id}:${pose}`;
  let hit = heroSheets.get(key);
  if (!hit) {
    hit = frames(HERO_W, HERO_H, (ctx, frame) => drawHero(ctx, frame, id, pose));
    heroSheets.set(key, hit);
  }
  return hit;
}

export function creepFrames(spec: CreepSpec, pose = 0): HTMLCanvasElement[] {
  const key = `${spec.w}:${spec.h}:${spec.fat}:${spec.head}:${spec.helmet ? 1 : 0}:${spec.gearEye ? 1 : 0}:${pose}`;
  let hit = creepSheets.get(key);
  if (!hit) {
    hit = frames(spec.w, spec.h, (ctx, frame) => drawCreep(ctx, frame, spec, pose));
    creepSheets.set(key, hit);
  }
  return hit;
}

const fallbackSheets = new Map<string, HTMLCanvasElement[]>();

export function fallbackFrames(kind: number, pose = 0): HTMLCanvasElement[] {
  const key = `${kind}:${pose}`;
  let hit = fallbackSheets.get(key);
  if (!hit) {
    const spec = fallbackSpec(kind);
    hit = frames(spec.w, spec.h, (ctx, frame) => drawCreep(ctx, frame, spec, pose));
    fallbackSheets.set(key, hit);
  }
  return hit;
}

export function shadowSprite(): HTMLCanvasElement {
  if (!shadow) {
    shadow = bakeRaw(64, 28, (ctx) => {
      const g = ctx.createRadialGradient(32, 14, 2, 32, 14, 26);
      g.addColorStop(0, "rgba(16,10,18,0.55)");
      g.addColorStop(1, "rgba(16,10,18,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(32, 14, 26, 11, 0, 0, Math.PI * 2);
      ctx.fill();
    });
  }
  return shadow;
}

export function gunSprite(): HTMLCanvasElement {
  if (!gun) {
    gun = bakeRaw(28, 14, (ctx) => {
      pill(ctx, 14, 7, 18, 6, 0, BRASS, 1.6);
      pill(ctx, 22, 7, 8, 4.2, 0, COPPER, 1.3);
      blob(ctx, 8, 7, 4, 4, BRASS, 1.4);
      const g = ctx.createRadialGradient(25, 7, 0.5, 25, 7, 4);
      g.addColorStop(0, "#fff4c8");
      g.addColorStop(1, "rgba(255,140,30,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(25, 7, 4, 0, Math.PI * 2);
      ctx.fill();
    });
  }
  return gun;
}

export function boltSprite(): HTMLCanvasElement {
  if (!bolt) {
    bolt = bakeRaw(28, 16, (ctx) => {
      const g = ctx.createRadialGradient(16, 8, 1, 16, 8, 8);
      g.addColorStop(0, "rgba(255,220,140,0.9)");
      g.addColorStop(1, "rgba(255,140,40,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 28, 16);
      pill(ctx, 15, 8, 16, 5, 0, { hi: "#fff6d0", mid: "#ffb040", lo: "#e06010", edge: "#7a2808" }, 1.3);
      ctx.beginPath();
      ctx.arc(20, 8, 2, 0, Math.PI * 2);
      ctx.fillStyle = "#fff8e4";
      ctx.fill();
    });
  }
  return bolt;
}

export function gearSprite(): HTMLCanvasElement {
  if (!gear) gear = bakeRaw(32, 32, (ctx) => cog(ctx, 16, 16, 10, 0, BRASS, 8, true));
  return gear;
}

export function sawSprite(): HTMLCanvasElement {
  if (!saw) {
    saw = bakeRaw(40, 40, (ctx) => {
      cog(ctx, 20, 20, 13, 0, STEEL_SAW, 10, false);
      const g = ctx.createRadialGradient(20, 20, 1, 20, 20, 8);
      g.addColorStop(0, "#fff4c4");
      g.addColorStop(0.6, "#ff8a1e");
      g.addColorStop(1, "rgba(255,80,10,0)");
      ctx.beginPath();
      ctx.arc(20, 20, 7, 0, Math.PI * 2);
      ctx.fillStyle = g;
      ctx.fill();
    });
  }
  return saw;
}

export function puffSprite(): HTMLCanvasElement {
  if (!puff) {
    puff = bakeRaw(32, 32, (ctx) => {
      const g = ctx.createRadialGradient(16, 16, 2, 16, 16, 15);
      g.addColorStop(0, "rgba(255,255,255,0.9)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 32, 32);
    });
  }
  return puff;
}

export function starSprite(): HTMLCanvasElement {
  if (!star) {
    star = bakeRaw(32, 32, (ctx) => {
      const g = ctx.createRadialGradient(16, 16, 1, 16, 16, 14);
      g.addColorStop(0, "rgba(255,244,200,0.95)");
      g.addColorStop(0.4, "rgba(255,170,50,0.7)");
      g.addColorStop(1, "rgba(255,120,20,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = "#fff8e0";
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        ctx.rotate(0);
        const a = (i / 4) * Math.PI * 2;
        ctx.ellipse(16 + Math.cos(a) * 4, 16 + Math.sin(a) * 4, 7, 2.2, a, 0, Math.PI * 2);
      }
      ctx.fill();
    });
  }
  return star;
}

export function paintShadow(ctx: CanvasRenderingContext2D, x: number, y: number, w: number): void {
  const h = w * 0.38;
  ctx.drawImage(shadowSprite(), x - w / 2 + 2, y - h * 0.45, w, h);
}
