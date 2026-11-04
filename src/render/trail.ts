import { HERO_DRAW_SCALE, walkBob } from "../art/look";
import { blitSheetLean, heroSpriteId } from "../art/sheet";
import { reduceMotionOn } from "./motion";

export const TRAIL_CAP = 5;
export const TRAIL_LIFE = 6;

const tx = new Float32Array(TRAIL_CAP);
const ty = new Float32Array(TRAIL_CAP);
const tLife = new Uint8Array(TRAIL_CAP);
let tHead = 0;

export function resetTrail(): void {
  tHead = 0;
  tLife.fill(0);
}

export function stampTrail(x: number, y: number, tick: number, moving: boolean): void {
  if (reduceMotionOn()) return;
  const i = tHead;
  tHead = i + 1 < TRAIL_CAP ? i + 1 : 0;
  tx[i] = x;
  ty[i] = y;
  tLife[i] = TRAIL_LIFE;
  void moving;
}

export function tickTrail(): void {
  for (let i = 0; i < TRAIL_CAP; i++) {
    const life = tLife[i] ?? 0;
    if (life > 0) tLife[i] = life - 1;
  }
}

export function paintTrail(
  ctx: CanvasRenderingContext2D,
  tick: number,
  flip: boolean,
  dash: boolean,
): void {
  if (reduceMotionOn() || !dash) return;
  const bob = walkBob(tick, true);
  const s = HERO_DRAW_SCALE;
  const id = heroSpriteId(true, tick);
  for (let k = 0; k < TRAIL_CAP; k++) {
    const i = (tHead + k) % TRAIL_CAP;
    const life = tLife[i] ?? 0;
    if (life <= 0) continue;
    const a = (life / TRAIL_LIFE) * 0.24;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.globalCompositeOperation = "source-over";
    blitSheetLean(ctx, id, tx[i] ?? 0, ty[i] ?? 0, flip, bob, 0, s * 0.9);
    ctx.restore();
  }
}
