import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { HERO_X, HERO_Y, HERO_R } from "../src/render/yard-fx";

describe("r32 fx-only phone read", () => {
  it("keeps vent steam small, warm, and off lighter double-blob compositing", () => {
    const yard = readFileSync("src/render/yard-fx.ts", "utf8");
    expect(yard.includes("STEAM_VENT_SCALE = 0.76")).toBe(true);
    expect(yard.includes("STEAM_VENT_ALPHA = 0.24")).toBe(true);
    expect(yard.includes("function paintVentSteam")).toBe(true);
    expect(yard.includes('globalCompositeOperation = "soft-light"')).toBe(true);
    const ventSteam = yard.slice(yard.indexOf("function paintVentSteam"), yard.indexOf("function arrow"));
    expect(ventSteam.includes('globalCompositeOperation = "lighter"')).toBe(false);
    expect(ventSteam.includes("globalAlpha = 0.92")).toBe(false);
    expect(yard.includes("#7a7060")).toBe(true);
  });

  it("limits blue glow to tanks and pipe props without breakable halos", () => {
    const yard = readFileSync("src/render/yard-fx.ts", "utf8");
    expect(yard.includes("function bluePuddle")).toBe(true);
    expect(yard.includes("BLUE_GLOW_ALPHA = 0.3")).toBe(true);
    expect(yard.includes('p.id === "pipes_blue_tank"')).toBe(true);
    expect(yard.includes('p.id === "blue_puddle"')).toBe(true);
    expect(yard.includes('breakable_gear_pylon" || p.id === "breakable_boiler" || p.id === "pipes_blue_tank"')).toBe(false);
    expect(yard.includes("rgba(90,245,255,0.7)")).toBe(false);
  });

  it("raises combat juice without r91 muzzle overscale", () => {
    const look = readFileSync("src/art/look.ts", "utf8");
    expect(look.includes("CASE_W = 4.8")).toBe(true);
    expect(look.includes("ellipse(mx, my, 22, 12")).toBe(false);
    expect(look.includes("lineTo(mx + nx * 28")).toBe(true);
    const juice = readFileSync("src/render/juice.ts", "utf8");
    expect(juice.includes("BLOOD_DROP_RX = 6.6")).toBe(true);
  });

  it("rings review blood outside the hero lane", () => {
    const shot = readFileSync("src/shell/review-shot.ts", "utf8");
    expect(shot.includes("w.px + 18, w.py + 14")).toBe(false);
    expect(shot.includes("w.px + 86, w.py + 48")).toBe(true);
    expect(shot.includes("w.px - 94, w.py + 52")).toBe(true);
    expect(shot.includes("w.px + 68, w.py - 52")).toBe(true);
    const rMin = HERO_R * 0.6;
    for (const spot of [[86, 48], [94, 52], [78, 72], [88, 68], [102, 36], [76, 28], [92, 18], [98, 22], [68, 52]] as const) {
      const dx = spot[0];
      const dy = spot[1];
      expect(dx * dx + dy * dy).toBeGreaterThan(rMin * rMin);
    }
    expect(HERO_X).toBe(480);
    expect(HERO_Y).toBe(320);
  });

  it("stores fx-r32 review captures under docs/reviews/fx-r32", () => {
    expect(readFileSync("docs/reviews/fx-r32/phone_390_play.png", "utf8").length).toBeGreaterThan(8000);
    expect(readFileSync("docs/reviews/fx-r32/compare_390_ref1.png", "utf8").length).toBeGreaterThan(8000);
    expect(readFileSync("docs/reviews/fx-r32/compare_390_ref2.png", "utf8").length).toBeGreaterThan(8000);
    expect(readFileSync("docs/reviews/fx-r32/trio_ref1_play_ref2.png", "utf8").length).toBeGreaterThan(8000);
  });
});
