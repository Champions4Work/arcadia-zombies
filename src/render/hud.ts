import { tierFrac, tierName } from "../sim/difficulty";
import { Z_GAS, Z_KIND, Z_KNIGHT, Z_RAT, Z_SPITTER } from "../sim/foes";
import { CARD_GAP, CARD_H, CARD_W, CARD_X0, CARD_Y, rarityName, UPG_RARITY, upgName, xpNeed } from "../sim/progress";
import {
  EVOL_AEGIS, EVOL_CANNON, EVOL_STORM, H, OFFER_N, UPG_DMG, UPG_FIRE, UPG_HP, UPG_MAX, UPG_MORTAR,
  UPG_PIERCE, UPG_SAWS, UPG_SHIELD, UPG_SHOTGUN, UPG_SPEED, UPG_TESLA, UPG_VENT, W, Z_BRUTE, Z_GHOUL, type World,
} from "../sim/types";
import { BRASS, cog, flame, font, heart, lit, OUTLINE, roundRect } from "./paint";

const BLURB = [
  "Chain a spark through nearby foes.",
  "Extra pellets in a wide fan.",
  "Orbiting saws chew the horde.",
  "Increase fire rate and burn nearby foes.",
  "Heavier rivets hit harder.",
  "A bigger boiler heart.",
  "Quicker strides across the yard.",
  "A steam burst shoves the nearest foes.",
  "Shots punch through the line.",
  "A brass shell soaks a hit.",
  "Thorns bite anything that touches the suit.",
  "The boiler heart mends between the heat.",
  "A lobbed shell bursts on the farthest foe.",
  "A shriek that slows the closest dead.",
  "Bolts bounce off the yard walls.",
  "Kills wind the boiler for the next shot.",
  "Tesla and saws fuse into a storm.",
  "Shotgun and pierce become a cannon.",
  "Shield and vent lock into an aegis.",
];

export const PAUSE_X = 456;
export const PAUSE_Y = 24;
export const PAUSE_R = 14;

export function difficultyLabel(rank: number): string {
  return tierName(Math.max(0, rank | 0));
}

export function formatClock(tick: number): string {
  const s = (Math.max(0, tick | 0) / 60) | 0;
  const m = Math.min(99, (s / 60) | 0);
  const r = s % 60;
  return `${m < 10 ? "0" : ""}${m}:${r < 10 ? "0" : ""}${r}`;
}

export function pauseHit(x: number, y: number): boolean {
  const dx = x - PAUSE_X;
  const dy = y - PAUSE_Y;
  return dx * dx + dy * dy <= (PAUSE_R + 6) * (PAUSE_R + 6);
}

export function blurbFor(id: number): string {
  return BLURB[id] ?? "A new gear for the boiler heart.";
}

export function weaponBadge(w: World): { name: string; pips: number; kind: number } {
  const storm = w.upgrades[EVOL_STORM] ?? 0;
  const cannon = w.upgrades[EVOL_CANNON] ?? 0;
  const aegis = w.upgrades[EVOL_AEGIS] ?? 0;
  const saws = w.upgrades[UPG_SAWS] ?? 0;
  const tesla = w.upgrades[UPG_TESLA] ?? 0;
  const shot = w.upgrades[UPG_SHOTGUN] ?? 0;
  const fire = w.upgrades[UPG_FIRE] ?? 0;
  const mortar = w.upgrades[UPG_MORTAR] ?? 0;
  const vent = w.upgrades[UPG_VENT] ?? 0;
  if (storm > 0) return { name: "STORM", pips: storm, kind: EVOL_STORM };
  if (cannon > 0) return { name: "CANNON", pips: cannon, kind: EVOL_CANNON };
  if (aegis > 0) return { name: "AEGIS", pips: aegis, kind: EVOL_AEGIS };
  if (saws > 0 && saws >= tesla && saws >= shot) return { name: "SAWSTORM", pips: saws, kind: UPG_SAWS };
  if (tesla > 0 && tesla >= shot) return { name: "TESLA", pips: tesla, kind: UPG_TESLA };
  if (shot > 0) return { name: "SCATTER", pips: shot, kind: UPG_SHOTGUN };
  if (mortar > 0) return { name: "MORTAR", pips: mortar, kind: UPG_MORTAR };
  if (vent > 0) return { name: "VENT", pips: vent, kind: UPG_VENT };
  if (fire > 0) return { name: "OVERDRIVE", pips: fire, kind: UPG_FIRE };
  return { name: "RIVETER", pips: Math.max(1, w.upgrades[UPG_DMG] ?? 0), kind: -1 };
}

