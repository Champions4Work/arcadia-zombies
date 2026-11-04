import { readFileSync } from "node:fs";
import { createWorld } from "../src/sim/world";
import { BRUTE_TO_HERO, FOE_TO_HERO, HERO_PACK_H, foeWorldH, foeWorldScale } from "../src/art/look";
import { stampBlood, stampCasing, stainCount, resetStains, STAIN_CAP } from "../src/render/stains";
import { reviewHorde, REVIEW_HORDE, REVIEW_RING, wantsReviewShot } from "../src/shell/review-shot";
import { yardPropHits, YARD_CLEAR } from "../src/render/yard-fx";
import { SEE_AXIS } from "../src/shell/play-view";
import { Z_BRUTE } from "../src/sim/types";
import { Z_ELITE } from "../src/sim/foes";

describe("visual review gates", () => {
  it("packs the hero at true-scale 64px and reads pack fields through quoted keys", () => {
    const pack = JSON.parse(readFileSync("src/art/packed/pack.json", "utf8"));
    expect(pack.hero_px).toBe(64);
    expect(HERO_PACK_H).toBe(64);
    const sheet = readFileSync("src/art/sheet.ts", "utf8");
    expect(sheet.includes('spr["x"]')).toBe(true);
    expect(sheet.includes("imageSmoothingEnabled = false")).toBe(true);
    expect(SEE_AXIS).toBe(360);
  });

  it("scales normal foes to 0.45 of hero height and brutes to 1.3x", () => {
    expect(FOE_TO_HERO).toBe(0.45);
    expect(BRUTE_TO_HERO).toBe(1.3);
    expect(foeWorldH(0)).toBeCloseTo(64 * 0.45);
    expect(foeWorldH(Z_BRUTE)).toBeCloseTo(64 * 1.3);
    expect(foeWorldScale(0, 62)).toBeCloseTo((64 * 0.45) / 62);
    expect(foeWorldScale(Z_BRUTE, 98)).toBeCloseTo((64 * 1.3) / 98);
    const look = readFileSync("src/art/look.ts", "utf8");
    expect(look.includes("rgba(200,208,220")).toBe(false);
    const actors = readFileSync("src/render/actors.ts", "utf8");
    expect(actors.includes("hp >= 3")).toBe(false);
    expect(actors.includes("paintElite")).toBe(false);
    expect(actors.includes("strokeRect")).toBe(false);
    expect(actors.includes("elite || kind === Z_BRUTE || kind === Z_KNIGHT")).toBe(true);
  });

  it("keeps props on the walls and the spawn floor open", () => {
    expect(yardPropHits(200, 0, 760, 640)).toBeGreaterThanOrEqual(20);
    expect(yardPropHits(YARD_CLEAR.x0, YARD_CLEAR.y0, YARD_CLEAR.x1, YARD_CLEAR.y1)).toBe(0);
    expect(YARD_CLEAR.x1 - YARD_CLEAR.x0).toBeGreaterThanOrEqual(220);
    expect(YARD_CLEAR.y1 - YARD_CLEAR.y0).toBeGreaterThanOrEqual(240);
  });

  it("keeps dusk dark with local lamp pools and no global orange wash", () => {
    const draw = readFileSync("src/render/draw.ts", "utf8");
    expect(draw.includes("rgba(6,6,10,0.9)")).toBe(true);
    expect(draw.includes("rgba(220,132,52,0.34)")).toBe(false);
    expect(draw.includes("rgba(255,186,88,0.42)")).toBe(false);
    const yard = readFileSync("src/render/yard-fx.ts", "utf8");
    expect(yard.includes("ellipse(x, y + 4, 36, 20")).toBe(true);
    expect(yard.includes("pipes_blue_tank")).toBe(true);
  });

  it("blits the objectives frame without filling a solid plate", () => {
    const hud = readFileSync("src/render/hud.ts", "utf8");
    const start = hud.indexOf("function checkLine");
    const obj = hud.slice(start, hud.indexOf("export function drawHud"));
    expect(obj.includes('blitSheetFit(ctx, "objectives_panel"')).toBe(true);
    expect(obj.includes("plate(")).toBe(false);
    expect(obj.includes("fillRect")).toBe(false);
    expect(obj.includes("ACTIVATE STEAM GATE")).toBe(true);
    expect(obj.includes("HOLD THE AREA")).toBe(true);
    expect(obj.includes("SURVIVE ALL WAVES")).toBe(true);
    expect(obj.includes("strokeRect")).toBe(true);
    expect(obj.includes("#f6f1e6")).toBe(true);
  });

  it("keeps spawn telegraphs and kill puffs on pack sprites, and aligns vertical belts", () => {
    const yard = readFileSync("src/render/yard-fx.ts", "utf8");
    const door = yard.slice(yard.indexOf("export function paintDoorSpawn"));
    expect(door.includes("window_lit")).toBe(true);
    expect(door.includes("building_wall_door")).toBe(false);
    expect(yard.includes("ctx.rotate(Math.PI / 2)")).toBe(true);
    const puff = readFileSync("src/render/cast-fx.ts", "utf8");
    expect(puff.includes("paintZombie")).toBe(true);
    expect(puff.includes("zombieGlyph")).toBe(false);
  });

  it("stamps blood and casings on hit or shot without growing past the cap", () => {
    resetStains();
    expect(stainCount()).toBe(0);
    stampBlood(480, 320, 3);
    stampCasing(470, 324, 9);
    expect(stainCount()).toBeGreaterThanOrEqual(2);
    for (let i = 0; i < 200; i++) stampBlood(i, i, i);
    expect(stainCount()).toBeLessThanOrEqual(STAIN_CAP);
    resetStains();
    expect(stainCount()).toBe(0);
  });

  it("arms a mid-fight review horde without touching spawn tables", () => {
    const boot = readFileSync("src/main.ts", "utf8");
    expect(boot.includes("wantsReviewShot")).toBe(true);
    expect(boot.includes("PHASE_PAUSE")).toBe(true);
    expect(wantsReviewShot("?shot=1", "")).toBe(true);
    expect(wantsReviewShot("", "#review")).toBe(true);
    expect(wantsReviewShot("", "")).toBe(false);
    resetStains();
    const w = createWorld(7);
    expect(reviewHorde(w)).toBe(REVIEW_HORDE);
    expect(REVIEW_HORDE).toBeGreaterThanOrEqual(30);
    expect(REVIEW_RING).toBeGreaterThanOrEqual(100);
    let n = 0;
    let marked = 0;
    let near = 0;
    for (let i = 0; i < w.zombies.alive.length; i++) {
      if (!w.zombies.alive[i]) continue;
      n++;
      const kind = w.zombies.kind[i] ?? 0;
      if (kind === Z_BRUTE || (kind & Z_ELITE) !== 0) marked++;
      const dx = (w.zombies.x[i] ?? 0) - w.px;
      const dy = (w.zombies.y[i] ?? 0) - w.py;
      if (dx * dx + dy * dy < 90 * 90) near++;
    }
    expect(n).toBe(REVIEW_HORDE);
    expect(marked).toBeLessThanOrEqual(8);
    expect(near).toBe(0);
    expect(stainCount()).toBeGreaterThanOrEqual(20);
    expect(w.px).toBe(480);
    expect(w.py).toBe(320);
  });
});
