import { pacedXpNeed } from "../sim/modifiers";
import { xpNeed } from "../sim/progress";
import { EV_LEVEL, FX_XP, MAX_FX, type World } from "../sim/types";
import { type Fit, worldToCss } from "../shell/fit";
import { type HudLayout } from "../shell/hud-layout";
import { blitAtlas } from "../art/atlas";
import { hudType } from "../art/look";
import { blitSheetFit } from "../art/sheet";
import { pixelWell } from "../art/chrome";
import { IRON, STEAM, INK } from "../shell/theme";
import { BRASS_HI, XP } from "../art/palette";

export const XP_BAR_FRAME_ASPECT = 240 / 70;

function caption(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: number,
  color: string,
  align: CanvasTextAlign = "left",
): void {
  hudType(ctx, text, x, y, size, color, align);
}

export const GEM_CAP = 48;
export const GEM_LIFE = 420;
export const XP_LERP = 0.18;

const gemX = new Float32Array(GEM_CAP);
const gemY = new Float32Array(GEM_CAP);
const gemVx = new Float32Array(GEM_CAP);
const gemVy = new Float32Array(GEM_CAP);
const gemLife = new Float32Array(GEM_CAP);
const gemOn = new Uint8Array(GEM_CAP);

let gemCursor = 0;
let gemCount = 0;
let shownXp = 0;
let shownLevel = 1;
let glowMs = 0;
let popMs = 0;
let popLevel = 1;
let lastXp = 0;
let lastLevel = 0;
let sparkMs = 0;
let booted = 0;

export function resetXpGain(): void {
  gemCursor = 0;
  gemCount = 0;
  shownXp = 0;
  shownLevel = 1;
  glowMs = 0;
  popMs = 0;
  popLevel = 1;
  lastXp = 0;
  lastLevel = 0;
  sparkMs = 0;
  booted = 0;
  gemOn.fill(0);
}

export function xpShown(): number {
  return shownXp;
}

export function xpGlow(): number {
  return glowMs;
}

export function xpPop(): { ms: number; level: number } {
  return { ms: popMs, level: popLevel };
}

export function gemLive(): number {
  return gemCount;
}

function spawnGem(x: number, y: number, tx: number, ty: number, salt: number): void {
  const i = gemCursor;
  gemCursor = i + 1 < GEM_CAP ? i + 1 : 0;
  if (gemOn[i] === 0) gemCount++;
  gemOn[i] = 1;
  gemX[i] = x;
  gemY[i] = y;
  const ang = ((salt * 17) % 628) * 0.01;
  gemVx[i] = (tx - x) * 0.08 + Math.cos(ang) * 40;
  gemVy[i] = (ty - y) * 0.08 + Math.sin(ang) * 40;
  gemLife[i] = GEM_LIFE;
}

function barTarget(layout: HudLayout): { x: number; y: number } {
  return { x: layout.xp.x + layout.xp.w * 0.42, y: layout.xp.y + layout.xp.h * 0.5 };
}

export function syncXpGain(w: World, layout: HudLayout, fit: Fit): void {
  const need = pacedXpNeed(xpNeed(w.level), w.mods);
  if (!booted) {
    lastXp = w.xp;
    lastLevel = w.level;
    shownXp = w.xp;
    shownLevel = w.level;
    booted = 1;
  }
  if (w.level > lastLevel) {
    shownLevel = w.level;
    popLevel = w.level;
    popMs = 640;
    glowMs = 520;
    shownXp = 0;
    lastLevel = w.level;
    lastXp = w.xp;
  }
  const gained = w.xp > lastXp ? w.xp - lastXp : 0;
  if (gained > 0 || w.events[EV_LEVEL]) {
    const dest = barTarget(layout);
    let n = 0;
    for (let i = 0; i < MAX_FX && n < 6; i++) {
      if ((w.fxKind[i] ?? 0) !== FX_XP) continue;
      const p = worldToCss(fit, w.arena.camX, w.arena.camY, w.fxX[i] ?? w.px, w.fxY[i] ?? w.py);
      spawnGem(p.x, p.y, dest.x, dest.y, w.tick + i);
      n++;
    }
    if (n === 0) {
      const p = worldToCss(fit, w.arena.camX, w.arena.camY, w.px, w.py);
      const bursts = Math.max(1, Math.min(5, gained || 2));
      for (let i = 0; i < bursts; i++) spawnGem(p.x, p.y, dest.x, dest.y, w.tick + i * 13);
    }
    glowMs = Math.max(glowMs, 280);
    sparkMs = 220;
    lastXp = w.xp;
  }
  if (shownXp > need) shownXp = need;
}

export function tickXpGain(dt: number, layout: HudLayout, xp: number): void {
  const dest = barTarget(layout);
  const scale = dt * 0.001;
  if (gemCount > 0) {
    for (let i = 0; i < GEM_CAP; i++) {
      if (gemOn[i] === 0) continue;
      const x = gemX[i] ?? 0;
      const y = gemY[i] ?? 0;
      gemVx[i] = (gemVx[i] ?? 0) * 0.86 + (dest.x - x) * 8;
      gemVy[i] = (gemVy[i] ?? 0) * 0.86 + (dest.y - y) * 8;
      gemX[i] = x + (gemVx[i] ?? 0) * scale;
      gemY[i] = y + (gemVy[i] ?? 0) * scale;
      const life = (gemLife[i] ?? 0) - dt;
      const dx = dest.x - (gemX[i] ?? 0);
      const dy = dest.y - (gemY[i] ?? 0);
      if (life <= 0 || dx * dx + dy * dy < 36) {
        gemOn[i] = 0;
        gemCount--;
        glowMs = Math.max(glowMs, 180);
      } else gemLife[i] = life;
    }
  }
  shownXp += (xp - shownXp) * XP_LERP;
  if (Math.abs(xp - shownXp) < 0.05) shownXp = xp;
  if (glowMs > 0) glowMs = glowMs > dt ? glowMs - dt : 0;
  if (popMs > 0) popMs = popMs > dt ? popMs - dt : 0;
  if (sparkMs > 0) sparkMs = sparkMs > dt ? sparkMs - dt : 0;
}