function ink(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, color: string, align: CanvasTextAlign = "left", weight = 700): void {
  ctx.font = font(size, weight);
  ctx.textAlign = align;
  ctx.textBaseline = "top";
  ctx.lineJoin = "round";
  ctx.lineWidth = Math.max(2, size * 0.16);
  ctx.strokeStyle = OUTLINE;
  ctx.strokeText(text, x, y);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

function brassPanel(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, inner: string): void {
  roundRect(ctx, x, y, w, h, r);
  ctx.fillStyle = OUTLINE;
  ctx.fill();
  roundRect(ctx, x + 2, y + 2, w - 4, h - 4, Math.max(1, r - 2));
  ctx.fillStyle = lit(ctx, x, y, w, h, BRASS);
  ctx.fill();
  roundRect(ctx, x + 5, y + 5, w - 10, h - 10, Math.max(1, r - 4));
  ctx.fillStyle = inner;
  ctx.fill();
}

function brassRing(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, inner: string): void {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = OUTLINE;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x, y, r - 2.2, 0, Math.PI * 2);
  const g = ctx.createLinearGradient(x - r, y - r, x + r, y + r);
  g.addColorStop(0, BRASS.hi);
  g.addColorStop(0.45, BRASS.mid);
  g.addColorStop(1, BRASS.lo);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x, y, r - 5.5, 0, Math.PI * 2);
  ctx.fillStyle = inner;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x, y, r - 3.4, Math.PI * 1.15, Math.PI * 1.9);
  ctx.strokeStyle = "rgba(255,255,255,0.65)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function flameIcon(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, tick: number): void {
  const k = 0.88 + Math.sin(tick * 0.18) * 0.1;
  flame(ctx, x, y, s * k);
  const g = ctx.createLinearGradient(x, y - s, x, y + s);
  g.addColorStop(0, "#fff4c0");
  g.addColorStop(0.45, "#ff9a22");
  g.addColorStop(1, "#e04010");
  ctx.fillStyle = g;
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  flame(ctx, x, y + s * 0.15, s * k * 0.45);
  ctx.fillStyle = "#fff1a8";
  ctx.fill();
}

function heartGauge(ctx: CanvasRenderingContext2D, w: World): void {
  const x = 26;
  const y = 28;
  const r = 18;
  brassRing(ctx, x, y, r, "#7a1822");
  const frac = w.maxHp > 0 ? Math.max(0, Math.min(1, w.hp / w.maxHp)) : 0;
  ctx.beginPath();
  ctx.arc(x, y, r - 3.2, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac);
  ctx.strokeStyle = "#ff5a48";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r - 6.2, 0, Math.PI * 2);
  ctx.clip();
  const g = ctx.createRadialGradient(x - 4, y - 5, 2, x, y, r);
  g.addColorStop(0, "#ff7a6a");
  g.addColorStop(1, "#9a1a22");
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  heart(ctx, x, y + 1.5, 7);
  const hg = ctx.createLinearGradient(x, y - 8, x, y + 10);
  hg.addColorStop(0, "#ffd4cc");
  hg.addColorStop(0.45, "#ff3b3b");
  hg.addColorStop(1, "#8c1420");
  ctx.fillStyle = hg;
  ctx.fill();
  ctx.lineWidth = 1.3;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  ctx.restore();
  ink(ctx, "GEARHEART", 50, 6, 8, "#ffe7ad");
  ink(ctx, `${Math.max(0, w.hp)}/${w.maxHp}`, 50, 16, 14, "#fff8ee");
  ink(ctx, `LV. ${w.level}`, 50, 32, 9, "#f0c86a");
  const need = xpNeed(w.level);
  const t = need <= 0 ? 0 : Math.min(1, w.xp / need);
  const bx = 62;
  const by = 45;
  const bw = 58;
  roundRect(ctx, bx, by, bw, 8, 4);
  ctx.fillStyle = lit(ctx, bx, by, bw, 8, BRASS);
  ctx.fill();
  ctx.lineWidth = 1.3;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  roundRect(ctx, bx + 2, by + 2, bw - 4, 4, 2);
  ctx.fillStyle = "#2a1c10";
  ctx.fill();
  roundRect(ctx, bx + 2, by + 2, Math.max(4, (bw - 4) * t), 4, 2);
  const bar = ctx.createLinearGradient(bx, by, bx + bw, by);
  bar.addColorStop(0, "#fff3b0");
  bar.addColorStop(1, "#ff9a1e");
  ctx.fillStyle = bar;
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(58, 45);
  ctx.lineTo(50, 49);
  ctx.lineTo(56, 49);
  ctx.lineTo(52, 54);
  ctx.lineTo(64, 46.5);
  ctx.lineTo(58, 46.5);
  ctx.closePath();
  ctx.fillStyle = "#ffe14a";
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  if (w.shield > 0) {
    for (let i = 0; i < w.shield; i++) {
      ctx.beginPath();
      ctx.arc(128 + i * 7, 18, 2.3, 0, Math.PI * 2);
      ctx.fillStyle = "#ffe7ad";
      ctx.fill();
      ctx.stroke();
    }
  }
}

