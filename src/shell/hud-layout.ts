import { H, W } from "../sim/types";
import { type Fit } from "./fit";
import { type Viewport } from "./viewport";

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Circle {
  x: number;
  y: number;
  r: number;
}

export interface HudLayout {
  view: Box;
  frame: Box;
  hero: Box;
  xp: Box;
  difficulty: Box;
  clock: Box;
  pause: Circle;
  minimap: Box;
  face: Box;
  weapons: Box;
  ability: Box;
  objectives: Box;
  phone: boolean;
}

let bound: HudLayout | null = null;

export function bindHud(layout: HudLayout): HudLayout {
  bound = layout;
  return layout;
}

export function currentHud(): HudLayout | null {
  return bound;
}

export function frameBox(fit: Fit, gameW = fit.viewW || W, gameH = fit.viewH || H): Box {
  return { x: fit.ox, y: fit.oy, w: gameW * fit.scale, h: gameH * fit.scale };
}

export function mapGameBox(fit: Fit, box: Box): Box {
  return {
    x: fit.ox + box.x * fit.scale,
    y: fit.oy + box.y * fit.scale,
    w: box.w * fit.scale,
    h: box.h * fit.scale,
  };
}

export function circleBox(c: Circle): Box {
  return { x: c.x - c.r, y: c.y - c.r, w: c.r * 2, h: c.r * 2 };
}

export function boxesOverlap(a: Box, b: Box): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function boxInside(inner: Box, outer: Box, pad = 0): boolean {
  return (
    inner.x >= outer.x - pad
    && inner.y >= outer.y - pad
    && inner.x + inner.w <= outer.x + outer.w + pad
    && inner.y + inner.h <= outer.y + outer.h + pad
  );
}

export function hudBoxes(layout: HudLayout): Box[] {
  return [
    layout.hero,
    layout.xp,
    layout.difficulty,
    layout.clock,
    circleBox(layout.pause),
    layout.minimap,
    layout.face,
    layout.weapons,
    layout.ability,
    layout.objectives,
  ].filter((box) => box.w > 0 && box.h > 0);
}

export function layoutHud(vp: Viewport, fit: Fit): HudLayout {
  const view = { x: 0, y: 0, w: vp.cssW, h: vp.cssH };
  const sl = vp.safe.l;
  const sr = vp.safe.r;
  const st = vp.safe.t;
  const sb = vp.safe.b;
  const inner = { x: sl, y: st, w: Math.max(1, vp.cssW - sl - sr), h: Math.max(1, vp.cssH - st - sb) };
  const portrait = vp.cssH > vp.cssW;
  const phone = portrait && vp.cssW < 720;
  const u = portrait ? clamp(inner.w / 390, 0.85, 1.15) : clamp(inner.h / 360, 0.78, 1.05);
  const gap = Math.max(4, (phone ? 8 : 6) * u);
  const xpH = Math.round((phone ? 20 : portrait ? 16 : 14) * u);
  const xp = { x: inner.x + gap, y: inner.y + inner.h - xpH, w: inner.w - gap * 2, h: xpH };
  const heroS = Math.round((phone ? 58 : portrait ? 48 : 42) * u);
  const abilS = Math.round((phone ? 68 : portrait ? 60 : 54) * u);
  const slot = Math.round((phone ? 42 : portrait ? 34 : 30) * u);
  const slotGap = Math.max(2, Math.round(3 * u));
  const wpnH = slot;
  const wpnW = slot * 5 + slotGap * 4;
  const bottomH = Math.max(heroS, abilS, wpnH);
  const bottomGap = phone ? 16 : gap;
  const bottomY = xp.y - bottomGap - bottomH;
  const hero = { x: inner.x + gap, y: bottomY + bottomH - heroS, w: heroS, h: heroS };
  const ability = { x: inner.x + inner.w - gap - abilS, y: bottomY + bottomH - abilS, w: abilS, h: abilS };
  const midLeft = hero.x + hero.w + gap;
  const midRight = ability.x - gap;
  const midW = Math.max(slot, midRight - midLeft);
  const weapons = {
    x: midLeft + Math.max(0, (midW - wpnW) / 2),
    y: bottomY + bottomH - wpnH,
    w: Math.min(wpnW, midW),
    h: wpnH,
  };
  const rowH = Math.round((phone ? 48 : portrait ? 40 : 34) * u);
  const topY = inner.y + gap;
  const pauseR = Math.round((phone ? 13 : 11) * u);
  const pause = {
    x: inner.x + inner.w - gap - pauseR,
    y: topY + rowH / 2,
    r: pauseR,
  };
  const clockW = Math.round((phone ? 96 : portrait ? 104 : 108) * u);
  const clockH = Math.round((phone ? 54 : portrait ? 50 : 44) * u);
  const clock = {
    x: pause.x - pauseR - gap - clockW,
    y: topY,
    w: clockW,
    h: clockH,
  };
  const mapS = Math.round((phone ? 72 : portrait ? 80 : 70) * u);
  const minimap = { x: inner.x + gap, y: topY, w: mapS, h: mapS };
  const difficulty = {
    x: minimap.x + minimap.w + gap,
    y: topY,
    w: Math.max(72, clock.x - gap - (minimap.x + minimap.w + gap)),
    h: rowH,
  };
  const faceS = Math.round((portrait ? 56 : 46) * u);
  const faceX = minimap.x + minimap.w + gap;
  const objLeft = clock.x - (portrait ? 16 : 0);
  const face = phone
    ? { x: 0, y: 0, w: 0, h: 0 }
    : {
      x: faceX,
      y: difficulty.y + difficulty.h + gap,
      w: Math.max(faceS + 52, Math.min(faceS + 64, objLeft - faceX - 8)),
      h: faceS,
    };
  const objX = clock.x - (phone ? 16 : 0);
  const objW = phone
    ? Math.min(168, inner.x + inner.w - objX - gap)
    : Math.min(196, inner.x + inner.w - objX - gap);
  const objH = phone ? 118 : 128;
  const objectives = {
    x: objX,
    y: clock.y + clock.h + 6,
    w: objW,
    h: objH,
  };
  return { view, frame: frameBox(fit), hero, xp, difficulty, clock, pause, minimap, face, weapons, ability, objectives, phone };
}

