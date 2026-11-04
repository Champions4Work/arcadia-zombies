import { readFileSync } from "node:fs";
import { yardPropHits, YARD_CLEAR, PHONE_CAM, PERIMETER_FIGHT_Y0, PERIMETER_FIGHT_Y1 } from "../src/render/yard-fx";

const DENSIFY = new Set(["crate", "barrel", "crate_stack"]);

function brassProps(): { id: string; x: number; y: number }[] {
  const yard = readFileSync("src/render/yard-fx.ts", "utf8");
  const block = yard.slice(yard.indexOf("const PROPS:"), yard.indexOf("const TANKS"));
  const rows = block.match(/\{ id: "[^"]+", x: \d+, y: \d+ \}/g) ?? [];
  return rows.map((row) => {
    const id = row.match(/id: "([^"]+)"/)?.[1] ?? "";
    const x = Number(row.match(/x: (\d+)/)?.[1]);
    const y = Number(row.match(/y: (\d+)/)?.[1]);
    return { id, x, y };
  });
}

describe("r30 perimeter scenery", () => {
  it("keeps az_art_v2 steampunk props on the perimeter band only", () => {
    const yard = readFileSync("src/render/yard-fx.ts", "utf8");
    expect(yard.includes("building_wall_door")).toBe(true);
    expect(yard.includes("window_lit")).toBe(true);
    expect(yard.includes("pipes_blue_tank")).toBe(true);
    expect(yard.includes("valve_steam")).toBe(true);
    expect(yard.includes("paintCrossBelt")).toBe(true);
    expect(yard.includes("lamp")).toBe(true);
    expect(yardPropHits(YARD_CLEAR.x0, YARD_CLEAR.y0, YARD_CLEAR.x1, YARD_CLEAR.y1)).toBe(0);
    expect(yardPropHits(PHONE_CAM.x0, PHONE_CAM.y0, PHONE_CAM.x1, PHONE_CAM.y1)).toBeGreaterThanOrEqual(16);
  });

  it("bans crate barrels and stacks in the vertical fight band on brass", () => {
    for (const p of brassProps()) {
      if (!DENSIFY.has(p.id)) continue;
      const inBand = p.y >= PERIMETER_FIGHT_Y0 && p.y <= PERIMETER_FIGHT_Y1;
      expect(inBand).toBe(false);
    }
    const block = readFileSync("src/render/yard-fx.ts", "utf8").slice(
      readFileSync("src/render/yard-fx.ts", "utf8").indexOf("const PROPS:"),
      readFileSync("src/render/yard-fx.ts", "utf8").indexOf("const TANKS"),
    );
    expect(block.includes('"crate"')).toBe(false);
    expect(block.includes('"barrel"')).toBe(false);
    expect(block.includes('"crate_stack"')).toBe(false);
  });

  it("documents r30 perimeter sprites in the art bible", () => {
    const bible = readFileSync("docs/STYLE.md", "utf8");
    expect(bible.includes("r30 perimeter")).toBe(true);
    expect(bible.includes("building_wall_door")).toBe(true);
    expect(bible.includes("valve_steam")).toBe(true);
    expect(readFileSync("docs/reviews/r30-perimeter/phone_390_play.png", "utf8").length).toBeGreaterThan(1000);
  });
});
