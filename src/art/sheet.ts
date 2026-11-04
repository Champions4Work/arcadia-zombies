import { PACK } from "./packed/pack";
import actorsUrl from "./packed/actors.webp";
import hudUrl from "./packed/hud.webp";
import worldUrl from "./packed/world.webp";
import metalUrl from "./packed/tile_metal_seamless.webp";
import stoneUrl from "./packed/tile_stone_seamless.webp";

const URLS: Record<string, string> = {
  "actors": actorsUrl,
  "hud": hudUrl,
  "world": worldUrl,
  "tile_stone_seamless": stoneUrl,
  "tile_metal_seamless": metalUrl,
};

const images = new Map<string, HTMLImageElement>();
const patterns = new Map<string, CanvasPattern>();
let loaded = 0;
let wanted = 0;

export type PackSprite = (typeof PACK)["sprites"][keyof (typeof PACK)["sprites"]];

export function packIds(): string[] {
  return Object.keys(PACK["sprites"]);
}

export function packHas(id: string): boolean {
  return id in PACK["sprites"];
}

export function spriteOf(id: string): PackSprite | undefined {
  return PACK["sprites"][id as keyof typeof PACK["sprites"]];
}

export function sheetsReady(): boolean {
  return wanted > 0 && loaded >= wanted;
}

function attach(name: string, url: string): void {
  if (typeof Image === "undefined") return;
  wanted++;
  const img = new Image();
  img.decoding = "async";
  img.onload = () => {
    loaded++;
    images.set(name, img);
  };
  img.onerror = () => {
    loaded++;
  };
  img.src = url;
  images.set(name, img);
}

export function bootSheets(): void {
  if (wanted) return;
  for (const [name, url] of Object.entries(URLS)) attach(name, url);
}

bootSheets();

function sheetImage(name: string): HTMLImageElement | undefined {
  const img = images.get(name);
  if (!img || !img.complete || img.naturalWidth < 1) return undefined;
  return img;
}

function packed(spr: PackSprite): HTMLImageElement | undefined {
  return sheetImage(spr["sheet"]);
}

export function blitSheet(
  ctx: CanvasRenderingContext2D,
  id: string,
  x: number,
  y: number,
  flip = false,
): void {
  const spr = spriteOf(id);
  const img = spr ? packed(spr) : undefined;
  if (!spr || !img) return;
  const sx = spr["x"];
  const sy = spr["y"];
  const sw = spr["w"];
  const sh = spr["h"];
  const ax = spr["ax"];
  const ay = spr["ay"];
  const dx = Math.round(x - ax);
  const dy = Math.round(y - ay);
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  if (flip) {
    ctx.translate(Math.round(x + ax), dy);
    ctx.scale(-1, 1);
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
  } else {
    ctx.drawImage(img, sx, sy, sw, sh, dx, dy, sw, sh);
  }
  ctx.restore();
}

export function blitSheetLean(
  ctx: CanvasRenderingContext2D,
  id: string,
  x: number,
  y: number,
  flip: boolean,
  bob: number,
  lean: number,
): void {
  const spr = spriteOf(id);
  const img = spr ? packed(spr) : undefined;
  if (!spr || !img) return;
  const sx = spr["x"];
  const sy = spr["y"];
  const sw = spr["w"];
  const sh = spr["h"];
  const ax = spr["ax"];
  const ay = spr["ay"];
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.translate(Math.round(x), Math.round(y - bob));
  ctx.transform(1, 0, lean, 1, 0, 0);
  if (flip) ctx.scale(-1, 1);
  ctx.drawImage(img, sx, sy, sw, sh, -ax, -ay, sw, sh);
  ctx.restore();
}

export function blitSheetFit(
  ctx: CanvasRenderingContext2D,
  id: string,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  const spr = spriteOf(id);
  const img = spr ? packed(spr) : undefined;
  if (!spr || !img || w <= 0 || h <= 0) return;
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, spr["x"], spr["y"], spr["w"], spr["h"], x, y, w, h);
  ctx.restore();
}

export function tileSheet(
  ctx: CanvasRenderingContext2D,
  id: string,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  const spr = spriteOf(id);
  const img = spr ? packed(spr) : undefined;
  if (!spr || !img || w <= 0 || h <= 0) return;
  let pat = patterns.get(id);
  if (!pat) {
    const made = ctx.createPattern(img, "repeat");
    if (!made) return;
    pat = made;
    patterns.set(id, pat);
  }
  ctx.save();
  ctx.fillStyle = pat;
  ctx.translate(x, y);
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

export function steamFrame(tick: number): string {
  return (`steam_${1 + ((tick >> 3) & 3)}` as const);
}

export function heroSpriteId(moving: boolean, tick: number): string {
  if (!moving) return "hero_idle";
  return `hero_walk_${1 + ((tick >> 3) & 3)}`;
}

export function foeSpriteId(kind: number, elite: boolean): string {
  if (kind === 2) return "brute";
  if (elite) return "zombie_bloater";
  if (kind === 1 || kind === 6) return "zombie_crawler";
  if (kind === 3 || kind === 4) return "zombie_tubes";
  return "zombie_worker";
}
