import { ultFill, ultReady } from "../sim/ult";
import type { World } from "../sim/types";
import type { Box, HudLayout } from "../shell/hud-layout";
import { heartIcon, ringMeter } from "../art/look";
import { blitSheetFit } from "../art/sheet";
import { BRASS, COPPER, CYAN, DANGER, XP } from "../shell/theme";
import { drawIcon } from "./icons";
import { weaponBadge } from "./weapon-badge";

function badgeIcon(ctx: CanvasRenderingContext2D, kind: number, x: number, y: number): void {
  drawIcon(ctx, kind, x, y, 12);
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
  ctx.fillStyle = "rgba(8,10,14,0.78)";
  ctx.fillRect(left, top, w, h);
  ctx.strokeStyle = "rgba(212,168,72,0.72)";
  ctx.lineWidth = 2;
  ctx.strokeRect(left + 0.5, top + 0.5, w - 1, h - 1);
  ctx.strokeStyle = "rgba(90,62,32,0.55)";
  ctx.lineWidth = 1;
  ctx.strokeRect(left + 3, top + 3, w - 6, h - 6);
  ctx.restore();
}

export function drawPhoneHealth(ctx: CanvasRenderingContext2D, w: World, box: Box): void {
  const frac = w.maxHp > 0 ? Math.max(0, Math.min(1, w.hp / w.maxHp)) : 0;
  const low = frac <= 0.35;
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  const r = Math.min(box.w, box.h) * 0.36;
  const heartCol = low ? DANGER : CYAN;
  blitSheetFit(ctx, "heart_ring", box.x - 14, box.y - 14, box.w + 28, box.h + 28);
  ctx.beginPath();
  ctx.arc(cx, cy, r + 2, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(6,8,12,0.88)";
  ctx.fill();
  ringMeter(ctx, cx, cy, r, frac, heartCol);
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.globalAlpha = 0.35 + frac * 0.25;
  heartIcon(ctx, cx, cy + 1, r * 0.5, heartCol);
  ctx.restore();
  heartIcon(ctx, cx, cy + 1, r * 0.5, heartCol);
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
  const r = Math.min(box.w, box.h) * 0.36;
  const ready = ultReady(w) || (w.ultBlast ?? 0) > 0;
  const fill = ultFill(w);
  blitSheetFit(ctx, "ultimate_button", box.x - 14, box.y - 14, box.w + 28, box.h + 28);
  ctx.beginPath();
  ctx.arc(cx, cy, r + 2, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(6,8,12,0.88)";
  ctx.fill();
  if (ready) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = "rgba(240,180,72,0.42)";
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.arc(cx, cy, r + 7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  ringMeter(ctx, cx, cy, r, fill, ready ? XP : BRASS);
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.52, 0, Math.PI * 2);
  ctx.fillStyle = ready ? "rgba(255,168,48,0.22)" : "rgba(24,20,16,0.55)";
  ctx.fill();
  badgeIcon(ctx, weaponBadge(w).kind, cx, cy);
  if (ready) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = "rgba(255,200,96,0.35)";
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.28, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export function paintPhonePowerTrayFrame(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  const bracket = 8;
  ctx.strokeStyle = "rgba(90,210,255,0.55)";
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
  ctx.strokeStyle = "rgba(212,168,72,0.45)";
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);
}

export const PHONE_BOTTOM_CROP_FRAC = 0.28;
