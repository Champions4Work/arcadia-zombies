import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("belt cargo pixel gate", () => {
  it("counts gold cube top faces distinct from chevron yellow", () => {
    const src = readFileSync("scripts/belt_cargo_pixel_gate.mjs", "utf8");
    expect(src.includes("b >= 100 && b <= 160")).toBe(true);
    expect(src.includes("counts.amber >= 80")).toBe(true);
  });

  it("passes on belt-r43 belt_cargo_crop capture", () => {
    const out = execFileSync("node", ["scripts/belt_cargo_pixel_gate.mjs", "docs/reviews/belt-r43/belt_cargo_crop.png"], {
      encoding: "utf8",
    });
    expect(out).toMatch(/^amber=\d+/);
    const amber = Number(out.match(/amber=(\d+)/)?.[1] ?? 0);
    expect(amber).toBeGreaterThanOrEqual(80);
  });

  it("rejects belt-r42 weak amber read", () => {
    expect(() =>
      execFileSync("node", ["scripts/belt_cargo_pixel_gate.mjs", "docs/reviews/belt-r42/belt_cargo_crop.png"], {
        encoding: "utf8",
      }),
    ).toThrow();
  });
});
