import { BIN_HI, BIN_LO } from "../src/render/actors";
import { ARENA_H } from "../src/sim/arena";
import { B_ACID, Z_GAS, Z_KNIGHT, Z_RAT, Z_SPITTER } from "../src/sim/foes";
import { createWorld } from "../src/sim/world";
import { projectileFor } from "../src/render/foes";
import { UPG_FIRE, UPG_SAWS, Z_SHAMBLER } from "../src/sim/types";
import { paintLayers, registerLayer, registerZombie, zombieGlyph, LAYER_BACK, LAYER_FRONT } from "../src/render/plugins";
import { fieldPlan } from "../src/render/draw";
import { fogCoverBox } from "../src/render/map-events";
import { hurtAlpha } from "../src/render/veil";
import { H, W } from "../src/sim/types";
import { blurbFor, difficultyLabel, drawHud, formatClock, pauseHit, weaponBadge, PAUSE_X, PAUSE_Y } from "../src/render/hud";
import { drawWeaponRack, WPN_TAGS } from "../src/render/weapons";
import { bindHud, layoutHud } from "../src/shell/hud-layout";
import { computeFit } from "../src/shell/fit";
import { playView } from "../src/shell/play-view";
import { readViewport, ZERO_INSETS } from "../src/shell/viewport";
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

function stubCtx(texts: string[]): CanvasRenderingContext2D {
  const grad = { addColorStop() {} };
  const noop = () => {};
  const ctx: Record<string, unknown> = {
    canvas: { width: 390 },
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 1,
    font: "",
    textAlign: "left",
    textBaseline: "alphabetic",
    globalAlpha: 1,
    lineJoin: "round",
    lineCap: "round",
    fillText(text: string) { texts.push(text); },
    strokeText(text: string) { texts.push(text); },
    measureText(text: string) { return { width: String(text).length * 6 }; },
    createLinearGradient() { return grad; },
    createRadialGradient() { return grad; },
  };
  return new Proxy(ctx, {
    get(target, key) {
      if (key in target) return target[key as string];
      return noop;
    },
    set(target, key, value) {
      target[key as string] = value;
      return true;
    },
  }) as unknown as CanvasRenderingContext2D;
}

describe("weapon rack", () => {
  it("paints icon slots and never writes the old text tags", () => {
    const texts: string[] = [];
    const vp = readViewport({ innerWidth: 390, innerHeight: 844, devicePixelRatio: 3 }, ZERO_INSETS);
    const pv = playView(vp.cssW, vp.cssH);
    const fit = computeFit(vp.cssW, vp.cssH, vp.dpr, pv.viewW, pv.viewH, ZERO_INSETS);
    bindHud(layoutHud(vp, fit));
    drawWeaponRack(stubCtx(texts), createWorld(1));
    expect(texts.some((t) => WPN_TAGS.includes(t))).toBe(false);
    expect(texts.join("")).not.toMatch(/RIVET|SHOT|FLAME|HARP|MORT/);
    expect(texts).toContain("34/210");
    expect(texts).toContain("6/36");
    expect(texts.filter((t) => /^\d+$/.test(t)).length).toBe(3);
  });

  it("keeps the live HUD free of the old GEARHEART and DIFFICULTY plates", () => {
    const texts: string[] = [];
    const vp = readViewport({ innerWidth: 390, innerHeight: 844, devicePixelRatio: 3 }, ZERO_INSETS);
    const pv = playView(vp.cssW, vp.cssH);
    const fit = computeFit(vp.cssW, vp.cssH, vp.dpr, pv.viewW, pv.viewH, ZERO_INSETS);
    bindHud(layoutHud(vp, fit));
    drawHud(stubCtx(texts), createWorld(1));
    expect(texts).not.toContain("GEARHEART");
    expect(texts).not.toContain("DIFFICULTY");
    expect(texts).not.toContain("YARD");
    expect(texts).toContain("120/120");
    expect(texts).toContain("Objectives");
    expect(texts).toContain("Chapter 1");
    expect(texts.some((t) => /^Wave \d+\/8$/.test(t))).toBe(true);
    expect(texts).toContain("ACTIVATE STEAM GATE");
    expect(texts).toContain("HOLD THE AREA");
    expect(texts).toContain("SURVIVE ALL WAVES");
  });

  it("binds wave kills and hold clock to live chapter state", () => {
    const texts: string[] = [];
    const vp = readViewport({ innerWidth: 390, innerHeight: 844, devicePixelRatio: 3 }, ZERO_INSETS);
    const pv = playView(vp.cssW, vp.cssH);
    const fit = computeFit(vp.cssW, vp.cssH, vp.dpr, pv.viewW, pv.viewH, ZERO_INSETS);
    bindHud(layoutHud(vp, fit));
    const w = createWorld(9);
    w.wave = 4;
    w.kills = 72;
    w.gate = 1;
    w.holdLeft = 180 * 60;
    w.rank = 0;
    drawHud(stubCtx(texts), w);
    expect(texts).toContain("Wave 4/8");
    expect(texts).toContain("72");
    expect(texts).toContain("HOLD THE AREA (03:00)");
  });

  it("leaves the steam gate open when only rank has risen", () => {
    const texts: string[] = [];
    const vp = readViewport({ innerWidth: 390, innerHeight: 844, devicePixelRatio: 3 }, ZERO_INSETS);
    const pv = playView(vp.cssW, vp.cssH);
    const fit = computeFit(vp.cssW, vp.cssH, vp.dpr, pv.viewW, pv.viewH, ZERO_INSETS);
    bindHud(layoutHud(vp, fit));
    const w = createWorld(10);
    w.rank = 4;
    w.wave = 1;
    w.gate = 0;
    w.holdLeft = 0;
    drawHud(stubCtx(texts), w);
    expect(texts).toContain("Wave 1/8");
    expect(texts).toContain("HOLD THE AREA");
    expect(texts.some((t) => t.includes("HOLD THE AREA ("))).toBe(false);
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

describe("horde yard", () => {
  it("keeps the baked yard and paints packed actors in a horde", () => {
    expect(fieldPlan(true)).toEqual({ yard: true, sprites: false });
    expect(fieldPlan(false)).toEqual({ yard: true, sprites: false });
  });
});

describe("fog surge plate", () => {
  it("covers the camera view when the player is on an arena edge", () => {
    const w = createWorld(3);
    w.px = 40;
    w.py = 50;
    w.arena.camX = 0;
    w.arena.camY = 0;
    const box = fogCoverBox(w);
    expect(box.x).toBeLessThanOrEqual(w.arena.camX);
    expect(box.y).toBeLessThanOrEqual(w.arena.camY);
    expect(box.x + box.w).toBeGreaterThanOrEqual(w.arena.camX + W);
    expect(box.y + box.h).toBeGreaterThanOrEqual(w.arena.camY + H);
    w.px = 920;
    w.py = 600;
    w.arena.camX = W;
    w.arena.camY = H;
    const far = fogCoverBox(w);
    expect(far.x).toBeLessThanOrEqual(w.arena.camX);
    expect(far.y).toBeLessThanOrEqual(w.arena.camY);
    expect(far.x + far.w).toBeGreaterThanOrEqual(w.arena.camX + W);
    expect(far.y + far.h).toBeGreaterThanOrEqual(w.arena.camY + H);
  });
});
