import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { PHONE_BOTTOM_CROP_FRAC } from "../src/render/hud-bottom";

describe("hud r39 phone bottom cluster", () => {
  it("routes phone health and ult through hud-bottom without a cyan energy ult ring", () => {
    const bottom = readFileSync("src/render/hud-bottom.ts", "utf8");
    expect(bottom.includes("drawPhoneHealth")).toBe(true);
    expect(bottom.includes("drawPhoneUlt")).toBe(true);
    expect(bottom.includes('blitSheetFit(ctx, "heart_ring"')).toBe(true);
    expect(bottom.includes("heartIcon")).toBe(true);
    expect(bottom.includes("paintPhoneBottomTray")).toBe(true);
    expect(bottom.includes("paintPhonePowerTrayFrame")).toBe(true);
    expect(bottom.includes("ULT_CHARGE")).toBe(true);
    expect(bottom.includes("ready ? XP : CYAN")).toBe(false);
    const hud = readFileSync("src/render/hud.ts", "utf8");
    expect(hud.includes("drawPhoneHealth(ctx, w, box)")).toBe(true);
    expect(hud.includes("drawPhoneUlt(ctx, w, box)")).toBe(true);
    expect(hud.includes("paintPhoneBottomTray(ctx, layout)")).toBe(true);
    const rack = readFileSync("src/render/weapons.ts", "utf8");
    expect(rack.includes("paintPhonePowerTrayFrame")).toBe(true);
    expect(rack.includes("fillRect(sx + 2")).toBe(true);
  });

  it("stores hud-r39 review captures under docs/reviews/hud-r39", () => {
    const dir = "docs/reviews/hud-r39";
    for (const name of [
      "phone_390_play.png",
      "hud_bottom_crop.png",
      "compare_390_ref1.png",
      "compare_390_ref2.png",
      "trio_ref1_play_ref2.png",
    ]) {
      expect(readFileSync(`${dir}/${name}`, "utf8").length).toBeGreaterThan(4000);
    }
    expect(PHONE_BOTTOM_CROP_FRAC).toBeGreaterThan(0.2);
    expect(PHONE_BOTTOM_CROP_FRAC).toBeLessThan(0.4);
  });
});
