import { blitAtlas, shotFrameId } from "../art/atlas";
import { paintZombie } from "../art/look";
import { Z_ELITE, Z_GAS, Z_KIND, Z_KNIGHT } from "../sim/foes";
import { EV_LEVEL, WPN_FLAME, WPN_HARP, WPN_MORT, WPN_SHOT, type World } from "../sim/types";
import { blob, BRASS, cog, COPPER, font, pill, STEEL } from "./paint";
import { type FxPaint } from "./plugins";

const EMBER = { hi: "#fff6d0", mid: "#ffb040", lo: "#e06010", edge: "#7a2808" };
const STEAM = { hi: "#f4f8fa", mid: "#c5d0d6", lo: "#7a8a92", edge: "#3a4448" };
const ACID = { hi: "#f4ffc4", mid: "#7fbf32", lo: "#3d7a16", edge: "#163008" };

function bloom(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, hi: string, mid: string): void {
  const g = ctx.createRadialGradient(x, y, 0.4, x, y, Math.max(2, r));
  g.addColorStop(0, hi);
  g.addColorStop(0.42, mid);
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, Math.max(2, r), 0, Math.PI * 2);
  ctx.fill();
}

function streak(ctx: CanvasRenderingContext2D, len: number, fat: number, hi: string, mid: string): void {
  const g = ctx.createLinearGradient(-len, 0, len * 0.45, 0);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(0.4, mid);
  g.addColorStop(1, hi);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(0, 0, len, fat, 0, 0, Math.PI * 2);
  ctx.fill();
}

export function paintAura(
  ctx: CanvasRenderingContext2D, x: number, y: number, r: number, tick: number, hi: string, mid: string,
): void {
  const p = 0.72 + 0.28 * Math.sin(tick * 0.14);
  bloom(ctx, x, y, r * p, hi, mid);
  ctx.save();
  ctx.globalAlpha = 0.35 + 0.25 * p;
  ctx.strokeStyle = hi;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(x, y, r * 0.42 * p, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function shotAim(vx: number, vy: number): { dir: number; flip: boolean } {
  if (Math.abs(vx) >= Math.abs(vy)) return { dir: vx >= 0 ? 1 : 0, flip: false };
  return { dir: vy >= 0 ? 3 : 2, flip: false };
}

function blitShot(ctx: CanvasRenderingContext2D, gun: number, x: number, y: number, vx: number, vy: number): void {
  const aim = shotAim(vx, vy);
  blitAtlas(ctx, shotFrameId(gun, aim.dir), x, y, 1, aim.flip);
}

export function paintRivetBolt(ctx: CanvasRenderingContext2D, x: number, y: number, vx: number, vy: number): void {
  const ang = Math.atan2(vy, vx || 1);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.globalCompositeOperation = "lighter";
  ctx.strokeStyle = "rgba(255,180,48,0.55)";
  ctx.lineWidth = 3.2;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-11, 0);
  ctx.lineTo(14, 0);
  ctx.stroke();
  ctx.strokeStyle = "#ffd24a";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-8, 0);
  ctx.lineTo(16, 0);
  ctx.stroke();
  ctx.restore();
}

export function paintPellet(ctx: CanvasRenderingContext2D, x: number, y: number, vx: number, vy: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.atan2(vy, vx || 1));
  ctx.globalCompositeOperation = "lighter";
  streak(ctx, 12, 3.6, "#f4efe2", "rgba(200,180,140,0.7)");
  ctx.globalCompositeOperation = "source-over";
  blob(ctx, 0, 0, 3.6, 3.2, STEEL, 1);
  blob(ctx, 1.4, 0, 1.8, 1.6, BRASS, 0.6);
  ctx.restore();
}

export function paintFlameJet(ctx: CanvasRenderingContext2D, x: number, y: number, life: number, tick: number, j: number): void {
  const flick = (tick + j) & 1;
  const s = 7 + (life > 10 ? 4 : 0) + flick;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  bloom(ctx, x, y, s + 10, "#fff3c0", flick ? "rgba(255,210,120,0.85)" : "rgba(255,110,20,0.8)");
  ctx.restore();
  blob(ctx, x, y - 1, 3.4, 4.2, COPPER, 0);
  blob(ctx, x + 1, y + 1, 1.8, 2, EMBER, 0);
}

export function paintHarpoon(ctx: CanvasRenderingContext2D, x: number, y: number, vx: number, vy: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.atan2(vy, vx || 1));
  ctx.globalCompositeOperation = "lighter";
  streak(ctx, 22, 3.2, "#d8fbff", "rgba(80,180,220,0.55)");
  ctx.globalCompositeOperation = "source-over";
  pill(ctx, -4, 0, 22, 3.4, 0, STEEL, 1);
  ctx.beginPath();
  ctx.moveTo(12, 0);
  ctx.lineTo(5, -4.5);
  ctx.lineTo(5, 4.5);
  ctx.closePath();
  ctx.fillStyle = BRASS.hi;
  ctx.fill();
  ctx.restore();
}

