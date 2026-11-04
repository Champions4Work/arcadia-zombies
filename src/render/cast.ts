import { blitAtlas } from "../art/atlas";
import { CHAR_ALCHEMIST, CHAR_BRUTE, CHAR_GUNSLINGER } from "../sim/characters";
import { MUZZLE_HAND_X, MUZZLE_HAND_Y } from "../sim/muzzle";
import { EV_SHOT, WPN_FLAME, WPN_HARP, WPN_MORT, WPN_SHOT, type World } from "../sim/types";
import { paintAura } from "./cast-fx";
import { drawHeroKit } from "./heroes";
import {
  blob, boiler, BRASS, cog, COPPER, eye, GREEN, GREEN_BOOT, grin, goggles as lens, pill, plate,
  PURPLE, rivet, SKIN, STEEL, type Metal,
} from "./paint";
import { heroPose, motionOf, POSE_WALK } from "./poses";
function groundShadow(ctx: CanvasRenderingContext2D, x: number, y: number, w: number): void {
  const h = w * 0.38;
  ctx.save();
  ctx.globalAlpha = 0.4;
  ctx.fillStyle = "#100a12";
  ctx.beginPath();
  ctx.ellipse(x, y, w * 0.5, h * 0.45, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

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
  metal: GREEN, boot: GREEN_BOOT, arm: COPPER, fat: 1.08, head: 1.12,
  gearEye: false, helmet: false, jaw: false, fists: false, stitch: true, w: 48, h: 66,
};
export const GHOUL: CreepSpec = {
  metal: { hi: "#d8fbff", mid: "#3ec4e4", lo: "#1478a4", edge: "#083048" },
  boot: BRASS, arm: BRASS, fat: 0.7, head: 0.92,
  gearEye: true, helmet: false, jaw: true, fists: false, stitch: false, w: 42, h: 66,
};
export const BRUTE: CreepSpec = {
  metal: PURPLE, boot: COPPER, arm: PURPLE, fat: 1.48, head: 0.84,
  gearEye: false, helmet: true, jaw: false, fists: true, stitch: true, w: 68, h: 76,
};

export const HERO_W = 66;
export const HERO_H = 84;
const IRON: Metal = { hi: "#d8dee4", mid: "#6a727c", lo: "#2c3238", edge: "#121418" };

export function drawHero(ctx: CanvasRenderingContext2D, frame: number, id = 0, pose = 0): void {
  drawHeroKit(ctx, frame, pose, id);
}

export function drawCreep(ctx: CanvasRenderingContext2D, frame: number, spec: CreepSpec, pose = POSE_WALK): void {
  const m = motionOf(pose, frame);
  const bob = m.bob;
  const swing = m.swing;
  const fat = spec.fat;
  const hy = -42 + bob + m.drop;
  ctx.save();
  ctx.scale(1, m.squash);
  pill(ctx, -11 * fat + m.lean * 3, -24 + bob + m.drop, 5.5, 16, 0.7 + swing * 0.5, spec.arm, 1.6);
  blob(ctx, -13 * fat + m.lean * 2, -14 + bob + swing * 5 + m.drop, spec.fists ? 5 : 3.2, spec.fists ? 4.6 : 2.8, spec.fists ? COPPER : spec.arm, 1.4);
  pill(ctx, -5.4 * fat + m.lean * 3, -14 + bob + m.drop, 7 * Math.min(fat, 1.2), 16, swing, spec.metal, 1.8);
  pill(ctx, 5.6 * fat + m.lean * 3, -14 + bob + m.drop, 7 * Math.min(fat, 1.2), 16, -swing, spec.metal, 1.8);
  pill(ctx, -5.8 * fat + m.lean * 3, -4 + m.drop, 8.4 * Math.min(fat, 1.15), 6.2, 0.05, spec.boot, 1.5);
  pill(ctx, 5.8 * fat + m.lean * 3, -4 + m.drop, 8.4 * Math.min(fat, 1.15), 6.2, -0.04, spec.boot, 1.5);
  blob(ctx, m.lean * 4, -26 + bob + m.drop, 11.4 * fat, 13.4, spec.metal, 2.3);
  boiler(ctx, m.lean * 4, -24 + bob + m.drop, 4.2 * Math.min(fat, 1.15), 4.6, frame & 1 ? 1 : 0.35);
  cog(ctx, 1.2 + m.lean * 4, -24 + bob + m.drop, 4.8, frame * 0.35, BRASS, 6, true);
  if (spec.helmet) cog(ctx, m.lean * 4, hy - 11, 9.2, 0.12 + frame * 0.12, BRASS, 8, true);
  blob(ctx, m.lean * 5, hy, 9.6 * spec.head, 8.8 * spec.head, spec.metal, 2.2);
  blob(ctx, -8.4 * spec.head + m.lean * 5, hy + 1, 2.4, 2.8, spec.metal, 1.2);
  blob(ctx, 8.4 * spec.head + m.lean * 5, hy + 1, 2.4, 2.8, spec.metal, 1.2);
  if (spec.gearEye) {
    eye(ctx, -3.4 * spec.head + m.lean * 5, hy - 1, 2.6, 0.36);
    cog(ctx, 3.6 * spec.head + m.lean * 5, hy - 1, 3, frame * 0.7, BRASS, 6, true);
  } else if (spec.helmet) {
    lens(ctx, m.lean * 5, hy - 0.4, 3.1, "rgba(255,150,50,0.7)");
  } else {
    eye(ctx, -3.6 * spec.head + m.lean * 5, hy - 1.2, 2.8 * spec.head, 0.4);
    eye(ctx, 3.8 * spec.head + m.lean * 5, hy - 0.4, 1.9 * spec.head, 0.48);
  }
  if (spec.jaw) plate(ctx, m.lean * 5, hy + 5.8, 10, 4.4, 0, BRASS, 1.3);
  else grin(ctx, m.lean * 5, hy + 4.4, 3.5 * spec.head);
  if (spec.stitch) {
    ctx.strokeStyle = "#1c120c";
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(-4.5 + m.lean * 5, hy - 6);
    ctx.lineTo(5 + m.lean * 5, hy - 5);
    ctx.moveTo(-2.2 + m.lean * 5, hy - 8.4);
    ctx.lineTo(-2.2 + m.lean * 5, hy - 3.6);
    ctx.moveTo(1.8 + m.lean * 5, hy - 8);
    ctx.lineTo(1.8 + m.lean * 5, hy - 3.4);
    ctx.stroke();
  }
  rivet(ctx, 6.6 * spec.head + m.lean * 5, hy + 2.6, 1.2);
  rivet(ctx, -6.2 * spec.head + m.lean * 5, hy + 3.2, 1);
  if (spec.fists) {
    blob(ctx, -14 * fat + m.lean * 2, -18 + bob + m.drop, 5.4, 5, COPPER, 2);
    blob(ctx, 13 * fat + m.lean * 6, -18 + bob + swing * 4 + m.drop, 5.4, 5, COPPER, 2);
  } else {
    pill(ctx, 12 * fat + m.lean * 6, -28 + bob + m.drop, 5.6, 13, -0.35 - swing * 0.35, spec.arm, 1.6);
    blob(ctx, 14.4 * fat + m.lean * 6, -20 + bob + m.drop, 3.2, 2.8, spec.arm, 1.3);
  }
  ctx.restore();
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
    w: 48,
    h: 68,
  };
}

