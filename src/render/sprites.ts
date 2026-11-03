import {
  bakeActor, bakeRaw, blob, BLUE, BRASS, cog, COPPER, eye, GREEN, GREEN_BOOT, grin,
  pill, PURPLE, rivet, type Metal,
} from "./paint";

export interface CreepSpec {
  metal: Metal;
  boot: Metal;
  arm: Metal;
  fat: number;
  head: number;
  gearEye: boolean;
  helmet: boolean;
  jaw: boolean;
  fists: boolean;
  stitch: boolean;
  w: number;
  h: number;
}

export const SHAMBLER: CreepSpec = {
  metal: GREEN, boot: GREEN_BOOT, arm: COPPER, fat: 1.06, head: 1.14,
  gearEye: false, helmet: false, jaw: false, fists: false, stitch: true, w: 42, h: 60,
};
export const GHOUL: CreepSpec = {
  metal: BLUE, boot: BRASS, arm: BRASS, fat: 0.74, head: 0.9,
  gearEye: true, helmet: false, jaw: true, fists: false, stitch: false, w: 38, h: 60,
};
export const BRUTE: CreepSpec = {
  metal: PURPLE, boot: COPPER, arm: PURPLE, fat: 1.42, head: 0.82,
  gearEye: false, helmet: true, jaw: false, fists: true, stitch: true, w: 62, h: 70,
};

const SWING = [0.55, 0.12, -0.55, -0.08];

export function drawCreep(ctx: CanvasRenderingContext2D, frame: number, spec: CreepSpec): void {
  const bob = frame & 1 ? -1.4 : 0;
  const swing = SWING[frame] ?? 0;
  const fat = spec.fat;
  const hy = -40 + bob;
  pill(ctx, -9 * fat, -22 + bob, 6, 13, swing * 0.7, spec.metal);
  if (spec.helmet) cog(ctx, 0, hy - 10, 8.5, 0.15, BRASS, 8, true);
  pill(ctx, -5.2 * fat, -13 + bob, 7 * Math.min(fat, 1.2), 13, swing, spec.metal);
  pill(ctx, 5.2 * fat, -13 + bob, 7 * Math.min(fat, 1.2), 13, -swing, spec.metal);
  blob(ctx, 0, -26 + bob, 10.5 * fat, 12.2, spec.metal, 2.5);
  cog(ctx, 0.5, -25 + bob, 4.4, frame * 0.4, BRASS, 6, true);
  pill(ctx, -5.2 * fat, -5.5, 8 * Math.min(fat, 1.15), 6, 0, spec.boot, 1.8);
  pill(ctx, 5.2 * fat, -5.5, 8 * Math.min(fat, 1.15), 6, 0, spec.boot, 1.8);
  blob(ctx, 0, hy, 9.2 * spec.head, 8.6 * spec.head, spec.metal, 2.4);
  blob(ctx, -8 * spec.head, hy + 1, 2.2, 2.6, spec.metal, 1.3);
  blob(ctx, 8 * spec.head, hy + 1, 2.2, 2.6, spec.metal, 1.3);
  if (spec.gearEye) {
    eye(ctx, -3.3 * spec.head, hy - 1, 2.5, 0.38);
    cog(ctx, 3.4 * spec.head, hy - 1, 2.8, frame * 0.7, BRASS, 6, true);
  } else {
    eye(ctx, -3.4 * spec.head, hy - 1.2, 2.7 * spec.head, 0.4);
    eye(ctx, 3.6 * spec.head, hy - 0.4, 1.8 * spec.head, 0.48);
  }
  if (spec.jaw) pill(ctx, 0, hy + 5.5, 9, 4.2, 0, BRASS, 1.4);
  else grin(ctx, 0, hy + 4.2, 3.3 * spec.head);
  if (spec.stitch) {
    ctx.strokeStyle = "#1c120c";
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(-4, hy - 6);
    ctx.lineTo(4.5, hy - 5.2);
    ctx.moveTo(-2, hy - 8);
    ctx.lineTo(-2, hy - 4);
    ctx.moveTo(1.5, hy - 7.6);
    ctx.lineTo(1.5, hy - 3.8);
    ctx.stroke();
  }
  rivet(ctx, 6.2 * spec.head, hy + 2.4, 1.15);
  if (spec.fists) {
    blob(ctx, -13 * fat, -18 + bob, 5, 4.6, COPPER, 2);
    blob(ctx, 13 * fat, -16 + bob + swing * 4, 5.2, 4.8, COPPER, 2);
  } else {
    pill(ctx, 11 * fat, -24 + bob, 5.5, 12, -0.4 - swing * 0.4, spec.arm, 1.8);
    blob(ctx, 13.5 * fat, -18 + bob, 3.1, 2.8, spec.arm, 1.4);
  }
}

export function drawHero(ctx: CanvasRenderingContext2D, frame: number): void {
  const bob = frame & 1 ? -1.2 : 0;
  const swing = SWING[frame] ?? 0;
  pill(ctx, -7, -16 + bob, 8, 15, swing * 0.85, BRASS);
  pill(ctx, -7, -7, 10, 6.5, 0.04, COPPER, 1.8);
  pill(ctx, -14, -30 + bob, 7, 12, 0.7 + swing * 0.2, BRASS);
  cog(ctx, -15, -40 + bob, 7.2, frame * 0.35, BRASS, 8, true);
  pill(ctx, 0, -34 + bob, 26, 20, 0, BRASS, 2.6);
  pill(ctx, 7, -16 + bob, 8, 15, -swing * 0.85, BRASS);
  pill(ctx, 7, -7, 10, 6.5, -0.04, COPPER, 1.8);
  cog(ctx, 0, -50 + bob, 10, frame * 0.2, BRASS, 6, true);
}

