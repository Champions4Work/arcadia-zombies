import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  BRASS, BRASS_HI, contrastRatio, DANGER, FONT_BODY, FONT_DISPLAY, forbiddenUiHits,
  HEALTH, INK, parseRootVars, SOOT, STEAM, THEME_VARS, TYPE_MIN, XP,
} from "../src/shell/theme";
import { FONT } from "../src/render/paint";

const root = process.cwd();

function load(rel: string): string {
  return readFileSync(resolve(root, rel), "utf8");
}

describe("theme tokens", () => {
  it("keeps steam, brass, and accents readable on soot", () => {
    expect(contrastRatio(STEAM, SOOT)).toBeGreaterThanOrEqual(10);
    expect(contrastRatio(BRASS_HI, SOOT)).toBeGreaterThanOrEqual(7);
    expect(contrastRatio(BRASS, SOOT)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(INK, BRASS_HI)).toBeGreaterThanOrEqual(7);
    expect(contrastRatio(DANGER, SOOT)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(XP, SOOT)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(HEALTH, SOOT)).toBeGreaterThanOrEqual(4.5);
  });

  it("mirrors CSS variables from the same token table", () => {
    const vars = parseRootVars(load("index.html"));
    for (const [key, value] of Object.entries(THEME_VARS)) {
      expect(vars[key]).toBe(value);
    }
    expect(FONT).toBe(FONT_DISPLAY);
    expect(FONT_BODY.length).toBeGreaterThan(10);
    expect(TYPE_MIN.canvasLabel).toBeGreaterThanOrEqual(11);
    expect(TYPE_MIN.body).toBeGreaterThanOrEqual(15);
  });

  it("bans the old purple Inter stack from UI chrome", () => {
    const files = [
      "index.html",
      "src/render/hud.ts",
      "src/render/cards.ts",
      "src/render/chestFx.ts",
      "src/render/xp-gain.ts",
      "src/render/reroll.ts",
      "src/render/weapons.ts",
      "src/render/icons.ts",
    ];
    for (const file of files) {
      expect(forbiddenUiHits(load(file)), file).toEqual([]);
    }
  });
});
