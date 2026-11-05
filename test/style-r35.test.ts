import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("obj-r35 phone objectives cluster", () => {
  it("aligns the phone clock strip and objectives card in one column", () => {
    const layout = readFileSync("src/shell/hud-layout.ts", "utf8");
    expect(layout.includes("clusterRight")).toBe(true);
    expect(layout.includes("objXPhone")).toBe(true);
    expect(layout.includes("phone ? 2 : 6")).toBe(true);
  });

  it("keeps objectives_panel on phone without the gear overlay", () => {
    const hud = readFileSync("src/render/hud.ts", "utf8");
    const start = hud.indexOf("function objectives");
    const obj = hud.slice(start, hud.indexOf("export function drawHud"));
    expect(obj.includes('if (!phone) blitSheetFit(ctx, "panel_frame_gears"')).toBe(true);
    expect(obj.includes("const row0 = phone ? box.y + 36")).toBe(true);
  });

  it("stores obj-r35 review captures under docs/reviews/obj-r35", () => {
    expect(readFileSync("docs/reviews/obj-r35/phone_390_play.png", "utf8").length).toBeGreaterThan(8000);
    expect(readFileSync("docs/reviews/obj-r35/compare_390_ref1.png", "utf8").length).toBeGreaterThan(8000);
    expect(readFileSync("docs/reviews/obj-r35/compare_390_ref2.png", "utf8").length).toBeGreaterThan(8000);
    expect(readFileSync("docs/reviews/obj-r35/trio_ref1_play_ref2.png", "utf8").length).toBeGreaterThan(8000);
  });
});
