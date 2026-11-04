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
});
