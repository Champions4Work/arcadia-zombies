import { type Insets, ZERO_INSETS } from "./viewport";

export interface Fit {
  dpr: number;
  scale: number;
  ox: number;
  oy: number;
  cssW: number;
  cssH: number;
  bufW: number;
  bufH: number;
  viewW: number;
  viewH: number;
}

export function computeFit(
  vw: number,
  vh: number,
  dpr: number,
  gameW: number,
  gameH: number,
  safe: Insets = ZERO_INSETS,
): Fit {
  const w = Math.max(1, vw);
  const h = Math.max(1, vh);
  const px = Math.max(1, dpr);
  const sl = Math.max(0, safe.l);
  const sr = Math.max(0, safe.r);
  const st = Math.max(0, safe.t);
  const sb = Math.max(0, safe.b);
  const availW = Math.max(1, w - sl - sr);
  const availH = Math.max(1, h - st - sb);
  const gw = Math.max(1, gameW);
  const gh = Math.max(1, gameH);
  const scale = Math.min(availW / gw, availH / gh);
  return {
    dpr: px,
    scale,
    ox: sl + (availW - gw * scale) / 2,
    oy: st + (availH - gh * scale) / 2,
    cssW: w,
    cssH: h,
    bufW: Math.max(1, Math.round(w * px)),
    bufH: Math.max(1, Math.round(h * px)),
    viewW: gw,
    viewH: gh,
  };
}

export function applyCanvas(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  vw: number,
  vh: number,
  dpr: number,
  gameW: number,
  gameH: number,
  safe: Insets = ZERO_INSETS,
): Fit {
  const f = computeFit(vw, vh, dpr, gameW, gameH, safe);
  canvas.style.width = `${f.cssW}px`;
  canvas.style.height = `${f.cssH}px`;
  if (canvas.width !== f.bufW || canvas.height !== f.bufH) {
    canvas.width = f.bufW;
    canvas.height = f.bufH;
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = "#160e24";
  ctx.fillRect(0, 0, f.bufW, f.bufH);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.setTransform(f.dpr * f.scale, 0, 0, f.dpr * f.scale, f.ox * f.dpr, f.oy * f.dpr);
  return f;
}

export function screenToGame(f: Fit, x: number, y: number): { x: number; y: number } {
  return { x: (x - f.ox) / f.scale, y: (y - f.oy) / f.scale };
}

export function worldToCss(f: Fit, camX: number, camY: number, x: number, y: number): { x: number; y: number } {
  return { x: f.ox + (x - camX) * f.scale, y: f.oy + (y - camY) * f.scale };
}
