import { SKYLINE_N } from "../src/render/stage";
import { KIND_BRASS, KIND_BRASS_W, KIND_RUBBLE, TILE, groundCols, groundKind, groundRows } from "../src/render/ground";
import { ARENA_H, ARENA_W } from "../src/sim/arena";
import { KIND_N, rollKind, Z_KIND } from "../src/sim/foes";
import { step } from "../src/sim/step.hot";
import { Z_BRUTE, Z_GHOUL, Z_SHAMBLER } from "../src/sim/types";
import { createWorld } from "../src/sim/world";
import {
  OB_BARREL,
  OB_BOILER,
  OB_CRATE,
  OB_GEAR,
  OB_PIPE,
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
    expect(YARD_W * ZONE_N).toBe(1440);
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

  it("walks from the boiler works into the scrap yard and the brass docks", () => {
    const w = createWorld(1);
    expect(zoneAt(w.px, w.py)).toBe(ZONE_BOILER);
    expect(w.px).toBe(ARENA_W / 2);
    expect(w.py).toBe(ARENA_H / 2);
    expect(SKYLINE_N).toBe(SKY_N);
    w.arena.obsAlive.fill(0);
    w.toSpawn = 99;
    w.spawnCd = 99999;
    w.fireCd = 99999;
    const left = { dx: -1, dy: 0, pick: 0 };
    for (let t = 0; t < 400 && zoneAt(w.px, w.py) === ZONE_BOILER; t++) step(w, left);
    expect(zoneAt(w.px, w.py)).toBe(ZONE_SCRAP);
    w.px = ARENA_W / 2;
    const right = { dx: 1, dy: 0, pick: 0 };
    for (let t = 0; t < 400 && zoneAt(w.px, w.py) === ZONE_BOILER; t++) step(w, right);
    expect(zoneAt(w.px, w.py)).toBe(ZONE_DOCKS);
    expect(zoneRow(ZONE_SCRAP).stone[0]).not.toBe(zoneRow(ZONE_BOILER).stone[0]);
    expect(zoneRow(ZONE_DOCKS).stone[0]).not.toBe(zoneRow(ZONE_BOILER).stone[0]);
  });

  it("keeps each prop in the yard that listed it", () => {
    const w = createWorld(4);
    const kinds = [OB_BOILER, OB_CRATE, OB_PIPE, OB_GEAR, OB_BARREL];
    for (let zone = 0; zone < ZONE_N; zone++) {
      const row = zoneRow(zone);
      const x0 = zone * YARD_W;
      for (const kind of kinds) {
        let got = 0;
        let want = 0;
        for (let i = 0; i < row.obs.length; i++) if (row.obs[i] === kind) want++;
        for (let i = 0; i < w.arena.obsN; i++) {
          if (!w.arena.obsAlive[i]) continue;
          const x = w.arena.obsX[i] ?? 0;
          if (x < x0 || x >= x0 + YARD_W) continue;
          if ((w.arena.obsKind[i] ?? 0) === kind) got++;
        }
        expect(got).toBe(want);
      }
    }
    expect(w.arena.propOverflow).toBe(0);
  });

  it("shifts the spawn mix and keeps the stream length", () => {
    const scrap = createWorld(1);
    const boiler = createWorld(1);
    const docks = createWorld(1);
    scrap.px = YARD_W * 0.5;
    boiler.px = ARENA_W / 2;
    docks.px = YARD_W * 2.5;
    const before = scrap.rng.state;
    expect(boiler.rng.state).toBe(before);
    expect(docks.rng.state).toBe(before);
    let scrapShambler = 0;
    let boilerShambler = 0;
    let scrapBrute = 0;
    let boilerBrute = 0;
    let scrapGhoul = 0;
    let docksGhoul = 0;
    for (let i = 0; i < 200; i++) {
      const s = rollKind(scrap) & Z_KIND;
      const b = rollKind(boiler) & Z_KIND;
      const d = rollKind(docks) & Z_KIND;
      if (s === Z_SHAMBLER) scrapShambler++;
      if (b === Z_SHAMBLER) boilerShambler++;
      if (s === Z_BRUTE) scrapBrute++;
      if (b === Z_BRUTE) boilerBrute++;
      if (s === Z_GHOUL) scrapGhoul++;
      if (d === Z_GHOUL) docksGhoul++;
    }
    expect(scrapShambler).toBeGreaterThan(boilerShambler);
    expect(boilerBrute).toBeGreaterThan(scrapBrute);
    expect(docksGhoul).toBeGreaterThan(scrapGhoul);
    expect(scrap.rng.state).toBe(boiler.rng.state);
    expect(scrap.rng.state).toBe(docks.rng.state);
    expect(scrap.rng.state).not.toBe(before);
  });

  it("reads a zone and leaves the world stream", () => {
    const w = createWorld(3);
    const state = w.rng.state;
    zoneAt(w.px, w.py);
    zoneAt(0, 0);
    zoneAt(ARENA_W, ARENA_H);
    expect(w.rng.state).toBe(state);
  });
});
