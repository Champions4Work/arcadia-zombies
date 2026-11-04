import { readFileSync } from "node:fs";
import { HAZARD_MARKS } from "../src/render/ground";
import { yardPropHits, YARD_CLEAR, PHONE_CAM } from "../src/render/yard-fx";

describe("r27 art-bible pass", () => {
  it("locks phone power row to round sun dot flame arrow droplet glyphs", () => {
    const rack = readFileSync("src/render/weapons.ts", "utf8");
    expect(rack.includes("function paintPhonePower")).toBe(true);
    expect(rack.includes("paintPhonePower(c, i, cx, cy")).toBe(true);
    expect(rack.includes('if (phone) {\n      paintPhonePower')).toBe(true);
    expect(rack.includes("quadraticCurveTo")).toBe(true);
    expect(rack.includes("bezierCurveTo")).toBe(true);
  });

  it("paints cyan heart rings on phone without rectangular weapon slots", () => {
    const hud = readFileSync("src/render/hud.ts", "utf8");
    expect(hud.includes('blitSheetFit(ctx, "panel_frame_small"')).toBe(true);
    expect(hud.includes("phone ? CYAN : HEALTH")).toBe(true);
    const rack = readFileSync("src/render/weapons.ts", "utf8");
    expect(rack.includes('if (phone) {\n      paintPhonePower')).toBe(true);
    expect(rack.includes('blitSheetFit(c, "panel_frame_glow"')).toBe(true);
    expect(rack.match(/blitSheetFit\(c, "power_slot"/g)?.length).toBe(1);
  });

  it("declutters brass yard perimeter breakables and drops center cyan pipe runs", () => {
    const yard = readFileSync("src/render/yard-fx.ts", "utf8");
    const brassProps = yard.slice(yard.indexOf("const PROPS:"), yard.indexOf("const TANKS"));
    const brassPipes = yard.slice(yard.indexOf("const PIPE_RUNS = ["), yard.indexOf("const BELT_H"));
    expect(yard.includes("y: 392")).toBe(true);
    expect(yard.includes("vert: 1")).toBe(true);
    expect(yard.includes("paintBrassGrade")).toBe(true);
    expect(brassProps.includes("breakable_gear_pylon")).toBe(true);
    expect(brassProps.includes("breakable_boiler")).toBe(true);
    expect(brassProps.includes("decal_grate")).toBe(true);
    expect(brassProps.includes("crate_stack")).toBe(false);
    expect(brassProps.includes('"barrel"')).toBe(false);
    expect(brassProps.includes("x: 308, y: 520")).toBe(true);
    expect(brassPipes.includes("x: 480, y:")).toBe(false);
    expect(brassPipes.includes("vert: 1")).toBe(true);
    expect(brassPipes.includes("x: 326, y: 328")).toBe(true);
    expect(HAZARD_MARKS.length).toBe(0);
    expect(yardPropHits(YARD_CLEAR.x0, YARD_CLEAR.y0, YARD_CLEAR.x1, YARD_CLEAR.y1)).toBe(0);
    expect(yardPropHits(PHONE_CAM.x0, PHONE_CAM.y0, PHONE_CAM.x1, PHONE_CAM.y1)).toBeGreaterThanOrEqual(20);
    const depth = readFileSync("src/sim/depth.ts", "utf8");
    expect(depth.includes("SIDE_BELT_LEFT_X")).toBe(true);
    expect(depth.includes("[296, 658, 368, 0]")).toBe(false);
    expect(depth.includes("OB_CRATE, 380, 260")).toBe(false);
    expect(depth.includes("OB_BARREL, 420, 480")).toBe(false);
  });

  it("paints dusk sky and hunter rim for phone readability", () => {
    const stage = readFileSync("src/render/stage.ts", "utf8");
    expect(stage.includes("#1a1030")).toBe(true);
    expect(stage.includes("rgba(255,190,110")).toBe(true);
    const look = readFileSync("src/art/look.ts", "utf8");
    expect(look.includes("createRadialGradient(x - 10 * s, y - 22 * s")).toBe(true);
    expect(look.includes("rgba(255,210,120,0.72)")).toBe(true);
  });
});
