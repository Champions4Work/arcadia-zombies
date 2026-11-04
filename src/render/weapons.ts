import { blitSheetFit } from "../art/sheet";
import { currentHud } from "../shell/hud-layout";
import { BRASS, COPPER, SOOT, XP } from "../shell/theme";
import { registerFx } from "./plugins";
import {
  FX_BOOM, UPG_WPN_FLAME, UPG_WPN_HARP, UPG_WPN_MORT, UPG_WPN_RIVET, UPG_WPN_SHOT,
  WPN_COUNT, WPN_RIVET, type World,
} from "../sim/types";
import { paintBoom, paintWeaponShot } from "./cast-fx";
import { OUTLINE } from "./paint";

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

function wpnGlyph(c: CanvasRenderingContext2D, i: number, x: number, y: number, s: number): void {
  c.save();
  c.translate(x, y);
  c.fillStyle = XP;
  c.strokeStyle = XP;
  c.lineWidth = 2.2;
  if (i === 0) {
    c.fillRect(-s * 0.85, -s * 0.22, s * 1.35, s * 0.44);
    c.fillRect(s * 0.28, -s * 0.4, s * 0.7, s * 0.8);
    c.fillRect(-s * 0.22, s * 0.12, s * 0.28, s * 0.55);
  } else if (i === 1) {
    c.beginPath();
    c.moveTo(-s * 0.15, 0);
    c.lineTo(s * 0.7, -s * 0.55);
    c.moveTo(-s * 0.15, 0);
    c.lineTo(s * 0.7, 0);
    c.moveTo(-s * 0.15, 0);
    c.lineTo(s * 0.7, s * 0.55);
    c.stroke();
    c.fillRect(-s * 0.45, -s * 0.2, s * 0.4, s * 0.4);
  } else if (i === 2) {
    c.beginPath();
    c.moveTo(0, -s * 0.7);
    c.lineTo(s * 0.42, s * 0.35);
    c.lineTo(-s * 0.42, s * 0.35);
    c.closePath();
    c.fill();
  } else if (i === 3) {
    c.fillRect(-s * 0.12, -s * 0.75, s * 0.24, s * 1.35);
    c.fillRect(-s * 0.32, -s * 0.15, s * 0.64, s * 0.18);
  } else {
    c.beginPath();
    c.arc(0, 0, s * 0.42, 0, Math.PI * 2);
    c.fill();
    c.fillRect(-s * 0.08, -s * 0.7, s * 0.16, s * 0.32);
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
  const gap = 3;
  const slot = Math.min(box.h, (box.w - gap * (WPN_COUNT - 1)) / WPN_COUNT);
  const row = slot * WPN_COUNT + gap * (WPN_COUNT - 1);
  const x0 = box.x + Math.max(0, (box.w - row) / 2);
  for (let i = 0; i < WPN_COUNT; i++) {
    const id = IDS[i] ?? 0;
    const lv = w.upgrades[id] ?? 0;
    const x = x0 + i * (slot + gap);
    const y = box.y + Math.max(0, (box.h - slot) / 2);
    c.fillStyle = SOOT;
    c.fillRect(x, y, slot, slot);
    c.strokeStyle = BRASS;
    c.lineWidth = 1.8;
    c.strokeRect(x + 0.8, y + 0.8, slot - 1.6, slot - 1.6);
    blitSheetFit(c, "power_slot", x - 1, y - 1, slot + 2, slot + 2);
    wpnGlyph(c, i, x + slot / 2, y + slot * 0.32, Math.max(10, slot * 0.42));
    const n = Math.max(12, lv * 12);
    c.fillStyle = "rgba(8,6,4,0.88)";
    c.fillRect(x + 2, y + slot - 15, slot - 4, 13);
    c.fillStyle = XP;
    c.font = "700 11px sans-serif";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText(`${n}`, x + slot / 2, y + slot - 8);
    const pipW = Math.max(2.2, (slot - 8) / 5 - 1);
    for (let p = 0; p < 5; p++) {
      c.fillStyle = p < lv ? EMBER : SOOT;
      c.fillRect(x + 4 + p * (pipW + 1), y + slot - 5, pipW, 2.4);
    }
    c.strokeStyle = OUTLINE;
    c.lineWidth = 1.2;
    c.strokeRect(x + 4, y + slot - 5, slot - 8, 2.4);
  }
  c.restore();
}
