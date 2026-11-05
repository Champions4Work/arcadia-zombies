import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { YARD_CLEAR, yardCratePropsInClear, yardPropHits } from "../src/render/yard-fx";
import { CARGO_RIDE, cargoOn, cargoPhase, cargoX, cargoY, reviewDepth } from "../src/sim/depth";
import { createWorld } from "../src/sim/world";

function inClear(x: number, y: number): boolean {
  return x >= YARD_CLEAR.x0 && x <= YARD_CLEAR.x1 && y >= YARD_CLEAR.y0 && y <= YARD_CLEAR.y1;
}

describe("r31 open fight floor + perimeter az_art", () => {
  it("keeps crate, barrel, and crate_stack props out of YARD_CLEAR on brass", () => {
    expect(yardCratePropsInClear()).toBe(0);
    expect(yardPropHits(YARD_CLEAR.x0, YARD_CLEAR.y0, YARD_CLEAR.x1, YARD_CLEAR.y1)).toBe(0);
  });

  it("parks the upgrade belt and review cargo on the bottom perimeter conveyor", () => {
    const w = createWorld(31);
    reviewDepth(w);
    expect(cargoOn(w, 0)).toBe(1);
    expect(cargoPhase(w, 0)).toBe(CARGO_RIDE);
    expect(inClear(cargoX(w, 0), cargoY(w, 0))).toBe(false);
  });

  it("stores r31 phone review captures under docs/reviews/r31", () => {
    expect(readFileSync("docs/reviews/r31/phone_390_play.png", "utf8").length).toBeGreaterThan(8000);
    expect(readFileSync("docs/reviews/r31/compare_390_ref1.png", "utf8").length).toBeGreaterThan(8000);
    expect(readFileSync("docs/reviews/r31/compare_390_ref2.png", "utf8").length).toBeGreaterThan(8000);
    expect(readFileSync("docs/reviews/r31/trio_ref1_play_ref2.png", "utf8").length).toBeGreaterThan(8000);
  });
});