export function pauseHitAt(layout: HudLayout, x: number, y: number): boolean {
  const dx = x - layout.pause.x;
  const dy = y - layout.pause.y;
  const hit = layout.pause.r + 6;
  return dx * dx + dy * dy <= hit * hit;
}

export function hudHitAt(layout: HudLayout, x: number, y: number): boolean {
  if (pauseHitAt(layout, x, y)) return true;
  for (const box of hudBoxes(layout)) {
    if (x >= box.x && x < box.x + box.w && y >= box.y && y < box.y + box.h) return true;
  }
  return false;
}

export function stickFrame(layout: HudLayout): Box {
  const top = Math.max(
    layout.minimap.y + layout.minimap.h,
    layout.face.y + layout.face.h,
    layout.difficulty.y + layout.difficulty.h,
    layout.clock.y + layout.clock.h,
    layout.pause.y + layout.pause.r,
    layout.objectives.y + layout.objectives.h,
  ) + 4;
  const bottom = Math.min(layout.hero.y, layout.weapons.y, layout.ability.y, layout.xp.y) - 4;
  return {
    x: layout.view.x,
    y: top,
    w: layout.view.w,
    h: Math.max(1, bottom - top),
  };
}

export function clampStick(x: number, y: number, r: number, frame: Box): { x: number; y: number } {
  const minX = frame.x + r;
  const maxX = frame.x + frame.w - r;
  const minY = frame.y + r;
  const maxY = frame.y + frame.h - r;
  return {
    x: maxX < minX ? frame.x + frame.w / 2 : clamp(x, minX, maxX),
    y: maxY < minY ? frame.y + frame.h / 2 : clamp(y, minY, maxY),
  };
}

export function offerCards(view: Box, slots: number): Box[] {
  const n = Math.max(1, slots);
  const gap = 10;
  const w = Math.max(96, Math.min(168, (view.w - 24 - gap * (n - 1)) / n));
  const h = Math.min(170, Math.max(120, view.h * 0.26));
  const row = w * n + gap * (n - 1);
  const x0 = view.x + (view.w - row) / 2;
  const y = view.y + Math.max(72, view.h * 0.22);
  const cards: Box[] = [];
  for (let i = 0; i < n; i++) cards.push({ x: x0 + i * (w + gap), y, w, h });
  return cards;
}

export function offerHit(view: Box, slots: number, x: number, y: number): number {
  const cards = offerCards(view, slots);
  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    if (!card) continue;
    if (x >= card.x && x <= card.x + card.w && y >= card.y && y <= card.y + card.h) return i + 1;
  }
  return 0;
}

export function rerollCss(view: Box): Box {
  const w = Math.min(180, view.w * 0.42);
  return { x: view.x + (view.w - w) / 2, y: view.y + view.h * 0.72, w, h: 36 };
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}
