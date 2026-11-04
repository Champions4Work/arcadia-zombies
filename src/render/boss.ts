import { bossName, BOSS_BEHEMOTH, BOSS_GEAR, BOSS_TANK, BOSS_WITCH, MAX_BOSS_SHOTS, MAX_CLOUDS } from "../sim/boss";
import { paintBehemoth, paintGearlord, paintWitch } from "./cast";
import { paintTank } from "./tank";
import { W, type World } from "../sim/types";
import { LAYER_HUD, LAYER_MID, registerLayer } from "./plugins";
import { font } from "./paint";
const SOOT = "#120c08";
const BRASS = "#c8963e";
const BRASS_HI = "#e8c878";
const BRASS_LO = "#7a5420";
const FURNACE = "#ff5a1a";
const EMBER = "#ffd27a";
const STEAM = "#d5e4ea";
const SAW = "#e4e7ee";
const SAW_LO = "#8d949e";
function px(c: CanvasRenderingContext2D, x: number, y: number, s: string, w = 1, h = 1): void {
  c.fillStyle = s;
  c.fillRect(x | 0, y | 0, w, h);
}
function sawBlade(c: CanvasRenderingContext2D, x: number, y: number, a: number, r: number): void {
  c.save();
  c.translate(x, y);
  c.rotate(a);
  c.fillStyle = SAW;
  c.fillRect(-r, -1.5, r * 2, 3);
  c.fillRect(-1.5, -r, 3, r * 2);
  c.rotate(Math.PI / 4);
  c.fillRect(-r * 0.82, -1.2, r * 1.64, 2.4);
  c.fillRect(-1.2, -r * 0.82, 2.4, r * 1.64);
  c.fillStyle = SAW_LO;
  c.beginPath();
  c.arc(0, 0, r * 0.28, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = BRASS;
  c.beginPath();
  c.arc(0, 0, r * 0.12, 0, Math.PI * 2);
  c.fill();
  c.restore();
}
function telegraph(c: CanvasRenderingContext2D, w: World): void {
  const b = w.boss;
  if (!b.on || b.mode !== 1) return;
  c.save();
  c.lineWidth = 2;
  if (b.kind === BOSS_BEHEMOTH && b.phase === 0) {
    c.strokeStyle = "rgba(255,90,26,0.85)";
    c.beginPath();
    c.moveTo(b.x, b.y - 8);
    c.lineTo(b.x + b.aimX * 150, b.y - 8 + b.aimY * 70);
    c.stroke();
  } else if (b.kind === BOSS_BEHEMOTH) {
    c.strokeStyle = "rgba(232,200,120,0.7)";
    c.beginPath();
    c.arc(b.x, b.y, 18 + (w.tick % 12), 0, Math.PI * 2);
    c.stroke();
  } else if (b.kind === BOSS_WITCH && b.phase > 0) {
    c.globalAlpha = 0.35;
    c.fillStyle = STEAM;
    c.beginPath();
    c.arc(w.px, w.py, 10 + (w.tick % 8), 0, Math.PI * 2);
    c.fill();
  } else if (b.kind !== BOSS_WITCH) {
    c.strokeStyle = "rgba(228,231,238,0.7)";
    c.beginPath();
    c.arc(b.x, b.y, 22, 0, Math.PI * 2);
    c.stroke();
  }
  c.restore();
}
function sprite(c: CanvasRenderingContext2D, w: World): void {
  const b = w.boss;
  if (b.kind === BOSS_WITCH) paintWitch(c, b.x, b.y, w.tick, b.phase);
  else if (b.kind === BOSS_GEAR) paintGearlord(c, b.x, b.y, w.tick);
  else paintBehemoth(c, b.x, b.y, w.tick, b.mode);
}
function clouds(c: CanvasRenderingContext2D, w: World): void {
  const b = w.boss;
  for (let i = 0; i < MAX_CLOUDS; i++) {
    const life = b.cloudLife[i] ?? 0;
    if (life <= 0) continue;
    const x = b.cloudX[i] ?? 0;
    const y = b.cloudY[i] ?? 0;
    const r = b.cloudR[i] ?? 0;
    c.globalAlpha = Math.min(0.45, life / 80);
    c.fillStyle = STEAM;
    c.beginPath();
    c.arc(x, y - 4, r, 0, Math.PI * 2);
    c.fill();
    c.beginPath();
    c.arc(x + 8, y - 10, r * 0.6, 0, Math.PI * 2);
    c.fill();
    c.globalAlpha = 1;
  }
}
function shock(c: CanvasRenderingContext2D, w: World): void {
  const b = w.boss;
  if (b.slam <= 1) return;
  c.strokeStyle = BRASS_HI;
  c.lineWidth = 3;
  c.beginPath();
  c.arc(b.x, b.y, b.slam, 0, Math.PI * 2);
  c.stroke();
}
function shots(c: CanvasRenderingContext2D, w: World): void {
  const b = w.boss;
  for (let i = 0; i < MAX_BOSS_SHOTS; i++) {
    if ((b.shotLife[i] ?? 0) <= 0) continue;
    sawBlade(c, b.shotX[i] ?? 0, b.shotY[i] ?? 0, w.tick * 0.45 + i, 7);
  }
}
function banner(c: CanvasRenderingContext2D, w: World): void {
  const b = w.boss;
  const flash = (w.tick >> 3) & 1;
  c.fillStyle = flash ? "rgba(90,16,8,0.92)" : "rgba(28,16,8,0.92)";
  c.fillRect(16, 56, W - 32, 26);
  c.strokeStyle = flash ? FURNACE : BRASS;
  c.lineWidth = 2;
  c.strokeRect(16, 56, W - 32, 26);
  c.fillStyle = flash ? EMBER : BRASS_HI;
  c.font = font(13, 800);
  c.textAlign = "center";
  c.fillText(`WARNING  ${bossName(b.kind)}`, W / 2, 74);
  c.textAlign = "left";
}
function hpBar(c: CanvasRenderingContext2D, w: World): void {
  const b = w.boss;
  const x = 20;
  const y = 56;
  const bw = W - 40;
  const bh = 18;
  c.fillStyle = SOOT;
  c.fillRect(x, y, bw, bh);
  c.fillStyle = BRASS_LO;
  c.fillRect(x + 1, y + 1, bw - 2, bh - 2);
  const t = b.maxHp > 0 ? Math.max(0, b.hp) / b.maxHp : 0;
  c.fillStyle = "#8a1c10";
  c.fillRect(x + 3, y + 3, bw - 6, bh - 6);
  c.fillStyle = t > 0.35 ? FURNACE : "#ff2a1a";
  c.fillRect(x + 3, y + 3, Math.max(0, (bw - 6) * t), bh - 6);
  c.strokeStyle = BRASS_HI;
  c.lineWidth = 2;
  c.strokeRect(x + 0.5, y + 0.5, bw - 1, bh - 1);
  c.fillStyle = BRASS_HI;
  c.font = font(12, 800);
  c.textAlign = "center";
  const hp = Math.max(0, b.hp | 0);
  c.fillText(`${bossName(b.kind)}  ${hp}/${b.maxHp | 0}`, W / 2, y + 13);
  c.textAlign = "left";
}
export function drawBoss(c: CanvasRenderingContext2D, w: World, layer: number): void {
  const b = w.boss;
  if (layer === 0) {
    if (b.kind === BOSS_TANK) {
      paintTank(c, w, 0);
      return;
    }
    clouds(c, w);
    return;
  }
  if (layer === 1) {
    if (!b.on) return;
    if (b.kind === BOSS_TANK) {
      paintTank(c, w, 1);
      return;
    }
    telegraph(c, w);
    sprite(c, w);
    return;
  }
  if (layer === 2) {
    if (b.kind === BOSS_TANK) {
      paintTank(c, w, 2);
      return;
    }
    shock(c, w);
    shots(c, w);
    if (b.slow > 0 && b.kind === BOSS_WITCH && b.phase > 0) {
      c.globalAlpha = 0.4;
      px(c, w.px - 8, w.py - 28, STEAM, 16, 10);
      px(c, w.px - 4, w.py - 36, STEAM, 10, 8);
      c.globalAlpha = 1;
    }
    return;
  }
  if (b.pending && b.warn > 0 && !b.on) banner(c, w);
  else if (b.on) hpBar(c, w);
}
registerLayer(LAYER_MID, (c, w) => {
  drawBoss(c, w, 0);
  drawBoss(c, w, 1);
  drawBoss(c, w, 2);
});
registerLayer(LAYER_HUD, (c, w) => {
  drawBoss(c, w, 3);
});