function fitInk(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, max: number, color: string, weight = 800): void {
  ctx.font = font(size, weight);
  let s = size;
  while (s > 7 && ctx.measureText(text).width > max) {
    s -= 1;
    ctx.font = font(s, weight);
  }
  ink(ctx, text, x, y, s, color, "center", weight);
}

function banner(ctx: CanvasRenderingContext2D, w: World): void {
  const x = 148;
  const y = 4;
  const bw = 168;
  const bh = 44;
  const name = difficultyLabel(w.rank);
  const flash = w.rankFlash > 0 && ((w.tick >> 2) & 1) === 0;
  brassPanel(ctx, x, y, bw, bh, 12, "#1a2744");
  ink(ctx, "DIFFICULTY", x + bw / 2, y + 5, 8, "#f0c86a", "center");
  fitInk(ctx, name, x + bw / 2, y + 16, 12, bw - 18, flash ? "#fff3c0" : "#fff8ee");
  const litN = Math.max(1, Math.min(6, Math.ceil(tierFrac(w.tick) * 6)));
  for (let i = 0; i < 6; i++) cog(ctx, x + 34 + i * 18, y + 35, 4, w.tick * 0.015 + i, i < litN ? BRASS : { hi: "#6a5430", mid: "#4a381c", lo: "#2a2014", edge: "#1a120c" }, 6, i < litN);
  flameIcon(ctx, x - 2, y + 30, 9, w.tick);
  flameIcon(ctx, x + bw + 2, y + 30, 9, w.tick + 10);
}

function clockIcon(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.beginPath();
  ctx.arc(x, y, 6.2, 0, Math.PI * 2);
  ctx.fillStyle = "#142033";
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = "#ffe7ad";
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y - 3.6);
  ctx.moveTo(x, y);
  ctx.lineTo(x + 2.6, y + 1.2);
  ctx.stroke();
}

