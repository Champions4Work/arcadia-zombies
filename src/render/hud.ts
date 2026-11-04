import { ARENA_H, ARENA_W } from "../sim/arena";
import { tierFrac, tierName } from "../sim/difficulty";
import { lichUp, lichX, lichY } from "../sim/finale";
import { Z_GAS, Z_KIND, Z_KNIGHT, Z_RAT, Z_SPITTER } from "../sim/foes";
import { offerCount } from "../sim/characters";
import { pacedXpNeed } from "../sim/modifiers";
import { CARD_Y, cardFrame, offerId, xpNeed } from "../sim/progress";
import {
  EVOL_AEGIS, EVOL_CANNON, EVOL_STORM, H, UNION_BELLOWS, UNION_BRIAR, UNION_CALLIOPE,
  UNION_CROWN, UNION_HALO, UNION_HEART, UNION_HOWITZER, UPG_DMG, UPG_FIRE, UPG_MORTAR,
  UPG_SAWS, UPG_SHOTGUN, UPG_TESLA, UPG_VENT, W, Z_BRUTE, Z_GHOUL, type World,
} from "../sim/types";
import { currentHud, offerCards, pauseHitAt } from "../shell/hud-layout";
import type { Box, Circle, HudLayout } from "../shell/hud-layout";
import { drawRewardCard } from "./cards";
import { drawIcon } from "./icons";
import { ultFill, ultReady } from "../sim/ult";
import { BRASS_HI, COPPER, DANGER, HEALTH, INK, IRON, SOOT, STEAM, STEAM_DIM, XP } from "../shell/theme";
import { BRASS, cog, copyFont, font, heart, lit, OUTLINE, rivet, roundRect } from "./paint";
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
  ctx.lineWidth = Math.max(1.4, size * 0.12);
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
  const pad = Math.min(6, box.w * 0.18, box.h * 0.18);
  rivet(ctx, box.x + pad, box.y + pad, 1.6);
  rivet(ctx, box.x + box.w - pad, box.y + pad, 1.6);
  rivet(ctx, box.x + pad, box.y + box.h - pad, 1.6);
  rivet(ctx, box.x + box.w - pad, box.y + box.h - pad, 1.6);
}

function chip(ctx: CanvasRenderingContext2D, box: Box, r: number, inner: string): void {
  brassPanel(ctx, box.x, box.y, box.w, box.h, r, inner);
}

