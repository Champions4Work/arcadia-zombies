import { blitSheetFit } from "../art/sheet";
import { currentHud } from "../shell/hud-layout";
import { BRASS, COPPER, CYAN, SOOT, XP } from "../shell/theme";
import { registerFx } from "./plugins";
import {
  FX_BOOM, UPG_WPN_FLAME, UPG_WPN_HARP, UPG_WPN_MORT, UPG_WPN_RIVET, UPG_WPN_SHOT,
  WPN_COUNT, WPN_RIVET, type World,
} from "../sim/types";
import { paintBoom, paintWeaponShot } from "./cast-fx";

const EMBER = COPPER;
export const WPN_TAGS = ["RIVET", "SHOT", "FLAME", "HARP", "MORT"];
const IDS = [UPG_WPN_RIVET, UPG_WPN_SHOT, UPG_WPN_FLAME, UPG_WPN_HARP, UPG_WPN_MORT];

export function paintWeapon(c: CanvasRenderingContext2D, w: World, j: number): number {
  const b = w.bullets;
  const gun = w.bGun[j] ?? 0;
  if (gun === WPN_RIVET) return 0;
  return paintWeaponShot(c, gun, b.x[j] ?? 0, b.y[j] ?? 0, b.vx[j] ?? 0, b.vy[j] ?? 0, w.bLife[j] ?? 0, w.tick, j);
}

registerFx(FX_BOOM, paintBoom);

function roundPhoneTray(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  const r = 10;
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
  ctx.fillStyle = "rgba(8,14,24,0.82)";
  ctx.fill();
  ctx.strokeStyle = "rgba(62,200,192,0.55)";
  ctx.lineWidth = 2.2;
  ctx.stroke();
}

