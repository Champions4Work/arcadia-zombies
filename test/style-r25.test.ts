import { readFileSync } from "node:fs";
import { composeHorde } from "../src/render/blit.hot";
import { copyGroundWindow, stampVentFx } from "../src/render/ground-atlas";
import { bg, buildSprites } from "../src/render/horde-sprites";
import { VENT_FX_CAP, VENT_PUFFS } from "../src/render/ground";
import {
  BLOOD_SPURT, drawJuice, juiceHit, juiceShot, resetJuice, tickJuice, JUICE_DT, PART_LIVE_CAP, SHAKE_HIT,
} from "../src/render/juice";
import { paintStains, stainCount, STAIN_FADE_MIN, STAIN_LIVE_CAP } from "../src/render/stains";
import { MAP_LIVE, MAP_VENT, VENT_LIVE, mapState } from "../src/sim/map-events";
import { step } from "../src/sim/step.hot";
import { H, W, type Input, type World } from "../src/sim/types";
import { createWorld } from "../src/sim/world";
import { applyPlayView } from "../src/shell/play-view";
import {
  PHONE_CSS_H,
  PHONE_CSS_W,
  PHONE_FPS_AVG_MIN,
  PHONE_FPS_MID_MIN,
  PHONE_FRAME_P95_MS,
} from "../src/shell/phone-perf";
import { reviewHorde } from "../src/shell/review-shot";
import { HERO_DRAW_SCALE, HERO_PACK_H } from "../src/art/look";
import { HAZARD_MARKS } from "../src/render/ground";
import { yardPropHits, YARD_CLEAR, PHONE_CAM } from "../src/render/yard-fx";
import { bindHud, boxesOverlap, hudBoxes, layoutHud } from "../src/shell/hud-layout";
import { computeFit } from "../src/shell/fit";
import { playView } from "../src/shell/play-view";
import { readViewport, ZERO_INSETS } from "../src/shell/viewport";
import { drawHud, difficultyLabel } from "../src/render/hud";

const walk: Input = { dx: 0.85, dy: 0.45, pick: 0 };
const frame = new Uint32Array(W * H);

function p95(samples: number[]): number {
  const ranked = samples.slice().sort((a, b) => a - b);
  return ranked[Math.min(ranked.length - 1, (ranked.length * 0.95) | 0)] ?? 0;
}

function stubCtx(texts: string[] = []): CanvasRenderingContext2D {
  const grad = { addColorStop() {} };
  const noop = () => {};
  const ctx: Record<string, unknown> = {
    canvas: { width: 390, height: 844 },
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 1,
    font: "",
    textAlign: "left",
    textBaseline: "alphabetic",
    globalAlpha: 1,
    lineJoin: "round",
    lineCap: "round",
    globalCompositeOperation: "source-over",
    imageSmoothingEnabled: false,
    fillText(text: string) { texts.push(text); },
    strokeText(text: string) { texts.push(text); },
    measureText(text: string) { return { width: String(text).length * 6 }; },
    createLinearGradient() { return grad; },
    createRadialGradient() { return grad; },
  };
  return new Proxy(ctx, {
    get(target, key) {
      if (key in target) return target[key as string];
      return noop;
    },
    set(target, key, value) {
      target[key as string] = value;
      return true;
    },
  }) as unknown as CanvasRenderingContext2D;
}

function armJuiceHorde(w: World): void {
  w.toSpawn = 0;
  w.spawnCd = 99999;
  w.fireCd = 99999;
  w.hurtCd = 40;
  applyPlayView(w.arena, PHONE_CSS_W, PHONE_CSS_H);
  resetJuice();
  reviewHorde(w);
  const vent = mapState(w);
  vent.kind = MAP_VENT;
  vent.phase = MAP_LIVE;
  vent.life = VENT_LIVE;
  vent.x = w.px + 24;
  vent.y = w.py;
  resetJuice();
  reviewHorde(w);
}

