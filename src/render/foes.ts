import { B_ACID } from "../sim/foes";
import { bakeActor, bakeRaw, blit, blob, boiler, BRASS, cog, COPPER, eye, GREEN, grin, pill, plate, rivet, type Metal } from "./paint";
import { FRAME_N, POSE_DIE, POSE_N, POSE_WALK, poseFrame } from "./poses";
import { drawCreep, type CreepSpec } from "./sprites";
import type { BulletPaint, Glyph } from "./plugins";

const ACID: Metal = { hi: "#f4ffc4", mid: "#9ae046", lo: "#3d7a16", edge: "#163008" };
const TANK: Metal = { hi: "#ffe0b0", mid: "#d07030", lo: "#7a3014", edge: "#3a1408" };

const SPITTER: CreepSpec = {
  metal: GREEN, boot: BRASS, arm: BRASS, fat: 0.78, head: 1.16,
  gearEye: true, helmet: false, jaw: false, fists: false, stitch: true, w: 48, h: 62,
};
const GAS: CreepSpec = {
  metal: GREEN, boot: COPPER, arm: COPPER, fat: 1.28, head: 0.86,
  gearEye: false, helmet: false, jaw: false, fists: false, stitch: false, w: 58, h: 70,
};
const KNIGHT: CreepSpec = {
  metal: COPPER, boot: BRASS, arm: BRASS, fat: 1.16, head: 0.92,
  gearEye: false, helmet: true, jaw: true, fists: false, stitch: false, w: 60, h: 72,
};

function nozzle(ctx: CanvasRenderingContext2D, frame: number): void {
  const bob = frame & 1 ? -1.4 : 0;
  plate(ctx, 16, -31 + bob, 14, 5.2, -0.12, BRASS, 1.5);
  blob(ctx, 24, -31 + bob, 3.8, 3.4, ACID, 1.6);
  ctx.beginPath();
  ctx.arc(25, -31 + bob, 1.4, 0, Math.PI * 2);
  ctx.fillStyle = frame & 2 ? "#f4ffd0" : "#c6f25a";
  ctx.fill();
}

function tank(ctx: CanvasRenderingContext2D, frame: number): void {
  const bob = frame & 1 ? -1.4 : 0;
  plate(ctx, -4, -33 + bob, 20, 14, 0.18, TANK, 2);
  rivet(ctx, -10, -36 + bob, 1.25);
  rivet(ctx, 2, -30 + bob, 1.25);
  rivet(ctx, -8, -28 + bob, 1.1);
  pill(ctx, 7, -42 + bob, 4.4, 7, 0.35, BRASS, 1.2);
  boiler(ctx, 6, -28 + bob, 2.6, 2.4, frame & 1 ? 1 : 0.3);
  blob(ctx, -11, -48 + bob - (frame & 2 ? 2 : 0), 3.4, 2.8, ACID, 1.2);
}

function drawRat(ctx: CanvasRenderingContext2D, frame: number, pose = POSE_WALK): void {
  const bob = (pose === POSE_DIE ? 4 : 0) + (frame & 1 ? -1.2 : 0);
  const step = frame & 1 ? 1.6 : -0.8;
  blob(ctx, -1, -9 + bob, 12, 6.8, BRASS, 1.8);
  cog(ctx, -2, -10 + bob, 3.6, frame * 0.45, COPPER, 6, true);
  blob(ctx, 9, -10 + bob, 4.6, 3.8, BRASS, 1.4);
  eye(ctx, 10.2, -10.4 + bob, 1.4, 0.2);
  ctx.beginPath();
  ctx.arc(11.4, -10.2 + bob, 0.75, 0, Math.PI * 2);
  ctx.fillStyle = "#ff4450";
  ctx.fill();
  plate(ctx, -13, -8 + bob, 8, 2, 0.4, COPPER, 1);
  blob(ctx, -4, -3 + step, 1.8, 1.5, { hi: "#3a2414", mid: "#24160c", lo: "#120c08", edge: "#120c08" }, 0.8);
  blob(ctx, 3, -3 - step, 1.8, 1.5, { hi: "#3a2414", mid: "#24160c", lo: "#120c08", edge: "#120c08" }, 0.8);
  grin(ctx, 9.2, -8 + bob, 1.5);
  rivet(ctx, 2, -7 + bob, 0.8);
}

const sheets = new Map<string, HTMLCanvasElement[][]>();

function sheet(key: string, w: number, h: number, draw: (ctx: CanvasRenderingContext2D, frame: number, pose: number) => void): HTMLCanvasElement[][] {
  let hit = sheets.get(key);
  if (!hit) {
    hit = [];
    for (let pose = 0; pose < POSE_N; pose++) {
      const row: HTMLCanvasElement[] = [];
      for (let frame = 0; frame < FRAME_N; frame++) {
        row.push(bakeActor(w, h, (ctx) => draw(ctx, frame, pose)));
      }
      hit.push(row);
    }
    sheets.set(key, hit);
  }
  return hit;
}

function baked(spec: CreepSpec, extra?: (ctx: CanvasRenderingContext2D, frame: number) => void): Glyph {
  const key = extra ? `${spec.w}x${spec.h}` : `body-${spec.w}`;
  return {
    w: spec.w,
    h: spec.h,
    draw(ctx, x, y, tick, flip, _hp, pose = POSE_WALK) {
      const frames = sheet(key + (extra ? "-x" : ""), spec.w, spec.h, (c, frame, p) => {
        drawCreep(c, frame, spec, p);
        extra?.(c, frame);
      });
      blit(ctx, frames[pose] ?? frames[POSE_WALK] ?? [], spec.w, spec.h, poseFrame(tick, pose, spec.fat > 1.2), x, y, flip);
    },
  };
}

const ratGlyph: Glyph = {
  w: 42,
  h: 38,
  draw(ctx, x, y, tick, flip, _hp, pose = POSE_WALK) {
    const frames = sheet("rat", 42, 38, drawRat);
    blit(ctx, frames[pose] ?? frames[POSE_WALK] ?? [], 42, 38, poseFrame(tick, pose, false), x, y, flip);
  },
};

export const spitterGlyph = baked(SPITTER, nozzle);
export const gasGlyph = baked(GAS, tank);
export const knightGlyph = baked(KNIGHT);
export const ratGearGlyph = ratGlyph;

let acid: HTMLCanvasElement | null = null;

export function acidSprite(): HTMLCanvasElement {
  if (!acid) {
    acid = bakeRaw(24, 24, (ctx) => {
      const g = ctx.createRadialGradient(12, 12, 1, 12, 12, 11);
      g.addColorStop(0, "rgba(244,255,196,0.95)");
      g.addColorStop(0.45, "rgba(154,224,70,0.85)");
      g.addColorStop(1, "rgba(60,120,20,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(12, 12, 11, 0, Math.PI * 2);
      ctx.fill();
      blob(ctx, 12, 12, 5.2, 4.6, ACID, 1.4);
      ctx.beginPath();
      ctx.arc(13.4, 10.6, 1.3, 0, Math.PI * 2);
      ctx.fillStyle = "#f4ffd0";
      ctx.fill();
    });
  }
  return acid;
}

export const acidBolt: BulletPaint = (ctx, x, y, vx, vy) => {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.atan2(vy, vx || 1));
  ctx.drawImage(acidSprite(), -12, -12, 24, 24);
  ctx.restore();
};

export function projectileFor(hp: number, bolt: BulletPaint): BulletPaint {
  return hp === B_ACID ? acidBolt : bolt;
}
