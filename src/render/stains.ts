import { paintBlood, paintCasing } from "../art/look";

export const STAIN_CAP = 160;
export const STAIN_LIVE_CAP = 128;
export const STAIN_FADE_MIN = 0.28;
export const STAIN_BLOOD = 1;
export const STAIN_CASE = 2;
export const BLOOD_STAIN_BASE = 11;

const sx = new Float32Array(STAIN_CAP);
const sy = new Float32Array(STAIN_CAP);
const ss = new Float32Array(STAIN_CAP);
const sk = new Uint8Array(STAIN_CAP);
let cursor = 0;
let live = 0;

export function resetStains(): void {
  cursor = 0;
  live = 0;
  sk.fill(0);
}

export function stainCount(): number {
  return live;
}

export function stainFade(i: number): number {
  if (i < 0 || i >= STAIN_CAP || (sk[i] ?? 0) === 0) return 0;
  const behind = (cursor - 1 - i + STAIN_CAP) % STAIN_CAP;
  return Math.max(STAIN_FADE_MIN, 1 - behind / STAIN_CAP);
}

function put(x: number, y: number, s: number, kind: number): void {
  if (live >= STAIN_LIVE_CAP) return;
  const i = cursor;
  cursor = i + 1 < STAIN_CAP ? i + 1 : 0;
  if (sk[i] === 0) live++;
  sx[i] = x;
  sy[i] = y;
  ss[i] = s;
  sk[i] = kind;
}

export function stampBlood(x: number, y: number, salt: number): void {
  const n = 4 + (salt & 3);
  for (let k = 0; k < n; k++) {
    const ox = ((salt + k * 17) % 19) - 9;
    const oy = ((salt + k * 9) % 17) - 8;
    put(x + ox, y + oy, BLOOD_STAIN_BASE + ((salt + k) & 7), STAIN_BLOOD);
  }
}

export function stampCasing(x: number, y: number, salt: number): void {
  const ox = ((salt * 13) % 27) - 13;
  const oy = ((salt * 7) % 17) - 6;
  put(x + ox, y + oy, 1, STAIN_CASE);
}

export function paintStains(ctx: CanvasRenderingContext2D): void {
  if (live <= 0) return;
  ctx.save();
  for (let i = 0; i < STAIN_CAP; i++) {
    const kind = sk[i] ?? 0;
    if (kind === STAIN_BLOOD) paintBlood(ctx, sx[i] ?? 0, sy[i] ?? 0, ss[i] ?? 3, stainFade(i));
    else if (kind === STAIN_CASE) paintCasing(ctx, sx[i] ?? 0, sy[i] ?? 0);
  }
  ctx.restore();
}