export function paintBomb(ctx: CanvasRenderingContext2D, x: number, y: number, tick: number): void {
  bloom(ctx, x, y, 11, "rgba(255,160,40,0.35)", "rgba(255,80,10,0.15)");
  blob(ctx, x, y, 5.6, 5.2, { hi: "#6a6058", mid: "#3a342c", lo: "#1c1814", edge: "#0a0806" }, 1.4);
  pill(ctx, x, y, 8.5, 2.4, 0, BRASS, 1);
  bloom(ctx, x, y - 8, (tick >> 1) & 1 ? 8 : 5, "#fff3c0", "rgba(255,80,10,0.7)");
}

export function paintWeaponShot(
  ctx: CanvasRenderingContext2D, gun: number, x: number, y: number, vx: number, vy: number, life: number, tick: number, j: number,
): number {
  if (gun !== WPN_FLAME && gun !== WPN_HARP && gun !== WPN_MORT && gun !== WPN_SHOT) return 0;
  blitShot(ctx, gun, x, y, vx, vy);
  if (gun === WPN_FLAME && (((tick + j + life) >> 1) & 1)) blitAtlas(ctx, "flame-1", x, y, 1);
  return 1;
}

export const paintFlash: FxPaint = (ctx, x, y, age, a) => {
  if (age < 0 || age >= 10) return;
  const t = 1 - age / 10;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(a);
  ctx.globalAlpha = t;
  ctx.globalCompositeOperation = "lighter";
  bloom(ctx, 4, 0, 18 * t + 6, "#fff8e4", "rgba(255,140,40,0.9)");
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(22 * t + 8, -9 * t);
  ctx.lineTo(16 * t + 5, 0);
  ctx.lineTo(22 * t + 8, 9 * t);
  ctx.closePath();
  ctx.fillStyle = "#fff6d0";
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(2, -5 * t);
  ctx.lineTo(12 * t + 4, -14 * t);
  ctx.lineTo(10 * t, -2);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(2, 5 * t);
  ctx.lineTo(12 * t + 4, 14 * t);
  ctx.lineTo(10 * t, 2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
};

export const paintSpark: FxPaint = (ctx, x, y, age, a) => {
  if (age < 0 || age >= 14) return;
  const t = 1 - age / 14;
  const k = 4 + age * 2.1;
  const ca = Math.cos(a);
  const sa = Math.sin(a);
  ctx.save();
  ctx.globalAlpha = t;
  ctx.globalCompositeOperation = "lighter";
  bloom(ctx, x, y, 7 * t + 2, "#fff6d0", "rgba(255,140,40,0.55)");
  ctx.globalCompositeOperation = "source-over";
  blob(ctx, x + ca * k + sa * 2, y + sa * k - ca * 2, 2.4, 2.1, BRASS, 0);
  blob(ctx, x - sa * k * 0.7, y + ca * k * 0.7, 1.9, 1.7, COPPER, 0);
  blob(ctx, x + ca * k * 0.4, y + sa * k * 0.4, 1.5, 1.5, EMBER, 0);
  blob(ctx, x - ca * k * 0.5 + sa * 3, y - sa * k * 0.5 - ca * 3, 1.3, 1.2, STEEL, 0);
  ctx.restore();
};

let crowd = false;

export function markCrowdFx(on: boolean): void {
  crowd = on;
}

export function puffDrawsCorpse(age: number, kind: number): boolean {
  if (crowd) return false;
  if ((kind & Z_KIND) === Z_GAS) return false;
  return age >= 0 && age < 12;
}

export const paintPuff: FxPaint = (ctx, x, y, age, raw) => {
  if (age < 0 || age >= 22) return;
  const kind = raw & Z_KIND;
  const gas = kind === Z_GAS;
  if (puffDrawsCorpse(age, kind)) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - age / 14);
    paintZombie(ctx, x, y + age * 0.8, kind, (raw & Z_ELITE) !== 0, age, 1);
    ctx.restore();
  }
  const s = (gas ? 18 : 13) + age * (gas ? 2 : 1.35);
  ctx.save();
  ctx.globalAlpha = Math.max(0, (gas ? 0.9 : 0.78) - age / 28);
  if (gas) {
    blob(ctx, x, y - age * 0.5, s * 0.58, s * 0.42, ACID, 0);
    blob(ctx, x - s * 0.18, y - age * 0.75, s * 0.3, s * 0.22, { hi: "#f4ffc4", mid: "#c6f27a", lo: "#7fbf32", edge: "#3d7a16" }, 0);
    bloom(ctx, x, y - age * 0.3, s * 0.7, "rgba(200,255,120,0.45)", "rgba(80,160,30,0)");
    ctx.restore();
    return;
  }
  bloom(ctx, x, y - age * 0.45, s, "rgba(230,236,240,0.9)", "rgba(230,236,240,0)");
  blob(ctx, x + 4, y - age * 0.2, 2.2, 1.8, COPPER, 0);
  blob(ctx, x - 5, y - age * 0.35, 1.8, 1.6, STEAM, 0);
  if (kind === Z_KNIGHT) {
    ctx.save();
    ctx.translate(x + age * 0.9, y - age * 0.7);
    ctx.rotate(age * 0.32);
    cog(ctx, 0, 0, 5.5, age * 0.4, BRASS, 6, false);
    ctx.restore();
    ctx.save();
    ctx.translate(x - age * 0.8, y - age * 0.35);
    ctx.rotate(-age * 0.28);
    pill(ctx, 0, 0, 9, 11, 0.4, STEEL, 1);
    ctx.restore();
    ctx.save();
    ctx.translate(x + age * 0.2, y - age * 1.1);
    ctx.rotate(age * 0.18);
    pill(ctx, 0, 0, 6, 5, 0.3, BRASS, 1);
    ctx.restore();
  }
  ctx.restore();
};

