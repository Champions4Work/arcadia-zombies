import { H, MAX_ZOMBIES, W, Z_BRUTE, Z_GHOUL, type World } from "../sim/types";

const MARK = new Float32Array(2);
const PAD_L = 16;
const PAD_T = 42;
const PAD_R = W - 16;
const PAD_B = H - 16;

export function markX(): number { return MARK[0] ?? 0; }
export function markY(): number { return MARK[1] ?? 0; }

export function edgeMark(camX: number, camY: number, px: number, py: number, zx: number, zy: number): boolean {
  const sx = zx - camX;
  const sy = zy - camY;
  if (sx >= -6 && sy >= -6 && sx <= W + 6 && sy <= H + 6) return false;
  const ox = px - camX;
  const oy = py - camY;
  const dx = zx - px;
  const dy = zy - py;
  if (dx === 0 && dy === 0) return false;
  let best = 2;
  for (let e = 0; e < 4; e++) {
    let t = -1;
    if (e === 0 && dx !== 0) t = (PAD_L - ox) / dx;
    else if (e === 1 && dx !== 0) t = (PAD_R - ox) / dx;
    else if (e === 2 && dy !== 0) t = (PAD_T - oy) / dy;
    else if (e === 3 && dy !== 0) t = (PAD_B - oy) / dy;
    if (!(t > 0) || t >= best) continue;
    const x = ox + dx * t;
    const y = oy + dy * t;
    if (x < PAD_L - 1 || x > PAD_R + 1 || y < PAD_T - 1 || y > PAD_B + 1) continue;
    best = t;
  }
  if (best >= 2) {
    MARK[0] = Math.max(PAD_L, Math.min(PAD_R, sx));
    MARK[1] = Math.max(PAD_T, Math.min(PAD_B, sy));
    return true;
  }
  MARK[0] = ox + dx * best;
  MARK[1] = oy + dy * best;
  return true;
}

export function drawMarkers(c: CanvasRenderingContext2D, w: World, camX: number, camY: number): void {
  const z = w.zombies;
  for (let i = 0; i < MAX_ZOMBIES; i++) {
    if (!z.alive[i]) continue;
    const zx = z.x[i] ?? 0;
    const zy = z.y[i] ?? 0;
    if (!edgeMark(camX, camY, w.px, w.py, zx, zy)) continue;
    const x = markX();
    const y = markY();
    const kind = z.kind[i] ?? 0;
    const col = kind === Z_GHOUL ? "#c8963e" : kind === Z_BRUTE ? "#b5562f" : "#6a8a38";
    const ang = Math.atan2(zy - w.py, zx - w.px);
    c.fillStyle = "#120c08";
    c.fillRect((x - 4) | 0, (y - 4) | 0, 9, 9);
    c.fillStyle = col;
    c.fillRect((x - 3) | 0, (y - 3) | 0, 7, 7);
    c.fillStyle = "#e8c878";
    c.fillRect((x - 1) | 0, (y - 1) | 0, 3, 3);
    c.fillStyle = col;
    c.fillRect((x + Math.cos(ang) * 7 - 1) | 0, (y + Math.sin(ang) * 7 - 1) | 0, 3, 3);
  }
}
