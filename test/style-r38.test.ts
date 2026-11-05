import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  HERO_X,
  HERO_Y,
  PHONE_CAM,
  PHONE_HERO_BLITS,
  PHONE_WING_LEFT,
  PHONE_WING_RIGHT,
  YARD_CLEAR,
  yardCratePropsInClear,
  yardPropHits,
} from "../src/render/yard-fx";
import { playView } from "../src/shell/play-view";
import { cameraTarget } from "../src/sim/arena";
import { VENT_SLOW, reviewDepth, ventCount, ventX, ventY } from "../src/sim/depth";
import { ventSlowAt } from "../src/sim/depth.hot";
import { createWorld } from "../src/sim/world";

function brassWingProps(): { id: string; x: number; y: number }[] {
  const yard = readFileSync("src/render/yard-fx.ts", "utf8");
  const block = yard.slice(yard.indexOf("const PROPS:"), yard.indexOf("const TANKS"));
  const out: { id: string; x: number; y: number }[] = [];
  const re = /\{\s*id:\s*"([^"]+)",\s*x:\s*(\d+),\s*y:\s*(\d+)\s*\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(block))) {
    out.push({ id: m[1] ?? "", x: Number(m[2]), y: Number(m[3]) });
  }
  return out;
}

function inPhoneWing(x: number): boolean {
  return (x >= PHONE_WING_LEFT.x0 && x <= PHONE_WING_LEFT.x1)
    || (x >= PHONE_WING_RIGHT.x0 && x <= PHONE_WING_RIGHT.x1);
}

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
});

describe("props-r38 phone-inframe wing vents and breakables", () => {
  it("parks scaled wing decals and crates inside the phone camera, not off-screen rails", () => {
    const yard = readFileSync("src/render/yard-fx.ts", "utf8");
    expect(yard.includes("WING_PROP_SCALE = 1.38")).toBe(true);
    expect(yard.includes("x: 310, y: 450")).toBe(false);
    expect(yard.includes("x: 656, y: 450")).toBe(false);
    const { viewW } = playView(390, 844);
    const cam = new Float32Array(2);
    cameraTarget(HERO_X, HERO_Y, cam, viewW, 844);
    const camX = cam[0] ?? 0;
    const camRight = camX + viewW;
    const vents = brassWingProps().filter((p) => p.id === "decal_vent" && p.y >= 450 && p.y <= 620);
    expect(vents.length).toBeGreaterThanOrEqual(4);
    for (const v of vents) {
      expect(v.x).toBeGreaterThanOrEqual(camX + 4);
      expect(v.x).toBeLessThanOrEqual(camRight - 4);
      expect(inPhoneWing(v.x)).toBe(true);
    }
    const crates = brassWingProps().filter((p) => p.id === "crate" || p.id === "crate_stack" || p.id === "barrel");
    expect(crates.length).toBeGreaterThanOrEqual(6);
    for (const c of crates) {
      expect(inPhoneWing(c.x)).toBe(true);
      expect(c.y).toBeGreaterThanOrEqual(450);
      expect(c.y).toBeLessThanOrEqual(632);
    }
    expect(yardCratePropsInClear()).toBe(0);
    expect(yardPropHits(YARD_CLEAR.x0, YARD_CLEAR.y0, YARD_CLEAR.x1, YARD_CLEAR.y1)).toBe(0);
    expect(yardPropHits(PHONE_CAM.x0, PHONE_CAM.y0, PHONE_CAM.x1, PHONE_CAM.y1)).toBeGreaterThanOrEqual(8);
  });

  it("registers lane vents on the phone wings for VENT_SLOW", () => {
    const depth = readFileSync("src/sim/depth.ts", "utf8");
    expect(depth.includes("[372, 472]")).toBe(true);
    expect(depth.includes("[588, 472]")).toBe(true);
    const w = createWorld(38);
    reviewDepth(w);
    expect(ventCount(w)).toBeGreaterThanOrEqual(5);
    expect(ventX(w, 3)).toBeGreaterThanOrEqual(PHONE_WING_LEFT.x0);
    expect(ventX(w, 3)).toBeLessThanOrEqual(PHONE_WING_LEFT.x1 + 8);
    expect(ventY(w, 3)).toBeGreaterThanOrEqual(450);
    expect(ventSlowAt(w, ventX(w, 3) ?? 0, ventY(w, 3) ?? 0)).toBe(VENT_SLOW);
    expect(ventSlowAt(w, ventX(w, 5) ?? 0, ventY(w, 5) ?? 0)).toBe(VENT_SLOW);
  });

  it("passes the midband pixel gate on props-r38 review captures", () => {
    const midband = "docs/reviews/props-r38/midband_crop.png";
    expect(readFileSync(midband, "utf8").length).toBeGreaterThan(4000);
    const gate = readFileSync("docs/reviews/props-r38/midband_gate.txt", "utf8").trim();
    expect(gate).toMatch(/^cyan=0 blue=\d+/);
    const blue = Number(gate.match(/blue=(\d+)/)?.[1] ?? 0);
    expect(blue).toBeGreaterThanOrEqual(200);
  });

  it("stores props-r38 review captures under docs/reviews/props-r38", () => {
    const dir = "docs/reviews/props-r38";
    for (const name of [
      "phone_390_play.png",
      "midband_crop.png",
      "side_crop_rails.png",
      "compare_390_ref1.png",
      "compare_390_ref2.png",
      "trio_ref1_play_ref2.png",
    ]) {
      expect(readFileSync(`${dir}/${name}`, "utf8").length).toBeGreaterThan(4000);
    }
    expect(readFileSync(`${dir}/midband_gate.txt`, "utf8")).toMatch(/^cyan=0 blue=\d+/);
  });
});
