import { BRASS_HI, COPPER as TONE_COPPER, STEAM_DIM, XP } from "../shell/theme";
import { isUnion, unionHint, unionSpec } from "../sim/evolve";
import { UPG_RARITY } from "../sim/progress";
import { UPG_COUNT } from "../sim/types";
import { BRASS, cog, COPPER, flame, heart, lit, OUTLINE, STEEL } from "./paint";

export const ICON_CELL = 32;
export const ICON_COLS = 8;
export const ICON_ROWS = 4;
export const FALLBACK_BLURB = "A new gear for the boiler heart.";

const BLURB: readonly string[] = [
  "Chain a spark through nearby foes.",
  "Extra pellets in a wide fan.",
  "Orbiting saws chew the horde.",
  "Increase fire rate and burn nearby foes.",
  "Heavier rivets hit harder.",
  "A bigger boiler heart.",
  "Quicker strides across the yard.",
  "A steam burst shoves the nearest foes.",
  "Shots punch through the line.",
  "A brass shell soaks a hit.",
  "Thorns bite anything that touches the suit.",
  "The boiler heart mends between the heat.",
  "A lobbed shell bursts on the farthest foe.",
  "A shriek that slows the closest dead.",
  "Bolts bounce off the yard walls.",
  "Kills wind the boiler for the next shot.",
  "Tesla and saws fuse into a storm.",
  "Shotgun and pierce become a cannon.",
  "Shield and vent lock into an aegis.",
  "Crown lightning chains farther and strikes harder.",
  "A gatling of heavy slugs that bounce and pierce.",
  "A wider halo of hotter buzzsaws.",
  "The boiler pulse reaches farther and mends brass.",
  "A spiked aegis with two extra charges.",
  "Three siege shells, faster and heavier.",
  "Calliope steam slows a wider ring and scalds it.",
  "Brass bolts from the rivet gun.",
  "A close cone of steam pellets.",
  "A boiler jet of flame.",
  "A harpoon that pierces the line.",
  "A lobbed bomb with an area blast.",
];

const KIND = new Uint8Array([
  1, 2, 3, 4, 0, 5, 6, 4, 8, 7, 9, 10, 11, 12, 13, 14,
  15, 16, 7, 1, 2, 3, 5, 7, 11, 12, 0, 2, 4, 8, 11,
]);

export function iconIndex(id: number): number {
  if (id < 0 || id >= UPG_COUNT) return -1;
  return id;
}

export function iconCell(id: number): { col: number; row: number; x: number; y: number } {
  const i = iconIndex(id);
  if (i < 0) return { col: 0, row: 0, x: 0, y: 0 };
  const col = i % ICON_COLS;
  const row = (i / ICON_COLS) | 0;
  return { col, row, x: col * ICON_CELL, y: row * ICON_CELL };
}

export function blurbFor(id: number): string {
  if (isUnion(id)) {
    const spec = unionSpec(id);
    if (spec) return `${unionHint(id)}. ${spec.effect}`;
  }
  return BLURB[id] ?? FALLBACK_BLURB;
}

export function rarityTint(id: number): string {
  if (isUnion(id)) return XP;
  const rarity = UPG_RARITY[id] ?? 0;
  if (rarity >= 2) return TONE_COPPER;
  if (rarity === 1) return BRASS_HI;
  return STEAM_DIM;
}

function bolt(ctx: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  ctx.beginPath();
  ctx.moveTo(x - s * 0.15, y - s);
  ctx.lineTo(x + s * 0.35, y - s * 0.1);
  ctx.lineTo(x + s * 0.05, y - s * 0.05);
  ctx.lineTo(x + s * 0.2, y + s);
  ctx.lineTo(x - s * 0.35, y + s * 0.05);
  ctx.lineTo(x - s * 0.02, y);
  ctx.closePath();
  ctx.fillStyle = "#ffe14a";
  ctx.fill();
  ctx.lineWidth = 1.4;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
}

function pellets(ctx: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  for (let i = 0; i < 5; i++) {
    const a = -0.7 + i * 0.35;
    ctx.beginPath();
    ctx.arc(x + Math.cos(a) * s * 0.55, y + Math.sin(a) * s * 0.2, s * 0.18, 0, Math.PI * 2);
    ctx.fillStyle = STEEL.hi;
    ctx.fill();
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();
  }
}

function flameIcon(ctx: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  flame(ctx, x, y, s);
  const g = ctx.createLinearGradient(x, y - s, x, y + s);
  g.addColorStop(0, "#fff4c0");
  g.addColorStop(0.45, "#ff9a22");
  g.addColorStop(1, "#e04010");
  ctx.fillStyle = g;
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
}

function shieldIcon(ctx: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  ctx.beginPath();
  ctx.moveTo(x, y - s);
  ctx.lineTo(x + s * 0.85, y - s * 0.55);
  ctx.lineTo(x + s * 0.7, y + s * 0.35);
  ctx.quadraticCurveTo(x, y + s * 1.05, x - s * 0.7, y + s * 0.35);
  ctx.lineTo(x - s * 0.85, y - s * 0.55);
  ctx.closePath();
  ctx.fillStyle = lit(ctx, x - s, y - s, s * 2, s * 2, BRASS);
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
}

