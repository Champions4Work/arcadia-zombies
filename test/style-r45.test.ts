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

describe("belt-r45 medium gold glow cubes on phone chevrons", () => {
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
    const w = createWorld(42);
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

  it("paints medium gold amber belt cubes with stronger halo, not blue_glow or crate blits", () => {
    const src = readFileSync("src/render/depth.ts", "utf8");
    expect(src.includes("paintBeltUpgradeCube")).toBe(true);
    expect(src.includes("BELT_CUBE_S = 9.75")).toBe(true);
    expect(src.includes("blue_glow")).toBe(false);
    expect(src.includes("crate_stack")).toBe(false);
    expect(src.includes("blitSheet(ctx, \"crate\"")).toBe(false);
    expect(src.includes("magenta")).toBe(false);
    expect(src.includes("#ff00ff")).toBe(false);
  });

  it("stores belt-r45 review captures under docs/reviews/belt-r45", () => {
    expect(readFileSync("docs/reviews/belt-r45/phone_390_play.png", "utf8").length).toBeGreaterThan(8000);
    expect(readFileSync("docs/reviews/belt-r45/belt_cargo_crop.png", "utf8").length).toBeGreaterThan(2000);
    expect(readFileSync("docs/reviews/belt-r45/midband_crop.png", "utf8").length).toBeGreaterThan(2000);
    expect(readFileSync("docs/reviews/belt-r45/midband_gate.txt", "utf8")).toMatch(/blue=\d+/);
    expect(readFileSync("docs/reviews/belt-r45/diff_vs_120.txt", "utf8")).toMatch(/#120/);
    expect(readFileSync("docs/reviews/belt-r45/diff_vs_123.txt", "utf8")).toMatch(/#123/);
    expect(readFileSync("docs/reviews/belt-r45/NOTE.md", "utf8")).toMatch(/#120/);
    const gate = readFileSync("docs/reviews/belt-r45/belt_cargo_gate.txt", "utf8");
    expect(gate).toMatch(/amber=\d+/);
    expect(gate).toMatch(/cardboard=\d+/);
    const amber = Number(gate.match(/amber=(\d+)/)?.[1] ?? "0");
    const cardboard = Number(gate.match(/cardboard=(\d+)/)?.[1] ?? "9999");
    expect(amber).toBeGreaterThan(550);
    expect(cardboard).toBeLessThan(220);
  });

  it("stores belt-r45 compare trio vs docs/target_look*", () => {
    const dir = "docs/reviews/belt-r45/compare";
    expect(readFileSync(`${dir}/trio_ref1_play_ref2.png`, "utf8").length).toBeGreaterThan(8000);
    expect(readFileSync(`${dir}/compare_390_ref2.png`, "utf8").length).toBeGreaterThan(8000);
  });
});
