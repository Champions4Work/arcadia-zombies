import { currentHud } from "../shell/hud-layout";
import { BRASS_HI, COPPER, IRON, SOOT, STEAM_DIM } from "../shell/theme";
import { LAYER_HUD, registerFx, registerLayer } from "./plugins";
import {
  FX_BOOM, UPG_WPN_FLAME, UPG_WPN_HARP, UPG_WPN_MORT, UPG_WPN_RIVET, UPG_WPN_SHOT,
  WPN_COUNT, WPN_RIVET, type World,
} from "../sim/types";
import { paintBoom, paintWeaponShot } from "./cast-fx";
import { drawIcon } from "./icons";
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
registerLayer(LAYER_HUD, drawWeaponRack);

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
    c.fillStyle = lv > 0 ? IRON : SOOT;
    c.fillRect(x, y, slot, slot);
    c.strokeStyle = lv > 0 ? BRASS_HI : STEAM_DIM;
    c.lineWidth = 1.6;
    c.strokeRect(x + 0.5, y + 0.5, slot - 1, slot - 1);
    drawIcon(c, id, x + slot / 2, y + slot * 0.42, Math.max(7, slot * 0.36));
    const pipW = Math.max(2.2, (slot - 8) / 5 - 1);
    for (let p = 0; p < 5; p++) {
      c.fillStyle = p < lv ? EMBER : SOOT;
      c.fillRect(x + 4 + p * (pipW + 1), y + slot - 6, pipW, 3);
    }
    c.strokeStyle = OUTLINE;
    c.strokeRect(x + 4, y + slot - 6, slot - 8, 3);
  }
  c.restore();
}
