import {
  CHAR_ALCHEMIST, CHAR_BRUTE, CHAR_GUNSLINGER, CHAR_TINKER,
} from "../sim/characters";
import {
  blob, boiler, BRASS, cog, COPPER, dome, eye, goggles, pill, plate, rivet, SKIN, stack, type Metal,
} from "./paint";
import { FRAME_N, motionOf, POSE_ATK, POSE_N, type Motion } from "./poses";

export const HERO_W = 66;
export const HERO_H = 84;

export const HAT_DOME = 0;
export const HAT_BRIM = 1;
export const HAT_TALL = 2;
export const HAT_HELM = 3;

export interface HeroKit {
  id: number;
  hat: number;
  coat: Metal;
  boot: Metal;
  glow: Metal;
  fat: number;
}

const DUSTER: Metal = { hi: "#d49258", mid: "#8a4a24", lo: "#4a2410", edge: "#1c0c08" };
const MINT: Metal = { hi: "#d8f0c8", mid: "#6aa060", lo: "#2e5a28", edge: "#122410" };
const IRON: Metal = { hi: "#d8dee4", mid: "#6a727c", lo: "#2c3238", edge: "#101418" };
const RUST: Metal = { hi: "#e09060", mid: "#8a3e22", lo: "#4a2014", edge: "#1c0c08" };

const TINKER_KIT: HeroKit = { id: CHAR_TINKER, hat: HAT_DOME, coat: BRASS, boot: COPPER, glow: BRASS, fat: 1 };

export const HERO_KITS: readonly HeroKit[] = [
  TINKER_KIT,
  { id: CHAR_GUNSLINGER, hat: HAT_BRIM, coat: DUSTER, boot: RUST, glow: COPPER, fat: 0.86 },
  { id: CHAR_ALCHEMIST, hat: HAT_TALL, coat: MINT, boot: BRASS, glow: { hi: "#e8ffb0", mid: "#7ad046", lo: "#2e6a14", edge: "#123008" }, fat: 0.9 },
  { id: CHAR_BRUTE, hat: HAT_HELM, coat: IRON, boot: COPPER, glow: RUST, fat: 1.38 },
];

export function heroKit(id: number): HeroKit {
  return HERO_KITS[id] ?? TINKER_KIT;
}

function legs(ctx: CanvasRenderingContext2D, m: Motion, kit: HeroKit): void {
  const fat = kit.fat;
  const lean = m.lean;
  pill(ctx, -7.2 * fat + lean * 4, -16 + m.bob + m.drop, 8.2 * Math.min(fat, 1.15), 16, m.swing * 0.85, kit.coat);
  pill(ctx, 7.2 * fat + lean * 4, -16 + m.bob + m.drop, 8.2 * Math.min(fat, 1.15), 16, -m.swing * 0.85, kit.coat);
  pill(ctx, -7.4 * fat + lean * 4, -6 + m.drop, 10.5 * Math.min(fat, 1.2), 6.8, 0.05, kit.boot, 1.8);
  pill(ctx, 7.4 * fat + lean * 4, -6 + m.drop, 10.5 * Math.min(fat, 1.2), 6.8, -0.05, kit.boot, 1.8);
}

function torso(ctx: CanvasRenderingContext2D, m: Motion, kit: HeroKit, frame: number): void {
  const y = -34 + m.bob + m.drop;
  const fat = kit.fat;
  plate(ctx, m.lean * 6, y, 28 * fat, 22, 0, kit.coat, 2.4);
  rivet(ctx, -9 * fat + m.lean * 6, y - 7, 1.35);
  rivet(ctx, 9 * fat + m.lean * 6, y - 7, 1.35);
  rivet(ctx, -9 * fat + m.lean * 6, y + 7, 1.35);
  rivet(ctx, 9 * fat + m.lean * 6, y + 7, 1.35);
  boiler(ctx, m.lean * 6, y + 1, 6.4 * Math.min(fat, 1.15), 6.8, (frame & 1) ? 1 : 0.3);
  plate(ctx, m.lean * 6, y + 9, 16 * fat, 4.2, 0, kit.glow, 1.3);
}

function tinkerHat(ctx: CanvasRenderingContext2D, m: Motion, frame: number): void {
  const y = -52 + m.bob + m.drop;
  dome(ctx, m.lean * 5, y, 11.2);
  goggles(ctx, m.lean * 5, y + 1.2, 3.6);
  stack(ctx, m.lean * 5, y - 14, 7, frame & 1 ? 1 : 0.4);
  cog(ctx, -16 + m.lean * 3, y + 6, 7.4, frame * 0.4, BRASS, 8, true);
}

function gunHat(ctx: CanvasRenderingContext2D, m: Motion): void {
  const y = -54 + m.bob + m.drop;
  blob(ctx, m.lean * 5, y + 6, 8.4, 7.6, SKIN, 1.6);
  eye(ctx, m.lean * 5 - 2.6, y + 5.4, 1.7, 0.42);
  eye(ctx, m.lean * 5 + 2.8, y + 5.4, 1.7, 0.42);
  plate(ctx, m.lean * 5, y - 2, 22, 5.2, 0, DUSTER, 1.6);
  plate(ctx, m.lean * 5, y - 8, 12, 8, 0, DUSTER, 1.6);
  plate(ctx, m.lean * 5, y - 4, 20, 2.2, 0, BRASS, 1.1);
}

