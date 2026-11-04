import { readFileSync } from "node:fs";
import { createWorld } from "../src/sim/world";
import { HERO_DRAW_SCALE, HERO_PACK_H } from "../src/art/look";
import { HAZARD_MARKS } from "../src/render/ground";
import { yardPropHits, YARD_CLEAR, PHONE_CAM } from "../src/render/yard-fx";
import { bindHud, boxesOverlap, hudBoxes, layoutHud } from "../src/shell/hud-layout";
import { computeFit } from "../src/shell/fit";
import { playView } from "../src/shell/play-view";
import { readViewport, ZERO_INSETS } from "../src/shell/viewport";
import { drawHud } from "../src/render/hud";

function stubCtx(texts: string[]): CanvasRenderingContext2D {
  const grad = { addColorStop() {} };
  const noop = () => {};
  const ctx: Record<string, unknown> = {
    canvas: { width: 390 },
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 1,
    font: "",
    textAlign: "left",
    textBaseline: "alphabetic",
    globalAlpha: 1,
    lineJoin: "round",
    lineCap: "round",
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

describe("r24 style pass", () => {
  it("keeps main phone HUD chrome with minimap, objectives, and pack hero scale", () => {
    const texts: string[] = [];
    const vp = readViewport({ innerWidth: 390, innerHeight: 844, devicePixelRatio: 3 }, ZERO_INSETS);
    const pv = playView(vp.cssW, vp.cssH);
    const fit = computeFit(vp.cssW, vp.cssH, vp.dpr, pv.viewW, pv.viewH, ZERO_INSETS);
    const hud = layoutHud(vp, fit);
    bindHud(hud);
    drawHud(stubCtx(texts), createWorld(7));
    expect(hud.minimap.w).toBeGreaterThan(0);
    expect(hud.objectives.w).toBeGreaterThan(0);
    expect(hud.face.w).toBeGreaterThan(0);
    expect(texts.some((t) => t.includes("Objectives") || t.includes("ACTIVATE"))).toBe(true);
    expect(texts.some((t) => t.startsWith("LV "))).toBe(true);
    expect(texts.some((t) => t.includes("34/210"))).toBe(true);
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
    expect(yard.includes("function lampWash")).toBe(false);
    expect(yard.includes("lampRay(ctx, pool")).toBe(false);
    expect(HAZARD_MARKS.length).toBeLessThanOrEqual(3);
    expect(yardPropHits(YARD_CLEAR.x0, YARD_CLEAR.y0, YARD_CLEAR.x1, YARD_CLEAR.y1)).toBe(0);
    expect(yardPropHits(PHONE_CAM.x0, PHONE_CAM.y0, PHONE_CAM.x1, PHONE_CAM.y1)).toBeGreaterThanOrEqual(28);
  });

  it("drops multiply plate darkening and warm sky shafts while keeping the brass pack hero", () => {
    const ground = readFileSync("src/render/ground.ts", "utf8");
    const paint = ground.slice(ground.indexOf("export function paintGround"));
    expect(paint.includes('globalCompositeOperation = "multiply"')).toBe(false);
    expect(paint.includes("const veil =")).toBe(true);
    const stage = readFileSync("src/render/stage.ts", "utf8");
    expect(stage.includes("rgba(255,220,170,0.42)")).toBe(false);
    const look = readFileSync("src/art/look.ts", "utf8");
    expect(look.includes("rgba(62,220,220,0.32)")).toBe(true);
    expect(look.includes("rgba(255,176,80,0.72)")).toBe(false);
    expect(look.includes("heroSpriteId")).toBe(true);
    const draw = readFileSync("src/render/draw.ts", "utf8");
    expect(draw.includes("rgba(4,6,12,0.32)")).toBe(true);
    expect(draw.includes("paintYardGlow")).toBe(false);
  });
});
