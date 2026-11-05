import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { computeFit } from "../src/shell/fit";
import { layoutHud } from "../src/shell/hud-layout";
import { playView } from "../src/shell/play-view";
import { readViewport, ZERO_INSETS } from "../src/shell/viewport";

describe("minimap-r44 phone top-left polish", () => {
  it("sizes the minimap to the top strip and paints phone dots plus aim wedge", () => {
    const layoutSrc = readFileSync("src/shell/hud-layout.ts", "utf8");
    expect(layoutSrc.includes("Math.max(52, rowH)")).toBe(true);
    expect(layoutSrc.includes("mapY")).toBe(true);
    const hud = readFileSync("src/render/hud.ts", "utf8");
    const mini = hud.slice(hud.indexOf("function minimap"), hud.indexOf("export function abilityHitAt"));
    expect(mini.includes('blitSheetFit(ctx, "minimap_frame"')).toBe(true);
    expect(mini.includes("paintMiniObstacles")).toBe(true);
    expect(hud.includes("miniAim(ctx, cx, cy, w.aimX, w.aimY)")).toBe(true);
    expect(hud.includes("ctx.arc(mx, my, 2.4")).toBe(true);
    expect(mini.includes("if (!phone)")).toBe(true);
  });

  it("keeps the minimap in the top-left safe band on 390x844", () => {
    const vp = readViewport({ innerWidth: 390, innerHeight: 844, devicePixelRatio: 3 }, ZERO_INSETS);
    const pv = playView(vp.cssW, vp.cssH);
    const hud = layoutHud(vp, computeFit(vp.cssW, vp.cssH, vp.dpr, pv.viewW, pv.viewH, ZERO_INSETS));
    expect(hud.minimap.x).toBeLessThan(vp.cssW * 0.08);
    expect(hud.minimap.y).toBeLessThan(vp.cssH * 0.06);
    expect(hud.minimap.h).toBeGreaterThanOrEqual(52);
    expect(hud.minimap.h).toBeLessThanOrEqual(hud.difficulty.h + 6);
  });

  it("stores minimap-r44 review captures under docs/reviews/minimap-r44", () => {
    const dir = "docs/reviews/minimap-r44";
    for (const name of [
      "phone_390_play.png",
      "minimap_crop.png",
      "compare_390_ref1.png",
      "compare_390_ref2.png",
      "trio_ref1_play_ref2.png",
    ]) {
      expect(readFileSync(`${dir}/${name}`, "utf8").length).toBeGreaterThan(4000);
    }
    expect(readFileSync(`${dir}/NOTE.md`, "utf8").includes("#122")).toBe(true);
  });
});
