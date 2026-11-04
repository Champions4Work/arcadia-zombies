import { ARENA_H, ARENA_W } from "../sim/arena";
import { tierFrac, tierName } from "../sim/difficulty";
import { lichUp, lichX, lichY, runLabel } from "../sim/finale";
import { Z_GAS, Z_KIND, Z_KNIGHT, Z_RAT, Z_SPITTER } from "../sim/foes";
import { offerCount } from "../sim/characters";
import { pacedXpNeed } from "../sim/modifiers";
import { CARD_Y, cardFrame, offerId, xpNeed } from "../sim/progress";
import {
  EVOL_AEGIS, EVOL_CANNON, EVOL_STORM, H, UNION_BELLOWS, UNION_BRIAR, UNION_CALLIOPE,
  UNION_CROWN, UNION_HALO, UNION_HEART, UNION_HOWITZER, UPG_DMG, UPG_FIRE, UPG_MAX, UPG_MORTAR,
  UPG_SAWS, UPG_SHOTGUN, UPG_TESLA, UPG_VENT, W, Z_BRUTE, Z_GHOUL, type World,
} from "../sim/types";
import { currentHud, offerCards, pauseHitAt } from "../shell/hud-layout";
import type { Box, Circle, HudLayout } from "../shell/hud-layout";
import { drawRewardCard } from "./cards";
import { drawIcon } from "./icons";
import { ultFill, ultReady } from "../sim/ult";
import { BRASS, cog, font, heart, lit, OUTLINE, rivet, roundRect } from "./paint";
import { drawXpBar } from "./xp-gain";

export { blurbFor } from "./icons";

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
  const layout = currentHud();
  if (layout) return pauseHitAt(layout, x, y);
  const dx = x - PAUSE_X;
  const dy = y - PAUSE_Y;
  return dx * dx + dy * dy <= (PAUSE_R + 6) * (PAUSE_R + 6);
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
  if ((w.upgrades[UNION_CROWN] ?? 0) > 0) return { name: "CROWN", pips: 1, kind: UNION_CROWN };
  if ((w.upgrades[UNION_BELLOWS] ?? 0) > 0) return { name: "GATLING", pips: 1, kind: UNION_BELLOWS };
  if ((w.upgrades[UNION_HALO] ?? 0) > 0) return { name: "HALO", pips: 1, kind: UNION_HALO };
  if ((w.upgrades[UNION_HEART] ?? 0) > 0) return { name: "HEART", pips: 1, kind: UNION_HEART };
  if ((w.upgrades[UNION_BRIAR] ?? 0) > 0) return { name: "BRIAR", pips: 1, kind: UNION_BRIAR };
  if ((w.upgrades[UNION_HOWITZER] ?? 0) > 0) return { name: "HOWITZER", pips: 1, kind: UNION_HOWITZER };
  if ((w.upgrades[UNION_CALLIOPE] ?? 0) > 0) return { name: "CALLIOPE", pips: 1, kind: UNION_CALLIOPE };
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

function plate(ctx: CanvasRenderingContext2D, box: Box, r: number, inner: string): void {
  brassPanel(ctx, box.x, box.y, box.w, box.h, r, inner);
  rivet(ctx, box.x + 8, box.y + 8, 2.1);
  rivet(ctx, box.x + box.w - 8, box.y + 8, 2.1);
  rivet(ctx, box.x + 8, box.y + box.h - 8, 2.1);
  rivet(ctx, box.x + box.w - 8, box.y + box.h - 8, 2.1);
}

