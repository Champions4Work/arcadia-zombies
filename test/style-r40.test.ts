import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  HERO_X,
  HERO_Y,
  PHONE_HERO_BELT_X0,
  PHONE_HERO_BELT_X1,
  PHONE_HERO_BELT_Y,
  PHONE_HERO_BLITS,
} from "../src/render/yard-fx";
import { playView } from "../src/shell/play-view";
import { cameraTarget } from "../src/sim/arena";

describe("r40 phone-inframe belt cargo on chevrons", () => {
  it("animates large power_slot pickups on PHONE_HERO belt paths from paintYardLive", () => {
    const yard = readFileSync("src/render/yard-fx.ts", "utf8");
    expect(yard.includes("function paintPhoneHeroBeltCargo")).toBe(true);
    expect(yard.includes("PHONE_HERO_CARGO_SLOT = 1.52")).toBe(true);
    expect(yard.includes('blitScaled(ctx, "power_slot"')).toBe(true);
    const live = yard.slice(yard.indexOf("export function paintYardLive"), yard.indexOf("function paintBrassGrade"));
    expect(live.includes("paintPhoneHeroBeltCargo(ctx")).toBe(true);
    expect(PHONE_HERO_BELT_Y).toBe(380);
    expect(PHONE_HERO_BELT_X1 - PHONE_HERO_BELT_X0).toBeGreaterThan(200);
    const conveyors = PHONE_HERO_BLITS.filter((b) => b.id === "conveyor");
    expect(conveyors.length).toBe(2);
    for (const c of conveyors) {
      expect(Math.abs(c.y - PHONE_HERO_BELT_Y)).toBeLessThanOrEqual(4);
    }
  });

  it("keeps belt cargo inside the 390x844 phone camera X clip", () => {
    const { viewW, viewH } = playView(390, 844);
    const cam = new Float32Array(2);
    cameraTarget(HERO_X, HERO_Y, cam, viewW, viewH);
    const camX = cam[0] ?? 0;
    expect(PHONE_HERO_BELT_X0).toBeGreaterThanOrEqual(camX + 8);
    expect(PHONE_HERO_BELT_X1).toBeLessThanOrEqual(camX + viewW - 8);
    expect(PHONE_HERO_BELT_Y).toBeGreaterThanOrEqual((cam[1] ?? 0) + 48);
    expect(PHONE_HERO_BELT_Y).toBeLessThanOrEqual((cam[1] ?? 0) + viewH - 120);
  });

  it("stores belt-r40 review captures and passes the midband gate", () => {
    const dir = "docs/reviews/belt-r40";
    const playPath = `${dir}/phone_390_play.png`;
    const r114Path = `${dir}/main_after_114_phone.png`;
    expect(readFileSync(playPath, "utf8").length).toBeGreaterThan(8000);
    expect(readFileSync(playPath, "utf8").length).not.toBe(readFileSync(r114Path, "utf8").length);
    expect(readFileSync(`${dir}/belt_cargo_crop.png`, "utf8").length).toBeGreaterThan(3000);
    const gate = readFileSync(`${dir}/midband_gate.txt`, "utf8").trim();
    expect(gate).toMatch(/^cyan=0 blue=\d+/);
    expect(Number(gate.match(/blue=(\d+)/)?.[1] ?? 0)).toBeGreaterThanOrEqual(200);
    for (const name of [
      "midband_crop.png",
      "compare_390_ref1.png",
      "compare_390_ref2.png",
      "trio_ref1_play_ref2.png",
      "vs_r114_main_after.png",
    ]) {
      expect(readFileSync(`${dir}/${name}`, "utf8").length).toBeGreaterThan(4000);
    }
  });
});
