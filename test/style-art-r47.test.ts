import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { PACK } from "../src/art/packed/pack";
import { HERO_X, HERO_Y, PHONE_HERO_BLITS, YARD_CLEAR, yardCratePropsInClear } from "../src/render/yard-fx";
import { playView } from "../src/shell/play-view";
import { cameraTarget } from "../src/sim/arena";

describe("art-r47 az_art_v2 integration", () => {
  it("packs hero walk frames with manifest foot anchors at 64px pack height", () => {
    const manifest = JSON.parse(readFileSync("art/az_art_v2/manifest.json", "utf8"));
    expect(manifest.scale_note).toMatch(/128px/);
    expect(PACK.hero_px).toBe(64);
    for (const id of ["hero_idle", "hero_walk_1", "hero_walk_2", "hero_walk_3", "hero_walk_4"]) {
      const meta = manifest.sprites[id];
      const packed = PACK.sprites[id as keyof typeof PACK.sprites];
      expect(meta.h).toBe(128);
      expect(packed.h).toBe(64);
      expect(packed.ay).toBe(64);
      expect(packed.ax).toBeGreaterThanOrEqual(Math.floor(meta.anchor.x * 0.5));
      expect(packed.ax).toBeLessThanOrEqual(Math.ceil(meta.anchor.x * 0.5));
    }
  });

  it("keeps #112 PHONE_HERO_BLITS tanks and chevrons inside the phone clip", () => {
    const { viewW, viewH } = playView(390, 844);
    const cam = new Float32Array(2);
    cameraTarget(HERO_X, HERO_Y, cam, viewW, viewH);
    const camX = cam[0] ?? 0;
    const camY = cam[1] ?? 0;
    for (const b of PHONE_HERO_BLITS) {
      expect(b.x).toBeGreaterThanOrEqual(camX + 24);
      expect(b.x).toBeLessThanOrEqual(camX + viewW - 24);
      expect(b.y).toBeGreaterThanOrEqual(camY + 48);
      expect(b.y).toBeLessThanOrEqual(camY + viewH - 48);
    }
    expect(PHONE_HERO_BLITS.filter((b) => b.id === "pipes_blue_tank").length).toBe(2);
    expect(PHONE_HERO_BLITS.filter((b) => b.id === "conveyor").length).toBe(2);
    expect(yardCratePropsInClear()).toBe(0);
    expect(YARD_CLEAR.x1 - YARD_CLEAR.x0).toBeGreaterThan(200);
  });

  it("stores art-r47 review captures and passes the midband pixel gate", () => {
    const dir = "docs/reviews/art-r47";
    for (const name of [
      "phone_390_play.png",
      "hero_crop.png",
      "props_crop.png",
      "midband_crop.png",
      "compare_390_ref1.png",
      "compare_390_ref2.png",
    ]) {
      expect(readFileSync(`${dir}/${name}`, "utf8").length).toBeGreaterThan(4000);
    }
    const gate = readFileSync(`${dir}/midband_gate.txt`, "utf8").trim();
    expect(gate).toMatch(/^cyan=0 blue=\d+/);
    const blue = Number(gate.match(/blue=(\d+)/)?.[1] ?? 0);
    expect(blue).toBeGreaterThanOrEqual(200);
  });
});
