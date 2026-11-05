import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { PHONE_BOTTOM_CROP_FRAC } from "../src/render/hud-bottom";
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

describe("belt-r42 phone chevron amber cubes", () => {
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

  it("renders small gold amber belt cubes instead of oversized blue_glow blobs", () => {
    const src = readFileSync("src/render/depth.ts", "utf8");
    expect(src.includes("paintBeltUpgradeCube")).toBe(true);
    expect(src.includes("blue_glow")).toBe(false);
    expect(src.includes("crate_stack")).toBe(false);
    expect(src.includes("blitSheet(ctx, \"crate\"")).toBe(false);
  });

  it("stores belt-r42 review captures under docs/reviews/belt-r42", () => {
    expect(readFileSync("docs/reviews/belt-r42/phone_390_play.png", "utf8").length).toBeGreaterThan(8000);
    expect(readFileSync("docs/reviews/belt-r42/belt_cargo_crop.png", "utf8").length).toBeGreaterThan(2000);
    expect(readFileSync("docs/reviews/belt-r42/midband_crop.png", "utf8").length).toBeGreaterThan(2000);
    expect(readFileSync("docs/reviews/belt-r42/midband_gate.txt", "utf8")).toMatch(/blue=\d+/);
    expect(readFileSync("docs/reviews/belt-r42/diff_vs_115.txt", "utf8")).toMatch(/#115/);
    expect(readFileSync("docs/reviews/belt-r42/diff_vs_119.txt", "utf8")).toMatch(/#119/);
    expect(readFileSync("docs/reviews/belt-r42/compare_390_ref2.png", "utf8").length).toBeGreaterThan(8000);
  });
});

describe("hud r42 phone bottom polish", () => {
  it("teal heart glow, orange ult sun, and stroked LV on xp frame", () => {
    const bottom = readFileSync("src/render/hud-bottom.ts", "utf8");
    expect(bottom.includes("heartCol = low ? HEART_CORE : CYAN")).toBe(true);
    expect(bottom.includes("paintPhoneUltSun")).toBe(true);
    expect(bottom.includes("ready ? XP : BRASS")).toBe(true);
    expect(bottom.includes("ready ? XP : CYAN")).toBe(false);
    expect(bottom.includes("ringCol = low ? DANGER : HEALTH")).toBe(true);
    const xp = readFileSync("src/render/xp-gain.ts", "utf8");
    expect(xp.includes("phoneLvCaption")).toBe(true);
    expect(xp.includes("drawPhoneXpBar")).toBe(true);
  });

  it("stores hud-r42 review captures under docs/reviews/hud-r42", () => {
    const dir = "docs/reviews/hud-r42";
    for (const name of ["phone_390_play.png", "hud_bottom_crop.png", "compare_390_ref1.png"]) {
      expect(readFileSync(`${dir}/${name}`, "utf8").length).toBeGreaterThan(4000);
    }
    expect(PHONE_BOTTOM_CROP_FRAC).toBe(0.28);
  });
});
