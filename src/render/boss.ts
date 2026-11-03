import { bossName, BOSS_BEHEMOTH, BOSS_GEAR, BOSS_WITCH, MAX_BOSS_SHOTS, MAX_CLOUDS } from "../sim/boss";
import { H, W, type World } from "../sim/types";
import { LAYER_HUD, LAYER_MID, registerLayer } from "./plugins";
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
const CLOTH = "#24182e";
const CLOTH_HI = "#4a3660";
const STEAM = "#d5e4ea";
const SAW = "#e4e7ee";
const SAW_LO = "#8d949e";
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
function behemoth(c: CanvasRenderingContext2D, x: number, y: number, tick: number, mode: number): void {
  const ix = x | 0;
  const iy = y | 0;
  const bob = mode === 2 ? (tick & 1) * 3 : tick >> 4 & 1;
  shadow(c, ix, iy, 46);
  px(c, ix - 22, iy - 4 + bob, IRON_LO, 16, 8);
  px(c, ix + 6, iy - 4 + (bob ^ 1), IRON_LO, 16, 8);
  px(c, ix - 22, iy + 2 + bob, SOOT, 16, 4);
  px(c, ix + 6, iy + 2 + (bob ^ 1), SOOT, 16, 4);
  px(c, ix - 24, iy - 32 + bob, IRON_LO, 48, 28);
  px(c, ix - 22, iy - 30 + bob, IRON, 44, 24);
  px(c, ix - 20, iy - 28 + bob, IRON_HI, 44, 3);
  px(c, ix - 10, iy - 22 + bob, SOOT, 20, 12);
  px(c, ix - 8, iy - 20 + bob, FURNACE, 16, 8);
  px(c, ix - 4, iy - 18 + bob, tick >> 2 & 1 ? EMBER : FURNACE, 8, 4);
  px(c, ix - 12, iy - 46 + bob, IRON, 24, 16);
  px(c, ix - 10, iy - 50 + bob, IRON_LO, 20, 6);
  px(c, ix - 8, iy - 42 + bob, SOOT, 16, 5);
  px(c, ix - 6, iy - 41 + bob, FURNACE, 5, 3);
  px(c, ix + 2, iy - 41 + bob, FURNACE, 5, 3);
  px(c, ix - 26, iy - 48 + bob, IRON_LO, 8, 18);
  px(c, ix + 18, iy - 48 + bob, IRON_LO, 8, 18);
  px(c, ix - 24, iy - 50 + bob, COPPER, 4, 4);
  px(c, ix + 20, iy - 50 + bob, COPPER, 4, 4);
  c.globalAlpha = 0.45;
  px(c, ix - 24 + (tick >> 2 & 1), iy - 58 - (tick % 14), STEAM, 6, 6);
  px(c, ix + 18 + (tick >> 3 & 1), iy - 60 - (tick % 12), STEAM, 7, 5);
  c.globalAlpha = 1;
  px(c, ix - 30, iy - 24 + bob, IRON, 8, 16);
  px(c, ix + 22, iy - 24 + bob, IRON, 8, 16);
  px(c, ix - 32, iy - 12 + bob, BRASS, 10, 6);
  px(c, ix + 22, iy - 12 + bob, BRASS, 10, 6);
  for (let r = -18; r <= 16; r += 8) rivet(c, ix + r, iy - 30 + bob);
}
function witch(c: CanvasRenderingContext2D, x: number, y: number, tick: number): void {
  const ix = x | 0;
  const iy = y | 0;
  const bob = tick >> 3 & 1;
  shadow(c, ix, iy, 26);
  px(c, ix - 8, iy - 6 + bob, CLOTH, 6, 12);
  px(c, ix + 2, iy - 6 + (bob ^ 1), CLOTH, 6, 12);
  px(c, ix - 14, iy - 28 + bob, CLOTH, 28, 24);
  px(c, ix - 12, iy - 26 + bob, CLOTH_HI, 10, 18);
  px(c, ix - 4, iy - 18 + bob, BRASS_LO, 8, 10);
  px(c, ix - 8, iy - 42 + bob, BRASS, 16, 16);
  px(c, ix - 10, iy - 46 + bob, SOOT, 20, 6);
  px(c, ix - 6, iy - 62 + bob, CLOTH, 12, 18);
  px(c, ix - 2, iy - 70 + bob, CLOTH, 4, 10);
  px(c, ix - 8, iy - 64 + bob, BRASS_LO, 16, 3);
  px(c, ix - 5, iy - 38 + bob, SOOT, 4, 4);
  px(c, ix + 2, iy - 38 + bob, SOOT, 4, 4);
  px(c, ix - 4, iy - 37 + bob, "#9ee7ff", 2, 2);
  px(c, ix + 3, iy - 37 + bob, "#9ee7ff", 2, 2);
  px(c, ix + 10, iy - 46 + bob, BRASS_LO, 3, 28);
  px(c, ix + 6, iy - 48 + bob, COPPER, 11, 4);
  c.globalAlpha = 0.55;
  const puffY = tick % 18;
  px(c, ix + 8, iy - 54 - puffY + bob, STEAM, 8, 6);
  px(c, ix + 4, iy - 62 - (puffY >> 1) + bob, STEAM, 6, 5);
  c.globalAlpha = 1;
  px(c, ix - 16, iy - 20 + bob, CLOTH_HI, 4, 14);
  px(c, ix - 18, iy - 8 + bob, BRASS, 6, 4);
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
function gearlord(c: CanvasRenderingContext2D, x: number, y: number, tick: number): void {
  const ix = x | 0;
  const iy = y | 0;
  const bob = tick >> 3 & 1;
  shadow(c, ix, iy, 30);
  px(c, ix - 8, iy - 8 + bob, BRASS_LO, 5, 12);
  px(c, ix + 3, iy - 8 + (bob ^ 1), BRASS_LO, 5, 12);
  px(c, ix - 6, iy - 22 + bob, IRON_LO, 12, 16);
  sawBlade(c, ix, iy - 16 + bob, tick * 0.2, 16);
  px(c, ix - 5, iy - 34 + bob, IRON, 10, 10);
  px(c, ix - 3, iy - 32 + bob, SOOT, 6, 4);
  px(c, ix - 2, iy - 31 + bob, FURNACE, 4, 2);
  px(c, ix - 8, iy - 40 + bob, BRASS, 16, 4);
  const swing = tick * 0.35;
  sawBlade(c, ix - 18, iy - 16 + bob + Math.sin(swing) * 3, -swing, 9);
  sawBlade(c, ix + 18, iy - 16 + bob + Math.cos(swing) * 3, swing, 9);
  px(c, ix - 20, iy - 18 + bob, BRASS_LO, 6, 3);
  px(c, ix + 14, iy - 18 + bob, BRASS_LO, 6, 3);
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
  } else if (b.kind === BOSS_WITCH) {
    c.globalAlpha = 0.35;
    c.fillStyle = STEAM;
    c.beginPath();
    c.arc(w.px, w.py, 10 + (w.tick % 8), 0, Math.PI * 2);
    c.fill();
  } else {
    c.strokeStyle = "rgba(228,231,238,0.7)";
    c.beginPath();
    c.arc(b.x, b.y, 22, 0, Math.PI * 2);
    c.stroke();
  }
  c.restore();
}
function sprite(c: CanvasRenderingContext2D, w: World): void {
  const b = w.boss;
  if (b.kind === BOSS_WITCH) witch(c, b.x, b.y, w.tick);
  else if (b.kind === BOSS_GEAR) gearlord(c, b.x, b.y, w.tick);
  else behemoth(c, b.x, b.y, w.tick, b.mode);
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
  c.save();
  c.strokeStyle = BRASS_HI;
  c.lineWidth = 3;
  c.beginPath();
  c.arc(b.x, b.y, b.slam, 0, Math.PI * 2);
  c.stroke();
  c.strokeStyle = FURNACE;
  c.lineWidth = 1;
  c.beginPath();
  c.arc(b.x, b.y, Math.max(2, b.slam - 6), 0, Math.PI * 2);
  c.stroke();
  c.restore();
  const n = 8;
  for (let k = 0; k < n; k++) {
    const a = (Math.PI * 2 * k) / n;
    px(c, b.x + Math.cos(a) * b.slam - 2, b.y + Math.sin(a) * b.slam - 2, BRASS, 4, 4);
  }
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
  c.fillRect(16, 40, W - 32, 26);
  c.strokeStyle = flash ? FURNACE : BRASS;
  c.lineWidth = 2;
  c.strokeRect(16, 40, W - 32, 26);
  px(c, 22, 46, flash ? FURNACE : BRASS_LO, 8, 8);
  px(c, W - 30, 46, flash ? EMBER : BRASS, 8, 8);
  px(c, 24, 48, flash ? EMBER : FURNACE, 4, 4);
  px(c, W - 28, 48, flash ? "#fff1c4" : FURNACE, 4, 4);
  c.fillStyle = flash ? EMBER : BRASS_HI;
  c.font = "bold 13px monospace";
  c.textAlign = "center";
  c.fillText(`WARNING  ${bossName(b.kind)}`, W / 2, 58);
  c.textAlign = "left";
  c.strokeStyle = flash ? "rgba(255,90,26,0.9)" : "rgba(200,150,62,0.5)";
  c.lineWidth = 3;
  c.strokeRect(2, 2, W - 4, H - 4);
}
function hpBar(c: CanvasRenderingContext2D, w: World): void {
  const b = w.boss;
  const x = 20;
  const y = 40;
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
  c.fillStyle = "rgba(255,255,255,0.28)";
  c.fillRect(x + 3, y + 3, Math.max(0, (bw - 6) * t), 3);
  c.strokeStyle = BRASS_HI;
  c.lineWidth = 2;
  c.strokeRect(x + 0.5, y + 0.5, bw - 1, bh - 1);
  rivet(c, x + 2, y + 2);
  rivet(c, x + bw - 6, y + 2);
  c.fillStyle = BRASS_HI;
  c.font = "bold 11px monospace";
  c.textAlign = "center";
  const hp = Math.max(0, b.hp | 0);
  c.fillText(`${bossName(b.kind)}  ${hp}/${b.maxHp | 0}`, W / 2, y + 13);
  c.textAlign = "left";
}
export function drawBoss(c: CanvasRenderingContext2D, w: World, layer: number): void {
  const b = w.boss;
  if (layer === 0) {
    clouds(c, w);
    return;
  }
  if (layer === 1) {
    if (!b.on) return;
    telegraph(c, w);
    sprite(c, w);
    return;
  }
  if (layer === 2) {
    shock(c, w);
    shots(c, w);
    if (b.slow > 0) {
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
