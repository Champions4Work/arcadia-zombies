import { type Box, boxInside, boxesOverlap } from "./hud-layout";
import { type Insets } from "./viewport";

export const MUTE_W = 88;
export const MUTE_H = 44;
export const MUTE_GAP = 12;

export function muteBox(vw: number, vh: number, safe: Insets): Box {
  return {
    x: Math.max(safe.l + MUTE_GAP, vw - safe.r - MUTE_GAP - MUTE_W),
    y: Math.max(0, Math.min(vh - MUTE_H, safe.t + MUTE_GAP)),
    w: MUTE_W,
    h: MUTE_H,
  };
}

export function menuPad(vw: number, vh: number, safe: Insets, phone: boolean): { t: number; r: number; b: number; l: number } {
  const mute = muteBox(vw, vh, safe);
  return {
    t: phone ? Math.max(92, safe.t + MUTE_H + MUTE_GAP * 2) : Math.max(28, safe.t + 16),
    r: phone ? Math.max(20, vw - mute.x + MUTE_GAP) : Math.max(16, safe.r + 16),
    b: Math.max(16, safe.b + 16),
    l: Math.max(16, safe.l + 16),
  };
}

export function rosterCell(vw: number, vh: number, safe: Insets, phone: boolean, index: number): Box {
  const pad = menuPad(vw, vh, safe, phone);
  const innerW = Math.max(1, vw - pad.l - pad.r);
  const cols = phone ? 2 : 4;
  const gap = 8;
  const cellW = (innerW - gap * (cols - 1)) / cols;
  const cellH = phone ? 168 : 220;
  const col = index % cols;
  const row = (index / cols) | 0;
  const y0 = pad.t + (phone ? 72 : 96);
  return {
    x: pad.l + col * (cellW + gap),
    y: y0 + row * (cellH + gap),
    w: cellW,
    h: cellH,
  };
}

export function menuChromeFits(vw: number, vh: number, safe: Insets, phone: boolean): boolean {
  const view = { x: 0, y: 0, w: vw, h: vh };
  const mute = muteBox(vw, vh, safe);
  if (!boxInside(mute, view)) return false;
  for (let i = 0; i < 4; i++) {
    const cell = rosterCell(vw, vh, safe, phone, i);
    if (!boxInside(cell, view)) return false;
    if (boxesOverlap(mute, cell)) return false;
  }
  return true;
}