export const HERO_W = 58;
export const HERO_H = 74;
const creepSheets = new Map<CreepSpec, HTMLCanvasElement[]>();
let heroSheet: HTMLCanvasElement[] | null = null;
let shadow: HTMLCanvasElement | null = null;
let gun: HTMLCanvasElement | null = null;
let bolt: HTMLCanvasElement | null = null;
let gear: HTMLCanvasElement | null = null;
let saw: HTMLCanvasElement | null = null;
const STEEL_SAW: Metal = { hi: "#f4f7fa", mid: "#c5ced6", lo: "#7d8b98", edge: "#2c3842" };
let puff: HTMLCanvasElement | null = null;
let star: HTMLCanvasElement | null = null;
const fallbackSheets = new Map<number, HTMLCanvasElement[]>();

function frames(w: number, h: number, draw: (ctx: CanvasRenderingContext2D, frame: number) => void): HTMLCanvasElement[] {
  return [0, 1, 2, 3].map((frame) => bakeActor(w, h, (ctx) => draw(ctx, frame)));
}

export function heroFrames(): HTMLCanvasElement[] {
  if (!heroSheet) heroSheet = frames(HERO_W, HERO_H, drawHero);
  return heroSheet;
}

export function creepFrames(spec: CreepSpec): HTMLCanvasElement[] {
  let hit = creepSheets.get(spec);
  if (!hit) {
    hit = frames(spec.w, spec.h, (ctx, frame) => drawCreep(ctx, frame, spec));
    creepSheets.set(spec, hit);
  }
  return hit;
}

export function fallbackSpec(kind: number): CreepSpec {
  const hue = (kind * 53) % 360;
  const metal: Metal = {
    hi: `hsl(${hue} 85% 82%)`,
    mid: `hsl(${hue} 70% 52%)`,
    lo: `hsl(${hue} 55% 32%)`,
    edge: `hsl(${hue} 45% 14%)`,
  };
  return {
    metal,
    boot: BRASS,
    arm: kind % 2 ? COPPER : metal,
    fat: 0.82 + (kind % 5) * 0.12,
    head: 0.9 + (kind % 3) * 0.1,
    gearEye: kind % 3 === 0,
    helmet: kind % 2 === 0,
    jaw: kind % 4 === 1,
    fists: kind % 5 === 4,
    stitch: kind % 2 === 1,
    w: 46,
    h: 64,
  };
}

export function fallbackFrames(kind: number): HTMLCanvasElement[] {
  let hit = fallbackSheets.get(kind);
  if (!hit) {
    const spec = fallbackSpec(kind);
    hit = frames(spec.w, spec.h, (ctx, frame) => drawCreep(ctx, frame, spec));
    fallbackSheets.set(kind, hit);
  }
  return hit;
}

export function shadowSprite(): HTMLCanvasElement {
  if (!shadow) shadow = bakeRaw(64, 28, (ctx) => {
    ctx.fillStyle = "rgba(16,10,18,0.35)";
    ctx.beginPath();
    ctx.ellipse(32, 14, 26, 11, 0, 0, Math.PI * 2);
    ctx.fill();
  });
  return shadow;
}

export function gunSprite(): HTMLCanvasElement {
  if (!gun) gun = bakeRaw(28, 14, (ctx) => {
    pill(ctx, 14, 7, 18, 6, 0, BRASS, 1.6);
    pill(ctx, 22, 7, 8, 4.2, 0, COPPER, 1.3);
  });
  return gun;
}

export function boltSprite(): HTMLCanvasElement {
  if (!bolt) bolt = bakeRaw(28, 16, (ctx) => {
    pill(ctx, 15, 8, 16, 5, 0, BRASS, 1.3);
  });
  return bolt;
}

export function gearSprite(): HTMLCanvasElement {
  if (!gear) gear = bakeRaw(32, 32, (ctx) => cog(ctx, 16, 16, 10, 0, BRASS, 8, true));
  return gear;
}

export function sawSprite(): HTMLCanvasElement {
  if (!saw) {
    saw = bakeRaw(40, 40, (ctx) => cog(ctx, 20, 20, 13, 0, STEEL_SAW, 10, false));
  }
  return saw;
}

export function puffSprite(): HTMLCanvasElement {
  if (!puff) {
    puff = bakeRaw(32, 32, (ctx) => {
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.beginPath();
      ctx.arc(16, 16, 12, 0, Math.PI * 2);
      ctx.fill();
    });
  }
  return puff;
}

export function starSprite(): HTMLCanvasElement {
  if (!star) {
    star = bakeRaw(32, 32, (ctx) => {
      ctx.fillStyle = "#fff8e0";
      ctx.fillRect(14, 4, 4, 24);
      ctx.fillRect(4, 14, 24, 4);
    });
  }
  return star;
}

export function paintShadow(ctx: CanvasRenderingContext2D, x: number, y: number, w: number): void {
  const h = w * 0.38;
  ctx.drawImage(shadowSprite(), x - w / 2 + 2, y - h * 0.45, w, h);
}
