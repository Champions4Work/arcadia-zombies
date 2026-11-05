import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { PHONE_HERO_STEAM } from "../src/render/yard-fx";
import { playView } from "../src/shell/play-view";
import { cameraTarget } from "../src/sim/arena";
import { HERO_X, HERO_Y } from "../src/render/yard-fx";

describe("steam-r42 phone hero-band valve + plume read", () => {
  it("exports PHONE_HERO_STEAM beside in-frame tanks inside the phone clip", () => {
    const yard = readFileSync("src/render/yard-fx.ts", "utf8");
    expect(yard.includes("export const PHONE_HERO_STEAM")).toBe(true);
    expect(yard.includes("export function paintPhoneHeroSteam")).toBe(true);
    expect(yard.includes("paintPhoneHeroSteam(ctx, s.x, s.y, tick)")).toBe(true);
    expect(PHONE_HERO_STEAM.length).toBeGreaterThanOrEqual(2);
    const { viewW, viewH } = playView(390, 844);
    const cam = new Float32Array(2);
    cameraTarget(HERO_X, HERO_Y, cam, viewW, viewH);
    const camX = cam[0] ?? 0;
    const camY = cam[1] ?? 0;
    for (const s of PHONE_HERO_STEAM) {
      expect(s.x).toBeGreaterThanOrEqual(camX + 8);
      expect(s.x).toBeLessThanOrEqual(camX + viewW - 8);
      expect(s.y).toBeGreaterThanOrEqual(camY + 48);
      expect(s.y).toBeLessThanOrEqual(camY + viewH - 48);
    }
  });

  it("paints readable white plumes with source-over, not lighter fog", () => {
    const yard = readFileSync("src/render/yard-fx.ts", "utf8");
    const block = yard.slice(yard.indexOf("export function paintPhoneHeroSteam"), yard.indexOf("function paintPhoneHeroBlits"));
    expect(block.includes("valve_steam")).toBe(true);
    expect(block.includes('globalCompositeOperation = "source-over"')).toBe(true);
    expect(block.includes('globalCompositeOperation = "lighter"')).toBe(false);
    expect(yard.includes("PHONE_STEAM_PUFF_ALPHA = 0.64")).toBe(true);
  });

  it("stores steam-r42 review captures and midband gate under docs/reviews/steam-r42", () => {
    expect(readFileSync("docs/reviews/steam-r42/phone_390_play.png", "utf8").length).toBeGreaterThan(8000);
    expect(readFileSync("docs/reviews/steam-r42/steam_crop.png", "utf8").length).toBeGreaterThan(2000);
    expect(readFileSync("docs/reviews/steam-r42/midband_crop.png", "utf8").length).toBeGreaterThan(4000);
    const gate = readFileSync("docs/reviews/steam-r42/midband_gate.txt", "utf8");
    expect(gate.includes("cyan=0")).toBe(true);
    expect(gate.includes("blue=")).toBe(true);
    expect(readFileSync("docs/reviews/steam-r42/compare_390_ref2.png", "utf8").length).toBeGreaterThan(8000);
    expect(readFileSync("docs/reviews/steam-r42/trio_ref1_play_ref2.png", "utf8").length).toBeGreaterThan(8000);
  });
});