function drawHealth(ctx: CanvasRenderingContext2D, w: World, box: Box): void {
  const frac = w.maxHp > 0 ? Math.max(0, Math.min(1, w.hp / w.maxHp)) : 0;
  const low = frac <= 0.35;
  const pulse = low ? 0.7 + 0.3 * (0.5 + 0.5 * Math.sin(w.tick * 0.28)) : 1;
  plate(ctx, box, 14, "#14080c");
  const cx = box.x + Math.min(36, box.w * 0.34);
  const cy = box.y + box.h * 0.52;
  const r = Math.min(28, box.h * 0.38);
  ctx.save();
  ctx.globalAlpha = pulse;
  brassRing(ctx, cx, cy, r, "#7a1822");
  ctx.beginPath();
  ctx.arc(cx, cy, r - 4, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac);
  ctx.strokeStyle = low ? "#ff7a3a" : "#ff5a48";
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.restore();
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r - 8, 0, Math.PI * 2);
  ctx.clip();
  const well = ctx.createRadialGradient(cx - 6, cy - 7, 2, cx, cy, r);
  well.addColorStop(0, "#ff8a78");
  well.addColorStop(1, "#6a1018");
  ctx.fillStyle = well;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  heart(ctx, cx, cy + 2, r * 0.42);
  const hg = ctx.createLinearGradient(cx, cy - r * 0.5, cx, cy + r * 0.55);
  hg.addColorStop(0, "#fff0e4");
  hg.addColorStop(0.4, low ? "#ff7040" : "#ff3b3b");
  hg.addColorStop(1, "#6a1018");
  ctx.fillStyle = hg;
  ctx.fill();
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  ctx.restore();
  const tx = cx + r + 8;
  ink(ctx, "GEARHEART", tx, box.y + 8, 9, "#ffe7ad");
  ink(ctx, `${Math.max(0, w.hp)}/${w.maxHp}`, tx, box.y + box.h * 0.34, Math.min(22, box.h * 0.3), "#fff8ee");
  if (w.meta.revive > 0) ink(ctx, "REV", tx, box.y + box.h - 22, 10, "#ffb060");
  if (w.shield > 0) {
    for (let i = 0; i < w.shield; i++) {
      ctx.beginPath();
      ctx.arc(tx + 8 + i * 9, box.y + box.h - 12, 3, 0, Math.PI * 2);
      ctx.fillStyle = "#ffe7ad";
      ctx.fill();
      ctx.strokeStyle = OUTLINE;
      ctx.stroke();
    }
  }
}

