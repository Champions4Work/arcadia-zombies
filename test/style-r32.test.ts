import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("r32 fx-only phone read", () => {
  it("keeps fx-r32 review captures as the prior steam pass baseline", () => {
    expect(readFileSync("docs/reviews/fx-r32/phone_390_play.png", "utf8").length).toBeGreaterThan(8000);
    expect(readFileSync("docs/reviews/fx-r32/compare_390_ref1.png", "utf8").length).toBeGreaterThan(8000);
    expect(readFileSync("docs/reviews/fx-r32/compare_390_ref2.png", "utf8").length).toBeGreaterThan(8000);
    expect(readFileSync("docs/reviews/fx-r32/trio_ref1_play_ref2.png", "utf8").length).toBeGreaterThan(8000);
  });

  it("limits blue glow to tanks and pipe props without breakable halos", () => {
    const yard = readFileSync("src/render/yard-fx.ts", "utf8");
    expect(yard.includes("function bluePuddle")).toBe(true);
    expect(yard.includes("BLUE_GLOW_ALPHA = 0.3")).toBe(true);
    expect(yard.includes('p.id === "pipes_blue_tank"')).toBe(true);
    expect(yard.includes('p.id === "blue_puddle"')).toBe(true);
    expect(yard.includes('breakable_gear_pylon" || p.id === "breakable_boiler" || p.id === "pipes_blue_tank"')).toBe(false);
    expect(yard.includes("rgba(90,245,255,0.7)")).toBe(false);
  });
});
