import { blitAtlas } from "../art/atlas";
import { MAX_BOSS_SHOTS, MAX_CLOUDS } from "../sim/boss";
import {
  PHASE_CANNON, PHASE_RAM, PHASE_SCAR, SCAR_LIFE, SHOT_SHELL, TELL_CANNON, TELL_RAM,
  scarAnchorX, scarAnchorY,
} from "../sim/tank";
import type { World } from "../sim/types";
import { PX } from "../art/palette";
import { BRASS, BRONZE, COPPER, IRON, SOOT } from "../shell/theme";

const FURNACE = PX.f;
const EMBER = PX.F;

function px(c: CanvasRenderingContext2D, x: number, y: number, s: string, w = 1, h = 1): void {
  c.fillStyle = s;
  c.fillRect(x | 0, y | 0, w, h);
}

function shadow(c: CanvasRenderingContext2D, x: number, y: number, w: number): void {
  c.globalAlpha = 0.4;
  px(c, x - w / 2, y + 4, SOOT, w, 5);
  c.globalAlpha = 1;
}

function mark(c: CanvasRenderingContext2D, x: number, y: number): void {
  px(c, x - 3, y - 2, EMBER, 6, 4);
  px(c, x - 1, y - 4, EMBER, 3, 3);
}

function capsule(c: CanvasRenderingContext2D, x: number, y: number, vx: number, vy: number): void {
  const ix = x | 0;
  const iy = y | 0;
  if (vx * vx >= vy * vy) {
    const nose = vx >= 0 ? 2 : -2;
    px(c, ix - 2, iy - 1, BRASS, 5, 3);
    px(c, ix - 1, iy - 1, COPPER, 3, 2);
    px(c, ix + nose, iy, EMBER, 1, 1);
    return;
  }
  const nose = vy >= 0 ? 2 : -2;
  px(c, ix - 1, iy - 2, BRASS, 3, 5);
  px(c, ix - 1, iy - 1, COPPER, 2, 3);
  px(c, ix, iy + nose, EMBER, 1, 1);
}

function paintScars(c: CanvasRenderingContext2D, w: World): void {
  const b = w.boss;
  for (let i = 0; i < MAX_CLOUDS; i++) {
    const life = b.cloudLife[i] ?? 0;
    if (life <= 0) continue;
    const x = b.cloudX[i] ?? 0;
    const y = b.cloudY[i] ?? 0;
    let a = life / SCAR_LIFE;
    if (a > 0.55) a = 0.55;
    c.globalAlpha = a;
    px(c, x - 8, y - 3, SOOT, 16, 8);
    px(c, x - 4, y - 6, FURNACE, 8, 6);
    c.globalAlpha = 1;
  }
}

function paintBody(c: CanvasRenderingContext2D, w: World): void {
  const b = w.boss;
  const scarWind = b.phase === PHASE_SCAR && b.mode === 1;
  const cannonWind = b.phase === PHASE_CANNON && b.mode === 1;
  const ramWind = b.phase === PHASE_RAM && b.mode === 1;
  shadow(c, b.x, b.y, 72);
  if (scarWind) {
    mark(c, scarAnchorX(b.x, b.aimX, b.aimY, -1), scarAnchorY(b.y, b.aimX, b.aimY, -1));
    mark(c, scarAnchorX(b.x, b.aimX, b.aimY, 1), scarAnchorY(b.y, b.aimX, b.aimY, 1));
  }
  if (cannonWind) {
    c.strokeStyle = FURNACE;
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(b.x, b.y);
    c.lineTo(b.x + b.aimX * TELL_CANNON, b.y + b.aimY * TELL_CANNON);
    c.stroke();
  }
  c.save();
  c.translate(b.x, b.y);
  c.rotate(Math.atan2(b.aimY, b.aimX));
  blitAtlas(c, `tank-${(w.tick >> 3) & 3}`, 0, 0, 2);
  if (ramWind) {
    c.fillStyle = IRON;
    c.fillRect(16, -14, TELL_RAM, 28);
    c.fillStyle = BRONZE;
    c.fillRect(16, -10, TELL_RAM, 4);
  }
  c.restore();
}

function paintShells(c: CanvasRenderingContext2D, w: World): void {
  const b = w.boss;
  for (let i = 0; i < MAX_BOSS_SHOTS; i++) {
    if ((b.shotLife[i] ?? 0) <= 0) continue;
    if ((b.shotKind[i] ?? 0) !== SHOT_SHELL) continue;
    capsule(c, b.shotX[i] ?? 0, b.shotY[i] ?? 0, b.shotVx[i] ?? 0, b.shotVy[i] ?? 0);
  }
  if (b.slow > 0) {
    px(c, w.px - 7, w.py + 8, SOOT, 8, 3);
    px(c, w.px + 2, w.py + 10, SOOT, 6, 3);
  }
}

export function paintTank(c: CanvasRenderingContext2D, w: World, layer: number): void {
  if (layer === 0) {
    paintScars(c, w);
    return;
  }
  if (layer === 1) {
    paintBody(c, w);
    return;
  }
  if (layer === 2) paintShells(c, w);
}