export function xpLevelText(level: number): string {
  return `LV ${level + 1}`;
}

export function xpFillT(need: number): number {
  if (need <= 0) return 0;
  const t = shownXp / need;
  return t < 0 ? 0 : t > 1 ? 1 : t;
}

function phoneLvCaption(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: number,
): void {
  ctx.font = `700 ${size}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  ctx.lineWidth = 3;
  ctx.strokeStyle = INK;
  ctx.strokeText(text, x, y);
  ctx.fillStyle = STEAM;
  ctx.fillText(text, x, y);
}

function drawPhoneXpBar(
  ctx: CanvasRenderingContext2D,
  box: HudLayout["xp"],
  t: number,
  needLabel: string,
): void {
  const frameW = box.w + 52;
  const frameH = Math.max(box.h + 34, frameW / XP_BAR_FRAME_ASPECT);
  const fx = box.x - 26;
  const fy = box.y + box.h - frameH + 2;
  blitSheetFit(ctx, "xp_bar_frame", fx, fy, frameW, frameH);
  const tubeX = fx + frameW * 0.07;
  const tubeW = frameW * 0.72;
  const tubeH = Math.max(5, frameH * 0.16);
  const tubeY = fy + frameH - tubeH - frameH * 0.11;
  ctx.fillStyle = "rgba(8,12,18,0.82)";
  ctx.fillRect(tubeX, tubeY, tubeW, tubeH);
  const fillW = Math.max(t > 0 ? 5 : 0, (tubeW - 2) * t);
  if (fillW > 0) {
    const glow = ctx.createLinearGradient(tubeX, tubeY, tubeX + fillW, tubeY);
    glow.addColorStop(0, glowMs > 0 ? "#f0c878" : "#2a7ec8");
    glow.addColorStop(0.55, glowMs > 0 ? "#f0b44a" : "#7ae0d4");
    glow.addColorStop(1, "#9af4ff");
    ctx.fillStyle = glow;
    ctx.fillRect(tubeX + 1, tubeY + 1, fillW - 2, tubeH - 2);
    ctx.fillStyle = "rgba(255,255,255,0.22)";
    ctx.fillRect(tubeX + 1, tubeY + 1, fillW - 2, Math.max(1, (tubeH - 2) * 0.35));
  }
  if (sparkMs > 0) {
    caption(ctx, "+XP", tubeX + fillW + 10, fy + frameH * 0.28, 11, STEAM);
  }
  const lvX = fx + frameW * 0.81;
  const lvY = fy + frameH * 0.48;
  phoneLvCaption(ctx, needLabel, lvX, lvY, 13);
  if (popMs > 0) {
    phoneLvCaption(ctx, `${popLevel}`, lvX, lvY - frameH * 0.22, 13);
  }
}

export function drawXpBar(ctx: CanvasRenderingContext2D, layout: HudLayout, need: number): void {
  const box = layout.xp;
  const t = xpFillT(need);
  const phone = layout.phone;
  ctx.save();
  if (phone) {
    drawPhoneXpBar(ctx, box, t, xpLevelText(shownLevel));
    ctx.restore();
    drawGems(ctx);
    return;
  }
  blitSheetFit(ctx, "xp_bar_frame", box.x - 18, box.y - 10, box.w + 36, box.h + 20);
  const pad = 10;
  const badge = Math.min(58, box.w * 0.15);
  const innerW = box.w - pad * 2 - badge;
  const tubeY = box.y + 6;
  const tubeH = Math.max(6, box.h - 12);
  pixelWell(ctx, box.x + pad, tubeY, innerW, tubeH);
  ctx.fillStyle = IRON;
  ctx.fillRect(box.x + pad + 2, tubeY + 2, innerW - 4, tubeH - 4);
  const fillW = Math.max(t > 0 ? 6 : 0, (innerW - 4) * t);
  if (fillW > 0) {
    ctx.fillStyle = glowMs > 0 ? BRASS_HI : XP;
    ctx.fillRect(box.x + pad + 2, tubeY + 2, fillW, tubeH - 4);
  }
  if (sparkMs > 0) {
    caption(ctx, "+XP", box.x + pad + fillW + 8, box.y + box.h * 0.18, 11, STEAM);
  }
  caption(ctx, xpLevelText(shownLevel), box.x + box.w - badge / 2, box.y + box.h * 0.42, 12, STEAM, "center");
  if (popMs > 0) {
    caption(ctx, `${popLevel}`, box.x + box.w - badge / 2, box.y - 12, 14, BRASS_HI, "center");
  }
  ctx.restore();
  drawGems(ctx);
}

function drawGems(ctx: CanvasRenderingContext2D): void {
  if (gemCount <= 0) return;
  ctx.save();
  for (let i = 0; i < GEM_CAP; i++) {
    if (gemOn[i] === 0) continue;
    blitAtlas(ctx, "xp-0", gemX[i] ?? 0, gemY[i] ?? 0, 1);
  }
  ctx.restore();
}
