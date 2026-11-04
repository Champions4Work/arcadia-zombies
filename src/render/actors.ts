import { ARENA_H } from "../sim/arena";
import { Z_ELITE, Z_GAS, Z_KIND, Z_KNIGHT, Z_RAT, Z_SPITTER } from "../sim/foes";
import { fogCover } from "../sim/map-events";
import { enemyFlash } from "./juice";
import {
  FX_FLASH, FX_PUFF, FX_SPARK, FX_XP, Z_BRUTE, Z_GHOUL, Z_SHAMBLER, type World,
} from "../sim/types";
import { paintProp } from "./arena";
import { offScreen } from "./cull";
import { gasGlyph, knightGlyph, projectileFor, ratGearGlyph, spitterGlyph } from "./foes";
import { blit, BRASS, font, roundRect } from "./paint";
import { paintWeapon } from "./weapons";
import {
  bulletPaint, fxPaint, registerBullet, registerFx, registerZombie, zombieGlyph, type BulletPaint, type FxPaint, type Glyph,
} from "./plugins";
import {
  BRUTE, creepFrames, fallbackFrames, fallbackSpec, GHOUL, gunSprite, HERO_H, HERO_W, heroFrames,
  paintShadow, puffSprite, SHAMBLER, starSprite, boltSprite,
} from "./sprites";

export const BIN_LO = -80;
export const BIN_HI = ARENA_H + 100;
const LO = BIN_LO;
const HI = BIN_HI;
const SPAN = HI - LO + 1;
const bin = new Uint16Array(SPAN);
let seq = new Int32Array(256);
let tmp = new Int32Array(256);

function creepGlyph(spec: typeof SHAMBLER, slow: boolean): Glyph {
  return {
    w: spec.w,
    h: spec.h,
    draw(ctx, x, y, tick, flip) {
      const frame = (tick >> (slow ? 4 : 3)) & 3;
      blit(ctx, creepFrames(spec), spec.w, spec.h, frame, x, y, flip);
    },
  };
}

function fallbackGlyph(kind: number): Glyph {
  const spec = fallbackSpec(kind);
  return {
    w: spec.w,
    h: spec.h,
    draw(ctx, x, y, tick, flip) {
      blit(ctx, fallbackFrames(kind), spec.w, spec.h, (tick >> 3) & 3, x, y, flip);
    },
  };
}

registerZombie(Z_SHAMBLER, creepGlyph(SHAMBLER, false));
registerZombie(Z_GHOUL, creepGlyph(GHOUL, false));
registerZombie(Z_BRUTE, creepGlyph(BRUTE, true));
registerZombie(Z_SPITTER, spitterGlyph);
registerZombie(Z_GAS, gasGlyph);
registerZombie(Z_KNIGHT, knightGlyph);
registerZombie(Z_RAT, ratGearGlyph);

export function paintPlayer(ctx: CanvasRenderingContext2D, w: World, moving: boolean): void {
  if (w.hurtCd > 0 && w.hurtCd % 6 >= 3) return;
  paintHero(ctx, w, moving);
}

function paintHero(ctx: CanvasRenderingContext2D, w: World, moving: boolean): void {
  paintShadow(ctx, w.px, w.py, 32);
  const flip = w.aimX < 0 ? -1 : 1;
  blit(ctx, heroFrames(), HERO_W, HERO_H, moving ? (w.tick >> 3) & 3 : 0, w.px, w.py, flip);
  ctx.save();
  ctx.translate(w.px + flip * 10, w.py - 36);
  ctx.rotate(Math.atan2(w.aimY, w.aimX || 1));
  ctx.drawImage(gunSprite(), -6, -7, 28, 14);
  ctx.restore();
  const t = w.tick % 48;
  if (t < 34) {
    ctx.globalAlpha = (1 - t / 34) * 0.5;
    const s = 8 + t * 0.22;
    ctx.drawImage(puffSprite(), w.px - s / 2, w.py - 76 - t * 0.4, s, s);
    ctx.globalAlpha = 1;
  }
}

function paintKnightShield(ctx: CanvasRenderingContext2D, x: number, y: number, face: number): void {
  ctx.save();
  ctx.translate(x, y - 24);
  ctx.rotate(face);
  ctx.translate(14, 0);
  ctx.beginPath();
  ctx.ellipse(0, 0, 7, 12, 0, 0, Math.PI * 2);
  ctx.fillStyle = BRASS.mid;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#1c120c";
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(-1.5, -2, 2.2, 4, -0.4, 0, Math.PI * 2);
  ctx.fillStyle = BRASS.hi;
  ctx.fill();
  ctx.restore();
}

function paintElite(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, tick: number): void {
  const bw = w * 0.72;
  const bh = h * 0.9;
  ctx.lineWidth = 2.2;
  ctx.strokeStyle = (tick >> 2) & 1 ? "#fff1c2" : "#f0b03a";
  roundRect(ctx, x - bw / 2, y - bh, bw, bh, 8);
  ctx.stroke();
}

