import { BIN_HI, BIN_LO } from "../src/render/actors";
import { ARENA_H } from "../src/sim/arena";
import { B_ACID, Z_GAS, Z_KNIGHT, Z_RAT, Z_SPITTER } from "../src/sim/foes";
import { createWorld } from "../src/sim/world";
import { projectileFor } from "../src/render/foes";
import { UPG_FIRE, UPG_SAWS, Z_SHAMBLER } from "../src/sim/types";
import { paintLayers, registerLayer, registerZombie, zombieGlyph, LAYER_BACK, LAYER_FRONT } from "../src/render/plugins";
import { hurtAlpha } from "../src/render/veil";
import { blurbFor, difficultyLabel, formatClock, pauseHit, weaponBadge, PAUSE_X, PAUSE_Y } from "../src/render/hud";
import type { BulletPaint, Glyph } from "../src/render/plugins";
import type { World } from "../src/sim/types";

describe("clocktower hud", () => {
  it("names pressure ranks the way the yard banner does", () => {
    expect(difficultyLabel(0)).toBe("CALM");
    expect(difficultyLabel(2)).toBe("STEAMING");
    expect(difficultyLabel(6)).toBe("CLOCKWORK APOCALYPSE");
    expect(difficultyLabel(99).length).toBeGreaterThan(0);
  });

  it("formats the sim tick as mm:ss", () => {
    expect(formatClock(0)).toBe("00:00");
    expect(formatClock(7 * 60 * 60 + 38 * 60)).toBe("07:38");
    expect(formatClock(-10)).toBe("00:00");
  });

  it("hits the brass pause button and misses the yard", () => {
    expect(pauseHit(PAUSE_X, PAUSE_Y)).toBe(true);
    expect(pauseHit(PAUSE_X + 10, PAUSE_Y)).toBe(true);
    expect(pauseHit(20, 200)).toBe(false);
  });

  it("describes known upgrades and still says something for a new one", () => {
    expect(blurbFor(UPG_FIRE).toLowerCase()).toContain("fire rate");
    expect(blurbFor(99).length).toBeGreaterThan(0);
  });

  it("badges the saw upgrade as sawstorm", () => {
    const w = createWorld(1);
    w.upgrades[UPG_SAWS] = 3;
    expect(weaponBadge(w)).toEqual({ name: "SAWSTORM", pips: 3, kind: UPG_SAWS });
  });
});

describe("actor sort", () => {
  it("covers the full arena height", () => {
    expect(BIN_LO).toBeLessThanOrEqual(0);
    expect(BIN_HI).toBeGreaterThanOrEqual(ARENA_H);
  });
});

describe("actor plugins", () => {
  it("keeps a registered glyph and a stable fallback", () => {
    const custom: Glyph = { w: 3, h: 4, draw() {} };
    registerZombie(21, custom);
    const made = (): Glyph => ({ w: 9, h: 8, draw() {} });
    expect(zombieGlyph(21, made)).toBe(custom);
    expect(zombieGlyph(Z_SHAMBLER, made).w).toBeGreaterThan(10);
    const a = zombieGlyph(22, made);
    expect(zombieGlyph(22, made)).toBe(a);
    expect(a).not.toBe(custom);
    for (const kind of [Z_SPITTER, Z_GAS, Z_KNIGHT, Z_RAT]) {
      const g = zombieGlyph(kind, made);
      expect(g.w).toBeGreaterThan(10);
      expect(g).not.toBe(made());
    }
    const bolt: BulletPaint = () => {};
    expect(projectileFor(B_ACID, bolt)).not.toBe(bolt);
    expect(projectileFor(0, bolt)).toBe(bolt);
  });

  it("paints a layer only in its slot", () => {
    let n = 0;
    registerLayer(LAYER_FRONT, () => { n += 1; });
    const ctx = {} as CanvasRenderingContext2D;
    const w = {} as World;
    paintLayers(ctx, w, LAYER_FRONT);
    expect(n).toBe(1);
    paintLayers(ctx, w, LAYER_BACK);
    expect(n).toBe(1);
  });
});

describe("hurt veil", () => {
  it("keeps a hit as strong as the old 0.4 edge", () => {
    expect(hurtAlpha(45)).toBe(0.4);
    expect(hurtAlpha(90)).toBe(0.4);
    expect(hurtAlpha(18)).toBe(0.2);
    expect(hurtAlpha(0)).toBe(0);
  });
});