function skull(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.beginPath();
  ctx.arc(x, y - 1, 5, 0, Math.PI * 2);
  ctx.fillStyle = "#f4f0e6";
  ctx.fill();
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  ctx.fillStyle = "#1c120c";
  ctx.beginPath();
  ctx.arc(x - 1.8, y - 1.4, 1.2, 0, Math.PI * 2);
  ctx.arc(x + 1.8, y - 1.4, 1.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(x - 2.2, y + 3, 1.2, 2);
  ctx.fillRect(x - 0.5, y + 3, 1.2, 2);
  ctx.fillRect(x + 1.2, y + 3, 1.2, 2);
}

function clockPanel(ctx: CanvasRenderingContext2D, w: World): void {
  const x = 328;
  const y = 4;
  brassPanel(ctx, x, y, 104, 44, 12, "#1a2744");
  clockIcon(ctx, x + 14, y + 16);
  ink(ctx, formatClock(w.tick), x + 24, y + 8, 12, "#fff8ee");
  skull(ctx, x + 14, y + 32);
  ink(ctx, String(w.score), x + 24, y + 24, 12, "#fff8ee");
}

function pauseButton(ctx: CanvasRenderingContext2D): void {
  brassRing(ctx, PAUSE_X, PAUSE_Y, PAUSE_R, "#1a2744");
  ctx.fillStyle = "#ffe7ad";
  ctx.fillRect(PAUSE_X - 4.2, PAUSE_Y - 5, 2.6, 10);
  ctx.fillRect(PAUSE_X + 1.6, PAUSE_Y - 5, 2.6, 10);
}

function minimap(ctx: CanvasRenderingContext2D, w: World): void {
  const cx = 48;
  const cy = 262;
  const r = 32;
  brassRing(ctx, cx, cy, r, "#102033");
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r - 6, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = "#16324a";
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  ctx.strokeStyle = "rgba(160,210,230,0.2)";
  ctx.lineWidth = 1;
  ctx.strokeRect(cx - 18, cy - 18, 36, 36);
  const z = w.zombies;
  const span = r * 1.45;
  for (let i = 0; i < z.alive.length; i++) {
    if (!z.alive[i]) continue;
    const mx = cx + ((z.x[i] ?? 0) / W - 0.5) * span;
    const my = cy + ((z.y[i] ?? 0) / H - 0.5) * span;
    const kind = (z.kind[i] ?? 0) & Z_KIND;
    ctx.fillStyle = kind === Z_BRUTE ? "#d06aff"
      : kind === Z_GHOUL ? "#3ad4f0"
      : kind === Z_SPITTER ? "#c6f25a"
      : kind === Z_GAS ? "#e08a30"
      : kind === Z_KNIGHT ? "#e07040"
      : kind === Z_RAT ? "#f0b03a"
      : "#9ae046";
    ctx.fillRect(mx - 1.3, my - 1.3, 2.6, 2.6);
  }
  ctx.save();
  ctx.translate(cx + (w.px / W - 0.5) * span, cy + (w.py / H - 0.5) * span);
  ctx.rotate(Math.atan2(w.aimY, w.aimX || 1));
  ctx.beginPath();
  ctx.moveTo(5, 0);
  ctx.lineTo(-3.4, 2.6);
  ctx.lineTo(-3.4, -2.6);
  ctx.closePath();
  ctx.fillStyle = "#fff8ee";
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  ctx.restore();
  ctx.restore();
  roundRect(ctx, 8, 290, 86, 16, 6);
  ctx.fillStyle = lit(ctx, 8, 290, 86, 16, BRASS);
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  roundRect(ctx, 10, 292, 82, 12, 4);
  ctx.fillStyle = "#1c120c";
  ctx.fill();
  ink(ctx, "CLOCKTOWER YARD", 51, 293, 7, "#ffe7ad", "center");
}

function badgeIcon(ctx: CanvasRenderingContext2D, kind: number, x: number, y: number, tick: number): void {
  if (kind === UPG_FIRE) {
    flameIcon(ctx, x, y + 6, 10, tick);
    return;
  }
  if (kind === UPG_TESLA) {
    bolt(ctx, x, y, 12);
    return;
  }
  if (kind === UPG_SHOTGUN) {
    pellets(ctx, x, y, 8);
    return;
  }
  cog(ctx, x, y, 12, tick * 0.02, BRASS, 8, true);
}

function ability(ctx: CanvasRenderingContext2D, w: World): void {
  const cx = 430;
  const cy = 258;
  const info = weaponBadge(w);
  brassRing(ctx, cx, cy, 28, "#1a2744");
  badgeIcon(ctx, info.kind, cx, cy, w.tick);
  roundRect(ctx, cx - 40, 290, 80, 16, 6);
  ctx.fillStyle = lit(ctx, cx - 40, 290, 80, 16, BRASS);
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  roundRect(ctx, cx - 38, 292, 76, 12, 4);
  ctx.fillStyle = "#1c120c";
  ctx.fill();
  ink(ctx, info.name, cx, 293, 8, "#ffe7ad", "center");
  const n = Math.max(1, Math.min(UPG_MAX, info.pips));
  for (let i = 0; i < UPG_MAX; i++) {
    ctx.beginPath();
    ctx.arc(cx - 16 + i * 8, 312, 2.4, 0, Math.PI * 2);
    ctx.fillStyle = i < n ? "#ff9a1e" : "#3a2a18";
    ctx.fill();
  }
}

export function drawHud(ctx: CanvasRenderingContext2D, w: World): void {
  heartGauge(ctx, w);
  if (!w.choosing) banner(ctx, w);
  clockPanel(ctx, w);
  pauseButton(ctx);
  if (!w.choosing) {
    minimap(ctx, w);
    ability(ctx, w);
    rankCallout(ctx, w);
  }
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}

function rankCallout(ctx: CanvasRenderingContext2D, w: World): void {
  if (w.banner <= 0 || w.over) return;
  const name = difficultyLabel(w.rank);
  const flash = ((w.tick >> 2) & 1) === 0;
  const bw = 240;
  const bh = 52;
  const x = (W - bw) / 2;
  const y = 64;
  brassPanel(ctx, x, y, bw, bh, 14, "#1a2744");
  ink(ctx, "RANK UP", x + bw / 2, y + 6, 10, flash ? "#ffb060" : "#f0c86a", "center");
  fitInk(ctx, name, x + bw / 2, y + 22, 16, bw - 24, flash ? "#fff3c0" : "#fff8ee");
}

function wrap(ctx: CanvasRenderingContext2D, text: string, max: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (let i = 0; i < words.length; i++) {
    const word = words[i] ?? "";
    const next = cur ? `${cur} ${word}` : word;
    if (ctx.measureText(next).width > max && cur) {
      lines.push(cur);
      cur = word;
    } else cur = next;
  }
  if (cur) lines.push(cur);
  return lines;
}

function bolt(ctx: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  ctx.beginPath();
  ctx.moveTo(x + s * 0.15, y - s);
  ctx.lineTo(x - s * 0.45, y + s * 0.05);
  ctx.lineTo(x - s * 0.05, y + s * 0.05);
  ctx.lineTo(x - s * 0.2, y + s);
  ctx.lineTo(x + s * 0.55, y - s * 0.12);
  ctx.lineTo(x + s * 0.05, y - s * 0.12);
  ctx.closePath();
  const g = ctx.createLinearGradient(x, y - s, x, y + s);
  g.addColorStop(0, "#fff6c8");
  g.addColorStop(1, "#ffb020");
  ctx.fillStyle = g;
  ctx.fill();
  ctx.lineWidth = 1.4;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
}

function pellets(ctx: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.arc(x + i * s * 0.7, y + Math.abs(i) * 2, s * 0.38, 0, Math.PI * 2);
    ctx.fillStyle = i === 0 ? "#fff1c2" : BRASS.mid;
    ctx.fill();
    ctx.lineWidth = 1.3;
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();
  }
}

