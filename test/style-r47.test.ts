import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("fx-r47 combat juice", () => {
  it("ejects four oblong brass particles per shot and splatter floor blood", () => {
    const juice = readFileSync("src/render/juice.ts", "utf8");
    expect(juice.includes("CASING_EJECT_N = 4")).toBe(true);
    expect(juice.includes("CASING_PART_W = 14")).toBe(true);
    expect(juice.includes("spawnPart(x, y, px * (eject * 0.84)")).toBe(true);
    expect(juice.includes("rgba(255,158,46,0.72)")).toBe(false);
    const look = readFileSync("src/art/look.ts", "utf8");
    expect(look.includes("const span = 4 + (s & 3)")).toBe(true);
    expect(look.includes("ctx.ellipse(x + ox")).toBe(false);
    expect(look.includes("fillRect((x + ox)")).toBe(true);
    const stains = readFileSync("src/render/stains.ts", "utf8");
    expect(stains.includes("const n = 6 + (salt & 3)")).toBe(true);
  });

  it("stores fx-r47 review captures and passes midband gate", () => {
    const dir = "docs/reviews/fx-r47";
    for (const name of [
      "phone_390_play.png",
      "muzzle_crop.png",
      "blood_crop.png",
      "vs_baseline.png",
      "midband_gate.txt",
      "NOTE.md",
    ]) {
      expect(readFileSync(`${dir}/${name}`, "utf8").length).toBeGreaterThan(20);
    }
    const mid = execFileSync("node", ["scripts/midband_pixel_gate.mjs", `${dir}/midband_crop.png`], { encoding: "utf8" });
    expect(mid).toMatch(/cyan=0/);
    expect(readFileSync(`${dir}/midband_gate.txt`, "utf8")).toMatch(/cyan=0/);
  });
});
