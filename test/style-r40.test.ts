import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { PHONE_BOTTOM_CROP_FRAC } from "../src/render/hud-bottom";
import { XP_BAR_FRAME_ASPECT } from "../src/render/xp-gain";

describe("hud r40 phone bottom chrome", () => {
  it("wraps phone XP in xp_bar_frame aspect and tints heart ring chrome", () => {
    const bottom = readFileSync("src/render/hud-bottom.ts", "utf8");
    expect(bottom.includes("HEART_GLOW")).toBe(true);
    expect(bottom.includes("HEART_CORE")).toBe(true);
    expect(bottom.includes('blitSheetFit(ctx, "heart_ring"')).toBe(true);
    expect(bottom.includes("globalCompositeOperation = \"lighter\"")).toBe(true);
    expect(bottom.includes("BRASS_HI")).toBe(true);
    const xp = readFileSync("src/render/xp-gain.ts", "utf8");
    expect(xp.includes("drawPhoneXpBar")).toBe(true);
    expect(xp.includes("XP_BAR_FRAME_ASPECT")).toBe(true);
    expect(xp.includes('blitSheetFit(ctx, "xp_bar_frame"')).toBe(true);
    expect(xp.includes("pixelWell(ctx")).toBe(true);
    expect(xp.includes("if (phone)")).toBe(true);
    expect(XP_BAR_FRAME_ASPECT).toBeGreaterThan(3);
  });

  it("stores hud-r40 review captures under docs/reviews/hud-r40", () => {
    const dir = "docs/reviews/hud-r40";
    for (const name of [
      "phone_390_play.png",
      "hud_bottom_crop.png",
      "compare_390_ref1.png",
      "trio_ref1_play_ref2.png",
    ]) {
      expect(readFileSync(`${dir}/${name}`, "utf8").length).toBeGreaterThan(4000);
    }
    expect(PHONE_BOTTOM_CROP_FRAC).toBe(0.28);
  });
});
