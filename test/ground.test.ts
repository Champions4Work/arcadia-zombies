import { ARENA_H, ARENA_W } from "../src/sim/arena";
import { H, W } from "../src/sim/types";
import { copyGroundWindow, yardColor } from "../src/render/ground-atlas";
import { ZONE_BRASS } from "../src/sim/zones";
import { bindYard } from "../src/render/yard-fx";
import {
  FEAT_GEAR,
  FEAT_LAMP,
  FEAT_PIPE,
  FEAT_RUBBLE,
  FEAT_STAIN,
  KIND_BRASS,
  KIND_BRASS_W,
  KIND_COBBLE,
  KIND_COBBLE_D,
  KIND_COBBLE_W,
  KIND_GRATE,
  KIND_RAIL_H,
  KIND_RAIL_V,
  KIND_RUBBLE,
  KIND_SKY,
  KIND_VENT,
  TILE,
  VENT_FX_CAP,
  VENT_PUFFS,
  groundCols,
  groundFeatureAt,
  groundFeatureCount,
  groundKind,
  groundRows,
  bindGround,
  paintGround,
  ventCount,
  ventFxCount,
  ventX,
  ventY,
} from "../src/render/ground";

function tally(): Uint16Array {
  const n = new Uint16Array(12);
  const cols = groundCols();
  const rows = groundRows();
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) n[groundKind(c, r)] = (n[groundKind(c, r)] ?? 0) + 1;
  }
  return n;
}

function featTally(): Uint16Array {
  const n = new Uint16Array(8);
  const total = groundFeatureCount();
  for (let i = 0; i < total; i++) {
    const f = groundFeatureAt(i);
    n[f.kind] = (n[f.kind] ?? 0) + 1;
  }
  return n;
}

describe("yard floor map", () => {
  beforeEach(() => {
    bindGround(ZONE_BRASS);
    bindYard(ZONE_BRASS);
  });

  it("covers the arena on a 16px grid", () => {
    expect(TILE).toBe(16);
    expect(groundCols() * TILE).toBe(ARENA_W);
    expect(groundRows() * TILE).toBe(ARENA_H);
  });

  it("keeps the skyline empty and the yard filled", () => {
    expect(groundKind(4, 2)).toBe(KIND_SKY);
    expect(groundKind(4, 8)).not.toBe(KIND_SKY);
    expect(groundKind(20, 20)).not.toBe(KIND_SKY);
  });

  it("returns the same cell and feature every time", () => {
    const a = groundKind(11, 14);
    const b = groundKind(11, 14);
    expect(a).toBe(b);
    expect(groundFeatureCount()).toBe(groundFeatureCount());
    const f0 = groundFeatureAt(0);
    const f1 = groundFeatureAt(0);
    expect(f1).toEqual(f0);
  });

  it("mixes cobble, brass, rails, vents, and rubble", () => {
    const n = tally();
    expect((n[KIND_COBBLE] ?? 0) + (n[KIND_COBBLE_D] ?? 0) + (n[KIND_COBBLE_W] ?? 0)).toBeGreaterThan(400);
    expect((n[KIND_BRASS] ?? 0) + (n[KIND_BRASS_W] ?? 0)).toBeGreaterThan(20);
    expect(n[KIND_RAIL_H] ?? 0).toBeGreaterThan(10);
    expect(n[KIND_RAIL_V] ?? 0).toBeGreaterThan(10);
    expect((n[KIND_VENT] ?? 0) + (n[KIND_GRATE] ?? 0)).toBeGreaterThan(4);
    expect(n[KIND_RUBBLE] ?? 0).toBeGreaterThan(8);
  });

  it("lays rails as unbroken runs", () => {
    const cols = groundCols();
    const rows = groundRows();
    let hRow = -1;
    let vCol = -1;
    for (let r = 0; r < rows; r++) {
      let run = 0;
      for (let c = 0; c < cols; c++) if (groundKind(c, r) === KIND_RAIL_H) run++;
      if (run > 20) hRow = r;
    }
    for (let c = 0; c < cols; c++) {
      let run = 0;
      for (let r = 0; r < rows; r++) if (groundKind(c, r) === KIND_RAIL_V) run++;
      if (run > 12) vCol = c;
    }
    expect(hRow).toBeGreaterThan(6);
    expect(vCol).toBeGreaterThan(6);
  });

  it("plants lamps, pipes, gears, stains, and rubble piles", () => {
    const n = featTally();
    expect(n[FEAT_LAMP] ?? 0).toBeGreaterThanOrEqual(3);
    expect(n[FEAT_PIPE] ?? 0).toBeGreaterThanOrEqual(1);
    expect(n[FEAT_GEAR] ?? 0).toBeGreaterThanOrEqual(4);
    expect(n[FEAT_STAIN] ?? 0).toBeGreaterThanOrEqual(8);
    expect(n[FEAT_RUBBLE] ?? 0).toBeGreaterThanOrEqual(8);
  });

  it("exposes vent mouths for live steam", () => {
    expect(ventCount()).toBeGreaterThanOrEqual(4);
    for (let i = 0; i < ventCount(); i++) {
      expect(ventX(i)).toBeGreaterThan(0);
      expect(ventY(i)).toBeGreaterThan(100);
      expect(ventX(i)).toBeLessThan(ARENA_W);
      expect(ventY(i)).toBeLessThan(ARENA_H);
    }
  });

  it("caps live vent puffs in the camera window", () => {
    expect(ventFxCount(0, 0)).toBeLessThanOrEqual(VENT_FX_CAP * VENT_PUFFS);
    expect(VENT_PUFFS).toBe(2);
    expect(VENT_FX_CAP).toBe(4);
  });
});

