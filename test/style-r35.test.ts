import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  FIGHT_FLOOR_PAD,
  PHONE_CAM,
  YARD_CLEAR,
  yardCratePropsInClear,
  yardFightFloorBluePools,
  yardPropHits,
} from "../src/render/yard-fx";
import { bindGround, groundKind, groundZone } from "../src/render/ground";
import { ZONE_BRASS } from "../src/sim/zones";

describe("r35 mid-frame pipes/belts, no fight-floor cyan pads", () => {
  it("drops horizontal cyan pipe runs and floor bluePool tanks on brass", () => {
    const yard = readFileSync("src/render/yard-fx.ts", "utf8");
    const brassPipes = yard.slice(yard.indexOf("const PIPE_RUNS"), yard.indexOf("const BELT_H"));
    expect(brassPipes.includes("y: 232")).toBe(false);
    expect(brassPipes.includes("y: 648")).toBe(false);
    expect(yard.includes("MID_TANK_SCALE")).toBe(true);
    expect(yard.includes("MID_CONVEYOR_SCALE")).toBe(true);
    expect(yard.includes("SIDE_BELT_BLIT_SCALE")).toBe(true);
    expect(yardFightFloorBluePools()).toBe(0);
  });

  it("keeps mid-frame side tanks and belts inside the phone cam without YARD_CLEAR clutter", () => {
    const yard = readFileSync("src/render/yard-fx.ts", "utf8");
    const brassProps = yard.slice(yard.indexOf("const PROPS:"), yard.indexOf("const TANKS"));
    expect(brassProps.includes("pipes_blue_tank")).toBe(true);
    expect(brassProps.includes("conveyor")).toBe(true);
    expect(brassProps.includes("x: 272, y: 362")).toBe(true);
    expect(brassProps.includes("x: 660, y: 362")).toBe(true);
    expect(brassProps.includes("y: 584")).toBe(false);
    expect(brassProps.includes("breakable_boiler")).toBe(false);
    expect(yardCratePropsInClear()).toBe(0);
    expect(yardPropHits(YARD_CLEAR.x0, YARD_CLEAR.y0, YARD_CLEAR.x1, YARD_CLEAR.y1)).toBe(0);
    expect(yardPropHits(PHONE_CAM.x0, PHONE_CAM.y0, PHONE_CAM.x1, PHONE_CAM.y1)).toBeGreaterThanOrEqual(12);
  });

  it("keeps brass ground stone without brassPad metal in the fight band", () => {
    bindGround(ZONE_BRASS);
    expect(groundZone()).toBe(ZONE_BRASS);
    const tile = 16;
    let brassCells = 0;
    for (let r = 20; r <= 38; r++) {
      for (let c = 22; c <= 38; c++) {
        const wx = c * tile;
        const wy = r * tile;
        if (wx < FIGHT_FLOOR_PAD.x0 || wx > FIGHT_FLOOR_PAD.x1) continue;
        if (wy < FIGHT_FLOOR_PAD.y0 || wy > FIGHT_FLOOR_PAD.y1) continue;
        const k = groundKind(c, r);
        if (k === 4 || k === 5) brassCells++;
      }
    }
    expect(brassCells).toBe(0);
  });

  it("stores r35 phone review captures under docs/reviews/r35", () => {
    expect(readFileSync("docs/reviews/r35/phone_390_play.png", "utf8").length).toBeGreaterThan(8000);
    expect(readFileSync("docs/reviews/r35/compare_390_ref1.png", "utf8").length).toBeGreaterThan(8000);
    expect(readFileSync("docs/reviews/r35/compare_390_ref2.png", "utf8").length).toBeGreaterThan(8000);
    expect(readFileSync("docs/reviews/r35/trio_ref1_play_ref2.png", "utf8").length).toBeGreaterThan(8000);
    expect(readFileSync("docs/reviews/r35/vs_r34_fail.png", "utf8").length).toBeGreaterThan(8000);
  });
});
