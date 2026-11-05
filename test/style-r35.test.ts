import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { HERO_X, HERO_Y } from "../src/render/yard-fx";
import { playView } from "../src/shell/play-view";
import { ARENA_H, ARENA_W, cameraTarget } from "../src/sim/arena";

describe("obj-r35 phone objectives cluster", () => {
  it("aligns the phone clock strip and objectives card in one column", () => {
    const layout = readFileSync("src/shell/hud-layout.ts", "utf8");
    expect(layout.includes("clusterRight")).toBe(true);
    expect(layout.includes("objXPhone")).toBe(true);
    expect(layout.includes("phone ? 2 : 6")).toBe(true);
  });

  it("keeps objectives_panel on phone with gear frame overlay", () => {
    const hud = readFileSync("src/render/hud.ts", "utf8");
    const start = hud.indexOf("function objectives");
    const obj = hud.slice(start, hud.indexOf("export function drawHud"));
    expect(obj.includes('blitSheetFit(ctx, "panel_frame_gears"')).toBe(true);
    expect(obj.includes("if (!phone) blitSheetFit(ctx, \"panel_frame_gears\"")).toBe(false);
    expect(obj.includes("const row0 = phone ? box.y + 38")).toBe(true);
  });

  it("stores obj-r35 review captures under docs/reviews/obj-r35", () => {
    expect(readFileSync("docs/reviews/obj-r35/phone_390_play.png", "utf8").length).toBeGreaterThan(8000);
    expect(readFileSync("docs/reviews/obj-r35/compare_390_ref1.png", "utf8").length).toBeGreaterThan(8000);
    expect(readFileSync("docs/reviews/obj-r35/compare_390_ref2.png", "utf8").length).toBeGreaterThan(8000);
    expect(readFileSync("docs/reviews/obj-r35/trio_ref1_play_ref2.png", "utf8").length).toBeGreaterThan(8000);
  });
});

describe("r35 fx-only mid-frame steam + combat read", () => {
  it("adds hero-band steam sites and exports paintVentSteam for depth vents", () => {
    const yard = readFileSync("src/render/yard-fx.ts", "utf8");
    expect(yard.includes("const HERO_BAND_STEAM")).toBe(true);
    expect(yard.includes("export function paintVentSteam")).toBe(true);
    expect(yard.includes("export function paintPhoneHeroValveSteam")).toBe(true);
    expect(yard.includes("export const PHONE_HERO_VALVE_BLITS")).toBe(true);
    expect(yard.includes("return STEAM_VENTS")).toBe(true);
    const depth = readFileSync("src/render/depth.ts", "utf8");
    expect(depth.includes("paintVentSteam")).toBe(true);
    expect(depth.includes("paintVentSteam(ctx, x, y - 6, w.tick, true)")).toBe(true);
  });

  it("keeps hero-band valve sites on phone tank rims inside the camera clip", () => {
    const { viewW, viewH } = playView(390, 844);
    const cam = new Float32Array(2);
    cameraTarget(HERO_X, HERO_Y, cam, viewW, viewH);
    const camX = cam[0] ?? 0;
    const camY = cam[1] ?? 0;
    const band = yardHeroBandSites();
    for (const v of band) {
      expect(v.x).toBeGreaterThanOrEqual(camX + 8);
      expect(v.x).toBeLessThanOrEqual(camX + viewW - 8);
      expect(v.y).toBeGreaterThanOrEqual(camY + 48);
      expect(v.y).toBeLessThanOrEqual(camY + viewH - 48);
    }
    expect(band.length).toBeGreaterThanOrEqual(2);
    expect(ARENA_W).toBeGreaterThan(viewW);
    expect(ARENA_H).toBeGreaterThanOrEqual(viewH);
  });

  it("tightens floor blood without shrinking combat brass read", () => {
    expect(readFileSync("docs/reviews/fx-r35/vs_baseline.png", "utf8").length).toBeGreaterThan(4000);
    expect(readFileSync("docs/reviews/fx-r35/phone_390_play.png", "utf8").length).toBeGreaterThan(8000);
  });

  it("stores fx-r35 review captures under docs/reviews/fx-r35", () => {
    expect(readFileSync("docs/reviews/fx-r35/phone_390_play.png", "utf8").length).toBeGreaterThan(8000);
    expect(readFileSync("docs/reviews/fx-r35/vs_baseline.png", "utf8").length).toBeGreaterThan(4000);
    expect(readFileSync("docs/reviews/fx-r35/compare_390_ref2.png", "utf8").length).toBeGreaterThan(8000);
  });
});

function yardHeroBandSites(): { x: number; y: number }[] {
  const yard = readFileSync("src/render/yard-fx.ts", "utf8");
  const block = yard.slice(yard.indexOf("const HERO_BAND_STEAM"), yard.indexOf("export const YARD_CLEAR"));
  const out: { x: number; y: number }[] = [];
  const re = /\{\s*x:\s*(\d+),\s*y:\s*(\d+)\s*\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(block))) {
    out.push({ x: Number(m[1]), y: Number(m[2]) });
  }
  return out;
}
