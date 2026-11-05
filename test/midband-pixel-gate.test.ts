import { execFileSync } from "child_process";
import { readFileSync, statSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("midband pixel gate", () => {
  it("ships scripts/midband_pixel_gate.mjs", () => {
    expect(readFileSync("scripts/midband_pixel_gate.mjs", "utf8").includes("midbandGateOk")).toBe(true);
  });

  it("rejects cyan fight-floor pads and accepts blue tank read", () => {
    const run = (path: string) =>
      execFileSync("node", ["scripts/midband_pixel_gate.mjs", path], { encoding: "utf8" });

    expect(() => run("test/fixtures/midband_bad_cyan.png")).toThrow();
    const good = run("test/fixtures/midband_good_blue.png");
    expect(good).toMatch(/cyan=0/);
    expect(good).toMatch(/blue=4096/);
  });

  it("stores premise and fixture PNGs", () => {
    expect(readFileSync("docs/premise/phone-midband-failed-r34-r37.txt", "utf8").includes("FAILED PREMISE")).toBe(true);
    expect(statSync("test/fixtures/midband_bad_cyan.png").size).toBeGreaterThan(100);
    expect(statSync("test/fixtures/midband_good_blue.png").size).toBeGreaterThan(100);
  });
});
