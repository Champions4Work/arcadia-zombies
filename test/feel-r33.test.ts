import { readFileSync } from "node:fs";
import { DASH_IFRAME, DASH_TICKS } from "../src/sim/dash";
import { enemyFlashAlpha, FLASH_MS, juiceHit, resetJuice } from "../src/render/juice";
import { TRAIL_LIFE } from "../src/render/trail";
import { createWorld } from "../src/sim/world";

describe("feel r33 combat juice", () => {
  it("maps enemy flash slots to a 0..1 alpha for canvas tint", () => {
    resetJuice();
    const w = createWorld(2);
    juiceHit(5, 100, 200, 3, 0, false, w.tick, w.px, w.py);
    expect(enemyFlashAlpha(5)).toBe(1);
    expect(enemyFlashAlpha(5)).toBeGreaterThan(enemyFlashAlpha(0));
    expect(enemyFlashAlpha(9999)).toBe(0);
    expect(FLASH_MS).toBeGreaterThanOrEqual(60);
  });

  it("keeps dash iframe readable and trail off lighter composite", () => {
    expect(DASH_IFRAME).toBeGreaterThanOrEqual(DASH_TICKS);
    expect(TRAIL_LIFE).toBeGreaterThanOrEqual(4);
    const trail = readFileSync("src/render/trail.ts", "utf8");
    expect(trail.includes('"lighter"')).toBe(false);
    expect(trail.includes("source-over")).toBe(true);
    const look = readFileSync("src/art/look.ts", "utf8");
    expect(look.includes("paintDashShell")).toBe(true);
    expect(look.includes("flashAlpha")).toBe(true);
    const smooth = readFileSync("src/render/smooth.ts", "utf8");
    expect(smooth.includes("1 - raw")).toBe(true);
  });
});
