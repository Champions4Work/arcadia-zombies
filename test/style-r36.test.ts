import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  PHONE_CAM,
  PHONE_MID_Y0,
  PHONE_MID_Y1,
  YARD_CLEAR,
  yardMidFrameHits,
  yardPropHits,
} from "../src/render/yard-fx";
describe("r36 mid-frame blue tanks + chevron belts", () => {
  it("blits scaled pipes_blue_tank and conveyor sprites in the phone mid band", () => {
    const yard = readFileSync("src/render/yard-fx.ts", "utf8");
    expect(yard.includes("MID_FRAME_BLITS")).toBe(true);
    expect(yard.includes('id: "pipes_blue_tank"')).toBe(true);
    expect(yard.includes('id: "conveyor"')).toBe(true);
    expect(yard.includes("function paintMidFrameBlits")).toBe(true);
    expect(yard.includes("paintMidFrameBlits(ctx, tick, camX, camY, vw, vh)")).toBe(true);
    expect(yard.includes("MID_TANK_SCALE = 1.56")).toBe(true);
    expect(PHONE_MID_Y0).toBe(280);
    expect(PHONE_MID_Y1).toBe(520);
    const midX0 = PHONE_CAM.x0 + 8;
    const midX1 = PHONE_CAM.x1 - 8;
    expect(yardMidFrameHits(midX0, PHONE_MID_Y0, midX1, PHONE_MID_Y1)).toBeGreaterThanOrEqual(4);
    expect(yardMidFrameHits(midX0, PHONE_MID_Y0, midX1, PHONE_MID_Y1)).toBe(4);
    expect(yardPropHits(YARD_CLEAR.x0, YARD_CLEAR.y0, YARD_CLEAR.x1, YARD_CLEAR.y1)).toBe(0);
  });

  it("drops reviewDepth mid boiler spawn so brown tanks do not cover blue blits", () => {
    const depth = readFileSync("src/sim/depth.ts", "utf8");
    expect(depth.includes("obsKind[slot] = OB_BOILER")).toBe(false);
    expect(depth.includes("obsY[slot] = 520")).toBe(false);
  });

  it("stores r36 review captures and differs from obj-r35 phone play", () => {
    const play = readFileSync("docs/reviews/r36/phone_390_play.png", "utf8");
    const fail = readFileSync("docs/reviews/obj-r35/phone_390_play.png", "utf8");
    expect(play.length).toBeGreaterThan(8000);
    expect(readFileSync("docs/reviews/r36/compare_390_ref1.png", "utf8").length).toBeGreaterThan(8000);
    expect(readFileSync("docs/reviews/r36/compare_390_ref2.png", "utf8").length).toBeGreaterThan(8000);
    expect(readFileSync("docs/reviews/r36/trio_ref1_play_ref2.png", "utf8").length).toBeGreaterThan(8000);
    expect(readFileSync("docs/reviews/r36/vs_r35_fail.png", "utf8").length).toBeGreaterThan(8000);
    expect(play).not.toBe(fail);
    let diff = 0;
    const n = Math.min(play.length, fail.length);
    for (let i = 0; i < n; i++) if (play.charCodeAt(i) !== fail.charCodeAt(i)) diff++;
    expect(diff).toBeGreaterThan(5000);
  });
});
