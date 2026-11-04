import { ARENA_H } from "../sim/arena";
import { Z_ELITE, Z_GAS, Z_KIND, Z_KNIGHT, Z_RAT, Z_SPITTER } from "../sim/foes";
import { fogCover } from "../sim/map-events";
import { enemyFlash, hitKnockX, hitKnockY } from "./juice";
import { FLASH_SOFT, reduceMotionOn } from "./motion";
import {
  EV_SHOT, FX_BOOM, FX_FLASH, FX_PUFF, FX_SPARK, FX_XP, Z_BRUTE, Z_GHOUL, Z_SHAMBLER, type World,
} from "../sim/types";
import { paintProp } from "./arena";
import { paintKnightShield } from "./cast";
import { paintBoom, paintFlash, paintLevelBurst, paintPuff, paintRivetBolt, paintSpark, paintXp } from "./cast-fx";
import { offScreen } from "./cull";
import { projectileFor } from "./foes";
import { POSE_WALK, poseFrame } from "./poses";
import { paintWeapon } from "./weapons";
import {
  bulletPaint, fxPaint, registerBullet, registerFx, registerZombie, type BulletPaint, type Glyph,
} from "./plugins";
import { blitAtlas, foeFrameId } from "../art/atlas";
import { foeWorldH, paintCasing, paintSignatureHero, paintZombie } from "../art/look";
import { stampCasing } from "./stains";

export const BIN_LO = -80;
export const BIN_HI = ARENA_H + 100;
const LO = BIN_LO;
const HI = BIN_HI;
const SPAN = HI - LO + 1;
const bin = new Uint16Array(SPAN);
let seq = new Int32Array(256);
let tmp = new Int32Array(256);

function atlasGlyph(kind: number): Glyph {
  return {
    w: 32,
    h: 40,
    draw(ctx, x, y, tick, flip, _hp, pose = POSE_WALK) {
      blitAtlas(ctx, foeFrameId(kind, poseFrame(tick, pose, false)), x, y, 2, flip < 0);
    },
  };
}

registerZombie(Z_SHAMBLER, atlasGlyph(Z_SHAMBLER));
registerZombie(Z_GHOUL, atlasGlyph(Z_GHOUL));
registerZombie(Z_BRUTE, atlasGlyph(Z_BRUTE));
registerZombie(Z_SPITTER, atlasGlyph(Z_SPITTER));
registerZombie(Z_GAS, atlasGlyph(Z_GAS));
registerZombie(Z_KNIGHT, atlasGlyph(Z_KNIGHT));
registerZombie(Z_RAT, atlasGlyph(Z_RAT));

export function paintPlayer(ctx: CanvasRenderingContext2D, w: World, moving: boolean): void {
  if (w.hurtCd > 0 && w.hurtCd % 6 >= 3) return;
  paintHero(ctx, w, moving);
}

function paintHero(ctx: CanvasRenderingContext2D, w: World, moving: boolean): void {
  const shoot = (w.events[EV_SHOT] ?? 0) !== 0;
  paintSignatureHero(ctx, w.px, w.py, w.aimX, w.aimY, moving, shoot, w.tick);
  if (shoot) {
    const ox = -w.aimX * 16 - 8;
    const oy = 8 - w.aimY * 4;
    paintCasing(ctx, w.px + ox, w.py + oy);
    paintCasing(ctx, w.px + ox - 8, w.py + oy + 5);
    paintCasing(ctx, w.px + ox - 16, w.py + oy + 9);
    paintCasing(ctx, w.px + ox + 6, w.py + oy + 7);
    paintCasing(ctx, w.px + ox - 4, w.py + oy + 12);
    paintCasing(ctx, w.px + ox - 20, w.py + oy + 3);
    stampCasing(w.px + ox - 4, w.py + oy + 2, w.tick);
    stampCasing(w.px + ox - 10, w.py + oy + 7, w.tick + 3);
    stampCasing(w.px + ox - 16, w.py + oy + 11, w.tick + 6);
    const mag = Math.max(0.2, Math.hypot(w.aimX, w.aimY));
    const nx = w.aimX / mag;
    const ny = w.aimY / mag;
    for (let i = 1; i <= 5; i++) {
      paintRivetBolt(ctx, w.px + nx * (30 + i * 12), w.py - 18 + ny * (30 + i * 12), nx * 8, ny * 8);
    }
  }
}

