import { readFileSync } from "node:fs";
import { createWorld } from "../src/sim/world";
import { stampBlood, stampCasing, stainCount, resetStains, STAIN_CAP } from "../src/render/stains";
import { reviewHorde, REVIEW_HORDE, wantsReviewShot } from "../src/shell/review-shot";
import { yardPropHits, YARD_CLEAR } from "../src/render/yard-fx";
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

  it("keeps props on the walls and the spawn floor open", () => {
    expect(yardPropHits(320, 0, 640, 640)).toBeGreaterThanOrEqual(20);
    expect(yardPropHits(YARD_CLEAR.x0, YARD_CLEAR.y0, YARD_CLEAR.x1, YARD_CLEAR.y1)).toBe(0);
  });

  it("keeps dusk dark with local lamp pools and no global orange wash", () => {
    const draw = readFileSync("src/render/draw.ts", "utf8");
    expect(draw.includes("rgba(6,6,10,0.9)")).toBe(true);
    expect(draw.includes("rgba(220,132,52,0.34)")).toBe(false);
    expect(draw.includes("rgba(255,186,88,0.42)")).toBe(false);
    const yard = readFileSync("src/render/yard-fx.ts", "utf8");
    expect(yard.includes("ellipse(x, y + 4, 36, 20")).toBe(true);
    expect(yard.includes("pipes_blue_tank")).toBe(true);
    expect(yard.includes("objectives_panel") || readFileSync("src/render/hud.ts", "utf8").includes("objectives_panel")).toBe(true);
  });

  it("keeps spawn telegraphs and kill puffs on pack sprites, and aligns vertical belts", () => {
    const yard = readFileSync("src/render/yard-fx.ts", "utf8");
    const door = yard.slice(yard.indexOf("export function paintDoorSpawn"));
    expect(door.includes("window_lit")).toBe(true);
    expect(door.includes("building_wall_door")).toBe(false);
    expect(yard.includes("ctx.rotate(Math.PI / 2)")).toBe(true);
    const puff = readFileSync("src/render/cast-fx.ts", "utf8");
    expect(puff.includes("paintZombie")).toBe(true);
    expect(puff.includes("zombieGlyph")).toBe(false);
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

  it("arms a mid-fight review horde without touching spawn tables", () => {
    expect(wantsReviewShot("?shot=1", "")).toBe(true);
    expect(wantsReviewShot("", "#review")).toBe(true);
    expect(wantsReviewShot("", "")).toBe(false);
    const w = createWorld(7);
    expect(reviewHorde(w)).toBe(REVIEW_HORDE);
    expect(REVIEW_HORDE).toBeGreaterThanOrEqual(30);
    let n = 0;
    for (let i = 0; i < w.zombies.alive.length; i++) if (w.zombies.alive[i]) n++;
    expect(n).toBe(REVIEW_HORDE);
    expect(w.px).toBe(480);
    expect(w.py).toBe(320);
  });
});
