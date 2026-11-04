import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { YARD_CLEAR } from "../src/render/yard-fx";
import {
  BELT_PHONE_VISIBLE_Y,
  CARGO_LAND,
  CARGO_RIDE,
  DROP_ALONG,
  FIRST_CARGO,
  PICKUP_DROP_Y,
  SIDE_BELT_LEFT_X,
  SIDE_BELT_RIDE_Y,
  cargoOn,
  cargoOutsideFightClear,
  cargoPhase,
  cargoX,
  cargoY,
  depthState,
  reviewDepth,
} from "../src/sim/depth";
import { stepDepth } from "../src/sim/depth.hot";
import { createWorld } from "../src/sim/world";

describe("r33 side belt visibility + pickup drop", () => {
  it("rides glowing cargo on mid-side vertical belts above the phone HUD band", () => {
    const yard = readFileSync("src/render/yard-fx.ts", "utf8");
    const depth = readFileSync("src/sim/depth.ts", "utf8");
    expect(yard.includes("y: 658, w: 368")).toBe(false);
    expect(yard.includes("y: 392")).toBe(true);
    expect(depth.includes("[296, 658, 368, 0]")).toBe(false);
    expect(depth.includes("SIDE_BELT_LEFT_X")).toBe(true);
    expect(SIDE_BELT_RIDE_Y).toBeLessThan(BELT_PHONE_VISIBLE_Y);
    const w = createWorld(33);
    reviewDepth(w);
    expect(cargoOn(w, 0)).toBe(1);
    expect(cargoPhase(w, 0)).toBe(CARGO_RIDE);
    expect(cargoX(w, 0)).toBe(SIDE_BELT_LEFT_X);
    expect(cargoY(w, 0)).toBeGreaterThan(SIDE_BELT_RIDE_Y);
    expect(cargoY(w, 0)).toBeLessThan(BELT_PHONE_VISIBLE_Y);
    expect(cargoOutsideFightClear(cargoX(w, 0), cargoY(w, 0))).toBe(true);
  });

  it("lands belt cargo outside YARD_CLEAR after the slide phase", () => {
    const w = createWorld(34);
    w.py = 80;
    w.px = 200;
    const d = depthState(w);
    d.cargoOn.fill(0);
    d.lastSpawn[0] = -9999;
    d.lastSpawn[1] = -9999;
    w.tick = FIRST_CARGO;
    stepDepth(w);
    let slot = cargoOn(w, 0) ? 0 : cargoOn(w, 1) ? 1 : -1;
    expect(slot).toBeGreaterThanOrEqual(0);
    d.cargoT[slot] = DROP_ALONG - 2;
    for (let t = 0; t < 80; t++) stepDepth(w);
    slot = cargoOn(w, 0) ? 0 : cargoOn(w, 1) ? 1 : slot;
    for (let t = 0; t < 240; t++) stepDepth(w);
    slot = cargoOn(w, 0) ? 0 : cargoOn(w, 1) ? 1 : slot;
    expect(cargoOn(w, slot)).toBe(1);
    expect(cargoPhase(w, slot)).toBe(CARGO_LAND);
    const x = cargoX(w, slot);
    const y = cargoY(w, slot);
    expect(y).toBeGreaterThanOrEqual(PICKUP_DROP_Y - 4);
    expect(cargoOutsideFightClear(x, y)).toBe(true);
    expect(x < YARD_CLEAR.x0 || x > YARD_CLEAR.x1 || y > YARD_CLEAR.y1).toBe(true);
  });

  it("stores belt-r33 phone review captures under docs/reviews/belt-r33", () => {
    expect(readFileSync("docs/reviews/belt-r33/phone_390_play.png", "utf8").length).toBeGreaterThan(8000);
    expect(readFileSync("docs/reviews/belt-r33/compare_390_ref2.png", "utf8").length).toBeGreaterThan(8000);
  });
});