function paintOne(ctx: CanvasRenderingContext2D, w: World, i: number): void {
  const z = w.zombies;
  const x = z.x[i] ?? 0;
  const y = z.y[i] ?? 0;
  const raw = z.kind[i] ?? 0;
  const kind = raw & Z_KIND;
  const elite = (raw & Z_ELITE) !== 0;
  const hp = z.hp[i] ?? 1;
  const flip = w.px - x < 0 ? -1 : 1;
  const glyph = zombieGlyph(kind, fallbackGlyph);
  const flash = enemyFlash(i) > 0;
  if (elite) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1.28, 1.28);
    ctx.translate(-x, -y);
  }
  paintShadow(ctx, x, y, glyph.w * 0.86);
  glyph.draw(ctx, x, y, w.tick + i * 3, flip, hp);
  if (kind === Z_KNIGHT) paintKnightShield(ctx, x, y, z.vy[i] ?? 0);
  if (elite) ctx.restore();
  if (hp >= 3) {
    const bw = Math.min(24, 4 + Math.min(hp, 10) * 2);
    const top = y - glyph.h * (elite ? 1.28 : 1) - 6;
    ctx.fillStyle = "#1c120c";
    ctx.fillRect(x - 13, top, 26, 4);
    ctx.fillStyle = kind === Z_BRUTE ? "#ffb040" : "#ff5a4a";
    ctx.fillRect(x - 12, top + 1, bw, 2);
  }
  if (elite) paintElite(ctx, x, y, glyph.w * 1.28, glyph.h * 1.28, w.tick);
  if (flash) {
    ctx.fillStyle = "#fff8e8";
    ctx.globalAlpha = 0.72;
    ctx.fillRect(x - glyph.w * 0.45, y - glyph.h * 0.92, glyph.w * 0.9, glyph.h * 0.7);
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
    } else if (!offScreen(z.x[id] ?? 0, z.y[id] ?? 0, 96, obs.camX, obs.camY)) {
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
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.atan2(vy, vx || 1));
  ctx.drawImage(boltSprite(), -14, -8, 28, 16);
  ctx.restore();
};

registerBullet(0, defaultBolt);

export function paintBullets(ctx: CanvasRenderingContext2D, w: World): void {
  const b = w.bullets;
  for (let i = 0; i < b.alive.length; i++) {
    if (!b.alive[i]) continue;
    if (offScreen(b.x[i] ?? 0, b.y[i] ?? 0, 24, w.arena.camX, w.arena.camY)) continue;
    if (paintWeapon(ctx, w, i)) continue;
    const paint = projectileFor(b.hp[i] ?? 0, bulletPaint(b.kind[i] ?? 0, defaultBolt));
    paint(ctx, b.x[i] ?? 0, b.y[i] ?? 0, b.vx[i] ?? 1, b.vy[i] ?? 0, w.tick);
  }
}

const paintFlash: FxPaint = (ctx, x, y, age) => {
  if (age < 0 || age >= 7) return;
  ctx.globalAlpha = 1 - age / 7;
  const s = 20 - age * 1.4;
  ctx.drawImage(starSprite(), x - s / 2, y - s / 2, s, s);
  ctx.globalAlpha = 1;
};

const paintSpark: FxPaint = (ctx, x, y, age) => {
  if (age < 0 || age >= 10) return;
  ctx.globalAlpha = 1 - age / 10;
  const k = 3 + age * 1.5;
  ctx.fillStyle = "#ffe08a";
  ctx.fillRect(x + k, y - k, 3, 3);
  ctx.fillStyle = "#ff9a30";
  ctx.fillRect(x - k, y + k * 0.3, 3, 3);
  ctx.fillStyle = "#fff6d0";
  ctx.fillRect(x, y - k * 0.2, 2, 2);
  ctx.globalAlpha = 1;
};

const PUFF = ["#c6f27a", "#9aefff", "#e4c0ff", "#f0d090"];

const paintPuff: FxPaint = (ctx, x, y, age, a) => {
  if (age < 0 || age >= 18) return;
  const gas = a === Z_GAS;
  const s = (gas ? 16 : 10) + age * (gas ? 1.8 : 1.15);
  ctx.globalAlpha = Math.max(0, (gas ? 0.85 : 0.7) - age / 26);
  if (gas) {
    ctx.fillStyle = "#7fbf32";
    ctx.beginPath();
    ctx.ellipse(x, y - age * 0.45, s * 0.55, s * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#e7ff9a";
    ctx.beginPath();
    ctx.ellipse(x - s * 0.15, y - age * 0.7, s * 0.28, s * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    return;
  }
  ctx.drawImage(puffSprite(), x - s / 2, y - s * 0.55 - age * 0.45, s, s * 0.85);
  ctx.globalAlpha = Math.max(0, 0.4 - age / 36);
  ctx.fillStyle = PUFF[a | 0] ?? "#f0d090";
  ctx.beginPath();
  ctx.arc(x, y - age * 0.35, 2.5 + age * 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
};

const paintXp: FxPaint = (ctx, x, y, age, a) => {
  if (age < 0 || age >= 24) return;
  const n = Math.max(1, a | 0);
  const label = `${n} XP`;
  ctx.globalAlpha = 1 - age / 24;
  ctx.font = font(9, 800);
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#1c120c";
  ctx.strokeText(label, x + 4, y - age);
  ctx.fillStyle = "#ffe08a";
  ctx.fillText(label, x + 4, y - age);
  ctx.globalAlpha = 1;
};

registerFx(FX_FLASH, paintFlash);
registerFx(FX_SPARK, paintSpark);
registerFx(FX_PUFF, paintPuff);
registerFx(FX_XP, paintXp);

export function paintFx(ctx: CanvasRenderingContext2D, w: World): void {
  for (let i = 0; i < w.fxKind.length; i++) {
    const kind = w.fxKind[i] ?? 0;
    if (!kind) continue;
    const age = w.tick - (w.fxTick[i] ?? 0);
    fxPaint(kind, paintSpark)(ctx, w.fxX[i] ?? 0, w.fxY[i] ?? 0, age, w.fxA[i] ?? 0, w.tick);
  }
}
