import {
  CARD_GAP, CARD_H, CARD_W, CARD_X0, CARD_Y, rarityName, sawAngle, sawRadius, upgName, UPG_RARITY,
} from "../sim/progress";
import {
  H, MAX_ZOMBIES, OFFER_N, UPG_MAX, UPG_SAWS, W, type World,
} from "../sim/types";
const BRASS = "#c8963e";
const BRASS_HI = "#e8c878";
const COPPER = "#b5562f";
const RARE = "#7ad0ff";
const LEGEND = "#ff7a2a";
function rarityColor(id: number): string {
  const r = UPG_RARITY[id] ?? 0;
  if (r >= 2) return LEGEND;
  if (r === 1) return RARE;
  return BRASS;
}
function drawSaws(c: CanvasRenderingContext2D, w: World): void {
  const n = w.upgrades[UPG_SAWS] ?? 0;
  if (n <= 0) return;
  const r = sawRadius(w);
  c.fillStyle = "#9aa0a8";
  for (let s = 0; s < n; s++) {
    const a = sawAngle(w.tick, s, n);
    c.fillRect(w.px + Math.cos(a) * r - 3, w.py + Math.sin(a) * r - 3, 6, 6);
  }
}
function drawTesla(c: CanvasRenderingContext2D, w: World): void {
  if (w.teslaFlash <= 0 || w.teslaN <= 0) return;
  c.strokeStyle = RARE;
  c.lineWidth = 1.5;
  c.beginPath();
  c.moveTo(w.px, w.py);
  for (let i = 0; i < w.teslaN; i++) {
    const zi = w.teslaHit[i] ?? -1;
    if (zi < 0 || zi >= MAX_ZOMBIES) continue;
    c.lineTo(w.zombies.x[zi] ?? w.px, w.zombies.y[zi] ?? w.py);
  }
  c.stroke();
}
function drawShield(c: CanvasRenderingContext2D, w: World): void {
  if (w.shield <= 0) return;
  c.strokeStyle = "#d7b56a";
  c.lineWidth = 1;
  c.beginPath();
  c.arc(w.px, w.py, 12, 0, Math.PI * 2);
  c.stroke();
}
function drawPips(c: CanvasRenderingContext2D, x: number, y: number, lv: number, col: string): void {
  for (let p = 0; p < UPG_MAX; p++) {
    c.fillStyle = p < lv ? col : "#1a120b";
    c.fillRect(x + p * 16, y, 12, 8);
    c.strokeStyle = p === lv ? LEGEND : col;
    c.strokeRect(x + p * 16, y, 12, 8);
  }
}
function drawCards(c: CanvasRenderingContext2D, w: World): void {
  if (!w.choosing) return;
  c.fillStyle = "rgba(0,0,0,0.55)";
  c.fillRect(0, 0, W, H);
  c.fillStyle = BRASS;
  c.font = "bold 16px monospace";
  c.textAlign = "center";
  c.fillText("CHOOSE  1  /  2", W / 2, 76);
  for (let i = 0; i < OFFER_N; i++) {
    const id = w.offers[i] ?? -1;
    const x = CARD_X0 + i * (CARD_W + CARD_GAP);
    const col = id < 0 ? BRASS : rarityColor(id);
    c.fillStyle = "#3a2a1a";
    c.fillRect(x, CARD_Y, CARD_W, CARD_H);
    c.strokeStyle = col;
    c.lineWidth = 3;
    c.strokeRect(x + 1, CARD_Y + 1, CARD_W - 2, CARD_H - 2);
    c.fillStyle = col;
    c.fillRect(x + 8, CARD_Y + 8, CARD_W - 16, 6);
    c.fillStyle = COPPER;
    c.font = "bold 28px monospace";
    c.fillText(String(i + 1), x + CARD_W / 2, CARD_Y + 48);
    c.fillStyle = col;
    c.font = "bold 11px monospace";
    c.fillText(id < 0 ? "" : rarityName(UPG_RARITY[id] ?? 0), x + CARD_W / 2, CARD_Y + 70);
    c.fillStyle = BRASS_HI;
    c.font = "bold 13px monospace";
    c.fillText(id < 0 ? "—" : upgName(id), x + CARD_W / 2, CARD_Y + 98);
    if (id >= 0) {
      const lv = w.upgrades[id] ?? 0;
      drawPips(c, x + (CARD_W - UPG_MAX * 16) / 2, CARD_Y + 124, lv, col);
      c.fillStyle = BRASS;
      c.font = "12px monospace";
      c.fillText(`LV ${lv} > ${lv + 1}`, x + CARD_W / 2, CARD_Y + 156);
    }
  }
  c.textAlign = "left";
}
export function drawProgress(c: CanvasRenderingContext2D, w: World): void {
  drawSaws(c, w);
  drawTesla(c, w);
  drawShield(c, w);
  drawCards(c, w);
}