export const paintXp: FxPaint = (ctx, x, y, age, a) => {
  if (age < 0 || age >= 24) return;
  const n = Math.max(1, a | 0);
  ctx.save();
  ctx.globalAlpha = 1 - age / 24;
  bloom(ctx, x - 4, y - age, 10, "rgba(255,214,90,0.55)", "rgba(255,214,90,0)");
  cog(ctx, x - 6, y - age, 4.4, age * 0.22, BRASS, 6, true);
  ctx.font = font(9, 800);
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#1c120c";
  ctx.strokeText(`${n} XP`, x + 2, y - age);
  ctx.fillStyle = "#ffe08a";
  ctx.fillText(`${n} XP`, x + 2, y - age);
  ctx.restore();
};

export const paintBoom: FxPaint = (ctx, x, y, age, a) => {
  if (age < 0 || age > 18) return;
  const r = a * (0.3 + age / 18);
  const t = Math.max(0, 1 - age / 18);
  ctx.save();
  ctx.globalAlpha = t;
  ctx.globalCompositeOperation = "lighter";
  bloom(ctx, x, y, Math.max(6, r), "#fff3c0", "rgba(255,90,16,0.85)");
  ctx.globalCompositeOperation = "source-over";
  ctx.strokeStyle = age < 4 ? "#fff3c0" : "#ff9a24";
  ctx.lineWidth = age < 4 ? 5 : 2.2;
  ctx.beginPath();
  ctx.arc(x, y, Math.max(3, r * 0.92), 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = t * 0.75;
  ctx.beginPath();
  ctx.ellipse(x, y - 6, r * 0.58, r * 0.3, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#d8e4ea";
  ctx.fill();
  ctx.globalAlpha = t;
  blob(ctx, x + r * 0.45, y - r * 0.2, 2.4, 2, COPPER, 0);
  blob(ctx, x - r * 0.35, y + r * 0.15, 2, 1.8, BRASS, 0);
  blob(ctx, x + r * 0.1, y - r * 0.4, 1.6, 1.5, STEEL, 0);
  ctx.restore();
};

let levelAt = -999;

export function paintLevelBurst(ctx: CanvasRenderingContext2D, w: World): void {
  if ((w.events[EV_LEVEL] ?? 0) !== 0) levelAt = w.tick;
  const age = w.tick - levelAt;
  if (age < 0 || age > 26) return;
  const t = 1 - age / 26;
  const x = w.px;
  const y = w.py - 28;
  ctx.save();
  ctx.globalAlpha = t;
  ctx.globalCompositeOperation = "lighter";
  bloom(ctx, x, y, 28 + age * 3.2, "#fff6d0", "rgba(255,170,40,0.55)");
  ctx.strokeStyle = "#ffe08a";
  ctx.lineWidth = 3.4;
  ctx.beginPath();
  ctx.arc(x, y, 14 + age * 4.6, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = "#ff9a24";
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(x, y, 8 + age * 2.8, 0, Math.PI * 2);
  ctx.stroke();
  for (let i = 0; i < 8; i++) {
    const ang = i * 0.785 + age * 0.08;
    const r0 = 6 + age;
    const r1 = 22 + age * 2.4;
    ctx.strokeStyle = i & 1 ? "#fff6d0" : "#ffb040";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(ang) * r0, y + Math.sin(ang) * r0);
    ctx.lineTo(x + Math.cos(ang) * r1, y + Math.sin(ang) * r1);
    ctx.stroke();
  }
  ctx.globalCompositeOperation = "source-over";
  cog(ctx, x - 20 - age, y - 12, 6.5, age * 0.32, BRASS, 8, true);
  cog(ctx, x + 18 + age, y + 8, 5.5, -age * 0.3, COPPER, 7, true);
  cog(ctx, x + 4, y - 22 - age * 0.6, 4.2, age * 0.2, BRASS, 6, true);
  ctx.restore();
}
