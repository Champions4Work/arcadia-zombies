import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("r29 hero diving-suit read", () => {
  it("keeps pack dive-suit sources and drops cyan hero ground halos", () => {
    const manifest = JSON.parse(readFileSync("art/az_art_v2/manifest.json", "utf8"));
    expect(manifest.sprites.hero_idle.h).toBe(128);
    expect(manifest.sprites.hero_idle.w).toBeGreaterThanOrEqual(70);
    const look = readFileSync("src/art/look.ts", "utf8");
    expect(look.includes("heroSpriteId")).toBe(true);
    expect(look.includes("rgba(62,220,220")).toBe(false);
    expect(look.includes("rgba(90,240,230")).toBe(false);
    expect(look.includes("rgba(120,245,245")).toBe(false);
    expect(look.includes("rgba(255,210,120,0.72)")).toBe(true);
    expect(look.includes("createRadialGradient(x - 10 * s, y - 22 * s")).toBe(true);
  });

  it("stores r29 phone review captures under docs/reviews/r29-hero", () => {
    expect(readFileSync("docs/reviews/r29-hero/phone_390_play.png", "utf8").length).toBeGreaterThan(8000);
    expect(readFileSync("docs/reviews/r29-hero/hero_crop.png", "utf8").length).toBeGreaterThan(2000);
  });
});
