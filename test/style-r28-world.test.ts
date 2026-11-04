import { readFileSync } from "node:fs";
import { yardPropHits, YARD_CLEAR, PHONE_CAM } from "../src/render/yard-fx";

describe("r28 world densify", () => {
  it("adds side vertical belts, blue puddles, and keeps the spawn lane open", () => {
    const yard = readFileSync("src/render/yard-fx.ts", "utf8");
    const brassProps = yard.slice(yard.indexOf("const PROPS:"), yard.indexOf("const TANKS"));
    const brassBelts = yard.slice(yard.indexOf("const BELTS = ["), yard.indexOf("const PIPE_RUNS"));
    expect(yard.includes("function paintVertBelt")).toBe(true);
    expect(brassBelts.includes("vert: 1")).toBe(true);
    expect(brassProps.includes("blue_puddle")).toBe(true);
    expect(brassProps.includes("decal_hazard")).toBe(true);
    expect(yardPropHits(YARD_CLEAR.x0, YARD_CLEAR.y0, YARD_CLEAR.x1, YARD_CLEAR.y1)).toBe(0);
    expect(yardPropHits(PHONE_CAM.x0, PHONE_CAM.y0, PHONE_CAM.x1, PHONE_CAM.y1)).toBeGreaterThanOrEqual(40);
    const ground = readFileSync("src/render/ground.ts", "utf8");
    const brassGround = ground.slice(ground.indexOf("} else {"), ground.indexOf("for (let i = 0; i < 14; i++)"));
    expect(brassGround.includes("FEAT_GEAR")).toBe(true);
    expect(ground.includes("c === 19 || c === 41")).toBe(true);
  });
});
