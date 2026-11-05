import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { HERO_X, HERO_Y, HERO_R, PHONE_HERO_BLITS } from "../src/render/yard-fx";
import { playView } from "../src/shell/play-view";
import { cameraTarget } from "../src/sim/arena";

describe("steam-r43 phone valve plumes beside cyan tanks", () => {
  it("parks hero-band steam on in-frame tank wings with packed source-over plumes", () => {
    const yard = readFileSync("src/render/yard-fx.ts", "utf8");
    expect(yard.includes("STEAM_PHONE_PUFF_ALPHA = 0.94")).toBe(true);
    expect(yard.includes("STEAM_PHONE_VALVE_SCALE = 1.04")).toBe(true);
    const ventSteam = yard.slice(yard.indexOf("export function paintVentSteam"), yard.indexOf("function heroBandVent"));
    expect(ventSteam.includes('globalCompositeOperation = "source-over"')).toBe(true);
    expect(ventSteam.includes("STEAM_PHONE_PUFF_SCALE")).toBe(true);
    expect(ventSteam.includes("return;")).toBe(true);
    expect(ventSteam.indexOf("return;")).toBeLessThan(ventSteam.indexOf("soft-light"));
    expect(yard.includes("{ x: 363, y: 294 }")).toBe(true);
    expect(yard.includes("{ x: 592, y: 294 }")).toBe(true);
  });

  it("aligns hero-band vents beside PHONE_HERO_BLITS tanks inside the phone clip", () => {
    const tanks = PHONE_HERO_BLITS.filter((b) => b.id === "pipes_blue_tank");
    expect(tanks.length).toBe(2);
    const { viewW, viewH } = playView(390, 844);
    const cam = new Float32Array(2);
    cameraTarget(HERO_X, HERO_Y, cam, viewW, viewH);
    const camX = cam[0] ?? 0;
    const band = yardHeroBandSites();
    expect(band.length).toBe(2);
    for (const v of band) {
      expect(v.x).toBeGreaterThanOrEqual(camX + 8);
      expect(v.x).toBeLessThanOrEqual(camX + viewW - 8);
      expect(v.y).toBeGreaterThanOrEqual(48);
      expect(v.y).toBeLessThanOrEqual(viewH - 48);
      const dx = v.x - HERO_X;
      const dy = v.y - HERO_Y;
      expect(dx * dx + dy * dy).toBeLessThan(HERO_R * HERO_R);
    }
    const leftTank = tanks[0];
    const rightTank = tanks[1];
    expect(Math.abs(band[0]!.x - (leftTank?.x ?? 0))).toBeLessThan(36);
    expect(Math.abs(band[1]!.x - (rightTank?.x ?? 0))).toBeLessThan(36);
  });

  it("passes midband and steam pixel gates on review captures", () => {
    const midPath = "docs/reviews/steam-r43/midband_crop.png";
    const steamPath = "docs/reviews/steam-r43/steam_crop.png";
    expect(readFileSync(midPath, "utf8").length).toBeGreaterThan(2000);
    expect(readFileSync(steamPath, "utf8").length).toBeGreaterThan(800);
    const midOut = execFileSync("node", ["scripts/midband_pixel_gate.mjs", midPath], { encoding: "utf8" });
    expect(midOut).toMatch(/cyan=0 blue=\d+/);
    const midBlue = Number(midOut.match(/blue=(\d+)/)?.[1] ?? 0);
    expect(midBlue).toBeGreaterThanOrEqual(200);
    const steamOut = execFileSync("node", ["scripts/steam_crop_gate.mjs", steamPath], { encoding: "utf8" });
    expect(steamOut).toMatch(/white=\d+ valveRed=\d+/);
    const white = Number(steamOut.match(/white=(\d+)/)?.[1] ?? 0);
    const valveRed = Number(steamOut.match(/valveRed=(\d+)/)?.[1] ?? 0);
    expect(white).toBeGreaterThanOrEqual(12);
    expect(valveRed).toBeGreaterThanOrEqual(8);
    expect(readFileSync("docs/reviews/steam-r43/midband_gate.txt", "utf8")).toMatch(/cyan=0/);
    expect(readFileSync("docs/reviews/steam-r43/steam_gate.txt", "utf8")).toMatch(/white=\d+/);
  });

  it("stores steam-r43 review captures and compares", () => {
    expect(readFileSync("docs/reviews/steam-r43/phone_390_play.png", "utf8").length).toBeGreaterThan(8000);
    expect(readFileSync("docs/reviews/steam-r43/compare_390_ref1.png", "utf8").length).toBeGreaterThan(8000);
    expect(readFileSync("docs/reviews/steam-r43/compare_390_ref2.png", "utf8").length).toBeGreaterThan(8000);
    expect(readFileSync("docs/reviews/steam-r43/trio_ref1_play_ref2.png", "utf8").length).toBeGreaterThan(8000);
    expect(readFileSync("docs/reviews/steam-r43/diff_vs_116_118_121.txt", "utf8")).toMatch(/white=0/);
  });
});

function yardHeroBandSites(): { x: number; y: number }[] {
  const yard = readFileSync("src/render/yard-fx.ts", "utf8");
  const block = yard.slice(yard.indexOf("const HERO_BAND_STEAM"), yard.indexOf("export const YARD_CLEAR"));
  const out: { x: number; y: number }[] = [];
  const re = /\{\s*x:\s*(\d+),\s*y:\s*(\d+)\s*\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(block))) {
    out.push({ x: Number(m[1]), y: Number(m[2]) });
  }
  return out;
}