function drawHealth(ctx: CanvasRenderingContext2D, w: World, box: Box): void {
  const frac = w.maxHp > 0 ? Math.max(0, Math.min(1, w.hp / w.maxHp)) : 0;
  const low = frac <= 0.35;
  const pulse = low ? 0.7 + 0.3 * (0.5 + 0.5 * Math.sin(w.tick * 0.28)) : 1;
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  const r = Math.min(box.w, box.h) * 0.46;
  ctx.save();
  ctx.globalAlpha = pulse;
  brassRing(ctx, cx, cy, r, IRON);
  ctx.beginPath();
  ctx.arc(cx, cy, r - 3, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac);
  ctx.strokeStyle = low ? DANGER : HEALTH;
  ctx.lineWidth = 3.4;
  ctx.stroke();
  ctx.restore();
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r - 6.5, 0, Math.PI * 2);
  ctx.clip();
  const well = ctx.createRadialGradient(cx - 4, cy - 5, 2, cx, cy, r);
  well.addColorStop(0, low ? DANGER : HEALTH);
  well.addColorStop(1, SOOT);
  ctx.fillStyle = well;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  heart(ctx, cx, cy + 1, r * 0.38);
  const hg = ctx.createLinearGradient(cx, cy - r * 0.5, cx, cy + r * 0.55);
  hg.addColorStop(0, STEAM);
  hg.addColorStop(0.4, low ? DANGER : HEALTH);
  hg.addColorStop(1, IRON);
  ctx.fillStyle = hg;
  ctx.fill();
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  ctx.restore();
  if (w.meta.revive > 0) ink(ctx, "REV", box.x + 2, box.y + 4, 8, COPPER);
  if (w.shield > 0) {
    for (let i = 0; i < w.shield; i++) {
      ctx.beginPath();
      ctx.arc(box.x + 5 + i * 6, box.y + 5, 2.2, 0, Math.PI * 2);
      ctx.fillStyle = BRASS_HI;
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

function barInk(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, color: string, align: CanvasTextAlign = "left"): void {
  ctx.font = copyFont(size, 800);
  ctx.textAlign = align;
  ctx.textBaseline = "top";
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

function fitInk(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, max: number, color: string): void {
  ctx.font = copyFont(size, 800);
  let s = size;
  while (s > 10 && ctx.measureText(text).width > max) {
    s -= 1;
    ctx.font = copyFont(s, 800);
  }
  barInk(ctx, text, x, y, s, color, "center");
}

function banner(ctx: CanvasRenderingContext2D, w: World, box: Box): void {
  const name = difficultyLabel(w.rank);
  const flash = w.rankFlash > 0 && ((w.tick >> 2) & 1) === 0;
  chip(ctx, box, 8, SOOT);
  const pip = 3.4;
  const pipSpan = Math.min(11, (box.w * 0.42) / 6);
  const pipX = box.x + 8;
  const pipY = box.y + box.h * 0.5;
  const litN = Math.max(1, Math.min(6, Math.ceil(tierFrac(w.tick) * 6)));
  for (let i = 0; i < 6; i++) {
    const on = i < litN;
    cog(ctx, pipX + i * pipSpan, pipY, pip, w.tick * 0.015 + i, on ? BRASS : { hi: "#6a5430", mid: "#4a381c", lo: "#2a2014", edge: "#1a120c" }, 6, on);
  }
  const nameX = pipX + 6 * pipSpan + 8;
  const nameW = Math.max(24, box.x + box.w - 8 - nameX);
  ctx.font = copyFont(12, 800);
  let s = 12;
  while (s > 10 && ctx.measureText(name).width > nameW) {
    s -= 1;
    ctx.font = copyFont(s, 800);
  }
  barInk(ctx, name, nameX, box.y + Math.max(2, (box.h - s) / 2), s, flash ? BRASS_HI : STEAM);
}

function clockIcon(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.beginPath();
  ctx.arc(x, y, 6.2, 0, Math.PI * 2);
  ctx.fillStyle = IRON;
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = BRASS_HI;
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
  ctx.fillStyle = STEAM;
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
  chip(ctx, box, 8, SOOT);
  const mid = box.y + box.h * 0.5;
  clockIcon(ctx, box.x + 10, mid);
  const ty = box.y + Math.max(2, (box.h - 11) / 2);
  barInk(ctx, formatClock(w.tick), box.x + 20, ty, 11, STEAM);
  const kill = String(w.kills);
  skull(ctx, box.x + box.w - 18 - kill.length * 6.2, mid);
  barInk(ctx, kill, box.x + box.w - 8, ty, 11, STEAM, "right");
}

function pauseButton(ctx: CanvasRenderingContext2D, pause: Circle): void {
  brassRing(ctx, pause.x, pause.y, pause.r, SOOT);
  ctx.fillStyle = BRASS_HI;
  ctx.fillRect(pause.x - 4.6, pause.y - 6, 3, 12);
  ctx.fillRect(pause.x + 1.6, pause.y - 6, 3, 12);
}

function minimap(ctx: CanvasRenderingContext2D, w: World, box: Box): void {
  const r = Math.max(10, Math.min(box.w, box.h) / 2);
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  brassRing(ctx, cx, cy, r, SOOT);
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r - 6, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = IRON;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  ctx.strokeStyle = "rgba(243,213,138,0.28)";
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
  ctx.strokeStyle = BRASS_HI;
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
  ctx.fillStyle = STEAM;
  ctx.fill();
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  ctx.restore();
  ctx.restore();
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
  const cy = box.y + box.h / 2;
  const r = Math.min(box.w, box.h) * 0.46;
  brassRing(ctx, cx, cy, r, SOOT);
  badgeIcon(ctx, info.kind, cx, cy);
  const fill = ultFill(w);
  ctx.beginPath();
  ctx.arc(cx, cy, r - 1.5, -Math.PI / 2, -Math.PI / 2 + fill * Math.PI * 2);
  ctx.strokeStyle = ultReady(w) || (w.ultBlast ?? 0) > 0 ? XP : STEAM_DIM;
  ctx.lineWidth = 3.6;
  ctx.stroke();
  if (ultReady(w) || (w.ultBlast ?? 0) > 0) {
    ctx.globalAlpha = 0.4 + 0.25 * Math.sin(w.tick * 0.28);
    ctx.beginPath();
    ctx.arc(cx, cy, r + 3, 0, Math.PI * 2);
    ctx.strokeStyle = XP;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.globalAlpha = 1;
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
  plate(ctx, { x, y, w: bw, h: bh }, 14, SOOT);
  ink(ctx, "RANK UP", x + bw / 2, y + 6, 12, flash ? COPPER : BRASS_HI, "center");
  fitInk(ctx, name, x + bw / 2, y + 22, 16, bw - 24, flash ? BRASS_HI : STEAM);
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
  ribbon.addColorStop(0, BRASS_HI);
  ribbon.addColorStop(1, COPPER);
  ctx.fillStyle = ribbon;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  ink(ctx, "CHOOSE YOUR UPGRADE", midX, by + 4, 12, INK, "center");
  for (let i = 0; i < slots; i++) {
    const f = cards?.[i] ?? cardFrame(i, slots);
    drawCard(ctx, f.x, f.y, f.w, f.h, offerId(w, i), i, w);
  }
  ctx.restore();
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}
