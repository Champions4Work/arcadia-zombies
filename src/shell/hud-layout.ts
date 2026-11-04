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
  weapons: Box;
  ability: Box;
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
    layout.weapons,
    layout.ability,
  ];
}

export function layoutHud(vp: Viewport, fit: Fit): HudLayout {
  const view = { x: 0, y: 0, w: vp.cssW, h: vp.cssH };
  const sl = vp.safe.l;
  const sr = vp.safe.r;
  const st = vp.safe.t;
  const sb = vp.safe.b;
  const inner = { x: sl, y: st, w: Math.max(1, vp.cssW - sl - sr), h: Math.max(1, vp.cssH - st - sb) };
  const portrait = vp.cssH > vp.cssW;
  const u = portrait ? clamp(inner.w / 390, 0.85, 1.15) : clamp(inner.h / 360, 0.78, 1.05);
  const gap = Math.max(6, 8 * u);
  const xpH = Math.round((portrait ? 22 : 18) * u);
  const xp = { x: inner.x + gap, y: inner.y + inner.h - xpH, w: inner.w - gap * 2, h: xpH };
  const heroW = Math.round((portrait ? 100 : 92) * u);
  const heroH = Math.round((portrait ? 70 : 60) * u);
  const hero = { x: inner.x + gap, y: xp.y - gap - heroH, w: heroW, h: heroH };
  const abilW = Math.round((portrait ? 80 : 72) * u);
  const abilH = Math.round((portrait ? 64 : 56) * u);
  const ability = { x: inner.x + inner.w - gap - abilW, y: xp.y - gap - abilH, w: abilW, h: abilH };
  const wpnH = Math.round((portrait ? 32 : 26) * u);
  const weapons = portrait
    ? { x: inner.x + gap, y: hero.y - gap - wpnH, w: inner.w - gap * 2, h: wpnH }
    : {
      x: hero.x + hero.w + gap,
      y: xp.y - gap - wpnH,
      w: Math.max(64, ability.x - gap - (hero.x + hero.w + gap)),
      h: wpnH,
    };
  const topY = inner.y + gap;
  const rowH = Math.round((portrait ? 36 : 34) * u);
  const pauseR = Math.round(14 * u);
  const pause = {
    x: inner.x + inner.w - gap - pauseR,
    y: topY + rowH / 2,
    r: pauseR,
  };
  const clockW = Math.round((portrait ? 108 : 112) * u);
  const clock = {
    x: pause.x - pauseR - gap - clockW,
    y: topY,
    w: clockW,
    h: rowH,
  };
  const diffW = Math.round((portrait ? 140 : 160) * u);
  const difficulty = {
    x: inner.x + gap,
    y: topY,
    w: Math.min(diffW, Math.max(88, clock.x - gap - (inner.x + gap))),
    h: rowH,
  };
  const mapS = Math.round((portrait ? 56 : 52) * u);
  const minimap = {
    x: inner.x + gap,
    y: topY + rowH + gap,
    w: mapS,
    h: mapS + 14,
  };
  if (boxesOverlap(minimap, hero)) minimap.y = Math.max(topY + rowH + gap, hero.y - gap - minimap.h);
  if (boxesOverlap(minimap, difficulty) || boxesOverlap(minimap, clock)) {
    minimap.y = Math.max(minimap.y, difficulty.y + difficulty.h + gap);
  }
  return { view, frame: frameBox(fit), hero, xp, difficulty, clock, pause, minimap, weapons, ability };
}

export function pauseHitAt(layout: HudLayout, x: number, y: number): boolean {
  const dx = x - layout.pause.x;
  const dy = y - layout.pause.y;
  const hit = layout.pause.r + 6;
  return dx * dx + dy * dy <= hit * hit;
}

export function stickFrame(layout: HudLayout): Box {
  return {
    x: layout.view.x,
    y: layout.view.y,
    w: layout.view.w,
    h: Math.max(1, layout.xp.y - layout.view.y),
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
