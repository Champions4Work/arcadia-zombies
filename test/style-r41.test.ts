import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { PHONE_HERO_BLITS, YARD_CLEAR, yardCratePropsInClear } from "../src/render/yard-fx";
import {
  CARGO_RIDE,
  DROP_ALONG,
  SIDE_BELT_LEFT_X,
  SIDE_BELT_RIGHT_X,
  SIDE_BELT_RIDE_Y,
  cargoOn,
  cargoOnPhoneHeroBelt,
  cargoOutsideFightClear,
  cargoPhase,
  cargoX,
  cargoY,
  reviewDepth,
} from "../src/sim/depth";
import { createWorld } from "../src/sim/world";

describe("belt-r41 phone chevron cargo", () => {
  it("aligns sim belts with PHONE_HERO_BLITS conveyor anchors inside the phone clip", () => {
    const conveyors = PHONE_HERO_BLITS.filter((b) => b.id === "conveyor");
    expect(conveyors.length).toBe(2);
    const left = conveyors[0];
    const right = conveyors[1];
    expect(left?.x).toBe(SIDE_BELT_LEFT_X);
    expect(right?.x).toBe(SIDE_BELT_RIGHT_X);
    expect(left?.y).toBe(SIDE_BELT_RIDE_Y);
    expect(right?.y).toBe(SIDE_BELT_RIDE_Y);
    expect(yardCratePropsInClear()).toBe(0);
    expect(YARD_CLEAR.x1 - YARD_CLEAR.x0).toBeGreaterThan(200);
  });

  it("parks review cargo riding the in-frame chevrons, not fight-floor brown crate props", () => {
    const w = createWorld(41);
    reviewDepth(w);
    expect(cargoOn(w, 0)).toBe(1);
    expect(cargoOn(w, 1)).toBe(1);
    expect(cargoPhase(w, 0)).toBe(CARGO_RIDE);
    expect(cargoPhase(w, 1)).toBe(CARGO_RIDE);
    expect(cargoOnPhoneHeroBelt(cargoX(w, 0), cargoY(w, 0))).toBe(true);
    expect(cargoOnPhoneHeroBelt(cargoX(w, 1), cargoY(w, 1))).toBe(true);
    expect(cargoOutsideFightClear(cargoX(w, 0), cargoY(w, 0))).toBe(true);
    expect(cargoY(w, 0)).toBeGreaterThan(SIDE_BELT_RIDE_Y);
    expect(cargoY(w, 0)).toBeLessThan(SIDE_BELT_RIDE_Y + DROP_ALONG * 0.5);
  });

  it("renders glow-first belt cargo without full-size floor crates", () => {
    const note = readFileSync("docs/reviews/belt-r41/diff_vs_115.txt", "utf8");
    expect(note.includes("blue_glow")).toBe(true);
    const src = readFileSync("src/render/depth.ts", "utf8");
    expect(src.includes("crate_stack")).toBe(false);
    expect(src.includes("blitSheet(ctx, \"crate\"")).toBe(false);
  });

  it("stores belt-r41 review captures under docs/reviews/belt-r41", () => {
    expect(readFileSync("docs/reviews/belt-r41/phone_390_play.png", "utf8").length).toBeGreaterThan(8000);
    expect(readFileSync("docs/reviews/belt-r41/belt_cargo_crop.png", "utf8").length).toBeGreaterThan(2000);
    expect(readFileSync("docs/reviews/belt-r41/midband_crop.png", "utf8").length).toBeGreaterThan(2000);
    expect(readFileSync("docs/reviews/belt-r41/midband_gate.txt", "utf8")).toMatch(/blue=\d+/);
    expect(readFileSync("docs/reviews/belt-r41/diff_vs_115.txt", "utf8")).toMatch(/#115/);
    expect(readFileSync("docs/reviews/belt-r41/compare_390_ref2.png", "utf8").length).toBeGreaterThan(8000);
  });
});