function drawGun(ctx: CanvasRenderingContext2D, gun: number, hot: boolean): void {
  const along = gun === WPN_HARP ? 26 : gun === WPN_MORT ? 16 : gun === WPN_SHOT ? 18 : 22;
  pill(ctx, 2, 2, 10, 4.2, 0.7, { hi: "#c8a070", mid: "#6a4430", lo: "#3a2418", edge: "#1a100c" }, 1.2);
  blob(ctx, 6, 1, 2.6, 2.4, SKIN, 1);
  if (gun === WPN_SHOT) {
    pill(ctx, 14, -2.2, along - 4, 3.2, 0, STEEL, 1.2);
    pill(ctx, 14, 2.2, along - 4, 3.2, 0, STEEL, 1.2);
    blob(ctx, 10, 0, 4, 4.2, BRASS, 1.3);
  } else if (gun === WPN_FLAME) {
    blob(ctx, 8, 4, 5.5, 5, COPPER, 1.4);
    pill(ctx, 16, 0, along - 6, 5, 0, BRASS, 1.3);
    blob(ctx, along, 0, 2.4, 2.4, { hi: "#fff3c0", mid: "#ff7a2a", lo: "#a82810", edge: "#4a1008" }, 1);
  } else if (gun === WPN_HARP) {
    pill(ctx, 16, 0, along - 2, 3.4, 0, STEEL, 1.2);
    ctx.beginPath();
    ctx.moveTo(along + 2, 0);
    ctx.lineTo(along - 4, -4);
    ctx.lineTo(along - 4, 4);
    ctx.closePath();
    ctx.fillStyle = BRASS.mid;
    ctx.fill();
    ctx.strokeStyle = "#1c120c";
    ctx.lineWidth = 1.1;
    ctx.stroke();
  } else if (gun === WPN_MORT) {
    pill(ctx, 12, 0, along - 2, 7.2, 0, IRON, 1.4);
    pill(ctx, 8, 0, 8, 8.4, 0, BRASS, 1.3);
    blob(ctx, along, -4, 1.6, 2.4, { hi: "#fff3c0", mid: "#ff7a2a", lo: "#a82810", edge: "#4a1008" }, 0.8);
  } else {
    pill(ctx, 14, 0, along - 4, 4.6, 0, BRASS, 1.3);
    pill(ctx, along - 2, 0, 7, 3.2, 0, COPPER, 1.1);
    blob(ctx, 9, 0, 3.6, 3.6, BRASS, 1.2);
    rivet(ctx, 9, -1.6, 0.9);
  }
  if (hot) {
    const g = ctx.createRadialGradient(along, 0, 0.4, along, 0, 10);
    g.addColorStop(0, "#fff6d0");
    g.addColorStop(0.35, "#ff9a24");
    g.addColorStop(1, "rgba(255,80,10,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(along, 0, 14, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function paintSurvivor(ctx: CanvasRenderingContext2D, w: World, moving: boolean, blitHero: (frame: number, flip: number) => void): void {
  groundShadow(ctx, w.px, w.py, 34);
  const flip = w.aimX < 0 ? -1 : 1;
  const shoot = (w.events[EV_SHOT] ?? 0) !== 0;
  const frame = shoot ? 0 : moving ? (w.tick >> 3) & 3 : 0;
  blitHero(frame, flip);
  ctx.save();
  ctx.translate(w.px + flip * MUZZLE_HAND_X, w.py + MUZZLE_HAND_Y);
  ctx.rotate(Math.atan2(w.aimY, w.aimX || 1));
  drawGun(ctx, w.gun, shoot);
  ctx.restore();
  if (w.charId === 0 || w.charId === CHAR_ALCHEMIST) {
    const t = w.tick % 40;
    if (t < 28) {
      ctx.globalAlpha = (1 - t / 28) * 0.45;
      const s = 7 + t * 0.2;
      ctx.beginPath();
      ctx.ellipse(w.px - flip * 12, w.py - 70 - t * 0.35, s * 0.45, s * 0.32, 0, 0, Math.PI * 2);
      ctx.fillStyle = "#d8e4ea";
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }
}

export function poseOf(moving: boolean, shoot: boolean, hurt = false, dead = false): number {
  return heroPose(moving, shoot, hurt, dead);
}

export function paintKnightShield(ctx: CanvasRenderingContext2D, x: number, y: number, face: number, hp: number): void {
  ctx.save();
  ctx.translate(x, y - 22);
  ctx.rotate(face);
  ctx.translate(16, 0);
  ctx.beginPath();
  ctx.moveTo(0, -17);
  ctx.lineTo(10, -11);
  ctx.lineTo(11, 3);
  ctx.quadraticCurveTo(8, 12, 0, 18);
  ctx.quadraticCurveTo(-8, 12, -11, 3);
  ctx.lineTo(-10, -11);
  ctx.closePath();
  ctx.fillStyle = IRON.mid;
  ctx.fill();
  ctx.lineWidth = 2.6;
  ctx.strokeStyle = BRASS.mid;
  ctx.stroke();
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = "#1c120c";
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, -15);
  ctx.lineTo(0, 15);
  ctx.moveTo(-8, -4);
  ctx.lineTo(8, -4);
  ctx.strokeStyle = BRASS.lo;
  ctx.lineWidth = 1.4;
  ctx.stroke();
  cog(ctx, 0, -2, 4.2, 0.2, BRASS, 6, false);
  rivet(ctx, -7, -10, 1.15);
  rivet(ctx, 7, -10, 1.15);
  rivet(ctx, -8, 4, 1.15);
  rivet(ctx, 8, 4, 1.15);
  if (hp <= 3) {
    ctx.strokeStyle = "#1c120c";
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(-4, -8);
    ctx.lineTo(1, -1);
    ctx.lineTo(-2, 6);
    ctx.stroke();
  }
  if (hp <= 1) {
    ctx.strokeStyle = "#ff7a2a";
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(3, -9);
    ctx.lineTo(6, 2);
    ctx.lineTo(2, 10);
    ctx.stroke();
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = "#ff9a24";
    ctx.beginPath();
    ctx.arc(2, 2, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

export function paintHealVial(ctx: CanvasRenderingContext2D, x: number, y: number, tick: number, i: number): void {
  const bob = (tick >> 3 & 1) + (i & 1);
  paintAura(ctx, x, y - bob, 12, tick + i * 7, "rgba(46,154,72,0.55)", "rgba(30,74,24,0.18)");
  blitAtlas(ctx, "hp-0", x, y - bob, 2);
}

export function paintCrate(ctx: CanvasRenderingContext2D, x: number, y: number, hw: number, hh: number): void {
  const scale = hw + hh > 28 ? 2 : 1;
  blitAtlas(ctx, "chest-0", x, y, scale);
}

export function paintChest(ctx: CanvasRenderingContext2D, x: number, y: number, tick: number): void {
  blitAtlas(ctx, (tick >> 4) & 1 ? "chest-1" : "chest-0", x, y, 2);
}

function block(ctx: CanvasRenderingContext2D, x: number, y: number, s: string, w = 1, h = 1): void {
  ctx.fillStyle = s;
  ctx.fillRect(x | 0, y | 0, w, h);
}

export function paintBehemoth(ctx: CanvasRenderingContext2D, x: number, y: number, tick: number, mode: number): void {
  const ix = x | 0;
  const iy = y | 0;
  const bob = mode === 2 ? (tick & 1) * 3 : tick >> 4 & 1;
  block(ctx, ix - 23, iy + 4, "#120c08", 46, 5);
  block(ctx, ix - 22, iy - 4 + bob, "#2c3238", 16, 8);
  block(ctx, ix + 6, iy - 4 + (bob ^ 1), "#2c3238", 16, 8);
  block(ctx, ix - 24, iy - 34 + bob, "#2c3238", 48, 30);
  block(ctx, ix - 22, iy - 32 + bob, "#6a727c", 44, 26);
  block(ctx, ix - 20, iy - 30 + bob, "#c5ccd4", 44, 3);
  block(ctx, ix - 10, iy - 22 + bob, "#120c08", 20, 12);
  block(ctx, ix - 8, iy - 20 + bob, "#ff5a1a", 16, 8);
  block(ctx, ix - 4, iy - 18 + bob, tick >> 2 & 1 ? "#ffd27a" : "#ff5a1a", 8, 4);
  block(ctx, ix - 12, iy - 50 + bob, "#6a727c", 24, 18);
  block(ctx, ix - 10, iy - 54 + bob, "#2c3238", 20, 6);
  block(ctx, ix - 8, iy - 44 + bob, "#120c08", 16, 5);
  block(ctx, ix - 6, iy - 43 + bob, "#ff5a1a", 5, 3);
  block(ctx, ix + 2, iy - 43 + bob, "#ff5a1a", 5, 3);
  block(ctx, ix - 28, iy - 50 + bob, "#2c3238", 8, 20);
  block(ctx, ix + 20, iy - 50 + bob, "#2c3238", 8, 20);
  block(ctx, ix - 26, iy - 52 + bob, "#b5562f", 4, 4);
  block(ctx, ix + 22, iy - 52 + bob, "#b5562f", 4, 4);
  block(ctx, ix - 32, iy - 24 + bob, "#6a727c", 8, 16);
  block(ctx, ix + 24, iy - 24 + bob, "#6a727c", 8, 16);
  block(ctx, ix - 34, iy - 12 + bob, "#c8963e", 10, 6);
  block(ctx, ix + 24, iy - 12 + bob, "#c8963e", 10, 6);
  for (let r = -18; r <= 16; r += 8) {
    block(ctx, ix + r, iy - 32 + bob, "#e8c878", 2, 2);
    block(ctx, ix + r + 1, iy - 31 + bob, "#7a5420", 1, 1);
  }
}

export function paintWitch(ctx: CanvasRenderingContext2D, x: number, y: number, tick: number, phase: number): void {
  const ix = x | 0;
  const iy = y | 0;
  const bob = tick >> 3 & 1;
  block(ctx, ix - 13, iy + 4, "#120c08", 26, 5);
  block(ctx, ix - 8, iy - 6 + bob, "#24182e", 6, 12);
  block(ctx, ix + 2, iy - 6 + (bob ^ 1), "#24182e", 6, 12);
  block(ctx, ix - 14, iy - 28 + bob, "#24182e", 28, 24);
  block(ctx, ix - 12, iy - 26 + bob, "#4a3660", 10, 18);
  block(ctx, ix - 4, iy - 18 + bob, "#7a5420", 8, 10);
  block(ctx, ix - 8, iy - 42 + bob, "#c8963e", 16, 16);
  block(ctx, ix - 10, iy - 46 + bob, "#120c08", 20, 6);
  block(ctx, ix - 6, iy - 38 + bob, "#7ad0ff", 5, 4);
  block(ctx, ix + 2, iy - 38 + bob, "#7ad0ff", 5, 4);
  block(ctx, ix - 5, iy - 37 + bob, "#e8ffff", 2, 2);
  block(ctx, ix + 3, iy - 37 + bob, "#e8ffff", 2, 2);
  block(ctx, ix - 6, iy - 62 + bob, "#24182e", 12, 18);
  block(ctx, ix - 2, iy - 70 + bob, "#24182e", 4, 10);
  block(ctx, ix - 8, iy - 64 + bob, "#7a5420", 16, 3);
  block(ctx, ix + 10, iy - 46 + bob, "#7a5420", 3, 28);
  block(ctx, ix + 6, iy - 48 + bob, "#b5562f", 11, 4);
  if (phase > 0) {
    ctx.globalAlpha = 0.55;
    const puffY = tick % 18;
    block(ctx, ix + 8, iy - 54 - puffY + bob, "#d5e4ea", 8, 6);
    block(ctx, ix + 4, iy - 62 - (puffY >> 1) + bob, "#d5e4ea", 6, 5);
    ctx.globalAlpha = 1;
  }
  block(ctx, ix - 16, iy - 20 + bob, "#4a3660", 4, 14);
  block(ctx, ix - 18, iy - 8 + bob, "#c8963e", 6, 4);
}

export function paintGearlord(ctx: CanvasRenderingContext2D, x: number, y: number, tick: number): void {
  const ix = x | 0;
  const iy = y | 0;
  const bob = tick >> 3 & 1;
  block(ctx, ix - 15, iy + 4, "#120c08", 30, 5);
  block(ctx, ix - 8, iy - 8 + bob, "#7a5420", 5, 12);
  block(ctx, ix + 3, iy - 8 + (bob ^ 1), "#7a5420", 5, 12);
  block(ctx, ix - 6, iy - 22 + bob, "#2c3238", 12, 16);
  block(ctx, ix - 14, iy - 20 + bob, "#e4e7ee", 28, 3);
  block(ctx, ix - 1, iy - 32 + bob, "#e4e7ee", 3, 28);
  block(ctx, ix - 5, iy - 34 + bob, "#6a727c", 10, 10);
  block(ctx, ix - 3, iy - 32 + bob, "#120c08", 6, 4);
  block(ctx, ix - 2, iy - 31 + bob, "#ff5a1a", 4, 2);
  block(ctx, ix - 8, iy - 40 + bob, "#c8963e", 16, 4);
  const swing = tick * 0.35;
  block(ctx, ix - 24, iy - 18 + bob + Math.sin(swing) * 3, "#e4e7ee", 10, 3);
  block(ctx, ix + 14, iy - 18 + bob + Math.cos(swing) * 3, "#e4e7ee", 10, 3);
  block(ctx, ix - 20, iy - 18 + bob, "#7a5420", 6, 3);
  block(ctx, ix + 14, iy - 18 + bob, "#7a5420", 6, 3);
}

export function charKitId(id: number): number {
  if (id === CHAR_GUNSLINGER) return 1;
  if (id === CHAR_ALCHEMIST) return 2;
  if (id === CHAR_BRUTE) return 3;
  return 0;
}
