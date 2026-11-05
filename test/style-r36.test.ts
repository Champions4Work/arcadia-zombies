import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { yardPropHits, PHONE_CAM } from "../src/render/yard-fx";

describe("spawn-r36 lit facade phone read", () => {
  it("pairs two scaled spawn facades with lamp pools on the brass wall band", () => {
    const yard = readFileSync("src/render/yard-fx.ts", "utf8");
    const brass = yard.slice(yard.indexOf("const BUILDINGS"), yard.indexOf("const BELTS"));
    expect((brass.match(/\{ x:/g) || []).length).toBe(2);
    expect(yard.includes("SPAWN_FACADE_PHONE = 1.44")).toBe(true);
    expect(yard.includes("function paintSpawnFacade")).toBe(true);
    expect(yard.includes("function facadeScale")).toBe(true);
    const facade = yard.slice(yard.indexOf("function paintSpawnFacade"), yard.indexOf("export function paintDoorSpawn"));
    expect(facade.includes("building_wall_door")).toBe(true);
    expect(facade.includes("window_lit")).toBe(true);
    expect(facade.includes("lamp")).toBe(true);
    const brick = yard.slice(yard.indexOf("function paintBrickWall"), yard.indexOf("function doorPool"));
    expect(brick.includes('yardBound === ZONE_BRASS')).toBe(true);
    expect(yardPropHits(PHONE_CAM.x0, PHONE_CAM.y0, PHONE_CAM.x1, PHONE_CAM.y1)).toBeGreaterThanOrEqual(8);
  });

  it("stores spawn-r36 review captures under docs/reviews/spawn-r36", () => {
    expect(readFileSync("docs/reviews/spawn-r36/phone_390_play.png", "utf8").length).toBeGreaterThan(8000);
    expect(readFileSync("docs/reviews/spawn-r36/compare_390_ref1.png", "utf8").length).toBeGreaterThan(8000);
    expect(readFileSync("docs/reviews/spawn-r36/compare_390_ref2.png", "utf8").length).toBeGreaterThan(8000);
    expect(readFileSync("docs/reviews/spawn-r36/trio_ref1_play_ref2.png", "utf8").length).toBeGreaterThan(8000);
  });
});
