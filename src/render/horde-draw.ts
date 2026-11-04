import { H, W, type World } from "../sim/types";
import { composeHorde } from "./blit.hot";
import { bg, buildSprites } from "./horde-sprites";

let view: HTMLCanvasElement | null = null;
let viewCtx: CanvasRenderingContext2D | null = null;
let image: ImageData | null = null;
let frame: Uint32Array | null = null;

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

export function renderHorde(c: CanvasRenderingContext2D, w: World): void {
  buildSprites();
  const pixels = ensureView();
  if (!pixels || !view || !viewCtx || !image) return;
  const camX = Math.round(w.arena.camX);
  const camY = Math.round(w.arena.camY);
  bg.fill(0);
  composeHorde(w, pixels);
  viewCtx.putImageData(image, 0, 0);
  const smooth = c.imageSmoothingEnabled;
  c.imageSmoothingEnabled = false;
  c.drawImage(view, camX, camY);
  c.imageSmoothingEnabled = smooth;
}