function shieldIcon(ctx: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  ctx.beginPath();
  ctx.moveTo(x, y - s);
  ctx.lineTo(x + s * 0.85, y - s * 0.55);
  ctx.lineTo(x + s * 0.7, y + s * 0.35);
  ctx.quadraticCurveTo(x, y + s * 1.05, x - s * 0.7, y + s * 0.35);
  ctx.lineTo(x - s * 0.85, y - s * 0.55);
  ctx.closePath();
  ctx.fillStyle = lit(ctx, x - s, y - s, s * 2, s * 2, BRASS);
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
}

function arrow(ctx: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  ctx.beginPath();
  ctx.moveTo(x - s, y);
  ctx.lineTo(x + s * 0.15, y);
  ctx.moveTo(x, y - s * 0.5);
  ctx.lineTo(x + s, y);
  ctx.lineTo(x, y + s * 0.5);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.lineWidth = 4.4;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  ctx.lineWidth = 2.2;
  ctx.strokeStyle = "#ffe7ad";
  ctx.stroke();
}

function chevrons(ctx: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  ctx.lineWidth = 2.2;
  ctx.strokeStyle = "#ffe7ad";
  ctx.lineJoin = "round";
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(x - s * 0.45, y - s * 0.4 + i * s * 0.35);
    ctx.lineTo(x + s * 0.15, y + i * s * 0.35);
    ctx.lineTo(x - s * 0.45, y + s * 0.4 + i * s * 0.35);
    ctx.stroke();
  }
}

