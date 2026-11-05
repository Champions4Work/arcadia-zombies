import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { HERO_X, HERO_Y, HERO_R, PHONE_HERO_STEAM } from "../src/render/yard-fx";
import { playView } from "../src/shell/play-view";
import { ARENA_H, ARENA_W, cameraTarget } from "../src/sim/arena";

describe("steam-r41 phone hero valve + plume read", () => {
  it("parks PHONE_HERO_STEAM beside in-frame tanks and exports paintPhoneHeroSteam", () => {
    const yard = readFileSync("src/render/yard-fx.ts", "utf8");
    expect(yard.includes("export const PHONE_HERO_STEAM")).toBe(true);
    expect(yard.includes("export function paintPhoneHeroSteam")).toBe(true);
    expect(yard.includes("PHONE_HERO_VALVE_SCALE = 0.84")).toBe(true);
    expect(yard.includes("PHONE_HERO_STEAM_ALPHA = 0.42")).toBe(true);
    const heroSteam = yard.slice(yard.indexOf("export function paintPhoneHeroSteam"), yard.indexOf("export function paintVentSteam"));
    expect(heroSteam.includes('globalCompositeOperation = "lighter"')).toBe(false);
    expect(heroSteam.includes("blitScaled(ctx, \"valve_steam\"")).toBe(true);
    expect(heroSteam.includes("steamFrame(tick + 5)")).toBe(true);
    expect(yard.includes("if (heroBand && vw < PHONE_FACADE_VW) continue")).toBe(true);
  });

  it("keeps hero-band steam sites inside the phone camera near the review hunter", () => {
    const { viewW, viewH } = playView(390, 844);
    const cam = new Float32Array(2);
    cameraTarget(HERO_X, HERO_Y, cam, viewW, viewH);
    const camX = cam[0] ?? 0;
    const camY = cam[1] ?? 0;
    for (const v of PHONE_HERO_STEAM) {
      expect(v.x).toBeGreaterThanOrEqual(camX + 8);
      expect(v.x).toBeLessThanOrEqual(camX + viewW - 8);
      expect(v.y).toBeGreaterThanOrEqual(camY + 48);
      expect(v.y).toBeLessThanOrEqual(camY + viewH - 48);
      const dx = v.x - HERO_X;
      const dy = v.y - HERO_Y;
      expect(dx * dx + dy * dy).toBeLessThan(HERO_R * HERO_R);
    }
    expect(PHONE_HERO_STEAM.length).toBe(2);
    expect(ARENA_W).toBeGreaterThan(viewW);
    expect(ARENA_H).toBeGreaterThanOrEqual(viewH);
  });

  it("stores steam-r41 review captures and midband gate proof", () => {
    const dir = "docs/reviews/steam-r41";
    expect(readFileSync(`${dir}/phone_390_play.png`, "utf8").length).toBeGreaterThan(8000);
    expect(readFileSync(`${dir}/steam_crop.png`, "utf8").length).toBeGreaterThan(2000);
    expect(readFileSync(`${dir}/midband_crop.png`, "utf8").length).toBeGreaterThan(4000);
    expect(readFileSync(`${dir}/midband_gate.txt`, "utf8").includes("cyan=0")).toBe(true);
    expect(readFileSync(`${dir}/trio_ref1_play_ref2.png`, "utf8").length).toBeGreaterThan(8000);
    expect(readFileSync(`${dir}/compare_390_ref1.png`, "utf8").length).toBeGreaterThan(8000);
    expect(readFileSync(`${dir}/compare_390_ref2.png`, "utf8").length).toBeGreaterThan(8000);
  });
});
