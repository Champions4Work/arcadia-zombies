import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("obj-r46 phone objectives cluster", () => {
  it("puts wave in the status strip and gear-framed objectives on phone", () => {
    const hud = readFileSync("src/render/hud.ts", "utf8");
    const clock = hud.slice(hud.indexOf("function clockPanel"), hud.indexOf("function paintHeroBust"));
    expect(clock.includes("Wave ${face.n}/${face.of}")).toBe(true);
    expect(clock.includes("waveSkull")).toBe(true);
    expect(clock.includes("barCount(ctx, `${w.kills | 0}`")).toBe(true);
    const start = hud.indexOf("function objectives");
    const obj = hud.slice(start, hud.indexOf("export function drawHud"));
    expect(obj.includes('blitSheetFit(ctx, "panel_frame_gears"')).toBe(true);
    expect(obj.includes("if (!phone) blitSheetFit(ctx, \"panel_frame_gears\"")).toBe(false);
    expect(obj.includes("gearGlyph")).toBe(true);
    expect(obj.includes("Wave ${face.n}/${face.of}")).toBe(false);
  });

  it("shows chapter title on the phone rank strip", () => {
    const hud = readFileSync("src/render/hud.ts", "utf8");
    const banner = hud.slice(hud.indexOf("function banner"), hud.indexOf("function clockGlyph"));
    expect(banner.includes("zoneChapterAt(w.wave)} — ${zoneTitleAt(w.wave)}")).toBe(true);
    expect(banner.includes('blitSheetFit(ctx, "panel_frame_pipes"')).toBe(true);
  });

  it("stores obj-r46 review captures under docs/reviews/obj-r46", () => {
    expect(readFileSync("docs/reviews/obj-r46/phone_390_play.png", "utf8").length).toBeGreaterThan(8000);
    expect(readFileSync("docs/reviews/obj-r46/objectives_crop.png", "utf8").length).toBeGreaterThan(2000);
    expect(readFileSync("docs/reviews/obj-r46/compare_390_ref1.png", "utf8").length).toBeGreaterThan(8000);
    expect(readFileSync("docs/reviews/obj-r46/compare_390_ref2.png", "utf8").length).toBeGreaterThan(8000);
    expect(readFileSync("docs/reviews/obj-r46/trio_ref1_play_ref2.png", "utf8").length).toBeGreaterThan(8000);
    expect(readFileSync("docs/reviews/obj-r46/NOTE.md", "utf8").length).toBeGreaterThan(80);
  });
});
