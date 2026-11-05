import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
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

describe("belt-r47 normal-play chevron cargo", () => {
  it("seeds hero-belt cargo at attachDepth without reviewDepth or ?shot=1", () => {
    const w = createWorld(7);
    expect(cargoOn(w, 0)).toBe(1);
    expect(cargoOn(w, 1)).toBe(1);
    expect(cargoPhase(w, 0)).toBe(CARGO_RIDE);
    expect(cargoOnPhoneHeroBelt(cargoX(w, 0), cargoY(w, 0))).toBe(true);
    expect(cargoOnPhoneHeroBelt(cargoX(w, 1), cargoY(w, 1))).toBe(true);
  });

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

  it("parks review cargo on the same hero-belt sim slots as normal play", () => {
    const w = createWorld(42);
    reviewDepth(w);
    expect(cargoOn(w, 0)).toBe(1);
    expect(cargoOn(w, 1)).toBe(1);
    expect(cargoPhase(w, 0)).toBe(CARGO_RIDE);
    expect(cargoPhase(w, 1)).toBe(CARGO_RIDE);
    expect(cargoOutsideFightClear(cargoX(w, 0), cargoY(w, 0))).toBe(true);
    expect(cargoY(w, 0)).toBeGreaterThan(SIDE_BELT_RIDE_Y);
    expect(cargoY(w, 0)).toBeLessThan(SIDE_BELT_RIDE_Y + DROP_ALONG * 0.35);
  });

  it("paints belt cubes from paintDepthLive on LAYER_MID without review-shot gating", () => {
    const depth = readFileSync("src/render/depth.ts", "utf8");
    const yard = readFileSync("src/render/yard-fx.ts", "utf8");
    expect(depth.includes("paintBeltUpgradeCube")).toBe(true);
    expect(depth.includes("registerLayer(LAYER_MID, paintDepthMid)")).toBe(true);
    expect(depth.includes("globalCompositeOperation = \"source-over\"")).toBe(true);
    expect(depth.includes("BELT_CUBE_SCALE = 1.5")).toBe(true);
    expect(depth.includes("wantsReviewShot")).toBe(false);
    expect(yard.includes("wantsReviewShot")).toBe(false);
    expect(yard.includes("paintBeltUpgradeCube")).toBe(false);
    expect(depth.includes("blue_glow")).toBe(false);
    expect(depth.includes("crate_stack")).toBe(false);
  });

  it("stores belt-r47 review captures and passes pixel gates", () => {
    const dir = "docs/reviews/belt-r47";
    expect(readFileSync(`${dir}/phone_390_play.png`, "utf8").length).toBeGreaterThan(8000);
    const beltPath = `${dir}/belt_cargo_crop.png`;
    expect(readFileSync(beltPath, "utf8").length).toBeGreaterThan(2000);
    expect(readFileSync(`${dir}/midband_crop.png`, "utf8").length).toBeGreaterThan(2000);
    expect(readFileSync(`${dir}/midband_gate.txt`, "utf8")).toMatch(/blue=\d+/);
    expect(readFileSync(`${dir}/belt_cargo_gate.txt`, "utf8")).toMatch(/gold=\d+/);
    execFileSync("node", ["scripts/belt_cargo_pixel_gate.mjs", beltPath], { stdio: "pipe" });
    execFileSync("node", ["scripts/midband_pixel_gate.mjs", `${dir}/midband_crop.png`], { stdio: "pipe" });
    expect(readFileSync(`${dir}/NOTE.md`, "utf8")).toMatch(/#132/);
    expect(readFileSync(`${dir}/NOTE.md`, "utf8")).toMatch(/paintDepthLive/);
  });
});