function arrow(ctx: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  ctx.beginPath();
  ctx.moveTo(x - s, y);
  ctx.lineTo(x + s * 0.15, y);
  ctx.moveTo(x, y - s * 0.5);
  ctx.lineTo(x + s, y);
  ctx.lineTo(x, y + s * 0.5);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.lineWidth = 4.4;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  ctx.lineWidth = 2.2;
  ctx.strokeStyle = "#ffe7ad";
  ctx.stroke();
}

function chevrons(ctx: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  ctx.lineWidth = 2.2;
  ctx.strokeStyle = "#ffe7ad";
  ctx.lineJoin = "round";
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(x - s * 0.45, y - s * 0.4 + i * s * 0.35);
    ctx.lineTo(x + s * 0.15, y + i * s * 0.35);
    ctx.lineTo(x - s * 0.45, y + s * 0.4 + i * s * 0.35);
    ctx.stroke();
  }
}

function thorn(ctx: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  ctx.beginPath();
  ctx.moveTo(x, y - s);
  ctx.lineTo(x + s * 0.35, y + s * 0.2);
  ctx.lineTo(x, y);
  ctx.lineTo(x - s * 0.35, y + s * 0.2);
  ctx.closePath();
  ctx.fillStyle = COPPER.mid;
  ctx.fill();
  ctx.lineWidth = 1.3;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
}

function drop(ctx: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  ctx.beginPath();
  ctx.moveTo(x, y - s);
  ctx.quadraticCurveTo(x + s * 0.7, y, x, y + s * 0.7);
  ctx.quadraticCurveTo(x - s * 0.7, y, x, y - s);
  ctx.fillStyle = "#3ec4e4";
  ctx.fill();
  ctx.lineWidth = 1.3;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
}

function bomb(ctx: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  ctx.beginPath();
  ctx.arc(x, y + s * 0.1, s * 0.7, 0, Math.PI * 2);
  ctx.fillStyle = STEEL.mid;
  ctx.fill();
  ctx.lineWidth = 1.3;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  ctx.fillStyle = COPPER.mid;
  ctx.fillRect(x - 2, y - s * 0.7, 4, s * 0.4);
}

function note(ctx: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  ctx.fillStyle = "#ffe7ad";
  ctx.fillRect(x - s * 0.15, y - s * 0.7, s * 0.22, s * 1.2);
  ctx.beginPath();
  ctx.ellipse(x - s * 0.28, y + s * 0.5, s * 0.38, s * 0.26, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
}

function bounce(ctx: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  ctx.strokeStyle = BRASS_HI;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(x - s, y + s * 0.2);
  ctx.lineTo(x - s * 0.1, y - s * 0.4);
  ctx.lineTo(x + s * 0.2, y + s * 0.15);
  ctx.lineTo(x + s, y - s * 0.5);
  ctx.stroke();
}

function coil(ctx: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  cog(ctx, x, y, s * 0.7, 0.2, BRASS, 8, true);
  bolt(ctx, x, y, s * 0.45);
}

function cannon(ctx: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  ctx.fillStyle = STEEL.mid;
  ctx.fillRect(x - s, y - s * 0.28, s * 1.6, s * 0.56);
  ctx.beginPath();
  ctx.arc(x + s * 0.7, y, s * 0.38, 0, Math.PI * 2);
  ctx.fillStyle = COPPER.mid;
  ctx.fill();
  ctx.lineWidth = 1.3;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
}

function stamp(ctx: CanvasRenderingContext2D, id: number, x: number, y: number, s: number): void {
  const k = KIND[id] ?? 0;
  if (k === 1) bolt(ctx, x, y, s);
  else if (k === 2) pellets(ctx, x, y, s);
  else if (k === 3) cog(ctx, x, y, s, 0.2, STEEL, 8, true);
  else if (k === 4) flameIcon(ctx, x, y + s * 0.2, s);
  else if (k === 5) {
    heart(ctx, x, y + s * 0.1, s * 0.85);
    ctx.fillStyle = "#ff4450";
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();
  } else if (k === 6) chevrons(ctx, x, y, s);
  else if (k === 7) shieldIcon(ctx, x, y, s);
  else if (k === 8) arrow(ctx, x, y, s);
  else if (k === 9) thorn(ctx, x, y, s);
  else if (k === 10) drop(ctx, x, y, s);
  else if (k === 11) bomb(ctx, x, y, s);
  else if (k === 12) note(ctx, x, y, s);
  else if (k === 13) bounce(ctx, x, y, s);
  else if (k === 14) cog(ctx, x, y, s, 0.4, COPPER, 10, true);
  else if (k === 15) coil(ctx, x, y, s);
  else if (k === 16) cannon(ctx, x, y, s);
  else cog(ctx, x, y, s, 0.1, BRASS, 8, true);
}

export function atlasHas(id: number): boolean {
  return iconIndex(id) >= 0;
}

export function drawIcon(ctx: CanvasRenderingContext2D, id: number, x: number, y: number, s = 12): void {
  ctx.save();
  if (id < 0 || id >= UPG_COUNT) {
    cog(ctx, x, y, s, 0.1, BRASS, 8, true);
    ctx.restore();
    return;
  }
  stamp(ctx, id, x, y, s);
  ctx.restore();
}