function frameCost(w: World, ctx: CanvasRenderingContext2D): number {
  const t0 = performance.now();
  step(w, walk);
  const camX = Math.round(w.arena.camX);
  const camY = Math.round(w.arena.camY);
  copyGroundWindow(bg, camX, camY);
  composeHorde(w, frame);
  stampVentFx(frame, camX, camY, w.tick);
  paintStains(ctx);
  drawJuice(ctx);
  tickJuice(JUICE_DT);
  if ((w.tick & 1) === 0) juiceShot(w.px + 20, w.py - 18, w.aimX, w.aimY, w.tick);
  if ((w.tick & 3) === 0) {
    const slot = w.tick % 48;
    juiceHit(slot, w.px + slot, w.py - 12, 3, slot % 3, false, w.tick, w.px, w.py);
  }
  return performance.now() - t0;
}

describe("juice r25 combat read", () => {
  it("keeps pool caps and stronger phone-readable combat constants", () => {
    expect(PART_LIVE_CAP).toBe(80);
    expect(STAIN_LIVE_CAP).toBe(128);
    expect(BLOOD_SPURT).toBe(4);
    expect(SHAKE_HIT).toBeGreaterThanOrEqual(0.6);
    expect(STAIN_FADE_MIN).toBeGreaterThanOrEqual(0.28);
    const juice = readFileSync("src/render/juice.ts", "utf8");
    expect(juice.includes("stampCasing(bx, by, tick)")).toBe(true);
    const flash = readFileSync("src/render/cast-fx.ts", "utf8");
    expect(flash.includes("age >= 12")).toBe(true);
    const hero = readFileSync("src/art/look.ts", "utf8");
    expect(hero.includes("rgba(62,220,220")).toBe(false);
    expect(hero.includes("walkBob(tick, moving)")).toBe(true);
  });

  it("stamps a spent casing when firing without exceeding stain cap", () => {
    resetJuice();
    expect(stainCount()).toBe(0);
    juiceShot(40, 20, 1, 0, 4);
    expect(stainCount()).toBe(1);
    for (let i = 0; i < 200; i++) juiceShot(i, i, 1, 0, i);
    expect(stainCount()).toBeLessThanOrEqual(STAIN_LIVE_CAP);
  });

  it("holds vent-horde fps with stains and juice draw on a 390 view", () => {
    buildSprites();
    const w = createWorld(25);
    const ctx = stubCtx();
    armJuiceHorde(w);
    for (let i = 0; i < 8; i++) frameCost(w, ctx);
    const vent = mapState(w);
    const msSamples: number[] = [];
    for (let i = 0; i < 64; i++) {
      vent.x = w.px + 18;
      vent.y = w.py;
      vent.life = VENT_LIVE;
      vent.phase = MAP_LIVE;
      vent.kind = MAP_VENT;
      msSamples.push(frameCost(w, ctx));
      expect(stampVentFx(frame, Math.round(w.arena.camX), Math.round(w.arena.camY), w.tick)).toBeLessThanOrEqual(VENT_FX_CAP * VENT_PUFFS);
    }
    const p95ms = p95(msSamples);
    expect(p95ms).toBeLessThan(PHONE_FRAME_P95_MS);
    const fpsSamples = msSamples.map((ms) => 1000 / (ms > 0 ? ms : PHONE_FRAME_P95_MS));
    fpsSamples.sort((a, b) => a - b);
    const mid = Math.round(fpsSamples[fpsSamples.length >> 1] ?? 0);
    const avg = Math.round(fpsSamples.reduce((sum, v) => sum + v, 0) / fpsSamples.length);
    expect(mid).toBeGreaterThanOrEqual(PHONE_FPS_MID_MIN);
    expect(avg).toBeGreaterThanOrEqual(PHONE_FPS_AVG_MIN);
  });
});

