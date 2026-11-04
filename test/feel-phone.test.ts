import { readFileSync } from "node:fs";
import { CASE_H, CASE_W } from "../src/art/look";
import { BLOOD_DROP_RX, BLOOD_DROP_RY, FLASH_MS, GLYPH_CELL, SHAKE_BRUTE, SHAKE_HIT } from "../src/render/juice";
import { SHAKE_CAP } from "../src/render/shake";
import { BLOOD_STAIN_BASE } from "../src/render/stains";
import { CAM_LERP } from "../src/sim/arena";
import { CURVE } from "../src/sim/difficulty";

describe("phone feel floors", () => {
  it("keeps shake, blood, casings, and numbers large enough to read at 390", () => {
    expect(SHAKE_CAP).toBeGreaterThanOrEqual(6);
    expect(SHAKE_CAP).toBeLessThanOrEqual(12);
    expect(SHAKE_BRUTE).toBeGreaterThan(SHAKE_HIT);
    expect(BLOOD_STAIN_BASE).toBeGreaterThanOrEqual(7);
    expect(BLOOD_DROP_RX).toBeGreaterThanOrEqual(4.5);
    expect(BLOOD_DROP_RY).toBeGreaterThanOrEqual(3.5);
    expect(CASE_W).toBeGreaterThanOrEqual(3.6);
    expect(CASE_H).toBeGreaterThanOrEqual(1.5);
    expect(GLYPH_CELL).toBeGreaterThanOrEqual(2);
    expect(FLASH_MS).toBeGreaterThanOrEqual(60);
    expect(FLASH_MS).toBeLessThanOrEqual(100);
    const guns = readFileSync("src/sim/weapons.hot.ts", "utf8");
    expect(guns.includes("juiceShot(mx, my, ux, uy, w.tick)")).toBe(true);
  });

  it("leaves camera follow, spawn curve, and the playtest bands alone", () => {
    expect(CAM_LERP).toBe(0.15);
    expect(CURVE.spawnBase).toBe(36);
    expect(CURVE.spawnPer).toBe(6);
    expect(CURVE.spawnMin).toBe(4);
    const play = readFileSync("test/playtest.test.ts", "utf8");
    expect(play.includes("SURVIVE_BAND = { min: 45, max: 480 }")).toBe(true);
    expect(play.includes("KITE_BAND = { min: 60, max: 480 }")).toBe(true);
    expect(play.includes("MIN_MEDIAN_KILLS = 40")).toBe(true);
    expect(play.includes("MAX_MEDIAN_KILLS = 1800")).toBe(true);
  });
});
