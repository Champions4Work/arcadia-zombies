import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("midband pixel gate", () => {
  it("counts fight-floor pad cyan (#7ae0d4), not tank liquid", () => {
    const src = readFileSync("scripts/midband_pixel_gate.mjs", "utf8");
    expect(src.includes("g > 205")).toBe(true);
    expect(src.includes("b > 200")).toBe(true);
    expect(src.includes("counts.cyan === 0 && counts.blue >= 200")).toBe(true);
  });

  it("rejects cyan fight-floor pads and accepts blue tank read", () => {
    const run = (path: string) =>
      execFileSync("node", ["scripts/midband_pixel_gate.mjs", path], { encoding: "utf8" });

    expect(() => run("test/fixtures/midband_bad_cyan.png")).toThrow();
    const good = run("test/fixtures/midband_good_blue.png");
    expect(good).toMatch(/cyan=0/);
    expect(good).toMatch(/blue=4096/);
  });

  it("passes on r38 midband_crop capture", () => {
    const out = execFileSync("node", ["scripts/midband_pixel_gate.mjs", "docs/reviews/r38/midband_crop.png"], {
      encoding: "utf8",
    });
    expect(out).toMatch(/^cyan=0 blue=\d+/);
    const blue = Number(out.match(/blue=(\d+)/)?.[1] ?? 0);
    expect(blue).toBeGreaterThanOrEqual(200);
  });

  it("stores premise and fixture PNGs", () => {
    expect(readFileSync("docs/premise/phone-midband-failed-r34-r37.txt", "utf8").includes("FAILED PREMISE")).toBe(true);
    expect(readFileSync("test/fixtures/midband_bad_cyan.png", "utf8").length).toBeGreaterThan(100);
    expect(readFileSync("test/fixtures/midband_good_blue.png", "utf8").length).toBeGreaterThan(100);
  });
});