function alchHat(ctx: CanvasRenderingContext2D, m: Motion, frame: number): void {
  const y = -52 + m.bob + m.drop;
  blob(ctx, m.lean * 5, y + 5, 8, 7.2, SKIN, 1.5);
  goggles(ctx, m.lean * 5, y + 4.2, 3.2, "rgba(180,255,140,0.8)");
  plate(ctx, m.lean * 5, y - 2, 16, 5, 0, BRASS, 1.4);
  ctx.save();
  ctx.translate(m.lean * 5, y - 16);
  ctx.beginPath();
  ctx.moveTo(-7, 10);
  ctx.lineTo(0, -16);
  ctx.lineTo(7, 10);
  ctx.closePath();
  ctx.fillStyle = "#2e5a28";
  ctx.fill();
  ctx.lineWidth = 1.8;
  ctx.strokeStyle = "#1c120c";
  ctx.stroke();
  ctx.restore();
  blob(ctx, 14 + m.lean * 4, -28 + m.bob + m.drop, 4.2, 5.4, { hi: "#e8ffb0", mid: "#7ad046", lo: "#2e6a14", edge: "#123008" }, 1.4);
  ctx.beginPath();
  ctx.arc(14 + m.lean * 4, -30 + m.bob + m.drop - (frame & 1 ? 1 : 0), 1.4, 0, Math.PI * 2);
  ctx.fillStyle = frame & 1 ? "#f4ffd0" : "#9ae046";
  ctx.fill();
}

function bruteHat(ctx: CanvasRenderingContext2D, m: Motion, frame: number): void {
  const y = -50 + m.bob + m.drop;
  blob(ctx, m.lean * 4, y + 4, 8.6, 7, SKIN, 1.5);
  plate(ctx, m.lean * 4, y - 2, 20, 12, 0, IRON, 2);
  cog(ctx, m.lean * 4, y - 8, 7.2, frame * 0.2, BRASS, 8, true);
  goggles(ctx, m.lean * 4, y + 2, 3.4, "rgba(255,160,60,0.75)");
  rivet(ctx, -8 + m.lean * 4, y - 4, 1.3);
  rivet(ctx, 8 + m.lean * 4, y - 4, 1.3);
}

function arms(ctx: CanvasRenderingContext2D, m: Motion, kit: HeroKit, pose: number): void {
  const y = -30 + m.bob + m.drop;
  const fat = kit.fat;
  const atk = pose === POSE_ATK ? 0.7 : 0;
  pill(ctx, -14 * fat + m.lean * 3, y, 7, 13, 0.65 + m.swing * 0.2, kit.coat, 1.8);
  pill(ctx, 13 * fat + m.lean * 8, y - atk * 4, 7, 13, -0.35 - m.swing * 0.25 - atk, kit.coat, 1.8);
  blob(ctx, -16 * fat + m.lean * 3, y + 6, 3.4, 3.1, kit.boot, 1.3);
  blob(ctx, 16 * fat + m.lean * 8, y + 4 - atk * 6, 3.4, 3.1, kit.boot, 1.3);
}

export function drawHeroKit(ctx: CanvasRenderingContext2D, frame: number, pose: number, id: number): void {
  const kit = heroKit(id);
  const m = motionOf(pose, frame);
  ctx.save();
  ctx.scale(1, m.squash);
  legs(ctx, m, kit);
  if (kit.hat === HAT_BRIM) {
    plate(ctx, m.lean * 4, -38 + m.bob + m.drop, 10, 16, 0.15, kit.glow, 1.4);
    for (let i = -2; i <= 2; i++) rivet(ctx, i * 3.2 + m.lean * 4, -42 + m.bob + m.drop, 0.9);
  }
  torso(ctx, m, kit, frame);
  arms(ctx, m, kit, pose);
  if (kit.hat === HAT_DOME) tinkerHat(ctx, m, frame);
  else if (kit.hat === HAT_BRIM) gunHat(ctx, m);
  else if (kit.hat === HAT_TALL) alchHat(ctx, m, frame);
  else bruteHat(ctx, m, frame);
  if (kit.hat === HAT_HELM) {
    blob(ctx, -16 * kit.fat, -20 + m.bob + m.drop, 5.4, 5, COPPER, 1.8);
    blob(ctx, 16 * kit.fat + m.lean * 6, -18 + m.bob + m.drop + m.swing * 3, 5.6, 5.2, COPPER, 1.8);
  }
  ctx.restore();
}

export function drawHeroPortrait(ctx: CanvasRenderingContext2D, id: number): void {
  ctx.save();
  ctx.translate(HERO_W / 2, HERO_H - 4);
  drawHeroKit(ctx, 0, 0, id);
  ctx.restore();
}

export function heroCellCount(): number {
  return POSE_N * FRAME_N;
}
