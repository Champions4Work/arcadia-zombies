import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { YARD_CLEAR } from "../src/render/yard-fx";
import { CARGO_RIDE, CARGO_UPG, cargoKind, cargoOn, cargoPhase, cargoX, cargoY, reviewDepth } from "../src/sim/depth";
import { createWorld } from "../src/sim/world";

function inClear(x: number, y: number): boolean {
  return x >= YARD_CLEAR.x0 && x <= YARD_CLEAR.x1 && y >= YARD_CLEAR.y0 && y <= YARD_CLEAR.y1;
}

describe("r32 belt delivery visibility", () => {
  it("scrolls conveyor art and yellow arrows on the brass perimeter belt", () => {
    const yard = readFileSync("src/render/yard-fx.ts", "utf8");
    const beltFn = yard.slice(yard.indexOf("function paintCrossBelt"), yard.indexOf("export const HERO_X"));
    expect(beltFn.includes("yardBound !== ZONE_BRASS")).toBe(false);
    expect(beltFn.includes("blitSheet(ctx, \"conveyor\"")).toBe(true);
    expect(beltFn.includes("arrow(ctx")).toBe(true);
    expect(beltFn.includes("tick * 2.4")).toBe(true);
    expect(yard.indexOf("paintBrassGrade")).toBeLessThan(yard.lastIndexOf("paintCrossBelt"));
    const depth = readFileSync("src/render/depth.ts", "utf8");
    expect(depth.includes("CARGO_UPG")).toBe(true);
    expect(depth.includes("crate_stack")).toBe(true);
    expect(depth.includes("paintRidingCargoBelts")).toBe(true);
  });

  it("parks a glowing upgrade crate mid-belt for review shots", () => {
    const w = createWorld(32);
    reviewDepth(w);
    expect(cargoOn(w, 0)).toBe(1);
    expect(cargoPhase(w, 0)).toBe(CARGO_RIDE);
    expect(cargoKind(w, 0)).toBe(CARGO_UPG);
    expect(Math.abs(cargoX(w, 0) - 480)).toBeLessThan(0.1);
    expect(Math.abs(cargoY(w, 0) - 658)).toBeLessThan(0.1);
    expect(inClear(cargoX(w, 0), cargoY(w, 0))).toBe(false);
  });

  it("stores r32 phone review captures under docs/reviews/belt-r32", () => {
    expect(readFileSync("docs/reviews/belt-r32/phone_390_play.png", "utf8").length).toBeGreaterThan(8000);
    expect(readFileSync("docs/reviews/belt-r32/compare_390_ref1.png", "utf8").length).toBeGreaterThan(8000);
    expect(readFileSync("docs/reviews/belt-r32/compare_390_ref2.png", "utf8").length).toBeGreaterThan(8000);
    expect(readFileSync("docs/reviews/belt-r32/trio_ref1_play_ref2.png", "utf8").length).toBeGreaterThan(8000);
  });
});
