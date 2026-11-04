import { KIND_BRASS, KIND_BRASS_W, KIND_RUBBLE, TILE, groundCols, groundKind, groundRows } from "../src/render/ground";
import { KIND_N } from "../src/sim/foes";
import {
  SKY_N,
  YARD_W,
  ZONE_BOILER,
  ZONE_DOCKS,
  ZONE_N,
  ZONE_SCRAP,
  zoneAt,
  zoneRow,
} from "../src/sim/zones";

function tileCount(zone: number, kind: number): number {
  const c0 = (zone * YARD_W) / TILE;
  const c1 = c0 + YARD_W / TILE;
  let n = 0;
  const rows = groundRows();
  const cols = groundCols();
  for (let r = 0; r < rows; r++) {
    for (let c = c0; c < c1 && c < cols; c++) if (groundKind(c, r) === kind) n++;
  }
  return n;
}

describe("yard strip", () => {
  it("clamps a point onto the end yards", () => {
    expect(zoneAt(-40, 0)).toBe(ZONE_SCRAP);
    expect(zoneAt(0, -10)).toBe(ZONE_SCRAP);
    expect(zoneAt(Number.NaN, 12)).toBe(ZONE_SCRAP);
    expect(zoneAt(YARD_W - 0.01, 640)).toBe(ZONE_SCRAP);
    expect(zoneAt(YARD_W, 0)).toBe(ZONE_BOILER);
    expect(zoneAt(YARD_W * 1.5, 999)).toBe(ZONE_BOILER);
    expect(zoneAt(YARD_W * 2 - 1, 0)).toBe(ZONE_BOILER);
    expect(zoneAt(YARD_W * 2, -4)).toBe(ZONE_DOCKS);
    expect(zoneAt(YARD_W * ZONE_N - 0.01, 1)).toBe(ZONE_DOCKS);
    expect(zoneAt(YARD_W * ZONE_N, 0)).toBe(ZONE_DOCKS);
    expect(zoneAt(YARD_W * ZONE_N + 80, 20)).toBe(ZONE_DOCKS);
    expect(zoneAt(YARD_W + 4, 0)).toBe(zoneAt(YARD_W + 4, 400));
  });

  it("keeps the strip width at YARD_W times ZONE_N", () => {
    expect(YARD_W * ZONE_N).toBe(2016);
    expect(ZONE_N).toBe(ZONE_DOCKS + 1);
    expect(SKY_N).toBe(ZONE_N);
  });

  it("gives every yard a spawn weight per foe kind", () => {
    const ids = [ZONE_SCRAP, ZONE_BOILER, ZONE_DOCKS];
    for (const id of ids) expect(zoneRow(id).spawnMul.length).toBe(KIND_N);
    expect([...zoneRow(ZONE_SCRAP).spawnMul]).toEqual([2, 1, 1, 1, 1, 1, 1]);
    expect([...zoneRow(ZONE_BOILER).spawnMul]).toEqual([1, 1, 2, 1, 1, 1, 1]);
    expect([...zoneRow(ZONE_DOCKS).spawnMul]).toEqual([1, 2, 1, 1, 1, 1, 1]);
  });

  it("lays brass plates in the boiler works and rubble in the scrap yard", () => {
    const scrapBrass = tileCount(ZONE_SCRAP, KIND_BRASS) + tileCount(ZONE_SCRAP, KIND_BRASS_W);
    const boilerBrass = tileCount(ZONE_BOILER, KIND_BRASS) + tileCount(ZONE_BOILER, KIND_BRASS_W);
    expect(scrapBrass).toBe(0);
    expect(boilerBrass).toBeGreaterThan(0);
    expect(tileCount(ZONE_SCRAP, KIND_RUBBLE)).toBeGreaterThan(tileCount(ZONE_DOCKS, KIND_RUBBLE));
  });
});
