import { readFileSync } from "node:fs";
import { createWorld } from "../src/sim/world";
import { drawHud } from "../src/render/hud";
import { bindHud, layoutHud } from "../src/shell/hud-layout";
import { computeFit } from "../src/shell/fit";
import { playView } from "../src/shell/play-view";
import { readViewport, ZERO_INSETS } from "../src/shell/viewport";
import {
  ZONE_BOILER, ZONE_BRASS, ZONE_N, ZONE_TRAM, ZONE_WAVE, zoneAt, zoneChapterAt, zoneTitle,
  zoneTitleAt,
} from "../src/sim/zones";
import { bindGround, groundKind, KIND_BRASS, KIND_BRASS_W, KIND_RAIL_H, KIND_RAIL_V, KIND_VENT } from "../src/render/ground";
import { bindYard, yardPropHits, YARD_CLEAR, PHONE_CAM } from "../src/render/yard-fx";
import { reviewHorde, reviewZoneFromSearch } from "../src/shell/review-shot";

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

function bindPhone(): void {
  const vp = readViewport({ innerWidth: 390, innerHeight: 844, devicePixelRatio: 3 }, ZERO_INSETS);
  const pv = playView(vp.cssW, vp.cssH);
  const fit = computeFit(vp.cssW, vp.cssH, vp.dpr, pv.viewW, pv.viewH, ZERO_INSETS);
  bindHud(layoutHud(vp, fit));
}

function railScore(): number {
  let n = 0;
  for (let r = 0; r < 40; r++) {
    for (let c = 0; c < 60; c++) {
      const k = groundKind(c, r);
      if (k === KIND_RAIL_H || k === KIND_RAIL_V) n++;
    }
  }
  return n;
}

function brassScore(): number {
  let n = 0;
  for (let r = 0; r < 40; r++) {
    for (let c = 0; c < 60; c++) {
      const k = groundKind(c, r);
      if (k === KIND_BRASS || k === KIND_BRASS_W) n++;
    }
  }
  return n;
}

function ventScore(): number {
  let n = 0;
  for (let r = 0; r < 40; r++) {
    for (let c = 0; c < 60; c++) if (groundKind(c, r) === KIND_VENT) n++;
  }
  return n;
}

describe("wave districts", () => {
  afterEach(() => {
    bindGround(ZONE_BRASS);
    bindYard(ZONE_BRASS);
  });

  it("maps waves onto Brass, then Boiler Works, then Tram Depot", () => {
    expect(ZONE_N).toBe(3);
    expect(ZONE_WAVE[ZONE_BRASS]).toBe(1);
    expect(ZONE_WAVE[ZONE_BOILER]).toBe(5);
    expect(ZONE_WAVE[ZONE_TRAM]).toBe(7);
    expect(zoneAt(0)).toBe(ZONE_BRASS);
    expect(zoneAt(4)).toBe(ZONE_BRASS);
    expect(zoneAt(5)).toBe(ZONE_BOILER);
    expect(zoneAt(6)).toBe(ZONE_BOILER);
    expect(zoneAt(7)).toBe(ZONE_TRAM);
    expect(zoneAt(8)).toBe(ZONE_TRAM);
    expect(zoneTitle(ZONE_BRASS)).toBe("The Brass District");
    expect(zoneTitle(ZONE_BOILER)).toBe("Boiler Works");
    expect(zoneTitle(ZONE_TRAM)).toBe("Tram Depot");
    expect(new Set([0, 1, 2].map(zoneTitle)).size).toBe(ZONE_N);
    expect(zoneTitleAt(4)).toBe("The Brass District");
    expect(zoneTitleAt(5)).toBe("Boiler Works");
    expect(zoneTitleAt(7)).toBe("Tram Depot");
    expect(zoneChapterAt(7)).toBe("Chapter 1");
  });

  it("keeps the default review shot on Brass District", () => {
    expect(reviewZoneFromSearch("?shot=1")).toBe(ZONE_BRASS);
    expect(reviewZoneFromSearch("?shot=1&zone=boiler")).toBe(ZONE_BOILER);
    expect(reviewZoneFromSearch("?shot=1&zone=tram")).toBe(ZONE_TRAM);
    const w = createWorld(7);
    expect(reviewHorde(w)).toBeGreaterThan(0);
    expect(w.wave).toBe(4);
    expect(zoneAt(w.wave)).toBe(ZONE_BRASS);
  });

  it("stamps the live district on the HUD banner", () => {
    bindPhone();
    const brass: string[] = [];
    const boiler: string[] = [];
    const tram: string[] = [];
    const a = createWorld(1);
    a.wave = 2;
    drawHud(stubCtx(brass), a);
    expect(brass).toContain("The Brass District");
    expect(brass).toContain("Chapter 1");
    const b = createWorld(1);
    b.wave = 5;
    drawHud(stubCtx(boiler), b);
    expect(boiler).toContain("Boiler Works");
    expect(boiler).not.toContain("The Brass District");
    const c = createWorld(1);
    c.wave = 7;
    drawHud(stubCtx(tram), c);
    expect(tram).toContain("Tram Depot");
  });

  it("gives each district a different floor mix", () => {
    bindGround(ZONE_BRASS);
    const brassRails = railScore();
    const brassMetal = brassScore();
    const brassVents = ventScore();
    bindGround(ZONE_BOILER);
    const boilerRails = railScore();
    const boilerMetal = brassScore();
    const boilerVents = ventScore();
    bindGround(ZONE_TRAM);
    const tramRails = railScore();
    const tramMetal = brassScore();
    expect(boilerMetal).toBeGreaterThan(brassMetal);
    expect(boilerVents).toBeGreaterThan(brassVents);
    expect(tramRails).toBeGreaterThan(brassRails);
    expect(tramRails).toBeGreaterThan(boilerRails);
    expect(tramMetal).not.toBe(boilerMetal);
  });

  it("keeps a rerunnable 390 shot lever for each district", () => {
    const shot = readFileSync("scripts/zone-shots.mjs", "utf8");
    expect(shot.includes("phone_390_brass.png")).toBe(true);
    expect(shot.includes("phone_390_boiler.png")).toBe(true);
    expect(shot.includes("phone_390_tram.png")).toBe(true);
    expect(shot.includes("width: 390")).toBe(true);
    expect(shot.includes("height: 844")).toBe(true);
  });

  it("keeps the spawn floor open and the walls dressed in every district", () => {
    for (const z of [ZONE_BRASS, ZONE_BOILER, ZONE_TRAM]) {
      bindYard(z);
      expect(yardPropHits(YARD_CLEAR.x0, YARD_CLEAR.y0, YARD_CLEAR.x1, YARD_CLEAR.y1)).toBe(0);
      expect(yardPropHits(PHONE_CAM.x0, PHONE_CAM.y0, PHONE_CAM.x1, PHONE_CAM.y1)).toBeGreaterThanOrEqual(28);
      expect(yardPropHits(200, 0, 760, 640)).toBeGreaterThanOrEqual(20);
    }
  });
});
