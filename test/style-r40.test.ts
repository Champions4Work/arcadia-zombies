import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { HERO_X, HERO_Y, PHONE_HERO_BLITS, PHONE_HERO_VALVES } from "../src/render/yard-fx";
import { playView } from "../src/shell/play-view";
import { cameraTarget } from "../src/sim/arena";

describe("r40 phone-inframe steam valves beside blue tanks", () => {
  it("paints large PHONE_HERO_VALVES from paintYardLive on brass", () => {
    const yard = readFileSync("src/render/yard-fx.ts", "utf8");
    expect(yard.includes("export const PHONE_HERO_VALVES")).toBe(true);
    expect(yard.includes("PHONE_HERO_VALVE_SCALE = 1.14")).toBe(true);
    expect(yard.includes("356, y: 318")).toBe(true);
    expect(yard.includes("604, y: 318")).toBe(true);
    expect(yard.includes("PHONE_HERO_STEAM_SCALE = 1.32")).toBe(true);
    expect(yard.includes("function paintPhoneHeroValveSteam")).toBe(true);
    const live = yard.slice(yard.indexOf("export function paintYardLive"), yard.indexOf("function paintBrassGrade"));
    expect(live.includes("paintPhoneHeroValveSteam(ctx")).toBe(true);
    expect(live.indexOf("paintPhoneHeroBlits")).toBeLessThan(live.indexOf("paintPhoneHeroValveSteam"));
  });

  it("keeps valve sites inside the 390x844 phone camera flanking hero tanks", () => {
    const { viewW, viewH } = playView(390, 844);
    const cam = new Float32Array(2);
    cameraTarget(HERO_X, HERO_Y, cam, viewW, viewH);
    const camX = cam[0] ?? 0;
    const camY = cam[1] ?? 0;
    for (const v of PHONE_HERO_VALVES) {
      expect(v.x).toBeGreaterThanOrEqual(camX + 20);
      expect(v.x).toBeLessThanOrEqual(camX + viewW - 20);
      expect(v.y).toBeGreaterThanOrEqual(camY + 40);
      expect(v.y).toBeLessThanOrEqual(camY + viewH - 120);
    }
    expect(PHONE_HERO_VALVES.length).toBe(2);
    expect(PHONE_HERO_BLITS.filter((b) => b.id === "pipes_blue_tank").length).toBe(2);
  });

  it("passes the midband pixel gate on r40-steam review captures", () => {
    const midband = "docs/reviews/r40-steam/midband_crop.png";
    expect(readFileSync(midband, "utf8").length).toBeGreaterThan(4000);
    const gate = readFileSync("docs/reviews/r40-steam/midband_gate.txt", "utf8").trim();
    expect(gate).toMatch(/^cyan=0 blue=\d+/);
    const blue = Number(gate.match(/blue=(\d+)/)?.[1] ?? 0);
    expect(blue).toBeGreaterThanOrEqual(200);
  });

  it("stores r40 phone review captures and steam crop under docs/reviews/r40-steam", () => {
    const dir = "docs/reviews/r40-steam";
    for (const name of [
      "phone_390_play.png",
      "midband_crop.png",
      "steam_crop.png",
      "trio_ref1_play_ref2.png",
      "compare_390_ref1.png",
      "compare_390_ref2.png",
    ]) {
      expect(readFileSync(`${dir}/${name}`, "utf8").length).toBeGreaterThan(4000);
    }
    expect(readFileSync(`${dir}/midband_gate.txt`, "utf8")).toMatch(/^cyan=0 blue=\d+/);
    const after114 = readFileSync("assets/main_after_114_phone.png", "utf8");
    const play = readFileSync(`${dir}/phone_390_play.png`, "utf8");
    expect(play.length).not.toBe(after114.length);
  });
});
