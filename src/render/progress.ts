import { CARD_GAP, CARD_H, CARD_W, CARD_X0, CARD_Y, sawAngle, sawRadius, upgName, xpNeed } from "../sim/progress";
import { H, MAX_COGS, MAX_ZOMBIES, OFFER_N, UPG_SAWS, W, type World } from "../sim/types";
const BRASS = "#c8963e";
const COPPER = "#b5562f";
function drawCogs(c: CanvasRenderingContext2D, w: World): void {
  const g = w.cogs;
  c.fillStyle = BRASS;
  for (let k = 0; k < MAX_COGS; k++) {
    if (!g.alive[k]) continue;
    c.fillRect((g.x[k] ?? 0) - 2, (g.y[k] ?? 0) - 2, 4, 4);
  }
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
  c.strokeStyle = "#7ad0ff";
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
function drawXp(c: CanvasRenderingContext2D, w: World): void {
  const need = xpNeed(w.level);
  const t = need <= 0 ? 0 : Math.min(1, w.xp / need);
  c.fillStyle = "#1a120b";
  c.fillRect(8, 22, 200, 5);
  c.fillStyle = BRASS;
  c.fillRect(8, 22, 200 * t, 5);
  c.fillStyle = "#24180e";
  c.fillRect(328, 4, 148, 16);
  c.fillStyle = BRASS;
  c.font = "bold 12px monospace";
  const sh = w.shield > 0 ? ` ⬡${w.shield}` : "";
  c.fillText(`LV ${w.level} ${w.xp}/${need}${sh}`, 332, 16);
}
function drawCards(c: CanvasRenderingContext2D, w: World): void {
  if (!w.choosing) return;
  c.fillStyle = "rgba(0,0,0,0.55)";
  c.fillRect(0, 0, W, H);
  c.fillStyle = BRASS;
  c.font = "bold 16px monospace";
  c.textAlign = "center";
  c.fillText("BRASS COGS — CHOOSE 1 / 2 / 3", W / 2, 48);
  for (let i = 0; i < OFFER_N; i++) {
    const id = w.offers[i] ?? -1;
    const x = CARD_X0 + i * (CARD_W + CARD_GAP);
    c.fillStyle = "#3a2a1a";
    c.fillRect(x, CARD_Y, CARD_W, CARD_H);
    c.strokeStyle = BRASS;
    c.lineWidth = 2;
    c.strokeRect(x + 1, CARD_Y + 1, CARD_W - 2, CARD_H - 2);
    c.fillStyle = COPPER;
    c.font = "bold 28px monospace";
    c.fillText(String(i + 1), x + CARD_W / 2, CARD_Y + 40);
    c.fillStyle = BRASS;
    c.font = "bold 12px monospace";
    const name = id < 0 ? "—" : upgName(id);
    c.fillText(name, x + CARD_W / 2, CARD_Y + 80);
    if (id >= 0) {
      const lv = w.upgrades[id] ?? 0;
      c.font = "12px monospace";
      c.fillText(`LV ${lv} > ${lv + 1}`, x + CARD_W / 2, CARD_Y + 110);
    }
  }
  c.textAlign = "left";
}
export function drawProgress(c: CanvasRenderingContext2D, w: World): void {
  drawCogs(c, w);
  drawSaws(c, w);
  drawTesla(c, w);
  drawShield(c, w);
  drawXp(c, w);
  drawCards(c, w);
}
