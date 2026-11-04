import { readFileSync } from "node:fs";
import { HAZARD_MARKS } from "../src/render/ground";
import { yardPropHits, YARD_CLEAR, PHONE_CAM } from "../src/render/yard-fx";

describe("r29 dark painted yard", () => {
  it("declutters brass side props and keeps the spawn floor open", () => {
    const yard = readFileSync("src/render/yard-fx.ts", "utf8");
    const brassProps = yard.slice(yard.indexOf("const PROPS:"), yard.indexOf("const TANKS"));
    expect(brassProps.includes("crate_stack")).toBe(false);
    expect(brassProps.includes('"barrel"')).toBe(false);
    expect(brassProps.includes("breakable_gear_pylon")).toBe(true);
    expect(brassProps.includes("pipes_blue_tank")).toBe(true);
    expect(yardPropHits(YARD_CLEAR.x0, YARD_CLEAR.y0, YARD_CLEAR.x1, YARD_CLEAR.y1)).toBe(0);
    expect(yardPropHits(PHONE_CAM.x0, PHONE_CAM.y0, PHONE_CAM.x1, PHONE_CAM.y1)).toBeGreaterThanOrEqual(10);
    expect(yardPropHits(PHONE_CAM.x0, PHONE_CAM.y0, PHONE_CAM.x1, PHONE_CAM.y1)).toBeLessThanOrEqual(24);
    expect(HAZARD_MARKS.length).toBe(0);
  });

  it("multiplies dusk grade and vignette without a global orange wash", () => {
    const yard = readFileSync("src/render/yard-fx.ts", "utf8");
    expect(yard.includes("rgba(52,28,40,0.42)")).toBe(true);
    expect(yard.includes("rgba(255,190,110,0.18)")).toBe(true);
    const draw = readFileSync("src/render/draw.ts", "utf8");
    expect(draw.includes("rgba(2,4,10,0.58)")).toBe(true);
    const ground = readFileSync("src/render/ground.ts", "utf8");
    expect(ground.includes("veil = bound === ZONE_BOILER ? 0.55 : bound === ZONE_TRAM ? 0.28 : 0.26")).toBe(true);
    expect(ground.includes('globalCompositeOperation = "multiply"')).toBe(true);
  });

  it("tones hero rim light for a brass hunter read", () => {
    const look = readFileSync("src/art/look.ts", "utf8");
    expect(look.includes("rgba(255,190,100,0.38)")).toBe(true);
    expect(look.includes("rgba(255,210,120,0.72)")).toBe(false);
    expect(look.includes("rgba(62,220,220,0.42)")).toBe(false);
    expect(look.includes('globalCompositeOperation = "multiply"')).toBe(true);
  });
});