function paintPhonePower(c: CanvasRenderingContext2D, i: number, cx: number, cy: number, r: number): void {
  c.beginPath();
  c.arc(cx, cy, r, 0, Math.PI * 2);
  c.fillStyle = "#141820";
  c.fill();
  c.strokeStyle = i === 0 ? XP : CYAN;
  c.lineWidth = 2.6;
  c.stroke();
  const s = r * 0.52;
  if (i === 0) {
    c.fillStyle = "#f0c040";
    c.beginPath();
    c.arc(cx, cy, s * 0.55, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = "#e8a828";
    c.lineWidth = 1.6;
    for (let a = 0; a < 8; a++) {
      const ang = (a / 8) * Math.PI * 2;
      c.beginPath();
      c.moveTo(cx + Math.cos(ang) * s * 0.72, cy + Math.sin(ang) * s * 0.72);
      c.lineTo(cx + Math.cos(ang) * s * 1.05, cy + Math.sin(ang) * s * 1.05);
      c.stroke();
    }
  } else if (i === 1) {
    c.fillStyle = "#eef2f8";
    c.beginPath();
    c.arc(cx, cy, s * 0.22, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = CYAN;
    c.beginPath();
    c.arc(cx, cy, s * 0.12, 0, Math.PI * 2);
    c.fill();
  } else if (i === 2) {
    c.fillStyle = "#e86820";
    c.beginPath();
    c.moveTo(cx, cy - s * 0.62);
    c.quadraticCurveTo(cx + s * 0.52, cy - s * 0.08, cx, cy + s * 0.58);
    c.quadraticCurveTo(cx - s * 0.52, cy - s * 0.08, cx, cy - s * 0.62);
    c.fill();
    c.fillStyle = "#f8c040";
    c.beginPath();
    c.arc(cx, cy - s * 0.18, s * 0.18, 0, Math.PI * 2);
    c.fill();
  } else if (i === 3) {
    c.fillStyle = XP;
    c.beginPath();
    c.moveTo(cx + s * 0.55, cy);
    c.lineTo(cx - s * 0.35, cy + s * 0.42);
    c.lineTo(cx - s * 0.12, cy);
    c.lineTo(cx - s * 0.35, cy - s * 0.42);
    c.closePath();
    c.fill();
  } else {
    c.fillStyle = "#3a9ae8";
    c.beginPath();
    c.moveTo(cx, cy - s * 0.55);
    c.bezierCurveTo(cx + s * 0.48, cy - s * 0.12, cx + s * 0.42, cy + s * 0.52, cx, cy + s * 0.62);
    c.bezierCurveTo(cx - s * 0.42, cy + s * 0.52, cx - s * 0.48, cy - s * 0.12, cx, cy - s * 0.55);
    c.fill();
    c.fillStyle = "#7ae0ff";
    c.beginPath();
    c.ellipse(cx - s * 0.12, cy - s * 0.22, s * 0.14, s * 0.1, -0.4, 0, Math.PI * 2);
    c.fill();
  }
}

function paintSlotIcon(c: CanvasRenderingContext2D, i: number, x: number, y: number, s: number): void {
  c.save();
  c.translate(x, y);
  if (i === 0) {
    c.fillStyle = "#6a4a28";
    c.fillRect(-s * 0.95, -s * 0.2, s * 0.4, s * 0.4);
    c.fillRect(-s * 0.38, s * 0.06, s * 0.22, s * 0.42);
    c.fillStyle = "#c4a060";
    c.fillRect(-s * 0.62, -s * 0.14, s * 1.45, s * 0.28);
    c.fillStyle = "#e8c878";
    c.fillRect(s * 0.55, -s * 0.1, s * 0.32, s * 0.2);
  } else if (i === 1) {
    c.fillStyle = "#6a4a28";
    c.fillRect(-s * 0.42, -s * 0.16, s * 0.36, s * 0.32);
    c.fillRect(-s * 0.22, s * 0.1, s * 0.2, s * 0.4);
    c.fillStyle = "#c4a060";
    c.fillRect(-s * 0.12, -s * 0.12, s * 0.82, s * 0.24);
    c.fillStyle = "#e8c878";
    c.fillRect(s * 0.52, -s * 0.08, s * 0.2, s * 0.16);
  } else if (i === 2) {
    c.fillStyle = "#6a8a3a";
    c.beginPath();
    c.ellipse(0, s * 0.08, s * 0.32, s * 0.4, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "#c4a060";
    c.fillRect(-s * 0.08, -s * 0.42, s * 0.16, s * 0.22);
    c.strokeStyle = "#e8c878";
    c.lineWidth = 1.4;
    c.beginPath();
    c.arc(s * 0.12, -s * 0.36, s * 0.12, -0.4, 2.2);
    c.stroke();
  } else if (i === 3) {
    c.fillStyle = "#e8e0d0";
    c.fillRect(-s * 0.38, -s * 0.28, s * 0.76, s * 0.56);
    c.fillStyle = "#d24a3a";
    c.fillRect(-s * 0.08, -s * 0.2, s * 0.16, s * 0.4);
    c.fillRect(-s * 0.22, -s * 0.06, s * 0.44, s * 0.16);
  } else {
    c.fillStyle = "#8a6a3a";
    c.beginPath();
    c.arc(0, s * 0.06, s * 0.34, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "#c4a060";
    c.fillRect(-s * 0.1, -s * 0.48, s * 0.2, s * 0.28);
  }
  c.restore();
}

export function drawWeaponRack(c: CanvasRenderingContext2D, w: World): void {
  if (w.over || w.choosing) return;
  const layout = currentHud();
  if (!layout) return;
  c.save();
  const dpr = c.canvas.width / Math.max(1, layout.view.w);
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  const box = layout.weapons;
  const phone = layout.phone;
  const gap = phone ? 3 : 4;
  const slot = Math.min(box.h, (box.w - gap * (WPN_COUNT - 1)) / WPN_COUNT);
  const row = slot * WPN_COUNT + gap * (WPN_COUNT - 1);
  const x0 = box.x + Math.max(0, (box.w - row) / 2);
  if (phone) {
    const trayPad = 6;
    const trayH = slot + trayPad * 2;
    const trayW = row + trayPad * 2;
    const tx = x0 - trayPad;
    const ty = box.y + Math.max(0, (box.h - trayH) / 2);
    roundPhoneTray(c, tx, ty, trayW, trayH);
  }
  for (let i = 0; i < WPN_COUNT; i++) {
    const id = IDS[i] ?? 0;
    const lv = w.upgrades[id] ?? 0;
    const x = x0 + i * (slot + gap);
    const y = box.y + Math.max(0, (box.h - slot) / 2);
    const hot = i === 0;
    const sw = slot;
    const sh = slot;
    const sx = x;
    const sy = y;
    const cx = sx + sw / 2;
    const cy = sy + sh / 2;
    blitSheetFit(c, "power_slot", sx - (phone ? 5 : 7), sy - (phone ? 5 : 7), sw + (phone ? 10 : 14), sh + (phone ? 10 : 14));
    if (phone) {
      paintPhonePower(c, i, cx, cy, sw * 0.34);
      continue;
    }
    const rim = hot ? sw * 0.56 : sw * 0.5;
    c.beginPath();
    c.arc(cx, cy, rim * 0.72, 0, Math.PI * 2);
    c.fillStyle = SOOT;
    c.fill();
    c.beginPath();
    c.arc(cx, cy, rim, 0, Math.PI * 2);
    c.strokeStyle = hot ? XP : BRASS;
    c.lineWidth = hot ? 3.4 : 2.8;
    c.stroke();
    paintSlotIcon(c, i, cx, cy - 2, Math.max(12, sw * (hot ? 0.48 : 0.4)));
    const label = i === 0 ? "34/210" : i === 1 ? "6/36" : `${Math.max(1, lv)}`;
    c.fillStyle = XP;
    c.font = hot ? "700 10px sans-serif" : "700 11px sans-serif";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText(label, cx, sy + sh - 5);
    const pipW = Math.max(2.2, (slot - 10) / 5 - 1);
    for (let p = 0; p < 5; p++) {
      c.fillStyle = p < lv ? EMBER : SOOT;
      c.fillRect(x + 5 + p * (pipW + 1), y + slot + 1, pipW, 2.4);
    }
  }
  c.restore();
}
