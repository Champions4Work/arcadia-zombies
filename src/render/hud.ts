import { tierName } from "../sim/difficulty";
import { lichUp, lichX, lichY } from "../sim/finale";
import { objectiveRows, waveFace } from "../sim/objectives";
import { offerCount } from "../sim/characters";
import { pacedXpNeed } from "../sim/modifiers";
import { CARD_Y, cardFrame, offerId, xpNeed } from "../sim/progress";
import { ARENA_H, ARENA_W } from "../sim/arena";
import { W, type World } from "../sim/types";
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
import { zoneChapterAt, zoneTitleAt } from "../sim/zones";
import { drawPhoneHealth, drawPhoneUlt, paintPhoneBottomTray } from "./hud-bottom";
import { weaponBadge } from "./weapon-badge";

export { blurbFor } from "./icons";
export { weaponBadge } from "./weapon-badge";

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
  blitSheetFit(ctx, id, box.x - 14, box.y - 12, box.w + 28, box.h + 24);
  ctx.fillStyle = "rgba(12,10,8,0.55)";
  ctx.fillRect(box.x + 5, box.y + 5, box.w - 10, box.h - 10);
  ctx.strokeStyle = BRASS;
  ctx.lineWidth = 3.2;
  ctx.strokeRect(box.x + 0.8, box.y + 0.8, box.w - 1.6, box.h - 1.6);
  ctx.strokeStyle = BRASS_HI;
  ctx.lineWidth = 1.8;
  ctx.strokeRect(box.x + 2.4, box.y + 2.4, box.w - 4.8, box.h - 4.8);
  ctx.restore();
}

