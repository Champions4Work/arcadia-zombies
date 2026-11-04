import { readFileSync } from "node:fs";
import { createWorld } from "../src/sim/world";
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

describe("r21 phone look", () => {
  it("paints energy chrome without a live energy pool", () => {
    const texts: string[] = [];
    const vp = readViewport({ innerWidth: 390, innerHeight: 844, devicePixelRatio: 3 }, ZERO_INSETS);
    const pv = playView(vp.cssW, vp.cssH);
    const fit = computeFit(vp.cssW, vp.cssH, vp.dpr, pv.viewW, pv.viewH, ZERO_INSETS);
    bindHud(layoutHud(vp, fit));
    drawHud(stubCtx(texts), createWorld(1));
    expect(texts).toContain("120/120");
    expect(texts).toContain("240/240");
    const world = createWorld(1) as unknown as Record<string, unknown>;
    expect("energy" in world).toBe(false);
    expect("stamina" in world).toBe(false);
    const types = readFileSync("src/sim/types.ts", "utf8");
    expect(types.includes("energy")).toBe(false);
  });

  it("stacks portrait bars beside the chapter and keeps the map under the bust", () => {
    const vp = readViewport({ innerWidth: 390, innerHeight: 844, devicePixelRatio: 3 }, ZERO_INSETS);
    const pv = playView(vp.cssW, vp.cssH);
    const fit = computeFit(vp.cssW, vp.cssH, vp.dpr, pv.viewW, pv.viewH, ZERO_INSETS);
    const hud = layoutHud(vp, fit);
    expect(hud.face.x).toBeLessThan(vp.cssW * 0.12);
    expect(hud.face.y).toBeLessThan(vp.cssH * 0.08);
    expect(hud.minimap.y).toBeGreaterThanOrEqual(hud.face.y + hud.face.h);
    expect(hud.difficulty.x).toBeGreaterThanOrEqual(hud.face.x + hud.face.w);
    expect(hud.difficulty.x + hud.difficulty.w * 0.5).toBeGreaterThan(vp.cssW * 0.4);
    expect(hud.difficulty.x + hud.difficulty.w * 0.5).toBeLessThan(vp.cssW * 0.7);
    expect(hud.clock.x).toBeGreaterThan(vp.cssW * 0.55);
    const boxes = hudBoxes(hud);
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        expect(boxesOverlap(boxes[i]!, boxes[j]!)).toBe(false);
      }
    }
  });

  it("keeps a thick cyan pipe, two red valves, and lamp pools on the phone cam", () => {
    const yard = readFileSync("src/render/yard-fx.ts", "utf8");
    expect(yard.includes("fillRect(x, y - 40, len, 80)")).toBe(true);
    expect(yard.includes("fillRect(x + 6, y - 12, len - 12, 24)")).toBe(true);
    expect(yard.includes("#7ae0d4")).toBe(true);
    expect(yard.includes("VALVE_B")).toBe(true);
    expect(yard.includes("ellipse(x, y + 10, 60, 36")).toBe(true);
    expect(yard.includes("rgba(255,196,110,0.25)")).toBe(true);
    expect(yard.includes("export function paintYardGlow")).toBe(false);
    expect(yard.includes("function lampWash")).toBe(false);
    expect(yard.includes("function lampRay")).toBe(true);
    const poolBlock = yard.slice(yard.indexOf("const POOLS"), yard.indexOf("const STEAM_VENTS"));
    expect((poolBlock.match(/\{ x:/g) || []).length).toBe(3);
    expect(yard.includes("FLOOR_DECALS")).toBe(true);
    expect(yard.includes("decal_grate")).toBe(true);
    expect(yard.includes("decal_vent")).toBe(true);
    const vents = yard.slice(yard.indexOf("const STEAM_VENTS"), yard.indexOf("export const YARD_CLEAR"));
    expect((vents.match(/\{ x:/g) || []).length).toBe(3);
    expect(yard.includes("vert: 1")).toBe(false);
    expect(HAZARD_MARKS.length).toBe(0);
    expect(yardPropHits(YARD_CLEAR.x0, YARD_CLEAR.y0, YARD_CLEAR.x1, YARD_CLEAR.y1)).toBe(0);
    expect(yardPropHits(PHONE_CAM.x0, PHONE_CAM.y0, PHONE_CAM.x1, PHONE_CAM.y1)).toBeGreaterThanOrEqual(32);
  });

  it("rims the hunter in lamp amber and dusks the sky", () => {
    const look = readFileSync("src/art/look.ts", "utf8");
    expect(look.includes("rgba(255,176,80,0.36)")).toBe(true);
    expect(look.includes("rgba(255,168,72,0.34)")).toBe(true);
    expect(look.includes("rgba(62,220,220,0.32)")).toBe(false);
    const stage = readFileSync("src/render/stage.ts", "utf8");
    expect(stage.includes("#241028")).toBe(true);
    expect(stage.includes("#4a2418")).toBe(true);
    const draw = readFileSync("src/render/draw.ts", "utf8");
    expect(draw.includes("rgba(4,6,12,0.72)")).toBe(true);
    expect(draw.includes("rgba(24,14,8,0.08)")).toBe(true);
    expect(draw.includes("paintYardGlow")).toBe(false);
    expect(draw.includes("rgba(40,18,10,0.05)")).toBe(false);
  });
});
