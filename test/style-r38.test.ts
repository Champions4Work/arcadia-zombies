import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { HERO_X, HERO_Y, PHONE_HERO_BLITS } from "../src/render/yard-fx";
import { playView } from "../src/shell/play-view";
import { cameraTarget } from "../src/sim/arena";

describe("r38 phone-inframe blue tanks and chevrons", () => {
  it("drops the fight-floor pipe run and paints PHONE_HERO_BLITS from paintYardLive", () => {
    const yard = readFileSync("src/render/yard-fx.ts", "utf8");
    const brassPipes = yard.slice(yard.indexOf("const PIPE_RUNS = ["), yard.indexOf("const BELT_H"));
    expect(brassPipes.includes("y: 232")).toBe(false);
    expect(brassPipes.includes("y: 648")).toBe(true);
    expect(yard.includes("export const PHONE_HERO_BLITS")).toBe(true);
    expect(yard.includes("PHONE_HERO_TANK_SCALE = 1.45")).toBe(true);
    expect(yard.includes("PHONE_HERO_CONVEYOR_SCALE = 1.3")).toBe(true);
    expect(yard.includes("function paintPhoneHeroBlits")).toBe(true);
    const live = yard.slice(yard.indexOf("export function paintYardLive"), yard.indexOf("function paintBrassGrade"));
    expect(live.includes("paintPhoneHeroBlits(ctx")).toBe(true);
    const cross = yard.slice(yard.indexOf("function paintCrossPipe"), yard.indexOf("function paintVertPipe"));
    expect(cross.includes("const heroBand = y <= YARD_CLEAR.y1")).toBe(true);
    expect(cross.includes("if (!heroBand)")).toBe(true);
  });

  it("keeps hero blits inside the 390x844 phone camera around the review hunter", () => {
    const { viewW, viewH } = playView(390, 844);
    const cam = new Float32Array(2);
    cameraTarget(HERO_X, HERO_Y, cam, viewW, viewH);
    const camX = cam[0] ?? 0;
    const camY = cam[1] ?? 0;
    for (const b of PHONE_HERO_BLITS) {
      expect(b.x).toBeGreaterThanOrEqual(camX + 24);
      expect(b.x).toBeLessThanOrEqual(camX + viewW - 24);
      expect(b.y).toBeGreaterThanOrEqual(camY + 48);
      expect(b.y).toBeLessThanOrEqual(camY + viewH - 48);
    }
    expect(PHONE_HERO_BLITS.some((b) => b.id === "pipes_blue_tank")).toBe(true);
    expect(PHONE_HERO_BLITS.some((b) => b.id === "conveyor")).toBe(true);
  });

  it("passes the midband pixel gate on r38 review captures", () => {
    const midband = "docs/reviews/r38/midband_crop.png";
    expect(readFileSync(midband, "utf8").length).toBeGreaterThan(4000);
    const gate = readFileSync("docs/reviews/r38/midband_gate.txt", "utf8").trim();
    expect(gate).toMatch(/^cyan=0 blue=\d+/);
    const blue = Number(gate.match(/blue=(\d+)/)?.[1] ?? 0);
    expect(blue).toBeGreaterThanOrEqual(200);
    expect(readFileSync("docs/reviews/r38/r37_110_midband_ref.png", "utf8").length).not.toBe(
      readFileSync(midband, "utf8").length,
    );
  });

  it("stores r38 phone review captures under docs/reviews/r38", () => {
    const dir = "docs/reviews/r38";
    for (const name of [
      "phone_390_play.png",
      "midband_crop.png",
      "trio_ref1_play_ref2.png",
      "compare_390_ref1.png",
      "compare_390_ref2.png",
      "vs_main_cyan.png",
      "vs_r37_offscreen.png",
    ]) {
      expect(readFileSync(`${dir}/${name}`, "utf8").length).toBeGreaterThan(4000);
    }
    expect(readFileSync(`${dir}/midband_gate.txt`, "utf8")).toMatch(/^cyan=0 blue=\d+/);
  });
});
