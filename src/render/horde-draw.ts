import { H, W, type World } from "../sim/types";
import { composeHorde } from "./blit.hot";
import { bg, buildSprites } from "./horde-sprites";

let view: HTMLCanvasElement | null = null;
let viewCtx: CanvasRenderingContext2D | null = null;
let image: ImageData | null = null;
let frame: Uint32Array | null = null;
let synced = false;

function ensureView(): Uint32Array | null {
  if (frame && image && view && viewCtx) return frame;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.imageSmoothingEnabled = false;
  const img = new ImageData(W, H);
  view = canvas;
  viewCtx = ctx;
  image = img;
  frame = new Uint32Array(img.data.buffer, img.data.byteOffset, W * H);
  return frame;
}

export function renderHorde(c: CanvasRenderingContext2D, w: World, ground: HTMLCanvasElement): void {
  buildSprites();
  const pixels = ensureView();
  if (!pixels || !view || !viewCtx || !image) return;
  if (!synced) {
    const g = ground.getContext("2d");
    if (g) {
      const snap = g.getImageData(0, 0, W, H);
      bg.set(new Uint32Array(snap.data.buffer, snap.data.byteOffset, W * H));
    }
    synced = true;
  }
  composeHorde(w, pixels);
  viewCtx.putImageData(image, 0, 0);
  const smooth = c.imageSmoothingEnabled;
  c.imageSmoothingEnabled = false;
  c.drawImage(view, 0, 0);
  c.imageSmoothingEnabled = smooth;
}
