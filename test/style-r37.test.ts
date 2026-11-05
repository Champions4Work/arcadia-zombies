import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { PHONE_CAM, YARD_CLEAR, yardCratePropsInClear, yardPropHits } from "../src/render/yard-fx";
import { VENT_R2, VENT_SLOW, ventCount, ventX, ventY } from "../src/sim/depth";
import { ventSlowAt } from "../src/sim/depth.hot";
import { createWorld } from "../src/sim/world";

describe("r37 side vents + breakable crates phone-visible", () => {
  it("parks sparse breakables on side rails only, never in YARD_CLEAR", () => {
    const yard = readFileSync("src/render/yard-fx.ts", "utf8");
    const brassProps = yard.slice(yard.indexOf("const PROPS:"), yard.indexOf("const TANKS"));
    expect(brassProps.includes("crate_stack")).toBe(true);
    expect(brassProps.includes('"barrel"')).toBe(true);
    expect(brassProps.includes('"crate"')).toBe(true);
    expect(yard.includes("RAIL_BREAKABLE_SCALE")).toBe(true);
    expect(yard.includes("paintFloorDecal")).toBe(true);
    expect(yardCratePropsInClear()).toBe(0);
    expect(yardPropHits(YARD_CLEAR.x0, YARD_CLEAR.y0, YARD_CLEAR.x1, YARD_CLEAR.y1)).toBe(0);
  });

  it("slows the hunter on side-rail vent pads aligned with yard decals", () => {
    const w = createWorld(37);
    expect(ventCount(w)).toBeGreaterThanOrEqual(7);
    const pads = [
      [310, 458],
      [656, 458],
      [310, 636],
      [656, 636],
    ] as const;
    for (const [x, y] of pads) {
      let hit = false;
      for (let i = 0; i < ventCount(w); i++) {
        const dx = x - ventX(w, i);
        const dy = y - ventY(w, i);
        if (dx * dx + dy * dy <= VENT_R2) hit = true;
      }
      expect(hit).toBe(true);
      expect(ventSlowAt(w, x, y)).toBe(VENT_SLOW);
    }
  });

  it("keeps mid-rail crate props inside the phone camera band", () => {
    const yard = readFileSync("src/render/yard-fx.ts", "utf8");
    expect(yard.includes("{ id: \"crate_stack\", x: 302, y: 538 }")).toBe(true);
    expect(yard.includes("{ id: \"crate\", x: 658, y: 538 }")).toBe(true);
    expect(302).toBeLessThan(YARD_CLEAR.x0);
    expect(658).toBeGreaterThan(YARD_CLEAR.x1);
    expect(538).toBeGreaterThan(PHONE_CAM.y0);
    expect(538).toBeLessThan(PHONE_CAM.y1);
  });

  it("stores props-r37 phone review captures under docs/reviews/props-r37", () => {
    expect(readFileSync("docs/reviews/props-r37/phone_390_play.png", "utf8").length).toBeGreaterThan(8000);
    expect(readFileSync("docs/reviews/props-r37/compare_390_ref1.png", "utf8").length).toBeGreaterThan(8000);
    expect(readFileSync("docs/reviews/props-r37/compare_390_ref2.png", "utf8").length).toBeGreaterThan(8000);
    expect(readFileSync("docs/reviews/props-r37/trio_ref1_play_ref2.png", "utf8").length).toBeGreaterThan(8000);
    expect(readFileSync("docs/reviews/props-r37/side_crop_rails.png", "utf8").length).toBeGreaterThan(4000);
  });
});
