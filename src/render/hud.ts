import { tierFrac, tierName } from "../sim/difficulty";
import { lichUp, lichX, lichY } from "../sim/finale";
import { offerCount } from "../sim/characters";
import { pacedXpNeed } from "../sim/modifiers";
import { CARD_Y, cardFrame, offerId, xpNeed } from "../sim/progress";
import {
  EVOL_AEGIS, EVOL_CANNON, EVOL_STORM, UNION_BELLOWS, UNION_BRIAR, UNION_CALLIOPE,
  UNION_CROWN, UNION_HALO, UNION_HEART, UNION_HOWITZER, UPG_DMG, UPG_FIRE, UPG_MORTAR,
  UPG_SAWS, UPG_SHOTGUN, UPG_TESLA, UPG_VENT, W, type World,
} from "../sim/types";
import { currentHud, offerCards, pauseHitAt } from "../shell/hud-layout";
import type { Box, Circle, HudLayout } from "../shell/hud-layout";
import { drawRewardCard } from "./cards";
import { drawIcon } from "./icons";
import { ultFill, ultReady } from "../sim/ult";
import { heartIcon, hudType, ringMeter } from "../art/look";
import { blitSheetFit } from "../art/sheet";
import { BRASS, BRASS_HI, COPPER, CYAN, DANGER, FONT_BODY, HEALTH, INK, IRON, STEAM, XP } from "../shell/theme";
import { drawWeaponRack } from "./weapons";
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

function ink(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, color: string, align: CanvasTextAlign = "left"): void {
  hudType(ctx, text, x, y, size, color, align);
}

