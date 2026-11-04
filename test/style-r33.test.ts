import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { YARD_CLEAR, yardCratePropsInClear, yardPropHits } from "../src/render/yard-fx";

describe("r33 painted spawn buildings and rail tanks", () => {
  it("drops full-width cyan pipe runs and scales az_art spawn facades", () => {
    const yard = readFileSync("src/render/yard-fx.ts", "utf8");
    const buildings = yard.slice(yard.indexOf("const BUILDINGS = ["), yard.indexOf("const BELTS"));
    expect((buildings.match(/\{ x:/g) || []).length).toBeGreaterThanOrEqual(5);
    expect(yard.includes("BUILD_SCALE = 1.48")).toBe(true);
    expect(yard.includes("TANK_SCALE = 1.68")).toBe(true);
    expect(yard.includes("VALVE_SCALE = 1.42")).toBe(true);
    expect(yard.includes("building_wall_door")).toBe(true);
    const brassPipes = yard.slice(yard.indexOf("const PIPE_RUNS:"), yard.indexOf("const BELT_H"));
    expect(brassPipes.includes("len: 368")).toBe(false);
    expect(brassPipes.includes("y: 232")).toBe(false);
    expect(yard.includes("len: 368, vert: 0")).toBe(false);
  });

  it("stacks large blue tanks and valves on both rails without yard clutter", () => {
    const yard = readFileSync("src/render/yard-fx.ts", "utf8");
    const brassProps = yard.slice(yard.indexOf("const PROPS:"), yard.indexOf("const TANKS"));
    expect(brassProps.includes("pipes_blue_tank")).toBe(true);
    expect(brassProps.includes("valve_steam")).toBe(true);
    expect(brassProps.includes("blue_puddle")).toBe(true);
    expect((brassProps.match(/pipes_blue_tank/g) || []).length).toBeGreaterThanOrEqual(6);
    expect((brassProps.match(/valve_steam/g) || []).length).toBeGreaterThanOrEqual(6);
    expect(brassProps.includes("crate_stack")).toBe(false);
    expect(brassProps.includes('"barrel"')).toBe(false);
    expect(brassProps.includes('"crate"')).toBe(false);
    expect(yardCratePropsInClear()).toBe(0);
    expect(yardPropHits(YARD_CLEAR.x0, YARD_CLEAR.y0, YARD_CLEAR.x1, YARD_CLEAR.y1)).toBe(0);
  });

  it("documents r33 review captures under docs/reviews/r33", () => {
    expect(readFileSync("docs/reviews/r33/phone_390_play.png", "utf8").length).toBeGreaterThan(8000);
    expect(readFileSync("docs/reviews/r33/compare_390_ref1.png", "utf8").length).toBeGreaterThan(8000);
    expect(readFileSync("docs/reviews/r33/compare_390_ref2.png", "utf8").length).toBeGreaterThan(8000);
    expect(readFileSync("docs/reviews/r33/trio_ref1_play_ref2.png", "utf8").length).toBeGreaterThan(8000);
  });
});
