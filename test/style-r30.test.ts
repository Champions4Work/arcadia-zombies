import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { yardPropHits, YARD_CLEAR } from "../src/render/yard-fx";

describe("r30 dark stone floor blit", () => {
  it("requires tile_stone_seamless blit and rejects brass-pad fill floor for brass district", () => {
    const ground = readFileSync("src/render/ground.ts", "utf8");
    expect(ground.includes('tileSheet(ctx, tile, 0, FLOOR0 * TILE')).toBe(true);
    expect(ground.includes('"tile_stone_seamless"')).toBe(true);
    expect(ground.includes('tileSheet(ctx, "tile_metal_seamless", x, y, TILE, TILE)')).toBe(true);
    expect(ground.includes("if (bound === ZONE_BRASS) return 0")).toBe(true);
    expect(ground.includes("KIND_COBBLE_W")).toBe(true);
    expect(ground.includes('tileSheet(ctx, "tile_metal_seamless", x, y, TILE, TILE)')).toBe(true);
    expect(readFileSync("art/az_art_v2/tile_stone_seamless.png", "utf8").length).toBeGreaterThan(4000);
    expect(readFileSync("src/art/packed/tile_stone_seamless.webp", "utf8").length).toBeGreaterThan(800);
  });

  it("keeps the hero lane free of static crate and barrel props", () => {
    const yard = readFileSync("src/render/yard-fx.ts", "utf8");
    const brassProps = yard.slice(yard.indexOf("const PROPS:"), yard.indexOf("const TANKS"));
    expect(brassProps.includes("crate_stack")).toBe(false);
    expect(brassProps.includes('"barrel"')).toBe(false);
    expect(brassProps.includes('"crate"')).toBe(false);
    expect(yardPropHits(YARD_CLEAR.x0, YARD_CLEAR.y0, YARD_CLEAR.x1, YARD_CLEAR.y1)).toBe(0);
  });

  it("stores r30 phone review captures under docs/reviews/r30", () => {
    expect(readFileSync("docs/reviews/r30/phone_390_play.png", "utf8").length).toBeGreaterThan(8000);
    expect(readFileSync("docs/reviews/r30/before_after_vs_r29.png", "utf8").length).toBeGreaterThan(8000);
  });
});