function drawHealth(ctx: CanvasRenderingContext2D, w: World, box: Box): void {
  const layout = currentHud();
  const phone = layout?.phone ?? false;
  if (phone) {
    drawPhoneHealth(ctx, w, box);
    return;
  }
  const frac = w.maxHp > 0 ? Math.max(0, Math.min(1, w.hp / w.maxHp)) : 0;
  const low = frac <= 0.35;
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  const r = Math.min(box.w, box.h) * 0.42;
  const heartCol = low ? DANGER : HEALTH;
  blitSheetFit(ctx, "heart_ring", box.x - 8, box.y - 8, box.w + 16, box.h + 16);
  ctx.beginPath();
  ctx.arc(cx, cy, r + 4, 0, Math.PI * 2);
  ctx.strokeStyle = BRASS;
  ctx.lineWidth = 3.4;
  ctx.stroke();
  ringMeter(ctx, cx, cy, r, frac, heartCol);
  heartIcon(ctx, cx, cy + 1, r * 0.62, heartCol);
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

function stampInk(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: number,
  color: string,
  align: CanvasTextAlign = "center",
): void {
  ctx.save();
  ctx.filter = "none";
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  ctx.font = `700 ${size}px ${FONT_BODY}`;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  ctx.lineWidth = Math.max(2.4, size * 0.28);
  ctx.strokeStyle = "#1a100c";
  ctx.fillStyle = color;
  ctx.strokeText(text, x, y);
  ctx.fillText(text, x, y);
  ctx.restore();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function banner(ctx: CanvasRenderingContext2D, w: World, box: Box, phone: boolean): void {
  if (!phone) {
    plate(ctx, box, "panel_frame_pipes");
    ctx.fillStyle = "#8a5a20";
    ctx.fillRect(box.x + 8, box.y + 18, box.w - 16, 12);
    ctx.fillStyle = "#e0a040";
    ctx.fillRect(box.x + 10, box.y + 20, (box.w - 20) * 0.86, 8);
    stampInk(ctx, zoneChapterAt(w.wave), box.x + box.w / 2, box.y + 12, 12, "#f0d080");
    stampInk(ctx, zoneTitleAt(w.wave), box.x + box.w / 2, box.y + box.h - 12, 11, "#fff6df");
    return;
  }
  const cy = box.y + box.h / 2;
  const pad = 4;
  const rx = 14;
  ctx.save();
  roundRect(ctx, box.x + pad, box.y + pad, box.w - pad * 2, box.h - pad * 2, rx);
  ctx.fillStyle = "#6a3a10";
  ctx.fill();
  roundRect(ctx, box.x + pad + 2, box.y + pad + 2, box.w - pad * 2 - 4, box.h - pad * 2 - 4, rx - 2);
  const glow = ctx.createLinearGradient(box.x, cy, box.x + box.w, cy);
  glow.addColorStop(0, "#c87820");
  glow.addColorStop(0.45, "#f0b040");
  glow.addColorStop(1, "#e89828");
  ctx.fillStyle = glow;
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = "#120c08";
  ctx.beginPath();
  ctx.arc(box.x + 22, cy, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f6e2a8";
  ctx.beginPath();
  ctx.moveTo(box.x + 18, cy - 5);
  ctx.lineTo(box.x + 18, cy + 5);
  ctx.lineTo(box.x + 27, cy);
  ctx.closePath();
  ctx.fill();
  stampInk(ctx, difficultyLabel(w.rank), box.x + 38 + (box.w - 46) / 2, cy, 15, "#120c08");
}

function clockGlyph(ctx: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  ctx.beginPath();
  ctx.arc(x, y, s, 0, Math.PI * 2);
  ctx.strokeStyle = BRASS_HI;
  ctx.lineWidth = 1.6;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y - s * 0.55);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + s * 0.42, y + s * 0.08);
  ctx.stroke();
}

function skull(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.beginPath();
  ctx.arc(x, y - 1, 6.2, 0, Math.PI * 2);
  ctx.fillStyle = "#f6f1e6";
  ctx.fill();
  ctx.lineWidth = 1.3;
  ctx.strokeStyle = INK;
  ctx.stroke();
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.arc(x - 2.1, y - 1.6, 1.4, 0, Math.PI * 2);
  ctx.arc(x + 2.1, y - 1.6, 1.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(x - 2.6, y + 3.2, 1.4, 2.4);
  ctx.fillRect(x - 0.6, y + 3.2, 1.4, 2.4);
  ctx.fillRect(x + 1.4, y + 3.2, 1.4, 2.4);
}

function clockPanel(ctx: CanvasRenderingContext2D, w: World, box: Box, phone: boolean): void {
  const face = waveFace(w);
  if (phone) {
    blitSheetFit(ctx, "panel_frame_small", box.x - 10, box.y - 8, box.w + 20, box.h + 16);
    ctx.save();
    roundRect(ctx, box.x + 2, box.y + 2, box.w - 4, box.h - 4, 7);
    ctx.fillStyle = "rgba(8,10,14,0.82)";
    ctx.fill();
    ctx.strokeStyle = "rgba(212,168,72,0.88)";
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.restore();
    const cy = box.y + box.h / 2;
    const split = box.x + box.w * 0.54;
    clockGlyph(ctx, box.x + 12, cy, 5.2);
    stampInk(ctx, formatClock(w.tick), box.x + 24, cy, 10, "#fff6df", "left");
    ctx.strokeStyle = "rgba(224,160,64,0.42)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(split, box.y + 4);
    ctx.lineTo(split, box.y + box.h - 4);
    ctx.stroke();
    skull(ctx, split + 12, cy);
    stampInk(ctx, `${w.kills | 0}`, split + 22, cy, 10, "#fff6df", "left");
    return;
  }
  plate(ctx, box, "panel_frame_small");
  const wave = face.n;
  const cap = face.of;
  stampInk(ctx, `Wave ${wave}/${cap}`, box.x + 8, box.y + 10, 11, "#fff6df", "left");
  const bx = box.x + 8;
  const by = box.y + 20;
  const bw = box.w - 16;
  ctx.fillStyle = "#2a1214";
  ctx.fillRect(bx, by, bw, 8);
  ctx.fillStyle = "#e24a32";
  ctx.fillRect(bx, by, bw * Math.min(1, wave / cap), 8);
  ctx.strokeStyle = BRASS;
  ctx.lineWidth = 1.8;
  ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, 7);
  skull(ctx, box.x + 14, box.y + box.h - 11);
  ink(ctx, `${w.kills | 0}`, box.x + 24, box.y + box.h - 11, 12, "#f6f1e6");
}

function paintHeroBust(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number): void {
  blitSheetFit(ctx, "hero_idle", cx - r * 0.95, cy - r * 1.2, r * 1.9, r * 2.25);
}

function lvBadge(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.fillStyle = "#2a1c10";
  ctx.fillRect(x, y, 36, 12);
  ctx.strokeStyle = BRASS;
  ctx.lineWidth = 1.2;
  ctx.strokeRect(x + 0.5, y + 0.5, 35, 11);
  stampInk(ctx, "LV 12", x + 18, y + 6, 9, "#f0d080");
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
  ctx.fillStyle = "#1a1410";
  ctx.fill();
  ctx.clip();
  paintHeroBust(ctx, cx, cy + r * 0.06, r);
  ctx.restore();
  ctx.strokeStyle = BRASS;
  ctx.lineWidth = 3.4;
  ctx.beginPath();
  ctx.arc(cx, cy, r + 1.2, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = BRASS_HI;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  const frac = w.maxHp > 0 ? Math.max(0, Math.min(1, w.hp / w.maxHp)) : 0;
  const bx = box.x + faceS + 6;
  const bw = Math.max(48, box.w - faceS - 10);
  lvBadge(ctx, bx, box.y + 2);
  const by = box.y + 16;
  ctx.fillStyle = IRON;
  ctx.fillRect(bx, by, bw, 13);
  ctx.fillStyle = "#e24a32";
  ctx.fillRect(bx, by, bw * frac, 13);
  ctx.strokeStyle = BRASS;
  ctx.lineWidth = 1.2;
  ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, 12);
  barCount(ctx, "240/240", bx + 5, by + 7);
}

function skillIcon(ctx: CanvasRenderingContext2D, i: number, x: number, y: number, s: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = XP;
  ctx.strokeStyle = XP;
  ctx.lineWidth = 2;
  if (i === 0) {
    ctx.beginPath();
    ctx.moveTo(-s * 0.12, -s * 0.42);
    ctx.lineTo(s * 0.18, -s * 0.08);
    ctx.lineTo(s * 0.02, -s * 0.04);
    ctx.lineTo(s * 0.16, s * 0.42);
    ctx.lineTo(-s * 0.2, s * 0.02);
    ctx.lineTo(-s * 0.02, -s * 0.02);
    ctx.closePath();
    ctx.fill();
  } else if (i === 1) {
    ctx.beginPath();
    ctx.arc(0, s * 0.04, s * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, s * 0.04, s * 0.42, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
  } else {
    ctx.beginPath();
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2 - Math.PI / 2;
      const r = k % 2 === 0 ? s * 0.4 : s * 0.18;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      if (k === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function skillKeys(ctx: CanvasRenderingContext2D, layout: HudLayout): void {
  const keys = ["Q", "E", "R"];
  const r = 24;
  const cx = layout.ability.x + layout.ability.w * 0.42;
  const cy = layout.ability.y - 8;
  const spots = [
    { x: cx - 30, y: cy - 10 },
    { x: cx, y: cy - 26 },
    { x: cx + 28, y: cy - 10 },
  ];
  for (let i = 0; i < 3; i++) {
    const p = spots[i];
    if (!p) continue;
    blitSheetFit(ctx, "ring_frame_b", p.x - r - 2, p.y - r - 2, r * 2 + 4, r * 2 + 4);
    ctx.beginPath();
    ctx.arc(p.x, p.y, r * 0.72, 0, Math.PI * 2);
    ctx.fillStyle = IRON;
    ctx.fill();
    ctx.strokeStyle = BRASS;
    ctx.lineWidth = 2;
    ctx.stroke();
    skillIcon(ctx, i, p.x, p.y - 2, r * 0.7);
    ink(ctx, keys[i] ?? "Q", p.x, p.y + r * 0.52, 9, STEAM, "center");
  }
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
  const layout = currentHud();
  const phone = layout?.phone ?? false;
  blitSheetFit(ctx, "ring_frame_b", pause.x - pause.r - 2, pause.y - pause.r - 2, pause.r * 2 + 4, pause.r * 2 + 4);
  if (phone) {
    ctx.beginPath();
    ctx.arc(pause.x, pause.y, pause.r * 0.78, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(12,10,8,0.82)";
    ctx.fill();
  }
  ctx.fillStyle = BRASS_HI;
  ctx.fillRect(pause.x - 5, pause.y - 6, 3, 12);
  ctx.fillRect(pause.x + 2, pause.y - 6, 3, 12);
}

function miniAim(ctx: CanvasRenderingContext2D, cx: number, cy: number, aimX: number, aimY: number): void {
  const len = Math.hypot(aimX, aimY);
  const ux = len > 0.001 ? aimX / len : 1;
  const uy = len > 0.001 ? aimY / len : 0;
  const px = -uy;
  const py = ux;
  const tip = 6.5;
  const back = 3.6;
  const wing = 3.8;
  ctx.fillStyle = XP;
  ctx.beginPath();
  ctx.moveTo(cx + ux * tip, cy + uy * tip);
  ctx.lineTo(cx - ux * back + px * wing, cy - uy * back + py * wing);
  ctx.lineTo(cx - ux * back - px * wing, cy - uy * back - py * wing);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = BRASS_HI;
  ctx.beginPath();
  ctx.moveTo(cx + ux * (tip - 1.2), cy + uy * (tip - 1.2));
  ctx.lineTo(cx - ux * back + px * (wing - 0.6), cy - uy * back + py * (wing - 0.6));
  ctx.lineTo(cx - ux * back - px * (wing - 0.6), cy - uy * back - py * (wing - 0.6));
  ctx.closePath();
  ctx.fill();
}

function paintMiniObstacles(
  ctx: CanvasRenderingContext2D,
  w: World,
  cx: number,
  cy: number,
  r: number,
  span: number,
): void {
  const a = w.arena;
  const scale = (r - 5) / span;
  ctx.fillStyle = "#2a2620";
  for (let i = 0; i < a.obsN; i++) {
    if (!a.obsAlive[i]) continue;
    const ox = a.obsX[i] ?? 0;
    const oy = a.obsY[i] ?? 0;
    const hw = Math.max(4, a.obsHW[i] ?? 8);
    const hh = Math.max(4, a.obsHH[i] ?? 8);
    const mx = cx + (ox - w.px) * scale;
    const my = cy + (oy - w.py) * scale;
    const mw = Math.max(3, hw * scale * 0.55);
    const mh = Math.max(3, hh * scale * 0.55);
    if (mx + mw < cx - r || mx - mw > cx + r || my + mh < cy - r || my - mh > cy + r) continue;
    ctx.fillRect(mx - mw, my - mh, mw * 2, mh * 2);
  }
}

function paintMiniRooms(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
): void {
  ctx.fillStyle = "#4a4030";
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  ctx.fillStyle = "#1a1612";
  ctx.fillRect(cx - r * 0.2, cy - r * 0.2, r * 0.44, r * 0.36);
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
}

function paintMiniDots(
  ctx: CanvasRenderingContext2D,
  w: World,
  cx: number,
  cy: number,
  r: number,
  span: number,
  phone: boolean,
): void {
  const z = w.zombies;
  let alive = 0;
  for (let i = 0; i < z.alive.length; i++) if (z.alive[i]) alive++;
  const step = alive > 96 ? Math.ceil(alive / 96) : 1;
  const scale = (r - 5) / span;
  let seen = 0;
  for (let i = 0; i < z.alive.length; i++) {
    if (!z.alive[i]) continue;
    if (step > 1 && seen++ % step !== 0) continue;
    const mx = cx + (((z.x[i] ?? 0) - w.px) * scale);
    const my = cy + (((z.y[i] ?? 0) - w.py) * scale);
    if (phone) {
      ctx.fillStyle = DANGER;
      ctx.beginPath();
      ctx.arc(mx, my, 2.4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = DANGER;
      ctx.fillRect(mx - 2.5, my - 2.5, 5, 5);
    }
  }
  if (lichUp(w)) {
    const lx = cx + ((lichX(w) - w.px) * scale);
    const ly = cy + ((lichY(w) - w.py) * scale);
    if (phone) {
      ctx.fillStyle = BRASS_HI;
      ctx.beginPath();
      ctx.arc(lx, ly, 2.8, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = BRASS_HI;
      ctx.fillRect(lx - 2.5, ly - 2.5, 5, 5);
    }
  }
  if (phone) miniAim(ctx, cx, cy, w.aimX, w.aimY);
  else {
    ctx.fillStyle = "#7ef0ff";
    ctx.beginPath();
    ctx.arc(cx, cy, 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function minimap(ctx: CanvasRenderingContext2D, w: World, box: Box): void {
  const layout = currentHud();
  const phone = layout?.phone ?? false;
  const pad = phone ? 10 : 14;
  const inset = phone ? 7 : 3;
  const r = Math.max(14, Math.min(box.w, box.h) / 2 - inset);
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  const span = phone ? 200 : 170;
  blitSheetFit(ctx, "minimap_frame", box.x - pad, box.y - pad, box.w + pad * 2, box.h + pad * 2);
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r - (phone ? 5 : 3), 0, Math.PI * 2);
  ctx.fillStyle = phone ? INK : "#14100c";
  ctx.fill();
  ctx.clip();
  if (phone) {
    ctx.fillStyle = "#12100e";
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    ctx.strokeStyle = "rgba(90,80,68,0.35)";
    ctx.lineWidth = 1;
    const edge = (r - 6) / Math.max(ARENA_W, ARENA_H);
    ctx.strokeRect(cx - ARENA_W * edge * 0.5, cy - ARENA_H * edge * 0.5, ARENA_W * edge, ARENA_H * edge);
    paintMiniObstacles(ctx, w, cx, cy, r, span);
  } else paintMiniRooms(ctx, cx, cy, r);
  paintMiniDots(ctx, w, cx, cy, r, span, phone);
  ctx.restore();
  if (!phone) {
    ctx.beginPath();
    ctx.arc(cx, cy, r - 2, 0, Math.PI * 2);
    ctx.strokeStyle = BRASS_HI;
    ctx.lineWidth = 3.4;
    ctx.stroke();
  }
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
  const layout = currentHud();
  const phone = layout?.phone ?? false;
  if (phone) {
    drawPhoneUlt(ctx, w, box);
    return;
  }
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  const r = Math.min(box.w, box.h) * 0.42;
  blitSheetFit(ctx, "ultimate_button", box.x - (phone ? 14 : 8), box.y - (phone ? 14 : 8), box.w + (phone ? 28 : 16), box.h + (phone ? 28 : 16));
  if (!phone) {
    ctx.beginPath();
    ctx.arc(cx, cy, r + 4, 0, Math.PI * 2);
    ctx.strokeStyle = BRASS;
    ctx.lineWidth = 3.4;
    ctx.stroke();
  }
  if (phone && (ultReady(w) || (w.ultBlast ?? 0) > 0)) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = "rgba(240,180,72,0.45)";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(cx, cy, r + 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  ringMeter(ctx, cx, cy, r, ultFill(w), ultReady(w) || (w.ultBlast ?? 0) > 0 ? XP : CYAN);
  badgeIcon(ctx, weaponBadge(w).kind, cx, cy);
}

function checkMark(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.strokeStyle = "#3ec86a";
  ctx.lineWidth = 1.8;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(x + 1.2, y);
  ctx.lineTo(x + 3.4, y + 3.2);
  ctx.lineTo(x + 7.4, y - 3.2);
  ctx.stroke();
}

function checkLine(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  done: boolean,
): void {
  if (done) {
    ctx.fillStyle = "#1a3a22";
    ctx.fillRect(x, y - 4, 8, 8);
    ctx.strokeStyle = "#3ec86a";
    ctx.lineWidth = 1.2;
    ctx.strokeRect(x, y - 4, 8, 8);
    checkMark(ctx, x, y);
    ink(ctx, text, x + 13, y, 10, "#8eec9a");
    return;
  }
  ctx.strokeStyle = "#f6f1e6";
  ctx.lineWidth = 1.2;
  ctx.strokeRect(x, y - 4, 8, 8);
  ink(ctx, text, x + 13, y, 10, "#f6f1e6");
}

function objectives(ctx: CanvasRenderingContext2D, w: World, box: Box): void {
  const layout = currentHud();
  const phone = layout?.phone ?? false;
  const face = waveFace(w);
  const framePad = phone ? 10 : 14;
  blitSheetFit(ctx, "objectives_panel", box.x - framePad, box.y - framePad, box.w + framePad * 2, box.h + framePad * 2);
  if (!phone) blitSheetFit(ctx, "panel_frame_gears", box.x - 10, box.y - 10, box.w + 20, box.h + 20);
  ctx.fillStyle = phone ? "rgba(8,10,16,0.76)" : "rgba(8,10,16,0.78)";
  ctx.fillRect(box.x, box.y, box.w, box.h);
  const headH = phone ? 18 : 24;
  ctx.fillStyle = "rgba(224,160,64,0.32)";
  ctx.fillRect(box.x + 4, box.y + 4, box.w - 8, headH);
  ctx.strokeStyle = "rgba(212,168,72,0.92)";
  if (phone) ctx.lineWidth = 2.6;
  else ctx.lineWidth = 4.6;
  ctx.strokeRect(box.x + 0.5, box.y + 0.5, box.w - 1, box.h - 1);
  ctx.strokeStyle = "rgba(240,200,120,0.65)";
  ctx.lineWidth = phone ? 1.6 : 2.2;
  ctx.strokeRect(box.x + 4, box.y + 4, box.w - 8, box.h - 8);
  stampInk(ctx, "Objectives", box.x + 10, box.y + (phone ? 13 : 16), phone ? 10 : 13, "#f0d080", "left");
  if (phone) {
    stampInk(ctx, `Wave ${face.n}/${face.of}`, box.x + box.w - 10, box.y + 13, 10, "#fff6df", "right");
  }
  ctx.fillStyle = "#e8c46a";
  ctx.fillRect(box.x + 8, box.y + headH + 6, box.w - 16, 2);
  const rows = objectiveRows(w);
  const inkX = box.x + 10;
  const hold = rows[1];
  const holdText = hold?.clock ? `HOLD THE AREA ${hold.clock}` : "HOLD THE AREA";
  const row0 = phone ? box.y + 36 : box.y + box.h * 0.38;
  const row1 = phone ? box.y + 54 : box.y + box.h * 0.58;
  const row2 = phone ? box.y + 72 : box.y + box.h * 0.78;
  checkLine(ctx, inkX, row0, "ACTIVATE STEAM GATE", rows[0]?.done === true);
  checkLine(ctx, inkX, row1, holdText, hold?.done === true);
  checkLine(ctx, inkX, row2, "SURVIVE ALL WAVES", rows[2]?.done === true);
}

export function drawHud(ctx: CanvasRenderingContext2D, w: World): void {
  const layout = currentHud();
  if (!layout) return;
  ctx.save();
  const dpr = ctx.canvas.width / Math.max(1, layout.view.w);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (layout.phone && !w.choosing) paintPhoneBottomTray(ctx, layout);
  drawHealth(ctx, w, layout.hero);
  drawXp(ctx, w, layout);
  if (!w.choosing) banner(ctx, w, layout.difficulty, layout.phone);
  clockPanel(ctx, w, layout.clock, layout.phone);
  pauseButton(ctx, layout.pause);
  if (!w.choosing) {
    minimap(ctx, w, layout.minimap);
    if (!layout.phone && layout.face.w > 0) portrait(ctx, w, layout.face);
    if (!layout.phone) {
      restStick(ctx, layout);
      skillKeys(ctx, layout);
    }
    drawWeaponRack(ctx, w);
    ability(ctx, w, layout.ability);
    objectives(ctx, w, layout.objectives);
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
  const card = layout.objectives;
  let y = layout.difficulty.y + layout.difficulty.h + 10;
  if (x < card.x + card.w && x + bw > card.x && y < card.y + card.h && y + bh > card.y) {
    y = card.y + card.h + 8;
  }
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
