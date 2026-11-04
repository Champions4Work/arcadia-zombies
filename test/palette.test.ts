import { readFileSync } from "node:fs";
import { catalogHits, FRAMES } from "../src/art/catalog";
import { atlasSize, atlasSprite, buildAtlas, heroFrameId } from "../src/art/atlas";
import { PX, PX_KEYS } from "../src/art/palette";
import { BRASS, BRASS_HI, DANGER, HEALTH, SOOT, STEAM, XP } from "../src/shell/theme";

describe("locked palette", () => {
  it("keeps sprite sources on the style keys", () => {
    expect(PX_KEYS.length).toBeGreaterThanOrEqual(24);
    expect(PX_KEYS.length).toBeLessThanOrEqual(33);
    expect(catalogHits()).toEqual([]);
    expect(FRAMES.length).toBeGreaterThan(80);
  });

  it("packs one atlas and serves hero frames from it", () => {
    buildAtlas();
    const size = atlasSize();
    expect(size.w).toBeGreaterThan(16);
    expect(size.h).toBeGreaterThan(16);
    expect(size.w * size.h).toBeLessThanOrEqual(512 * 512);
    const spr = atlasSprite(heroFrameId(0, 1, 0));
    expect(spr.w).toBe(16);
    expect(spr.h).toBe(24);
    expect(spr.pix.some((p) => p !== 0)).toBe(true);
  });

  it("keeps palette keys quoted so minify cannot rename them", () => {
    const src = readFileSync("src/art/palette.ts", "utf8");
    expect(src.includes('"k":')).toBe(true);
    expect(src.includes('"h":')).toBe(true);
    expect(Object.keys(PX).includes("k")).toBe(true);
  });

  it("mirrors theme tokens onto the same hexes", () => {
    expect(SOOT).toBe(PX.s);
    expect(STEAM).toBe(PX.m);
    expect(BRASS).toBe(PX.b);
    expect(BRASS_HI).toBe(PX.B);
    expect(DANGER).toBe(PX.R);
    expect(XP).toBe(PX.y);
    expect(HEALTH).toBe(PX.h);
    expect(HEALTH).toBe("#3ec8c0");
  });
});
