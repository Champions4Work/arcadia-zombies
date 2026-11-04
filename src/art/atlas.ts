import { catalogHits, FRAMES } from "./catalog";
import { decodeRgba, type PxFrame } from "./px";

export interface AtlasRect {
  x: number;
  y: number;
  w: number;
  h: number;
  ox: number;
  oy: number;
}

export interface AtlasSprite {
  pix: Uint32Array;
  w: number;
  h: number;
  ox: number;
  oy: number;
}

const probe = new Uint8Array(4);
const endian = new Uint32Array(probe.buffer);
endian[0] = 0x01020304;
const little = probe[0] === 4;

export function packRgba(r: number, g: number, b: number, a = 255): number {
  if (little) return ((a << 24) | (b << 16) | (g << 8) | r) >>> 0;
  return ((r << 24) | (g << 16) | (b << 8) | a) >>> 0;
}

function packFrame(src: PxFrame): { pix: Uint32Array; w: number; h: number } {
  const h = src.rows.length;
  const w = src.rows[0]?.length ?? 0;
  const pix = new Uint32Array(w * h);
  for (let y = 0; y < h; y++) {
    const row = src.rows[y] ?? "";
    for (let x = 0; x < w; x++) {
      const [r, g, b, a] = decodeRgba(row[x] ?? ".");
      if (a === 0) continue;
      pix[y * w + x] = packRgba(r, g, b, a);
    }
  }
  return { pix, w, h };
}

const rects = new Map<string, AtlasRect>();
const sprites = new Map<string, AtlasSprite>();
let atlasW = 0;
let atlasH = 0;
let atlasPix = new Uint32Array(1);
let atlasCanvas: HTMLCanvasElement | OffscreenCanvas | null = null;
let ready = false;

function shelfPack(): void {
  const hits = catalogHits();
  if (hits.length) {
    atlasW = 1;
    atlasH = 1;
    atlasPix = new Uint32Array(1);
    return;
  }
  const items = FRAMES.map((src) => ({ src, ...packFrame(src) }));
  items.sort((a, b) => b.h - a.h || b.w - a.w);
  const maxW = 512;
  let x = 0;
  let y = 0;
  let rowH = 0;
  let usedW = 0;
  for (const item of items) {
    if (x + item.w > maxW) {
      x = 0;
      y += rowH;
      rowH = 0;
    }
    rects.set(item.src.id, {
      x, y, w: item.w, h: item.h, ox: item.src.ox, oy: item.src.oy,
    });
    sprites.set(item.src.id, {
      pix: item.pix, w: item.w, h: item.h, ox: item.src.ox, oy: item.src.oy,
    });
    x += item.w;
    if (x > usedW) usedW = x;
    if (item.h > rowH) rowH = item.h;
  }
  atlasW = Math.max(1, usedW);
  atlasH = Math.max(1, y + rowH);
  atlasPix = new Uint32Array(atlasW * atlasH);
  for (const item of items) {
    const rec = rects.get(item.src.id);
    if (!rec) continue;
    for (let yy = 0; yy < item.h; yy++) {
      const dest = (rec.y + yy) * atlasW + rec.x;
      const src = yy * item.w;
      atlasPix.set(item.pix.subarray(src, src + item.w), dest);
    }
  }
}

function paintAtlas(): HTMLCanvasElement | OffscreenCanvas | null {
  try {
    const canOff = typeof OffscreenCanvas === "function";
    const canDoc = typeof document !== "undefined";
    if (!canOff && !canDoc) return null;
    const c = canOff
      ? new OffscreenCanvas(atlasW, atlasH)
      : Object.assign(document.createElement("canvas"), { width: atlasW, height: atlasH });
    const ctx = c.getContext("2d");
    if (!ctx) return c;
    const img = ctx.createImageData(atlasW, atlasH);
    const bytes = new Uint8ClampedArray(atlasPix.buffer, atlasPix.byteOffset, atlasPix.byteLength);
    img.data.set(bytes);
    ctx.putImageData(img, 0, 0);
    return c;
  } catch {
    return null;
  }
}

export function buildAtlas(): void {
  if (ready) return;
  shelfPack();
  atlasCanvas = paintAtlas();
  ready = true;
}

export function atlasSize(): { w: number; h: number } {
  buildAtlas();
  return { w: atlasW, h: atlasH };
}

export function atlasRect(id: string): AtlasRect | undefined {
  buildAtlas();
  return rects.get(id);
}

export function atlasSprite(id: string): AtlasSprite {
  buildAtlas();
  return sprites.get(id) ?? { pix: new Uint32Array(1), w: 1, h: 1, ox: 0, oy: 0 };
}

export function blitAtlas(
  ctx: CanvasRenderingContext2D,
  id: string,
  x: number,
  y: number,
  scale = 1,
  flip = false,
): void {
  buildAtlas();
  const rec = rects.get(id);
  const sheet = atlasCanvas;
  if (!rec || !sheet) return;
  const s = Math.max(1, scale | 0);
  const dx = Math.round(x - rec.ox * s);
  const dy = Math.round(y - rec.oy * s);
  ctx.imageSmoothingEnabled = false;
  ctx.save();
  if (flip) {
    ctx.translate(dx + rec.w * s, dy);
    ctx.scale(-1, 1);
    ctx.drawImage(sheet, rec.x, rec.y, rec.w, rec.h, 0, 0, rec.w * s, rec.h * s);
  } else {
    ctx.drawImage(sheet, rec.x, rec.y, rec.w, rec.h, dx, dy, rec.w * s, rec.h * s);
  }
  ctx.restore();
}

export function heroFrameId(kit: number, pose: number, frame: number): string {
  const names = ["tinker", "gunslinger", "alchemist", "brute", "stoker"];
  const name = names[kit] ?? "tinker";
  const f = frame & 3;
  if (pose === 1) return `${name}-walk-${f}`;
  if (pose === 2) return `${name}-atk-${f}`;
  if (pose === 3) return `${name}-hit-0`;
  if (pose === 4) return `${name}-die-0`;
  return `${name}-idle-${f & 1}`;
}

const FOE_NAMES = ["shambler", "ghoul", "zbrute", "spitter", "gas", "knight", "rat"];

export function foeFrameId(kind: number, frame: number, elite = false): string {
  const name = FOE_NAMES[kind] ?? "shambler";
  const bob = frame & 1;
  return elite ? `${name}-e-${bob}` : `${name}-${bob}`;
}

const SHOT = ["rivet", "pellet", "flame", "harp", "bomb"];

export function shotFrameId(gun: number, dir: number): string {
  const name = SHOT[gun] ?? "rivet";
  return `${name}-${dir & 3}`;
}
