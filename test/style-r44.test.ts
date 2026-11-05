import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { HERO_X, HERO_Y, PHONE_CAM, PHONE_HERO_BLITS, PHONE_HERO_VALVE_BLITS } from "../src/render/yard-fx";
import { playView } from "../src/shell/play-view";
import { cameraTarget } from "../src/sim/arena";

describe("steam-r44 hero-band valve read", () => {
  it("paints phone tank valves source-over on LAYER_MID, not soft-light in paintVentSteam", () => {
    const yard = readFileSync("src/render/yard-fx.ts", "utf8");
    expect(yard.includes("export const PHONE_HERO_VALVE_BLITS")).toBe(true);
    expect(yard.includes("export function paintPhoneHeroValveSteam")).toBe(true);
    expect(yard.includes("PHONE_HERO_VALVE_SCALE = 1.24")).toBe(true);
    const valvePaint = yard.slice(
      yard.indexOf("export function paintPhoneHeroValveSteam"),
      yard.indexOf("function heroBandVent"),
    );
    expect(valvePaint.includes('globalCompositeOperation = "source-over"')).toBe(true);
    expect(valvePaint.includes("blitScaled(ctx, \"valve_steam\"")).toBe(true);
    expect(valvePaint.includes("soft-light")).toBe(false);
    const ventSteam = yard.slice(yard.indexOf("export function paintVentSteam"), yard.indexOf("export function paintPhoneHeroValveSteam"));
    expect(ventSteam.includes("if (heroBand) return")).toBe(true);
    const depth = readFileSync("src/render/depth.ts", "utf8");
    expect(depth.includes("paintPhoneHeroValveSteam")).toBe(true);
    expect(depth.includes("registerLayer(LAYER_MID, paintDepthMid)")).toBe(true);
  });

  it("seats valve blits beside PHONE_HERO_BLITS tanks inside the phone camera X band", () => {
    const { viewW, viewH } = playView(390, 844);
    const cam = new Float32Array(2);
    cameraTarget(HERO_X, HERO_Y, cam, viewW, viewH);
    const camX = cam[0] ?? 0;
    const tanks = PHONE_HERO_BLITS.filter((b) => b.id === "pipes_blue_tank");
    expect(tanks.length).toBe(2);
    for (const v of PHONE_HERO_VALVE_BLITS) {
      expect(v.x).toBeGreaterThanOrEqual(PHONE_CAM.x0);
      expect(v.x).toBeLessThanOrEqual(PHONE_CAM.x1);
      expect(v.x).toBeGreaterThanOrEqual(camX + 8);
      expect(v.x).toBeLessThanOrEqual(camX + viewW - 8);
      const flank = tanks.some((t) => Math.abs(t.x - v.x) < 28 && v.y < t.y);
      expect(flank).toBe(true);
    }
    expect(viewH).toBeGreaterThan(600);
  });

  it("steam pixel gate requires readable white plume cluster", () => {
    const src = readFileSync("scripts/steam_pixel_gate.mjs", "utf8");
    expect(src.includes("r + g + b >= 335")).toBe(true);
    expect(src.includes("whiteish >= 800")).toBe(true);
    expect(src.includes("valveRed >= 36")).toBe(true);
  });

  it("stores steam-r44 review captures and passes gates", () => {
    const dir = "docs/reviews/steam-r44";
    expect(readFileSync(`${dir}/phone_390_play.png`, "utf8").length).toBeGreaterThan(8000);
    expect(readFileSync(`${dir}/steam_crop.png`, "utf8").length).toBeGreaterThan(2000);
    expect(readFileSync(`${dir}/trio_ref1_play_ref2.png`, "utf8").length).toBeGreaterThan(8000);
    const mid = execFileSync("node", ["scripts/midband_pixel_gate.mjs", `${dir}/midband_crop.png`], { encoding: "utf8" });
    expect(mid).toMatch(/cyan=0/);
    const steam = execFileSync("node", ["scripts/steam_pixel_gate.mjs", `${dir}/steam_crop.png`], { encoding: "utf8" });
    expect(steam).toMatch(/whiteish=\d+/);
    const white = Number(steam.match(/whiteish=(\d+)/)?.[1] ?? 0);
    expect(white).toBeGreaterThanOrEqual(800);
  });
});
