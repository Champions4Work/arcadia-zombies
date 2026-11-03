import { MAX_BOSS_SHOTS, MAX_CLOUDS } from "../sim/boss";
import {
  PHASE_CANNON, PHASE_RAM, PHASE_SCAR, SCAR_LIFE, SHOT_SHELL, TELL_CANNON, TELL_RAM,
  scarAnchorX, scarAnchorY,
} from "../sim/tank";
import type { World } from "../sim/types";

const SOOT = "#120c08";
const BRASS = "#c8963e";
const BRASS_HI = "#e8c878";
const BRASS_LO = "#7a5420";
const COPPER = "#b5562f";
const IRON = "#6a727c";
const IRON_HI = "#c5ccd4";
const IRON_LO = "#2c3238";
const FURNACE = "#ff5a1a";
const EMBER = "#ffd27a";

function px(c: CanvasRenderingContext2D, x: number, y: number, s: string, w = 1, h = 1): void {
  c.fillStyle = s;
  c.fillRect(x | 0, y | 0, w, h);
}
function rivet(c: CanvasRenderingContext2D, x: number, y: number): void {
  px(c, x, y, BRASS_HI, 2, 2);
  px(c, x + 1, y + 1, BRASS_LO, 1, 1);
}
function shadow(c: CanvasRenderingContext2D, x: number, y: number, w: number): void {
  c.globalAlpha = 0.4;
  px(c, x - w / 2, y + 4, SOOT, w, 5);
  c.globalAlpha = 1;
}
function doorOn(tick: number, scarWind: boolean): boolean {
  if (scarWind) return (tick & 1) === 0;
  return (tick & 3) === 0;
}
function cleats(c: CanvasRenderingContext2D, tick: number, fast: boolean): void {
  const scroll = (fast ? tick >> 1 : tick >> 2) & 7;
  for (let i = 0; i < 6; i++) {
    const x = -22 + ((i * 8 + scroll) % 44);
    px(c, x, -24, SOOT, 4, 6);
    px(c, x, 18, SOOT, 4, 6);
  }
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
  shadow(c, b.x, b.y, 62);
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
  px(c, -22, -26, IRON_LO, 44, 10);
  px(c, -22, 16, IRON_LO, 44, 10);
  cleats(c, w.tick, b.phase === PHASE_RAM && b.mode === 2);
  px(c, -24, -11, COPPER, 16, 22);
  px(c, -22, -6, SOOT, 10, 12);
  if (doorOn(w.tick, scarWind)) px(c, -20, -4, EMBER, 6, 8);
  px(c, -17, -14, IRON, 34, 28);
  px(c, -17, -14, IRON_HI, 34, 3);
  rivet(c, -15, -12);
  rivet(c, 13, -12);
  rivet(c, -15, 10);
  rivet(c, 13, 10);
  px(c, -8, -8, BRASS, 16, 16);
  const len = b.phase === PHASE_CANNON && b.mode === 2 ? 12 : 18;
  px(c, 8, -3, IRON, len, 6);
  px(c, 8 + len - 4, -4, BRASS, 4, 8);
  if (ramWind) px(c, 16, -14, IRON, TELL_RAM, 28);
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
