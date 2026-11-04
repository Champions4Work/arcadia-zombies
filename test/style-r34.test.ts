import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  bindYard,
  heroCrowd,
  yardCratePropsInClear,
  yardMidFrameHits,
  yardPropHits,
  YARD_CLEAR,
  PHONE_CAM,
} from "../src/render/yard-fx";
import { ZONE_BRASS } from "../src/sim/zones";

describe("r34 mid-yard phone read", () => {
  it("puts belts, blue pipe columns, and lit spawns in the phone mid band", () => {
    bindYard(ZONE_BRASS);
    const yard = readFileSync("src/render/yard-fx.ts", "utf8");
    const brassProps = yard.slice(yard.indexOf("const PROPS:"), yard.indexOf("const TANKS"));
    expect(brassProps.includes("conveyor", brassProps.indexOf("y: 444"))).toBe(true);
    expect(brassProps.includes("pipes_blue_tank", brassProps.indexOf("y: 416"))).toBe(true);
    expect(brassProps.includes("valve_steam", brassProps.indexOf("y: 388"))).toBe(true);
    expect(yard.includes("y: 446, w: 58, vert: 0")).toBe(true);
    expect(yard.includes("x: 326, y: 328, len: 268, vert: 1")).toBe(true);
    expect(yardPropHits(YARD_CLEAR.x0, YARD_CLEAR.y0, YARD_CLEAR.x1, YARD_CLEAR.y1)).toBe(0);
    expect(yardCratePropsInClear()).toBe(0);
    expect(yardMidFrameHits()).toBeGreaterThanOrEqual(14);
    expect(yardPropHits(PHONE_CAM.x0, PHONE_CAM.y0, PHONE_CAM.x1, PHONE_CAM.y1)).toBeGreaterThanOrEqual(28);
    expect(heroCrowd()).toBe(0);
  });

  it("rejects edge-only bottom tank stacks as the sole phone signature", () => {
    const yard = readFileSync("src/render/yard-fx.ts", "utf8");
    const brassProps = yard.slice(yard.indexOf("const PROPS:"), yard.indexOf("const TANKS"));
    const midConveyor = /conveyor", x: 3\d\d, y: 44[0-9]/;
    const midTank = /pipes_blue_tank", x: 6\d\d, y: 4(16|76)/;
    expect(midConveyor.test(brassProps)).toBe(true);
    expect(midTank.test(brassProps)).toBe(true);
    expect(brassProps.includes('conveyor", x: 304, y: 656')).toBe(true);
    expect(brassProps.indexOf("y: 444")).toBeLessThan(brassProps.indexOf("y: 656"));
  });

  it("stores r34 review captures under docs/reviews/r34", () => {
    expect(readFileSync("docs/reviews/r34/phone_390_play.png", "utf8").length).toBeGreaterThan(8000);
    expect(readFileSync("docs/reviews/r34/compare_390_ref1.png", "utf8").length).toBeGreaterThan(8000);
    expect(readFileSync("docs/reviews/r34/compare_390_ref2.png", "utf8").length).toBeGreaterThan(8000);
    expect(readFileSync("docs/reviews/r34/trio_ref1_play_ref2.png", "utf8").length).toBeGreaterThan(8000);
  });
});