function paintOne(ctx: CanvasRenderingContext2D, w: World, i: number): void {
  const z = w.zombies;
  const x = (z.x[i] ?? 0) + hitKnockX(i);
  const y = (z.y[i] ?? 0) + hitKnockY(i);
  const raw = z.kind[i] ?? 0;
  const kind = raw & Z_KIND;
  const elite = (raw & Z_ELITE) !== 0;
  const hp = z.hp[i] ?? 1;
  const flip = w.px - x < 0 ? -1 : 1;
  const flash = enemyFlash(i) > 0;
  const marked = elite || kind === Z_BRUTE || kind === Z_KNIGHT;
  paintZombie(ctx, x, y, kind, elite, w.tick + i * 3, flip);
  if (kind === Z_KNIGHT) paintKnightShield(ctx, x, y, z.vy[i] ?? 0, hp);
  if (marked) {
    const bodyH = foeWorldH(kind) * (elite ? 1.12 : 1);
    const bw = Math.min(18, 4 + Math.min(hp, 8) * 1.6);
    const top = y - bodyH - 4;
    ctx.fillStyle = "#1a1410";
    ctx.fillRect(x - 10, top, 20, 3);
    ctx.fillStyle = kind === Z_BRUTE ? "#e0a028" : "#e24a32";
    ctx.fillRect(x - 9, top + 1, bw, 1.4);
  }
  if (flash && marked) {
    ctx.fillStyle = "#fff8e8";
    ctx.globalAlpha = reduceMotionOn() ? FLASH_SOFT : 0.45;
    ctx.fillRect(x - 8, y - foeWorldH(kind) * 0.85, 16, 10);
    ctx.globalAlpha = 1;
  }
}

export function paintActors(ctx: CanvasRenderingContext2D, w: World, moving: boolean): void {
  const z = w.zombies;
  const cap = z.alive.length;
  const obs = w.arena;
  const need = cap + obs.obsN + 1;
  if (seq.length < need) {
    seq = new Int32Array(need);
    tmp = new Int32Array(need);
  }
  let n = 0;
  for (let i = 0; i < cap; i++) if (z.alive[i]) tmp[n++] = i;
  for (let i = 0; i < obs.obsN; i++) if (obs.obsAlive[i]) tmp[n++] = -2 - i;
  tmp[n++] = -1;
  bin.fill(0);
  for (let i = 0; i < n; i++) {
    const id = tmp[i] ?? -1;
    const y = id < -1 ? (obs.obsY[-2 - id] ?? 0) : id < 0 ? w.py : (z.y[id] ?? 0);
    bin[binOf(y)] = (bin[binOf(y)] ?? 0) + 1;
  }
  let run = 0;
  for (let i = 0; i < SPAN; i++) {
    const count = bin[i] ?? 0;
    bin[i] = run;
    run += count;
  }
  for (let i = 0; i < n; i++) {
    const id = tmp[i] ?? -1;
    const y = id < -1 ? (obs.obsY[-2 - id] ?? 0) : id < 0 ? w.py : (z.y[id] ?? 0);
    const key = binOf(y);
    const slot = bin[key] ?? 0;
    bin[key] = slot + 1;
    seq[slot] = id;
  }
  const hidden = w.hurtCd > 0 && w.hurtCd % 6 >= 3;
  const cover = fogCover(w);
  const shade = cover > 0 ? 1 - cover : 1;
  for (let i = 0; i < n; i++) {
    const id = seq[i] ?? -1;
    if (id < -1) paintProp(ctx, w, -2 - id);
    else if (id < 0) {
      ctx.globalAlpha = 1;
      if (!hidden) paintHero(ctx, w, moving);
    } else if (!offScreen(z.x[id] ?? 0, z.y[id] ?? 0, 96, obs.camX, obs.camY, obs.viewW, obs.viewH)) {
      if (shade < 1) ctx.globalAlpha = shade;
      paintOne(ctx, w, id);
    }
  }
  ctx.globalAlpha = 1;
}

function binOf(y: number): number {
  let k = y | 0;
  if (k < LO) k = LO;
  else if (k > HI) k = HI;
  return k - LO;
}

const defaultBolt: BulletPaint = (ctx, x, y, vx, vy) => {
  paintRivetBolt(ctx, x, y, vx, vy);
};

registerBullet(0, defaultBolt);

export function paintBullets(ctx: CanvasRenderingContext2D, w: World): void {
  const b = w.bullets;
  for (let i = 0; i < b.alive.length; i++) {
    if (!b.alive[i]) continue;
    if (offScreen(b.x[i] ?? 0, b.y[i] ?? 0, 24, w.arena.camX, w.arena.camY, w.arena.viewW, w.arena.viewH)) continue;
    if (paintWeapon(ctx, w, i)) continue;
    const paint = projectileFor(b.hp[i] ?? 0, bulletPaint(b.kind[i] ?? 0, defaultBolt));
    paint(ctx, b.x[i] ?? 0, b.y[i] ?? 0, b.vx[i] ?? 1, b.vy[i] ?? 0, w.tick);
  }
}

registerFx(FX_FLASH, paintFlash);
registerFx(FX_SPARK, paintSpark);
registerFx(FX_PUFF, paintPuff);
registerFx(FX_XP, paintXp);
registerFx(FX_BOOM, paintBoom);

export function paintFx(ctx: CanvasRenderingContext2D, w: World): void {
  paintLevelBurst(ctx, w);
  const camX = w.arena.camX;
  const camY = w.arena.camY;
  for (let i = 0; i < w.fxKind.length; i++) {
    const kind = w.fxKind[i] ?? 0;
    if (!kind) continue;
    const x = w.fxX[i] ?? 0;
    const y = w.fxY[i] ?? 0;
    if (offScreen(x, y, 48, camX, camY, w.arena.viewW, w.arena.viewH)) continue;
    const age = w.tick - (w.fxTick[i] ?? 0);
    fxPaint(kind, paintSpark)(ctx, x, y, age, w.fxA[i] ?? 0, w.tick);
  }
}