function iconFor(ctx: CanvasRenderingContext2D, id: number, x: number, y: number): void {
  ctx.save();
  ctx.translate(x, y);
  if (id === UPG_TESLA) bolt(ctx, 0, 0, 12);
  else if (id === UPG_SHOTGUN) pellets(ctx, 0, 0, 8);
  else if (id === UPG_SAWS) cog(ctx, 0, 0, 12, 0.2, BRASS, 8, true);
  else if (id === UPG_FIRE) flameIcon(ctx, 0, 4, 12, 0);
  else if (id === UPG_HP) {
    heart(ctx, 0, 2, 10);
    ctx.fillStyle = "#ff4450";
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();
  }   else if (id === UPG_SPEED) chevrons(ctx, 0, 0, 12);
  else if (id === UPG_VENT) flameIcon(ctx, 0, 4, 12, 1);
  else if (id === UPG_PIERCE) arrow(ctx, 0, 0, 12);
  else if (id === UPG_SHIELD) shieldIcon(ctx, 0, 0, 12);
  else cog(ctx, 0, 0, 12, 0.1, BRASS, 8, true);
  ctx.restore();
}

function drawCard(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, id: number, index: number, world: World): void {
  roundRect(ctx, x, y, w, h, 12);
  ctx.fillStyle = OUTLINE;
  ctx.fill();
  roundRect(ctx, x + 3, y + 3, w - 6, h - 6, 10);
  ctx.fillStyle = lit(ctx, x, y, w, h, BRASS);
  ctx.fill();
  roundRect(ctx, x + 6, y + 6, w - 12, h - 12, 8);
  const bg = ctx.createLinearGradient(x, y, x, y + h);
  bg.addColorStop(0, "#2c5284");
  bg.addColorStop(1, "#14243c");
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + 16, y + 16, 9, 0, Math.PI * 2);
  ctx.fillStyle = BRASS.mid;
  ctx.fill();
  ctx.lineWidth = 1.4;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  ink(ctx, String(index + 1), x + 16, y + 10, 11, "#1c120c", "center");
  if (id < 0) {
    ink(ctx, "—", x + w / 2, y + h / 2, 16, "#f0c86a", "center");
    return;
  }
  const rarity = UPG_RARITY[id] ?? 0;
  const tag = rarityName(rarity);
  const tagColor = rarity >= 2 ? "#ff9a1e" : rarity === 1 ? "#7ad0ff" : "#f0c86a";
  ink(ctx, tag, x + w / 2, y + 26, 8, tagColor, "center");
  iconFor(ctx, id, x + w / 2, y + 52);
  const name = upgName(id) || "GEAR";
  ctx.font = font(12, 800);
  let size = 12;
  while (size > 8 && ctx.measureText(name).width > w - 18) {
    size -= 1;
    ctx.font = font(size, 800);
  }
  ink(ctx, name, x + w / 2, y + 74, size, "#ffe7ad", "center", 800);
  ctx.font = font(9, 600);
  const lines = wrap(ctx, blurbFor(id), w - 22);
  for (let i = 0; i < lines.length && i < 3; i++) ink(ctx, lines[i] ?? "", x + w / 2, y + 94 + i * 12, 9, "#f4f8fc", "center", 600);
  const lv = world.upgrades[id] ?? 0;
  for (let p = 0; p < UPG_MAX; p++) {
    ctx.beginPath();
    ctx.arc(x + w / 2 - (UPG_MAX - 1) * 6 + p * 12, y + h - 18, 3.3, 0, Math.PI * 2);
    ctx.fillStyle = p < lv ? "#ff9a1e" : p === lv ? "#fff1c2" : "#0e1828";
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();
  }
}

export function drawCards(ctx: CanvasRenderingContext2D, w: World): void {
  if (!w.choosing) return;
  const bw = 168;
  const bx = (W - bw) / 2;
  const by = CARD_Y - 24;
  roundRect(ctx, bx, by, bw, 20, 9);
  const ribbon = ctx.createLinearGradient(bx, by, bx, by + 20);
  ribbon.addColorStop(0, "#c45ad4");
  ribbon.addColorStop(1, "#6e2484");
  ctx.fillStyle = ribbon;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  ink(ctx, "CHOOSE YOUR UPGRADE", W / 2, by + 4, 10, "#fff8ee", "center");
  for (let i = 0; i < OFFER_N; i++) drawCard(ctx, CARD_X0 + i * (CARD_W + CARD_GAP), CARD_Y, CARD_W, CARD_H, w.offers[i] ?? -1, i, w);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}
