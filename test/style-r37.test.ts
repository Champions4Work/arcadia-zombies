import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { HERO_X, PHONE_MID_BAND, YARD_CLEAR, yardPropHits } from "../src/render/yard-fx";

describe("r37 gate — kill cyan fight floor + mid-band az_art blits", () => {
  it("drops the fight-floor cyan pipe run and mid-band blit call sites use pack keys", () => {
    const yard = readFileSync("src/render/yard-fx.ts", "utf8");
    const pipeRuns = yard.slice(yard.indexOf("const PIPE_RUNS = ["), yard.indexOf("const BELT_H"));
    expect(pipeRuns.includes("y: 232")).toBe(false);
    expect(pipeRuns.includes("y: 648")).toBe(true);
    const crossPipe = yard.slice(yard.indexOf("function paintCrossPipe"), yard.indexOf("function paintVertPipe"));
    expect(crossPipe.includes("#7ae0d4")).toBe(false);
    expect(crossPipe.includes("rgba(70,230,255")).toBe(false);
    expect(yard.includes("const MID_BAND_BLITS")).toBe(true);
    const blits = yard.slice(yard.indexOf("const MID_BAND_BLITS"), yard.indexOf("const FIGHT_BAND_CRATE"));
    expect(blits.includes('"pipes_blue_tank"')).toBe(true);
    expect(blits.includes('"conveyor"')).toBe(true);
    const midPaint = yard.slice(yard.indexOf("function paintMidBandBlits"), yard.indexOf("export function paintMidBandYard"));
    expect(midPaint.includes("blitScaled(ctx, b.id")).toBe(true);
    expect(yard.includes("paintMidBandBlits(ctx, w.tick")).toBe(true);
    expect(yard.includes("registerLayer(LAYER_MID, paintMidBandYard)")).toBe(true);
  });

  it("keeps hero lane clear while parking mid-band props on phone-visible rails", () => {
    const yard = readFileSync("src/render/yard-fx.ts", "utf8");
    const blits = yard.slice(yard.indexOf("const MID_BAND_BLITS"), yard.indexOf("const FIGHT_BAND_CRATE"));
    expect(blits.includes("x: 312")).toBe(true);
    expect(blits.includes("x: 648")).toBe(true);
    for (const spot of [
      [312, 318],
      [304, 388],
      [648, 318],
      [656, 388],
    ] as const) {
      const dx = spot[0] - HERO_X;
      const dy = spot[1] - 320;
      expect(dx * dx + dy * dy).toBeGreaterThan(100 * 100);
      expect(spot[0] < YARD_CLEAR.x0 || spot[0] > YARD_CLEAR.x1).toBe(true);
    }
    expect(PHONE_MID_BAND.y0).toBeGreaterThanOrEqual(180);
    expect(PHONE_MID_BAND.y1).toBeLessThanOrEqual(500);
    expect(yardPropHits(YARD_CLEAR.x0, YARD_CLEAR.y0, YARD_CLEAR.x1, YARD_CLEAR.y1)).toBe(0);
  });

  it("stores r37 review captures under docs/reviews/r37", () => {
    expect(readFileSync("docs/reviews/r37/phone_390_play.png", "utf8").length).toBeGreaterThan(8000);
    expect(readFileSync("docs/reviews/r37/midband_crop.png", "utf8").length).toBeGreaterThan(2000);
    expect(readFileSync("docs/reviews/r37/compare_390_ref1.png", "utf8").length).toBeGreaterThan(8000);
    expect(readFileSync("docs/reviews/r37/compare_390_ref2.png", "utf8").length).toBeGreaterThan(8000);
    expect(readFileSync("docs/reviews/r37/trio_ref1_play_ref2.png", "utf8").length).toBeGreaterThan(8000);
    expect(readFileSync("docs/reviews/r37/vs_main_cyan.png", "utf8").length).toBeGreaterThan(8000);
    expect(readFileSync("docs/reviews/r37/vs_r35_brown.png", "utf8").length).toBeGreaterThan(8000);
  });
});
