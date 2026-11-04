import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { HERO_X, HERO_Y, HERO_R, bindYard, valveSteamSites } from "../src/render/yard-fx";
import { ZONE_BOILER, ZONE_BRASS, ZONE_TRAM } from "../src/sim/zones";

describe("r34 fx-only phone read", () => {
  it("cycles dark steam at valve_steam props without soft-light fog walls", () => {
    const yard = readFileSync("src/render/yard-fx.ts", "utf8");
    expect(yard.includes("STEAM_VENT_SCALE = 0.62")).toBe(true);
    expect(yard.includes("STEAM_VENT_ALPHA = 0.36")).toBe(true);
    expect(yard.includes("function valveSteamSites")).toBe(true);
    expect(yard.includes('p.id === "valve_steam"')).toBe(true);
    expect(yard.includes("const STEAM_VENTS")).toBe(false);
    const ventSteam = yard.slice(yard.indexOf("function paintVentSteam"), yard.indexOf("function arrow"));
    expect(ventSteam.includes('globalCompositeOperation = "multiply"')).toBe(true);
    expect(ventSteam.includes('globalCompositeOperation = "lighter"')).toBe(false);
    expect(ventSteam.includes("globalAlpha = 0.92")).toBe(false);
    expect(yard.includes("#5a5248")).toBe(true);
    bindYard(ZONE_BRASS);
    const brass = valveSteamSites();
    expect(brass.length).toBeGreaterThanOrEqual(5);
    bindYard(ZONE_BOILER);
    expect(valveSteamSites().length).toBeGreaterThanOrEqual(4);
    bindYard(ZONE_TRAM);
    expect(valveSteamSites().length).toBe(0);
  });

  it("raises combat juice without r91 muzzle overscale", () => {
    const look = readFileSync("src/art/look.ts", "utf8");
    expect(look.includes("CASE_W = 4.8")).toBe(true);
    expect(look.includes("ellipse(mx, my, 22, 12")).toBe(false);
    expect(look.includes("lineTo(mx + nx * 28")).toBe(true);
    const juice = readFileSync("src/render/juice.ts", "utf8");
    expect(juice.includes("BLOOD_DROP_RX = 7")).toBe(true);
    const flash = readFileSync("src/render/cast-fx.ts", "utf8");
    expect(flash.includes("rgba(255,150,48,0.98)")).toBe(true);
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

  it("stores fx-r34 review captures under docs/reviews/fx-r34", () => {
    expect(readFileSync("docs/reviews/fx-r34/phone_390_play.png", "utf8").length).toBeGreaterThan(8000);
    expect(readFileSync("docs/reviews/fx-r34/compare_390_ref1.png", "utf8").length).toBeGreaterThan(8000);
    expect(readFileSync("docs/reviews/fx-r34/compare_390_ref2.png", "utf8").length).toBeGreaterThan(8000);
    expect(readFileSync("docs/reviews/fx-r34/trio_ref1_play_ref2.png", "utf8").length).toBeGreaterThan(8000);
  });
});
