import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { YARD_CLEAR, yardCratePropsInClear, yardPropHits } from "../src/render/yard-fx";

describe("r32 perimeter world pass", () => {
  it("drops the center cyan pipe runway and keeps YARD_CLEAR open", () => {
    const yard = readFileSync("src/render/yard-fx.ts", "utf8");
    const pipes = yard.slice(yard.indexOf("const PIPE_RUNS = ["), yard.indexOf("const BELT_H"));
    expect(yard.includes("y: 232, len: 368")).toBe(false);
    expect(pipes.includes("y: 218")).toBe(true);
    expect(yard.includes("y: 648, len: 368")).toBe(true);
    expect(yardCratePropsInClear()).toBe(0);
    expect(yardPropHits(YARD_CLEAR.x0, YARD_CLEAR.y0, YARD_CLEAR.x1, YARD_CLEAR.y1)).toBe(0);
  });

  it("densifies spawn buildings and top perimeter machinery", () => {
    const yard = readFileSync("src/render/yard-fx.ts", "utf8");
    const buildings = yard.slice(yard.indexOf("const BUILDINGS = ["), yard.indexOf("const BELTS"));
    expect((buildings.match(/\{ x:/g) || []).length).toBe(5);
    expect(yard.includes("y: 274")).toBe(true);
    expect(yard.includes("building_wall_door")).toBe(true);
    expect(yard.includes("pipes_blue_tank")).toBe(true);
    expect(yard.includes("valve_steam")).toBe(true);
    expect(yard.includes("conveyor")).toBe(true);
    const ground = readFileSync("src/render/ground.ts", "utf8");
    expect(ground.includes("296, 132, 368")).toBe(false);
    expect(ground.includes("296, 128, 88")).toBe(true);
  });

  it("stores r32 phone review captures under docs/reviews/r32", () => {
    expect(readFileSync("docs/reviews/r32/phone_390_play.png", "utf8").length).toBeGreaterThan(8000);
    expect(readFileSync("docs/reviews/r32/compare_390_ref1.png", "utf8").length).toBeGreaterThan(8000);
    expect(readFileSync("docs/reviews/r32/compare_390_ref2.png", "utf8").length).toBeGreaterThan(8000);
    expect(readFileSync("docs/reviews/r32/trio_ref1_play_ref2.png", "utf8").length).toBeGreaterThan(8000);
  });

  it("documents r32 perimeter OK / center banned in STYLE.md", () => {
    const bible = readFileSync("docs/STYLE.md", "utf8");
    expect(bible.includes("Round 32")).toBe(true);
    expect(bible.includes("docs/reviews/r32/")).toBe(true);
    expect(bible.includes("Center densify stays banned")).toBe(true);
  });
});