describe("yard floor paint", () => {
  it("bakes warm cobble, brass, and lamp pools instead of the old cool wash", () => {
    const fills: string[] = [];
    const radials: number[] = [];
    const brush = { fillStyle: "" };
    const ctx = {
      get fillStyle() { return brush.fillStyle; },
      set fillStyle(v: string | CanvasGradient | CanvasPattern) { brush.fillStyle = String(v); },
      strokeStyle: "",
      lineWidth: 1,
      globalAlpha: 1,
      lineCap: "butt",
      lineJoin: "miter",
      fillRect() {
        fills.push(brush.fillStyle);
      },
      beginPath() {},
      moveTo() {},
      lineTo() {},
      closePath() {},
      arc() {},
      ellipse() {},
      fill() {
        fills.push(brush.fillStyle);
      },
      stroke() {},
      strokeRect() {},
      save() {},
      restore() {},
      translate() {},
      rotate() {},
      createLinearGradient() {
        return { addColorStop() {} };
      },
      createRadialGradient() {
        radials.push(1);
        return { addColorStop() {} };
      },
      createPattern() {
        return null;
      },
    } as unknown as CanvasRenderingContext2D;
    paintGround(ctx);
    const blob = fills.join(" ");
    expect(blob.includes("#5c6e7e")).toBe(false);
    expect(blob.includes("#7f93a4")).toBe(false);
    expect(/#181412|#24303c|rgba\(16,24,36/.test(blob)).toBe(true);
    expect(/#2a2a30|rgba\(24,24,32/.test(blob)).toBe(false);
    expect(/#c49038|#f0b03a|#fff1c2/.test(blob)).toBe(false);
  });
});

describe("yard atlas window", () => {
  it("copies the camera window from the baked atlas", () => {
    const a = new Uint32Array(W * H);
    const b = new Uint32Array(W * H);
    copyGroundWindow(a, 40, 80);
    copyGroundWindow(b, 40, 80);
    expect(Array.from(a)).toEqual(Array.from(b));
    expect(a[0]).toBe(yardColor(40, 80));
    expect(a[W * 10 + 20]).toBe(yardColor(60, 90));
    copyGroundWindow(b, 200, 160);
    expect(b[0]).toBe(yardColor(200, 160));
    expect(b[0]).not.toBe(a[0]);
  });
});
