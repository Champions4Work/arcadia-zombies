import { readFileSync } from "node:fs";
import { stampBlood, stampCasing, stainCount, resetStains, STAIN_CAP } from "../src/render/stains";
import { yardPropHits } from "../src/render/yard-fx";
import { SEE_AXIS } from "../src/shell/play-view";

describe("visual review gates", () => {
  it("packs the hero at true-scale 64px and reads pack fields through quoted keys", () => {
    const pack = JSON.parse(readFileSync("src/art/packed/pack.json", "utf8"));
    expect(pack.hero_px).toBe(64);
    const sheet = readFileSync("src/art/sheet.ts", "utf8");
    expect(sheet.includes('spr["x"]')).toBe(true);
    expect(sheet.includes("imageSmoothingEnabled = false")).toBe(true);
    expect(SEE_AXIS).toBe(288);
  });

  it("keeps a 390-wide spawn window as busy as the yard reference", () => {
    expect(yardPropHits(320, 0, 640, 640)).toBeGreaterThanOrEqual(24);
    expect(yardPropHits(0, 0, 200, 200)).toBeLessThan(yardPropHits(320, 0, 640, 640));
  });

  it("grades dusk with a warm multiply, vignette, and lamp-strength pools", () => {
    const draw = readFileSync("src/render/draw.ts", "utf8");
    expect(draw.includes("rgba(220,132,52,0.34)")).toBe(true);
    expect(draw.includes("rgba(8,6,4,0.78)")).toBe(true);
    expect(draw.includes("rgba(255,186,88,0.42)")).toBe(true);
    const yard = readFileSync("src/render/yard-fx.ts", "utf8");
    expect(yard.includes("0.72")).toBe(true);
    expect(yard.includes("pipes_blue_tank")).toBe(true);
    expect(yard.includes("breakable_boiler")).toBe(true);
    expect(yard.includes("valve_steam")).toBe(true);
  });

  it("stamps blood and casings on hit or shot without growing past the cap", () => {
    resetStains();
    expect(stainCount()).toBe(0);
    stampBlood(480, 320, 3);
    stampCasing(470, 324, 9);
    expect(stainCount()).toBeGreaterThanOrEqual(2);
    for (let i = 0; i < 200; i++) stampBlood(i, i, i);
    expect(stainCount()).toBeLessThanOrEqual(STAIN_CAP);
    resetStains();
    expect(stainCount()).toBe(0);
  });
});
