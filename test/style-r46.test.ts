import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { PHONE_HERO_BLITS, YARD_CLEAR, yardCratePropsInClear } from "../src/render/yard-fx";
import {
  CARGO_RIDE,
  REVIEW_CARGO_T_LEFT,
  REVIEW_CARGO_T_RIGHT,
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

describe("belt-r46 phone chevron gold cubes", () => {
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

  it("parks review cargo on chevron anchors not mid-belt drop or fight-floor boilers", () => {
    const w = createWorld(42);
    reviewDepth(w);
    expect(cargoOn(w, 0)).toBe(1);
    expect(cargoOn(w, 1)).toBe(1);
    expect(cargoPhase(w, 0)).toBe(CARGO_RIDE);
    expect(cargoPhase(w, 1)).toBe(CARGO_RIDE);
    expect(cargoOnPhoneHeroBelt(cargoX(w, 0), cargoY(w, 0))).toBe(true);
    expect(cargoOnPhoneHeroBelt(cargoX(w, 1), cargoY(w, 1))).toBe(true);
    expect(cargoOutsideFightClear(cargoX(w, 0), cargoY(w, 0))).toBe(true);
    expect(cargoY(w, 0)).toBe(SIDE_BELT_RIDE_Y + REVIEW_CARGO_T_LEFT);
    expect(cargoY(w, 1)).toBe(SIDE_BELT_RIDE_Y + REVIEW_CARGO_T_RIGHT);
    expect(cargoX(w, 0)).toBe(SIDE_BELT_LEFT_X);
    expect(cargoX(w, 1)).toBe(SIDE_BELT_RIGHT_X);
  });

  it("renders 1.65x gold cubes on LAYER_MID with source-over halos for shot=1", () => {
    const src = readFileSync("src/render/belt-cube.ts", "utf8");
    expect(src.includes("paintBeltUpgradeCube")).toBe(true);
    expect(readFileSync("src/render/depth.ts", "utf8").includes("PHONE_CHEVRON_CARGO_DY")).toBe(true);
    expect(src.includes("globalCompositeOperation = \"source-over\"")).toBe(true);
    expect(src.includes("BELT_CUBE_SCALE = 1.65")).toBe(true);
    const depth = readFileSync("src/render/depth.ts", "utf8");
    expect(depth.includes("shot=1")).toBe(true);
    expect(src.includes("blue_glow")).toBe(false);
    expect(src.includes("blitSheet(ctx, \"crate\"")).toBe(false);
  });

  it("stores belt-r46 review captures and passes belt_cargo pixel gate", () => {
    const dir = "docs/reviews/belt-r46";
    expect(readFileSync(`${dir}/phone_390_play.png`, "utf8").length).toBeGreaterThan(8000);
    expect(readFileSync(`${dir}/belt_cargo_crop.png`, "utf8").length).toBeGreaterThan(2000);
    expect(readFileSync(`${dir}/midband_crop.png`, "utf8").length).toBeGreaterThan(2000);
    expect(readFileSync(`${dir}/midband_gate.txt`, "utf8")).toMatch(/blue=\d+/);
    const gateLine = readFileSync(`${dir}/belt_cargo_gate.txt`, "utf8").trim();
    expect(gateLine).toMatch(/chevronCube=\d+/);
    execFileSync("node", ["scripts/belt_cargo_pixel_gate.mjs", `${dir}/belt_cargo_crop.png`]);
    expect(gateLine).toMatch(/goldHi=\d+/);
    expect(readFileSync(`${dir}/compare_390_ref2.png`, "utf8").length).toBeGreaterThan(8000);
    expect(readFileSync(`${dir}/trio_ref1_play_ref2.png`, "utf8").length).toBeGreaterThan(8000);
    expect(readFileSync(`${dir}/NOTE.md`, "utf8")).toMatch(/#128/);
  });
});
