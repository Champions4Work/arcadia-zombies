import { currentHud } from "../shell/hud-layout";
import { LAYER_HUD, registerFx, registerLayer } from "./plugins";
import {
  FX_BOOM, UPG_WPN_FLAME, UPG_WPN_HARP, UPG_WPN_MORT, UPG_WPN_RIVET, UPG_WPN_SHOT,
  WPN_COUNT, WPN_RIVET, type World,
} from "../sim/types";
import { paintBoom, paintWeaponShot } from "./cast-fx";

const BRASS_HI = "#e8c878";
const EMBER = "#ff7a2a";
const SOOT = "#120c08";
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
  const slotW = box.w / WPN_COUNT;
  for (let i = 0; i < WPN_COUNT; i++) {
    const id = IDS[i] ?? 0;
    const lv = w.upgrades[id] ?? 0;
    const x = box.x + i * slotW + 2;
    const y = box.y;
    const bw = slotW - 4;
    c.fillStyle = lv > 0 ? "#5a3a16" : "#1a120b";
    c.fillRect(x, y, bw, box.h);
    c.strokeStyle = lv > 0 ? BRASS_HI : "#5a4630";
    c.lineWidth = 2;
    c.strokeRect(x + 0.5, y + 0.5, bw - 1, box.h - 1);
    c.save();
    c.beginPath();
    c.rect(x + 2, y + 2, bw - 4, box.h - 4);
    c.clip();
    c.fillStyle = lv > 0 ? "#fff1c2" : "#8a7050";
    const tag = WPN_TAGS[i] ?? "";
    let size = Math.max(7, Math.min(9, box.h * 0.26));
    c.font = `800 ${size}px sans-serif`;
    while (size > 6 && c.measureText(tag).width > bw - 8) {
      size -= 1;
      c.font = `800 ${size}px sans-serif`;
    }
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText(tag, x + bw / 2, y + box.h * 0.38);
    c.restore();
    const pipW = Math.max(4, (bw - 12) / 5 - 2);
    for (let p = 0; p < 5; p++) {
      c.fillStyle = p < lv ? EMBER : SOOT;
      c.fillRect(x + 6 + p * (pipW + 2), y + box.h - 10, pipW, 5);
    }
  }
  c.textAlign = "left";
  c.restore();
}
