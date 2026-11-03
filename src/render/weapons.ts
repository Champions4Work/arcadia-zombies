import { LAYER_HUD, registerFx, registerLayer, type FxPaint } from "./plugins";
import {
  FX_BOOM, UPG_WPN_FLAME, UPG_WPN_HARP, UPG_WPN_MORT, UPG_WPN_RIVET, UPG_WPN_SHOT,
  WPN_COUNT, WPN_FLAME, WPN_HARP, WPN_MORT, WPN_RIVET, WPN_SHOT, type World,
} from "../sim/types";

const BRASS = "#c8963e";
const BRASS_HI = "#e8c878";
const COPPER = "#b5562f";
const EMBER = "#ff7a2a";
const EMBER_HI = "#ffd27a";
const STEAM = "#c8c0b0";
const SOOT = "#120c08";
const TAGS = ["RIVET", "SHOT", "FLAME", "HARP", "MORT"];
const IDS = [UPG_WPN_RIVET, UPG_WPN_SHOT, UPG_WPN_FLAME, UPG_WPN_HARP, UPG_WPN_MORT];

function px(c: CanvasRenderingContext2D, x: number, y: number, s: string, w = 1, h = 1): void {
  c.fillStyle = s;
  c.fillRect(x | 0, y | 0, w, h);
}

function drawPellet(c: CanvasRenderingContext2D, x: number, y: number, vx: number, vy: number): void {
  px(c, x - vx * 0.8 - 1, y - vy * 0.8 - 1, STEAM, 3, 3);
  px(c, x - 3, y - 3, STEAM, 6, 6);
  px(c, x - 1, y - 1, BRASS, 3, 3);
}

function drawFlame(c: CanvasRenderingContext2D, x: number, y: number, life: number, tick: number, j: number): void {
  const flick = (tick + j) & 1;
  const s = 4 + (life > 10 ? 2 : 0);
  c.globalAlpha = 0.9;
  px(c, x - s, y - s, flick ? EMBER_HI : EMBER, s * 2, s * 2);
  px(c, x - 2, y - 3, "#fff3c0", 4, 4);
  px(c, x - 5, y + 1, COPPER, 3, 3);
  c.globalAlpha = 1;
}

function drawHarpoon(c: CanvasRenderingContext2D, x: number, y: number, vx: number, vy: number): void {
  const len = Math.hypot(vx, vy) || 1;
  const ux = vx / len;
  const uy = vy / len;
  for (let k = 0; k < 7; k++) {
    const col = k === 0 ? BRASS_HI : k < 3 ? "#8a9098" : "#5c5848";
    px(c, x - ux * k * 3 - 1, y - uy * k * 3 - 1, col, 3, 3);
  }
}

function drawBomb(c: CanvasRenderingContext2D, x: number, y: number, tick: number): void {
  px(c, x - 4, y - 4, "#2a2420", 8, 8);
  px(c, x - 3, y - 3, "#4a4038", 6, 6);
  px(c, x - 3, y - 1, BRASS, 6, 2);
  px(c, x - 1, y - 8, (tick >> 1) & 1 ? "#fff3c0" : EMBER, 2, 4);
}

export function paintWeapon(c: CanvasRenderingContext2D, w: World, j: number): number {
  const b = w.bullets;
  const gun = w.bGun[j] ?? 0;
  if (gun === WPN_RIVET) return 0;
  const x = b.x[j] ?? 0;
  const y = b.y[j] ?? 0;
  if (gun === WPN_FLAME) drawFlame(c, x, y, w.bLife[j] ?? 0, w.tick, j);
  else if (gun === WPN_HARP) drawHarpoon(c, x, y, b.vx[j] ?? 0, b.vy[j] ?? 0);
  else if (gun === WPN_MORT) drawBomb(c, x, y, w.tick);
  else if (gun === WPN_SHOT) drawPellet(c, x, y, b.vx[j] ?? 0, b.vy[j] ?? 0);
  else return 0;
  return 1;
}

const paintBoom: FxPaint = (c, x, y, age, a) => {
  if (age < 0 || age > 14) return;
  const r = a * (0.25 + age / 18);
  c.globalAlpha = Math.max(0, 1 - age / 14);
  c.strokeStyle = age < 3 ? "#fff3c0" : EMBER;
  c.lineWidth = age < 3 ? 4 : 2;
  c.beginPath();
  c.arc(x, y, Math.max(2, r), 0, Math.PI * 2);
  c.stroke();
  c.globalAlpha = 1;
};

registerFx(FX_BOOM, paintBoom);
registerLayer(LAYER_HUD, drawWeaponRack);

export function drawWeaponRack(c: CanvasRenderingContext2D, w: World): void {
  if (w.over || w.choosing) return;
  for (let i = 0; i < WPN_COUNT; i++) {
    const id = IDS[i] ?? 0;
    const lv = w.upgrades[id] ?? 0;
    const x = 100 + i * 56;
    const y = 286;
    c.fillStyle = lv > 0 ? "#4a3214" : "#1a120b";
    c.fillRect(x, y, 52, 26);
    c.strokeStyle = lv > 0 ? BRASS : "#3a2a1a";
    c.lineWidth = 1;
    c.strokeRect(x + 0.5, y + 0.5, 51, 25);
    c.fillStyle = lv > 0 ? BRASS_HI : "#5a4630";
    c.font = "10px monospace";
    c.textAlign = "center";
    c.fillText(TAGS[i] ?? "", x + 26, y + 11);
    for (let p = 0; p < 5; p++) {
      c.fillStyle = p < lv ? EMBER : SOOT;
      c.fillRect(x + 8 + p * 8, y + 16, 6, 4);
    }
  }
  c.textAlign = "left";
}
