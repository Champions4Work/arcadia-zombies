import { ultFill, ultReady } from "../sim/ult";
import type { World } from "../sim/types";
import type { Box, HudLayout } from "../shell/hud-layout";
import { heartIcon, ringMeter } from "../art/look";
import { blitSheetFit } from "../art/sheet";
import { BRASS, BRASS_HI, COPPER, CYAN, DANGER, HEALTH, STEAM } from "../shell/theme";

const HEART_GLOW = "#48f0e8";
const HEART_CORE = "#d82428";
const ULT_SUN = "#f0c040";
const ULT_SUN_HI = "#ffe8a8";
const ULT_SUN_CORE = "#ff9020";
const ULT_CHARGE = BRASS;
const ULT_CHARGE_READY = COPPER;

function paintPhoneUltSun(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number, strength: number): void {
  const k = Math.max(0, Math.min(1, strength));
  if (k <= 0) return;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.globalAlpha = 0.28 + k * 0.55;
  const halo = ctx.createRadialGradient(cx, cy, s * 0.04, cx, cy, s * 1.18);
  halo.addColorStop(0, "rgba(255,236,160,0.98)");
  halo.addColorStop(0.38, "rgba(255,152,48,0.72)");
  halo.addColorStop(0.72, "rgba(240,104,32,0.28)");
  halo.addColorStop(1, "rgba(232,72,16,0)");
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(cx, cy, s * 1.18, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  const rays = 12;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.globalAlpha = 0.42 + k * 0.52;
  ctx.fillStyle = ULT_SUN;
  ctx.beginPath();
  for (let i = 0; i < rays * 2; i++) {
    const ang = (i / (rays * 2)) * Math.PI * 2 - Math.PI / 2;
    const outer = i % 2 === 0 ? s * 0.98 : s * 0.38;
    const px = cx + Math.cos(ang) * outer;
    const py = cy + Math.sin(ang) * outer;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.globalAlpha = 0.55 + k * 0.42;
  ctx.fillStyle = ULT_SUN_CORE;
  ctx.beginPath();
  ctx.arc(cx, cy, s * 0.36, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = ULT_SUN_HI;
  ctx.beginPath();
  ctx.arc(cx, cy, s * 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function paintPhoneBottomTray(ctx: CanvasRenderingContext2D, layout: HudLayout): void {
  const padX = 6;
  const left = layout.hero.x - padX;
  const right = layout.ability.x + layout.ability.w + padX;
  const top = Math.min(layout.hero.y, layout.weapons.y, layout.ability.y) - 10;
  const bottom = Math.max(
    layout.hero.y + layout.hero.h,
    layout.weapons.y + layout.weapons.h,
    layout.ability.y + layout.ability.h,
  ) + 6;
  const w = right - left;
  const h = bottom - top;
  blitSheetFit(ctx, "panel_frame_glow", left - 10, top - 8, w + 20, h + 14);
  ctx.save();
  ctx.fillStyle = "rgba(8,10,14,0.82)";
  ctx.fillRect(left, top, w, h);
  ctx.strokeStyle = "rgba(212,168,72,0.88)";
  ctx.lineWidth = 2.4;
  ctx.strokeRect(left + 0.5, top + 0.5, w - 1, h - 1);
  ctx.strokeStyle = BRASS_HI;
  ctx.lineWidth = 1.2;
  ctx.strokeRect(left + 2.5, top + 2.5, w - 5, h - 5);
  ctx.strokeStyle = "rgba(90,62,32,0.62)";
  ctx.lineWidth = 1;
  ctx.strokeRect(left + 4, top + 4, w - 8, h - 8);
  ctx.restore();
}

export function drawPhoneHealth(ctx: CanvasRenderingContext2D, w: World, box: Box): void {
  const frac = w.maxHp > 0 ? Math.max(0, Math.min(1, w.hp / w.maxHp)) : 0;
  const low = frac <= 0.35;
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  const r = Math.min(box.w, box.h) * 0.34;
  const ringCol = low ? DANGER : HEALTH;
  const heartCol = low ? HEART_CORE : CYAN;
  const pad = 18;
  const bw = box.w + pad * 2;
  const bh = box.h + pad * 2;
  const bx = box.x - pad;
  const by = box.y - pad;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.globalAlpha = 0.38 + frac * 0.22;
  blitSheetFit(ctx, "heart_ring", bx - 2, by - 2, bw + 4, bh + 4);
  ctx.restore();
  blitSheetFit(ctx, "heart_ring", bx, by, bw, bh);
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.globalAlpha = 0.32 + frac * 0.2;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.72, 0, Math.PI * 2);
  ctx.fillStyle = HEART_GLOW;
  ctx.fill();
  ctx.restore();
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.46, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(6,8,12,0.68)";
  ctx.fill();
  ringMeter(ctx, cx, cy, r * 0.98, frac, ringCol);
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.globalAlpha = 0.62;
  ringMeter(ctx, cx, cy, r * 0.98, frac, HEART_GLOW);
  ctx.restore();
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.globalAlpha = 0.5;
  heartIcon(ctx, cx, cy + 1, r * 0.5, HEART_GLOW);
  ctx.restore();
  heartIcon(ctx, cx, cy + 1, r * 0.4, heartCol);
  if (!low) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 0.35;
    heartIcon(ctx, cx, cy, r * 0.28, STEAM);
    ctx.restore();
  }
  if (w.meta.revive > 0) {
    ctx.font = "700 9px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = COPPER;
    ctx.fillText("REV", cx, box.y + 8);
  }
}

export function drawPhoneUlt(ctx: CanvasRenderingContext2D, w: World, box: Box): void {
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  const r = Math.min(box.w, box.h) * 0.34;
  const ready = ultReady(w) || (w.ultBlast ?? 0) > 0;
  const fill = ultFill(w);
  const pad = 18;
  const bw = box.w + pad * 2;
  const bh = box.h + pad * 2;
  const bx = box.x - pad;
  const by = box.y - pad;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.globalAlpha = 0.32 + fill * 0.28 + (ready ? 0.18 : 0);
  blitSheetFit(ctx, "heart_ring", bx - 2, by - 2, bw + 4, bh + 4);
  ctx.restore();
  blitSheetFit(ctx, "heart_ring", bx, by, bw, bh);
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.88, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(8,6,4,0.92)";
  ctx.fill();
  const sunPulse = ready ? 1 : 0.38 + fill * 0.62;
  const ringCol = ready ? ULT_CHARGE_READY : ULT_CHARGE;
  ringMeter(ctx, cx, cy, r * 0.98, fill, ringCol);
  if (ready) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 0.48;
    ringMeter(ctx, cx, cy, r * 0.98, 1, BRASS_HI);
    ctx.restore();
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = "rgba(255,168,48,0.38)";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(cx, cy, r + 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  paintPhoneUltSun(ctx, cx, cy, r * 0.92, sunPulse);
}

export function paintPhonePowerTrayFrame(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  const bracket = 8;
  ctx.strokeStyle = "rgba(72,240,232,0.42)";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(x + bracket, y);
  ctx.lineTo(x + w - bracket, y);
  ctx.moveTo(x + bracket, y + h);
  ctx.lineTo(x + w - bracket, y + h);
  ctx.moveTo(x, y + bracket);
  ctx.lineTo(x, y + h - bracket);
  ctx.moveTo(x + w, y + bracket);
  ctx.lineTo(x + w, y + h - bracket);
  ctx.stroke();
  ctx.strokeStyle = "rgba(212,168,72,0.58)";
  ctx.lineWidth = 1.2;
  ctx.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);
}

export const PHONE_BOTTOM_CROP_FRAC = 0.28;
