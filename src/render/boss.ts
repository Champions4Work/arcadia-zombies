import { bossName, BOSS_BEHEMOTH, BOSS_WITCH, MAX_BOSS_SHOTS, MAX_CLOUDS } from "../sim/boss";
import { W, type World } from "../sim/types";
import { LAYER_HUD, LAYER_MID, registerLayer } from "./plugins";
const STEAM = "#d5e4ea";
const BRASS = "#c8963e";
const HOT = "#ff5a1a";
const SOOT = "#120c08";
function box(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, s: string): void {
  c.fillStyle = s;
  c.fillRect(x | 0, y | 0, w, h);
}
function telegraph(c: CanvasRenderingContext2D, w: World): void {
  const b = w.boss;
  if (!b.on || b.mode !== 1) return;
  c.save();
  c.lineWidth = 2;
  if (b.kind === BOSS_BEHEMOTH && b.phase === 0) {
    c.strokeStyle = HOT;
    c.beginPath();
    c.moveTo(b.x, b.y - 8);
    c.lineTo(b.x + b.aimX * 150, b.y - 8 + b.aimY * 70);
    c.stroke();
  } else if (b.kind === BOSS_BEHEMOTH) {
    c.strokeStyle = BRASS;
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
    c.strokeStyle = STEAM;
    c.beginPath();
    c.arc(b.x, b.y, 22, 0, Math.PI * 2);
    c.stroke();
  }
  c.restore();
}
function sprite(c: CanvasRenderingContext2D, w: World): void {
  const b = w.boss;
  const x = b.x | 0;
  const y = b.y | 0;
  box(c, x - 14, y - 26, 28, 26, b.kind === BOSS_WITCH ? "#24182e" : "#6a727c");
  box(c, x - 6, y - 38, 12, 12, BRASS);
  if (b.kind !== BOSS_WITCH || b.phase <= 0) return;
  c.globalAlpha = 0.55;
  box(c, x + 8, y - 54 - (w.tick % 18), 8, 6, STEAM);
  c.globalAlpha = 1;
}
function clouds(c: CanvasRenderingContext2D, w: World): void {
  const b = w.boss;
  c.fillStyle = STEAM;
  for (let i = 0; i < MAX_CLOUDS; i++) {
    const life = b.cloudLife[i] ?? 0;
    if (life <= 0) continue;
    c.globalAlpha = Math.min(0.45, life / 80);
    c.beginPath();
    c.arc(b.cloudX[i] ?? 0, (b.cloudY[i] ?? 0) - 4, b.cloudR[i] ?? 0, 0, Math.PI * 2);
    c.fill();
  }
  c.globalAlpha = 1;
}
function layer(c: CanvasRenderingContext2D, w: World, n: number): void {
  const b = w.boss;
  if (n === 0) {
    clouds(c, w);
    return;
  }
  if (n === 1) {
    if (!b.on) return;
    telegraph(c, w);
    sprite(c, w);
    return;
  }
  if (n === 2) {
    if (b.slam > 1) {
      c.strokeStyle = BRASS;
      c.lineWidth = 3;
      c.beginPath();
      c.arc(b.x, b.y, b.slam, 0, Math.PI * 2);
      c.stroke();
    }
    c.fillStyle = "#e4e7ee";
    for (let i = 0; i < MAX_BOSS_SHOTS; i++) {
      if ((b.shotLife[i] ?? 0) <= 0) continue;
      box(c, (b.shotX[i] ?? 0) - 4, (b.shotY[i] ?? 0) - 4, 8, 8, "#e4e7ee");
    }
    if (b.slow > 0 && b.kind === BOSS_WITCH && b.phase > 0) {
      c.globalAlpha = 0.4;
      box(c, w.px - 8, w.py - 28, 16, 10, STEAM);
      c.globalAlpha = 1;
    }
    return;
  }
  if (b.pending && b.warn > 0 && !b.on) {
    const flash = (w.tick >> 3) & 1;
    c.fillStyle = flash ? "rgba(90,16,8,0.92)" : "rgba(28,16,8,0.92)";
    c.fillRect(16, 56, W - 32, 26);
    c.strokeStyle = flash ? HOT : BRASS;
    c.lineWidth = 2;
    c.strokeRect(16, 56, W - 32, 26);
    c.fillStyle = flash ? "#ffd27a" : "#e8c878";
    c.font = "bold 13px monospace";
    c.textAlign = "center";
    c.fillText(`WARNING  ${bossName(b.kind)}`, W / 2, 74);
    c.textAlign = "left";
    return;
  }
  if (!b.on) return;
  const x = 20;
  const y = 56;
  const bw = W - 40;
  c.fillStyle = SOOT;
  c.fillRect(x, y, bw, 18);
  const t = b.maxHp > 0 ? Math.max(0, b.hp) / b.maxHp : 0;
  c.fillStyle = HOT;
  c.fillRect(x + 3, y + 3, Math.max(0, (bw - 6) * t), 12);
  c.strokeStyle = BRASS;
  c.strokeRect(x + 0.5, y + 0.5, bw - 1, 17);
  c.fillStyle = "#e8c878";
  c.font = "bold 11px monospace";
  c.textAlign = "center";
  c.fillText(`${bossName(b.kind)}  ${Math.max(0, b.hp | 0)}/${b.maxHp | 0}`, W / 2, y + 13);
  c.textAlign = "left";
}
export function drawBoss(c: CanvasRenderingContext2D, w: World, n: number): void {
  layer(c, w, n);
}
registerLayer(LAYER_MID, (c, w) => {
  layer(c, w, 0);
  layer(c, w, 1);
  layer(c, w, 2);
});
registerLayer(LAYER_HUD, (c, w) => {
  layer(c, w, 3);
});
