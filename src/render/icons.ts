import { blitAtlas } from "../art/atlas";
import { BRASS_HI, COPPER as TONE_COPPER, STEAM_DIM, XP } from "../shell/theme";
import { isUnion, unionHint, unionSpec } from "../sim/evolve";
import { UPG_RARITY } from "../sim/progress";
import { UPG_COUNT } from "../sim/types";

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

const ATLAS = [
  "icon-rivet",
  "icon-bolt",
  "icon-fan",
  "icon-saw",
  "icon-fire",
  "icon-heart",
  "icon-boot",
  "icon-shield",
  "icon-spike",
  "icon-spike",
  "icon-heart",
  "icon-bomb",
  "icon-horn",
  "icon-gear",
  "icon-gear",
  "icon-bolt",
  "icon-bomb",
] as const;

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

export function atlasHas(id: number): boolean {
  return iconIndex(id) >= 0;
}

export function iconFrame(id: number): string {
  if (id < 0 || id >= UPG_COUNT) return "icon-gear";
  if (isUnion(id)) return "icon-crown";
  return ATLAS[KIND[id] ?? 0] ?? "icon-gear";
}

export function drawIcon(ctx: CanvasRenderingContext2D, id: number, x: number, y: number, s = 12): void {
  const scale = s >= 16 ? 2 : 1;
  blitAtlas(ctx, iconFrame(id), x - 8 * scale, y - 8 * scale, scale);
}
