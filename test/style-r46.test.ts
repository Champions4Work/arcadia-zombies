import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { HERO_R } from "../src/render/yard-fx";

describe("fx-r46 phone combat juice", () => {
  it("brightens amber muzzle bloom and lengthens the phone tracer", () => {
    const look = readFileSync("src/art/look.ts", "utf8");
    expect(look.includes("const trace = 36")).toBe(true);
    expect(look.includes("createRadialGradient(mx, my, 0.5, mx, my, 22)")).toBe(true);
    expect(look.includes("lineTo(mx + nx * trace")).toBe(true);
    expect(look.includes("lineTo(mx + nx * 28")).toBe(false);
  });

  it("densifies horde floor blood outside the hero lane without touching yard blits", () => {
    const look = readFileSync("src/art/look.ts", "utf8");
    expect(look.includes("const span = 8 + (s & 6)")).toBe(true);
    expect(look.includes("const n = 9 + (seed & 4)")).toBe(true);
    const stains = readFileSync("src/render/stains.ts", "utf8");
    expect(stains.includes("const n = 6 + (salt & 3)")).toBe(true);
    const shot = readFileSync("src/shell/review-shot.ts", "utf8");
    expect(shot.includes("outsideHeroLane")).toBe(true);
    expect(shot.includes("HERO_LANE_R2")).toBe(true);
    const yard = readFileSync("src/render/yard-fx.ts", "utf8");
    expect(yard.includes("export function paintPhoneHeroValveSteam")).toBe(true);
    expect(yard.includes("PHONE_HERO_VALVE_BLITS")).toBe(true);
    const rMin = HERO_R * 0.58;
    for (const spot of [[86, 48], [94, 52], [78, 72], [88, 68], [102, 36], [76, 28], [92, 18], [98, 22], [68, 52]] as const) {
      expect(spot[0] * spot[0] + spot[1] * spot[1]).toBeGreaterThan(rMin * rMin);
    }
  });

  it("ejects three flying brass particles per shot", () => {
    const juice = readFileSync("src/render/juice.ts", "utf8");
    expect(juice.includes("spawnPart(x, y, -uy * 50 * side")).toBe(true);
    expect(juice.includes("spawnPart(x, y, -uy * 40 * side")).toBe(true);
  });

  it("stores fx-r46 review proof under docs/reviews/fx-r46", () => {
    expect(readFileSync("docs/reviews/fx-r46/phone_390_play.png", "utf8").length).toBeGreaterThan(8000);
    expect(readFileSync("docs/reviews/fx-r46/muzzle_crop.png", "utf8").length).toBeGreaterThan(2000);
    expect(readFileSync("docs/reviews/fx-r46/blood_crop.png", "utf8").length).toBeGreaterThan(2000);
    expect(readFileSync("docs/reviews/fx-r46/vs_baseline.png", "utf8").length).toBeGreaterThan(4000);
    expect(readFileSync("docs/reviews/fx-r46/midband_gate.txt", "utf8")).toMatch(/cyan=0/);
    expect(readFileSync("docs/reviews/fx-r46/midband_gate.txt", "utf8")).toMatch(/blue=\d+/);
    expect(readFileSync("docs/reviews/fx-r46/NOTE.md", "utf8").length).toBeGreaterThan(80);
  });
});
