import { readFileSync } from "node:fs";
import { foeSpriteId, heroSpriteId, packHas, packIds, steamFrame } from "../src/art/sheet";
import { PACK } from "../src/art/packed/pack";
import { paintSignatureHero } from "../src/art/look";

describe("az_art_v2 pack", () => {
  it("keeps every approved sprite in the packed atlases", () => {
    const manifest = JSON.parse(readFileSync("art/az_art_v2/manifest.json", "utf8"));
    const names = Object.keys(manifest.sprites);
    expect(names.length).toBe(44);
    for (const name of names) expect(packHas(name)).toBe(true);
    expect(packIds().length).toBe(44);
    expect(PACK.hero_px).toBe(48);
  });

  it("walks the hero and cycles steam without leaving the pack", () => {
    expect(heroSpriteId(false, 0)).toBe("hero_idle");
    expect(heroSpriteId(true, 0)).toBe("hero_walk_1");
    expect(heroSpriteId(true, 8)).toBe("hero_walk_2");
    expect(steamFrame(0)).toBe("steam_1");
    expect(steamFrame(8)).toBe("steam_2");
    expect(foeSpriteId(0, false)).toBe("zombie_worker");
    expect(foeSpriteId(1, false)).toBe("zombie_crawler");
    expect(foeSpriteId(3, false)).toBe("zombie_tubes");
    expect(foeSpriteId(2, false)).toBe("brute");
    expect(foeSpriteId(0, true)).toBe("zombie_bloater");
  });

  it("quotes pack keys so production minify cannot rename sprite ids", () => {
    const src = readFileSync("src/art/packed/pack.ts", "utf8");
    expect(src.includes('"hero_idle"')).toBe(true);
    expect(src.includes('"heart_ring"')).toBe(true);
    expect(src.includes('"tile_stone_seamless"')).toBe(true);
    expect(src.includes("hero_idle:")).toBe(false);
  });

  it("paints the signature hero without a kit argument", () => {
    expect(paintSignatureHero.length).toBe(8);
  });

  it("reads pack sprite fields through quoted keys so minify cannot drop them", () => {
    const src = readFileSync("src/art/sheet.ts", "utf8");
    expect(src.includes('spr["x"]')).toBe(true);
    expect(src.includes('spr["y"]')).toBe(true);
    expect(src.includes('spr["w"]')).toBe(true);
    expect(src.includes('spr["h"]')).toBe(true);
    expect(src.includes('spr["ax"]')).toBe(true);
    expect(src.includes('spr["ay"]')).toBe(true);
    expect(src.includes('spr["sheet"]')).toBe(true);
    expect(src.includes("spr.x")).toBe(false);
    expect(src.includes("spr.sheet")).toBe(false);
  });
});
