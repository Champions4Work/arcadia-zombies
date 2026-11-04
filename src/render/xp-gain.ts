import { pacedXpNeed } from "../sim/modifiers";
import { xpNeed } from "../sim/progress";
import { EV_LEVEL, FX_XP, MAX_FX, type World } from "../sim/types";
import { type Fit, worldToCss } from "../shell/fit";
import { type HudLayout } from "../shell/hud-layout";
import { blitAtlas } from "../art/atlas";
import { hudType } from "../art/look";
import { blitSheetFit } from "../art/sheet";
import { pixelWell } from "../art/chrome";
import { BRASS_HI, IRON, STEAM, XP } from "../shell/theme";

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

export function drawXpBar(ctx: CanvasRenderingContext2D, layout: HudLayout, need: number): void {
  const box = layout.xp;
  const t = xpFillT(need);
  ctx.save();
  blitSheetFit(ctx, "xp_bar_frame", box.x - 2, box.y - 6, box.w + 4, box.h + 12);
  pixelWell(ctx, box.x + 4, box.y + 2, box.w - 62, box.h - 4);
  const pad = 4;
  const badge = Math.min(58, box.w * 0.15);
  const innerW = box.w - pad * 2 - badge;
  ctx.fillStyle = IRON;
  ctx.fillRect(box.x + pad, box.y + pad, innerW, box.h - pad * 2);
  const fillW = Math.max(t > 0 ? 6 : 0, innerW * t);
  if (fillW > 0) {
    ctx.fillStyle = glowMs > 0 ? BRASS_HI : XP;
    ctx.fillRect(box.x + pad, box.y + pad, fillW, box.h - pad * 2);
  }
  if (sparkMs > 0) {
    caption(ctx, "+XP", box.x + pad + fillW + 8, box.y + box.h * 0.18, 11, STEAM);
  }
  caption(ctx, xpLevelText(shownLevel), box.x + box.w - badge / 2, box.y + box.h * 0.28, 12, STEAM, "center");
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