describe("r25 art-bible phone pass", () => {
  it("locks 390 HUD to CALM bar, map, objectives, heart slots, and LV", () => {
    const texts: string[] = [];
    const vp = readViewport({ innerWidth: 390, innerHeight: 844, devicePixelRatio: 3 }, ZERO_INSETS);
    const pv = playView(vp.cssW, vp.cssH);
    const fit = computeFit(vp.cssW, vp.cssH, vp.dpr, pv.viewW, pv.viewH, ZERO_INSETS);
    const hud = layoutHud(vp, fit);
    bindHud(hud);
    expect(hud.phone).toBe(true);
    expect(hud.face.w).toBe(0);
    const w = createWorld(7);
    drawHud(stubCtx(texts), w);
    expect(hud.minimap.w).toBeGreaterThan(0);
    expect(hud.objectives.w).toBeGreaterThan(0);
    expect(texts.some((t) => t.includes("Objectives") || t.includes("ACTIVATE"))).toBe(true);
    expect(texts.some((t) => t.startsWith("LV "))).toBe(true);
    expect(texts).toContain(difficultyLabel(w.rank));
    expect(texts.some((t) => t.includes("34/210"))).toBe(false);
    expect(texts).not.toContain("240/240");
    expect(texts).not.toContain("Q");
    expect(HERO_DRAW_SCALE).toBe(1.4);
    expect(HERO_PACK_H).toBe(64);
    const pack = JSON.parse(readFileSync("src/art/packed/pack.json", "utf8"));
    expect(pack.hero_px).toBe(64);
  });

  it("anchors minimap top-left and objectives top-right without HUD overlap", () => {
    const vp = readViewport({ innerWidth: 390, innerHeight: 844, devicePixelRatio: 3 }, ZERO_INSETS);
    const pv = playView(vp.cssW, vp.cssH);
    const fit = computeFit(vp.cssW, vp.cssH, vp.dpr, pv.viewW, pv.viewH, ZERO_INSETS);
    const hud = layoutHud(vp, fit);
    expect(hud.minimap.x).toBeLessThan(vp.cssW * 0.08);
    expect(hud.minimap.y).toBeLessThan(vp.cssH * 0.06);
    expect(hud.objectives.x + hud.objectives.w).toBeGreaterThan(vp.cssW * 0.55);
    expect(hud.hero.y).toBeGreaterThan(vp.cssH * 0.68);
    const boxes = hudBoxes(hud);
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        expect(boxesOverlap(boxes[i]!, boxes[j]!)).toBe(false);
      }
    }
  });

  it("keeps cyan pipes, belt loot, and lit spawn props on the phone cam", () => {
    const yard = readFileSync("src/render/yard-fx.ts", "utf8");
    expect(yard.includes("#7ae0d4")).toBe(true);
    expect(yard.includes("function paintCrossBelt")).toBe(true);
    expect(yard.includes("BELT_H = 72")).toBe(true);
    expect(yard.includes("window_lit")).toBe(true);
    expect(yard.includes("building_wall_door")).toBe(true);
    expect(HAZARD_MARKS.length).toBe(0);
    expect(yardPropHits(YARD_CLEAR.x0, YARD_CLEAR.y0, YARD_CLEAR.x1, YARD_CLEAR.y1)).toBe(0);
    expect(yardPropHits(PHONE_CAM.x0, PHONE_CAM.y0, PHONE_CAM.x1, PHONE_CAM.y1)).toBeGreaterThanOrEqual(8);
  });

  it("draws the pack dive-suit hero and phone power slots without ammo strip", () => {
    const look = readFileSync("src/art/look.ts", "utf8");
    expect(look.includes("heroSpriteId")).toBe(true);
    expect(look.includes("blitSheetLean(ctx, heroSpriteId")).toBe(true);
    const rack = readFileSync("src/render/weapons.ts", "utf8");
    expect(rack.includes("layout.phone")).toBe(true);
    expect(rack.includes("34/210")).toBe(true);
    const hud = readFileSync("src/render/hud.ts", "utf8");
    expect(hud.includes("difficultyLabel(w.rank)")).toBe(true);
    expect(hud.includes("layout.phone")).toBe(true);
    expect(hud.includes("if (!layout.phone && layout.face.w > 0) portrait")).toBe(true);
    const bottom = readFileSync("src/render/hud-bottom.ts", "utf8");
    expect(bottom.includes("heartCol = low ? DANGER : CYAN")).toBe(true);
  });
});