function barCount(ctx: CanvasRenderingContext2D, text: string, x: number, y: number): void {
  ctx.save();
  ctx.filter = "none";
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  ctx.font = `700 11px ${FONT_BODY}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#1a100c";
  ctx.fillStyle = "#fff6df";
  ctx.strokeText(text, x, y);
  ctx.fillText(text, x, y);
  ctx.restore();
}

function plate(ctx: CanvasRenderingContext2D, box: Box, id = "panel_frame_small"): void {
  ctx.save();
  ctx.fillStyle = IRON;
  ctx.fillRect(box.x, box.y, box.w, box.h);
  blitSheetFit(ctx, id, box.x - 2, box.y - 2, box.w + 4, box.h + 4);
  ctx.fillStyle = "rgba(12,12,16,0.62)";
  ctx.fillRect(box.x + 1, box.y + 1, box.w - 2, box.h - 2);
  ctx.strokeStyle = BRASS;
  ctx.lineWidth = 2;
  ctx.strokeRect(box.x + 0.8, box.y + 0.8, box.w - 1.6, box.h - 1.6);
  ctx.restore();
}

function drawHealth(ctx: CanvasRenderingContext2D, w: World, box: Box): void {
  const frac = w.maxHp > 0 ? Math.max(0, Math.min(1, w.hp / w.maxHp)) : 0;
  const low = frac <= 0.35;
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  const r = Math.min(box.w, box.h) * 0.42;
  blitSheetFit(ctx, "heart_ring", box.x - 3, box.y - 3, box.w + 6, box.h + 6);
  ctx.beginPath();
  ctx.arc(cx, cy, r + 3, 0, Math.PI * 2);
  ctx.strokeStyle = BRASS;
  ctx.lineWidth = 2.4;
  ctx.stroke();
  ringMeter(ctx, cx, cy, r, frac, low ? DANGER : HEALTH);
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.58, 0, Math.PI * 2);
  ctx.fillStyle = low ? DANGER : HEALTH;
  ctx.fill();
  heartIcon(ctx, cx, cy + 1, r * 1.05, low ? DANGER : HEALTH);
  if (w.meta.revive > 0) ink(ctx, "REV", cx, box.y + 8, 9, COPPER, "center");
}

function drawXp(ctx: CanvasRenderingContext2D, w: World, layout: HudLayout): void {
  const need = pacedXpNeed(xpNeed(w.level), w.mods);
  drawXpBar(ctx, layout, need);
}

function fitInk(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, _size: number, max: number, color: string): void {
  const size = text.length * 7 > max ? 10 : 12;
  ink(ctx, text, x, y, size, color, "center");
}

function banner(ctx: CanvasRenderingContext2D, w: World, box: Box): void {
  const name = difficultyLabel(w.rank);
  const flash = w.rankFlash > 0 && ((w.tick >> 2) & 1) === 0;
  plate(ctx, box, "panel_frame_pipes");
  const fill = Math.max(0.12, Math.min(1, tierFrac(w.tick)));
  ctx.fillStyle = BRASS;
  ctx.globalAlpha = 0.55;
  ctx.fillRect(box.x + 8, box.y + box.h * 0.62, (box.w - 16) * fill, 3);
  ctx.globalAlpha = 1;
  fitInk(ctx, name, box.x + box.w / 2, box.y + box.h * 0.38, 12, box.w - 16, flash ? BRASS_HI : STEAM);
}

function skull(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.beginPath();
  ctx.arc(x, y - 1, 5, 0, Math.PI * 2);
  ctx.fillStyle = STEAM;
  ctx.fill();
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = INK;
  ctx.stroke();
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.arc(x - 1.8, y - 1.4, 1.2, 0, Math.PI * 2);
  ctx.arc(x + 1.8, y - 1.4, 1.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(x - 2.2, y + 3, 1.2, 2);
  ctx.fillRect(x - 0.5, y + 3, 1.2, 2);
  ctx.fillRect(x + 1.2, y + 3, 1.2, 2);
}

function clockPanel(ctx: CanvasRenderingContext2D, w: World, box: Box): void {
  plate(ctx, box, "panel_frame_small");
  ink(ctx, `WAVE ${Math.max(1, w.wave)}`, box.x + 10, box.y + box.h * 0.32, 11, STEAM);
  skull(ctx, box.x + 14, box.y + box.h * 0.68);
  ink(ctx, `${w.kills} KILLS`, box.x + 24, box.y + box.h * 0.68, 12, "#f6f1e6");
}

function portrait(ctx: CanvasRenderingContext2D, w: World, box: Box): void {
  const faceS = box.h;
  const cx = box.x + faceS / 2;
  const cy = box.y + box.h / 2;
  const r = faceS * 0.42;
  blitSheetFit(ctx, "ring_frame_a", box.x - 2, box.y - 2, faceS + 4, faceS + 4);
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = IRON;
  ctx.fill();
  ctx.clip();
  const body = faceS * 1.15;
  ctx.filter = "brightness(1.7) contrast(1.15)";
  blitSheetFit(ctx, "hero_idle", cx - body * 0.5, cy - body * 0.62, body, body);
  ctx.restore();
  ctx.strokeStyle = BRASS_HI;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  const frac = w.maxHp > 0 ? Math.max(0, Math.min(1, w.hp / w.maxHp)) : 0;
  const bx = box.x + faceS + 6;
  const by = box.y + 6;
  const bw = Math.max(72, box.w - faceS - 10);
  ctx.fillStyle = IRON;
  ctx.fillRect(bx, by, bw, 14);
  ctx.fillStyle = "#e24a32";
  ctx.fillRect(bx, by, bw * frac, 14);
  ctx.strokeStyle = BRASS;
  ctx.lineWidth = 1.2;
  ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, 13);
  barCount(ctx, "240/240", bx + 5, by + 7);
  const ey = by + 17;
  ctx.fillStyle = IRON;
  ctx.fillRect(bx, ey, bw, 14);
  ctx.fillStyle = "#3d8cff";
  ctx.fillRect(bx, ey, bw * 0.72, 14);
  ctx.strokeStyle = BRASS;
  ctx.strokeRect(bx + 0.5, ey + 0.5, bw - 1, 13);
  barCount(ctx, "120/120", bx + 5, ey + 7);
}

function restStick(ctx: CanvasRenderingContext2D, layout: HudLayout): void {
  const r = 30;
  const x = layout.hero.x + 36;
  const y = layout.hero.y - 94;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(12,10,8,0.55)";
  ctx.fill();
  ctx.strokeStyle = "rgba(232,196,96,0.88)";
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, r * 0.62, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(40,32,24,0.7)";
  ctx.lineWidth = 2.2;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, r * 0.28, 0, Math.PI * 2);
  ctx.fillStyle = BRASS_HI;
  ctx.fill();
  ctx.strokeStyle = BRASS;
  ctx.lineWidth = 1.6;
  ctx.stroke();
}

function pauseButton(ctx: CanvasRenderingContext2D, pause: Circle): void {
  blitSheetFit(ctx, "ring_frame_b", pause.x - pause.r, pause.y - pause.r, pause.r * 2, pause.r * 2);
  ctx.fillStyle = BRASS_HI;
  ctx.fillRect(pause.x - 5, pause.y - 6, 3, 12);
  ctx.fillRect(pause.x + 2, pause.y - 6, 3, 12);
}

function minimap(ctx: CanvasRenderingContext2D, w: World, box: Box): void {
  const r = Math.max(16, Math.min(box.w, box.h) / 2 - 1);
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  blitSheetFit(ctx, "minimap_frame", box.x - 6, box.y - 6, box.w + 12, box.h + 12);
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r - 3, 0, Math.PI * 2);
  ctx.fillStyle = "#1a1612";
  ctx.fill();
  ctx.clip();
  ctx.fillStyle = "#4a4030";
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  ctx.fillStyle = "#8a7654";
  ctx.fillRect(cx - r * 0.78, cy - r * 0.74, r * 0.5, r * 0.36);
  ctx.fillRect(cx + r * 0.08, cy - r * 0.7, r * 0.52, r * 0.34);
  ctx.fillRect(cx - r * 0.72, cy + r * 0.02, r * 0.46, r * 0.4);
  ctx.fillRect(cx - r * 0.08, cy - r * 0.08, r * 0.72, r * 0.52);
  ctx.strokeStyle = "#e8c46a";
  ctx.lineWidth = 2.2;
  ctx.strokeRect(cx - r * 0.78, cy - r * 0.74, r * 0.5, r * 0.36);
  ctx.strokeRect(cx + r * 0.08, cy - r * 0.7, r * 0.52, r * 0.34);
  ctx.strokeRect(cx - r * 0.72, cy + r * 0.02, r * 0.46, r * 0.4);
  ctx.strokeRect(cx - r * 0.08, cy - r * 0.08, r * 0.72, r * 0.52);
  ctx.strokeStyle = "#5ae8ff";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.52, cy - r * 0.38);
  ctx.lineTo(cx - r * 0.52, cy + r * 0.2);
  ctx.lineTo(cx + r * 0.42, cy + r * 0.2);
  ctx.lineTo(cx + r * 0.42, cy - r * 0.36);
  ctx.moveTo(cx - r * 0.52, cy);
  ctx.lineTo(cx + r * 0.2, cy);
  ctx.stroke();
  const z = w.zombies;
  const local = 170;
  let alive = 0;
  for (let i = 0; i < z.alive.length; i++) if (z.alive[i]) alive++;
  const step = alive > 96 ? Math.ceil(alive / 96) : 1;
  let seen = 0;
  for (let i = 0; i < z.alive.length; i++) {
    if (!z.alive[i]) continue;
    if (step > 1 && seen++ % step !== 0) continue;
    const mx = cx + (((z.x[i] ?? 0) - w.px) / local) * (r - 4);
    const my = cy + (((z.y[i] ?? 0) - w.py) / local) * (r - 4);
    ctx.fillStyle = DANGER;
    ctx.fillRect(mx - 2.5, my - 2.5, 5, 5);
  }
  if (lichUp(w)) {
    const lx = cx + ((lichX(w) - w.px) / local) * (r - 4);
    const ly = cy + ((lichY(w) - w.py) / local) * (r - 4);
    ctx.fillStyle = BRASS_HI;
    ctx.fillRect(lx - 2.5, ly - 2.5, 5, 5);
  }
  ctx.fillStyle = "#7ef0ff";
  ctx.beginPath();
  ctx.arc(cx, cy, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.beginPath();
  ctx.arc(cx, cy, r - 2, 0, Math.PI * 2);
  ctx.strokeStyle = BRASS_HI;
  ctx.lineWidth = 2.2;
  ctx.stroke();
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
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  const r = Math.min(box.w, box.h) * 0.42;
  blitSheetFit(ctx, "ultimate_button", box.x - 3, box.y - 3, box.w + 6, box.h + 6);
  ctx.beginPath();
  ctx.arc(cx, cy, r + 3, 0, Math.PI * 2);
  ctx.strokeStyle = BRASS;
  ctx.lineWidth = 2.4;
  ctx.stroke();
  ringMeter(ctx, cx, cy, r, ultFill(w), ultReady(w) || (w.ultBlast ?? 0) > 0 ? XP : CYAN);
  badgeIcon(ctx, weaponBadge(w).kind, cx, cy);
}

function checkLine(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  color: string,
): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.2;
  ctx.strokeRect(x, y - 4, 7, 7);
  ink(ctx, text, x + 12, y, 10, color);
}

function objectives(ctx: CanvasRenderingContext2D, w: World, layout: HudLayout): void {
  const phone = layout.view.w < 720;
  const x = layout.clock.x - (phone ? 16 : 0);
  const y = layout.clock.y + layout.clock.h + 6;
  const bw = phone ? Math.min(156, layout.view.w - x - 8) : Math.min(188, layout.view.w - x - 16);
  const bh = phone ? 108 : 124;
  const hold = Math.max(0, 240 - ((w.tick / 60) | 0) % 240);
  blitSheetFit(ctx, "objectives_panel", x, y, bw, bh);
  const inkX = x + bw * 0.14;
  checkLine(ctx, inkX, y + bh * 0.32, "ACTIVATE STEAM GATE", w.rank > 0 ? HEALTH : "#f6f1e6");
  checkLine(ctx, inkX, y + bh * 0.52, `HOLD THE AREA (${hold}s)`, "#f6f1e6");
  checkLine(ctx, inkX, y + bh * 0.72, "SURVIVE ALL WAVES", "#f6f1e6");
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
    portrait(ctx, w, layout.face);
    drawWeaponRack(ctx, w);
    restStick(ctx, layout);
    ability(ctx, w, layout.ability);
    objectives(ctx, w, layout);
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
  plate(ctx, { x, y, w: bw, h: bh });
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
  blitSheetFit(ctx, "panel_frame_glow", bx, by, bw, 20);
  ink(ctx, "CHOOSE YOUR UPGRADE", midX, by + 10, 11, INK, "center");
  for (let i = 0; i < slots; i++) {
    const f = cards?.[i] ?? cardFrame(i, slots);
    drawCard(ctx, f.x, f.y, f.w, f.h, offerId(w, i), i, w);
  }
  ctx.restore();
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}