function drawXp(ctx: CanvasRenderingContext2D, w: World, layout: HudLayout): void {
  const need = pacedXpNeed(xpNeed(w.level), w.mods);
  drawXpBar(ctx, layout, need);
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

function banner(ctx: CanvasRenderingContext2D, w: World, box: Box): void {
  const name = difficultyLabel(w.rank);
  const flash = w.rankFlash > 0 && ((w.tick >> 2) & 1) === 0;
  plate(ctx, box, 12, "#10182c");
  ink(ctx, "DIFFICULTY", box.x + box.w / 2, box.y + 5, 9, "#ffe7ad", "center");
  fitInk(ctx, name, box.x + box.w / 2, box.y + 16, 14, box.w - 20, flash ? "#fff3c0" : "#fff8ee");
  const litN = Math.max(1, Math.min(6, Math.ceil(tierFrac(w.tick) * 6)));
  const cogY = box.y + box.h - 10;
  const span = Math.max(12, (box.w - 36) / 6);
  for (let i = 0; i < 6; i++) {
    const on = i < litN;
    cog(ctx, box.x + 18 + i * span, cogY, 5, w.tick * 0.015 + i, on ? BRASS : { hi: "#6a5430", mid: "#4a381c", lo: "#2a2014", edge: "#1a120c" }, 6, on);
  }
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

function clockPanel(ctx: CanvasRenderingContext2D, w: World, box: Box): void {
  plate(ctx, box, 12, "#10182c");
  clockIcon(ctx, box.x + 16, box.y + 16);
  const label = runLabel(w.tick);
  ink(ctx, label, box.x + 28, box.y + 8, label.length > 5 ? 11 : 15, "#fff8ee");
  skull(ctx, box.x + 16, box.y + box.h - 14);
  ink(ctx, String(w.kills), box.x + 28, box.y + box.h - 22, 14, "#fff8ee");
}

function pauseButton(ctx: CanvasRenderingContext2D, pause: Circle): void {
  brassRing(ctx, pause.x, pause.y, pause.r, "#10182c");
  ctx.fillStyle = "#ffe7ad";
  ctx.fillRect(pause.x - 4.6, pause.y - 6, 3, 12);
  ctx.fillRect(pause.x + 1.6, pause.y - 6, 3, 12);
}

function minimap(ctx: CanvasRenderingContext2D, w: World, box: Box): void {
  const labelH = 16;
  const r = Math.max(16, Math.min(box.w, box.h - labelH) / 2);
  const cx = box.x + box.w / 2;
  const cy = box.y + r + 2;
  brassRing(ctx, cx, cy, r, "#0c1828");
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r - 6, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = "#16324a";
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  ctx.strokeStyle = "rgba(220,240,255,0.28)";
  ctx.lineWidth = 1;
  ctx.strokeRect(cx - r * 0.55, cy - r * 0.55, r * 1.1, r * 1.1);
  const z = w.zombies;
  const span = r * 1.45;
  let alive = 0;
  for (let i = 0; i < z.alive.length; i++) if (z.alive[i]) alive++;
  const step = alive > 96 ? Math.ceil(alive / 96) : 1;
  let seen = 0;
  for (let i = 0; i < z.alive.length; i++) {
    if (!z.alive[i]) continue;
    if (step > 1 && seen++ % step !== 0) continue;
    const mx = cx + ((z.x[i] ?? 0) / ARENA_W - 0.5) * span;
    const my = cy + ((z.y[i] ?? 0) / ARENA_H - 0.5) * span;
    const kind = (z.kind[i] ?? 0) & Z_KIND;
    ctx.fillStyle = kind === Z_BRUTE ? "#d06aff"
      : kind === Z_GHOUL ? "#3ad4f0"
      : kind === Z_SPITTER ? "#c6f25a"
      : kind === Z_GAS ? "#e08a30"
      : kind === Z_KNIGHT ? "#e07040"
      : kind === Z_RAT ? "#f0b03a"
      : "#9ae046";
    ctx.fillRect(mx - 1.4, my - 1.4, 2.8, 2.8);
  }
  if (lichUp(w)) {
    const lx = cx + (lichX(w) / ARENA_W - 0.5) * span;
    const ly = cy + (lichY(w) / ARENA_H - 0.5) * span;
    ctx.fillStyle = "#e4c0ff";
    ctx.fillRect(lx - 2, ly - 2, 4, 4);
  }
  const vx = cx + (w.arena.camX / ARENA_W - 0.5) * span;
  const vy = cy + (w.arena.camY / ARENA_H - 0.5) * span;
  ctx.strokeStyle = "#ffe7ad";
  ctx.lineWidth = 1.4;
  ctx.strokeRect(vx, vy, (W / ARENA_W) * span, (H / ARENA_H) * span);
  ctx.save();
  ctx.translate(cx + (w.px / ARENA_W - 0.5) * span, cy + (w.py / ARENA_H - 0.5) * span);
  ctx.rotate(Math.atan2(w.aimY, w.aimX || 1));
  ctx.beginPath();
  ctx.moveTo(6, 0);
  ctx.lineTo(-3.6, 2.8);
  ctx.lineTo(-3.6, -2.8);
  ctx.closePath();
  ctx.fillStyle = "#fff8ee";
  ctx.fill();
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  ctx.restore();
  ctx.restore();
  const ly = box.y + box.h - 16;
  roundRect(ctx, box.x, ly, box.w, 16, 6);
  ctx.fillStyle = lit(ctx, box.x, ly, box.w, 16, BRASS);
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  ink(ctx, "YARD", box.x + box.w / 2, ly + 3, 8, "#1c120c", "center");
}

function badgeIcon(ctx: CanvasRenderingContext2D, kind: number, x: number, y: number): void {
  drawIcon(ctx, kind, x, y, 12);
}

export function abilityHit(x: number, y: number): boolean {
  const layout = currentHud();
  if (!layout) return false;
  const b = layout.ability;
  return x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h;
}

function ability(ctx: CanvasRenderingContext2D, w: World, box: Box): void {
  const info = weaponBadge(w);
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h * 0.42;
  const r = Math.min(28, box.w * 0.32);
  brassRing(ctx, cx, cy, r, "#10182c");
  badgeIcon(ctx, info.kind, cx, cy);
  const fill = ultFill(w);
  ctx.beginPath();
  ctx.arc(cx, cy, r - 1.5, -Math.PI / 2, -Math.PI / 2 + fill * Math.PI * 2);
  ctx.strokeStyle = ultReady(w) || (w.ultBlast ?? 0) > 0 ? "#ffe14a" : "#7ad0ff";
  ctx.lineWidth = 3.4;
  ctx.stroke();
  if (ultReady(w) || (w.ultBlast ?? 0) > 0) {
    ctx.globalAlpha = 0.4 + 0.25 * Math.sin(w.tick * 0.28);
    ctx.beginPath();
    ctx.arc(cx, cy, r + 4, 0, Math.PI * 2);
    ctx.strokeStyle = "#ffe14a";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  const ly = box.y + box.h - 22;
  roundRect(ctx, box.x, ly, box.w, 16, 6);
  ctx.fillStyle = lit(ctx, box.x, ly, box.w, 16, BRASS);
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  ink(ctx, info.name, cx, ly + 3, 8, "#1c120c", "center");
  const n = Math.max(1, Math.min(UPG_MAX, info.pips));
  for (let i = 0; i < UPG_MAX; i++) {
    ctx.beginPath();
    ctx.arc(cx - 16 + i * 8, box.y + 8, 2.6, 0, Math.PI * 2);
    ctx.fillStyle = i < n ? "#ff9a1e" : "#3a2a18";
    ctx.fill();
  }
}

export function drawHud(ctx: CanvasRenderingContext2D, w: World): void {
  const layout = currentHud();
  if (!layout) return;
  ctx.save();
  const dpr = ctx.canvas.width / Math.max(1, layout.view.w);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawHealth(ctx, w, layout.hero);
  drawXp(ctx, w, layout);
  if (!w.choosing) banner(ctx, w, layout.difficulty);
  clockPanel(ctx, w, layout.clock);
  pauseButton(ctx, layout.pause);
  if (!w.choosing) {
    minimap(ctx, w, layout.minimap);
    ability(ctx, w, layout.ability);
    rankCallout(ctx, w, layout);
  }
  ctx.restore();
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}

function rankCallout(ctx: CanvasRenderingContext2D, w: World, layout: HudLayout): void {
  if (w.banner <= 0 || w.over) return;
  const name = difficultyLabel(w.rank);
  const flash = ((w.tick >> 2) & 1) === 0;
  const bw = Math.min(280, layout.view.w * 0.72);
  const bh = 52;
  const x = (layout.view.w - bw) / 2;
  const y = layout.difficulty.y + layout.difficulty.h + 10;
  plate(ctx, { x, y, w: bw, h: bh }, 14, "#10182c");
  ink(ctx, "RANK UP", x + bw / 2, y + 6, 11, flash ? "#ffb060" : "#f0c86a", "center");
  fitInk(ctx, name, x + bw / 2, y + 22, 16, bw - 24, flash ? "#fff3c0" : "#fff8ee");
}

function drawCard(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, id: number, index: number, world: World): void {
  drawRewardCard(ctx, x, y, w, h, id, world, index);
}

export function drawCards(ctx: CanvasRenderingContext2D, w: World): void {
  if (!w.choosing) return;
  const layout = currentHud();
  const slots = offerCount(w);
  const cards = layout ? offerCards(layout.view, slots) : null;
  ctx.save();
  if (layout) {
    const dpr = ctx.canvas.width / Math.max(1, layout.view.w);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  const midX = layout ? layout.view.w / 2 : W / 2;
  const by = cards?.[0] ? cards[0].y - 28 : CARD_Y - 24;
  const bw = 168;
  const bx = midX - bw / 2;
  roundRect(ctx, bx, by, bw, 20, 9);
  const ribbon = ctx.createLinearGradient(bx, by, bx, by + 20);
  ribbon.addColorStop(0, "#c45ad4");
  ribbon.addColorStop(1, "#6e2484");
  ctx.fillStyle = ribbon;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  ink(ctx, "CHOOSE YOUR UPGRADE", midX, by + 4, 10, "#fff8ee", "center");
  for (let i = 0; i < slots; i++) {
    const f = cards?.[i] ?? cardFrame(i, slots);
    drawCard(ctx, f.x, f.y, f.w, f.h, offerId(w, i), i, w);
  }
  ctx.restore();
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}
