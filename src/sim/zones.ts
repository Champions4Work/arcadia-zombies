export const OB_BOILER = 0;
export const OB_CRATE = 1;
export const OB_PIPE = 2;
export const OB_GEAR = 3;
export const OB_BARREL = 4;

export const SKY_HEAP = 0;
export const SKY_WORKS = 1;
export const SKY_DOCK = 2;
export const SKY_N = 3;

export const ZONE_SCRAP = 0;
export const ZONE_BOILER = 1;
export const ZONE_DOCKS = 2;
export const ZONE_N = 3;
export const YARD_W = 480;

export interface YardPad {
  row0: number;
  row1: number;
  col0: number;
  col1: number;
}

export type SpawnMul = readonly [number, number, number, number, number, number, number];

export interface ZoneRow {
  skyline: number;
  sky: readonly [number, number, number, number];
  dirt: readonly [number, number, number];
  stone: readonly number[];
  brass: number;
  pipeN: number;
  lampN: number;
  gearN: number;
  stainN: number;
  rubbleN: number;
  railRows: readonly number[];
  railCols: readonly number[];
  pads: readonly YardPad[];
  edgeRubble: number;
  grateMod: number;
  ventN: number;
  obs: readonly number[];
  spawnMul: SpawnMul;
}

export const ZONES: readonly ZoneRow[] = [
  {
    skyline: SKY_HEAP,
    sky: [0x140e18, 0x3a2848, 0x6a4038, 0xc47848],
    dirt: [0x3a342c, 0x2a241c, 0x1a1410],
    stone: [0x5a5048, 0x4a4038, 0x6a5848, 0x3a3028],
    brass: 0x8a6230,
    pipeN: 8,
    lampN: 2,
    gearN: 2,
    stainN: 6,
    rubbleN: 10,
    railRows: [],
    railCols: [8, 34],
    pads: [],
    edgeRubble: 1,
    grateMod: 0,
    ventN: 4,
    obs: [
      OB_CRATE, OB_CRATE, OB_CRATE, OB_CRATE, OB_CRATE, OB_CRATE,
      OB_PIPE, OB_PIPE, OB_PIPE, OB_PIPE, OB_PIPE,
      OB_BARREL, OB_BARREL,
      OB_BOILER,
      OB_GEAR,
    ],
    spawnMul: [2, 1, 1, 1, 1, 1, 1],
  },
  {
    skyline: SKY_WORKS,
    sky: [0x241454, 0x6a3478, 0xe07068, 0xffb15a],
    dirt: [0x3a2e28, 0x2e2620, 0x241c18],
    stone: [0x6a5848, 0x5c4c3e, 0x7a6856, 0x4e4238, 0x8a7462, 0x3e342c],
    brass: 0xc49038,
    pipeN: 6,
    lampN: 6,
    gearN: 4,
    stainN: 8,
    rubbleN: 4,
    railRows: [16, 27],
    railCols: [],
    pads: [
      { row0: 8, row1: 13, col0: 6, col1: 18 },
      { row0: 12, row1: 18, col0: 28, col1: 38 },
    ],
    edgeRubble: 0,
    grateMod: 47,
    ventN: 6,
    obs: [
      OB_BOILER, OB_BOILER, OB_BOILER, OB_BOILER, OB_BOILER,
      OB_GEAR, OB_GEAR, OB_GEAR, OB_GEAR,
      OB_CRATE, OB_CRATE,
      OB_PIPE, OB_PIPE,
      OB_BARREL,
    ],
    spawnMul: [1, 1, 2, 1, 1, 1, 1],
  },
  {
    skyline: SKY_DOCK,
    sky: [0x102028, 0x245058, 0xc08050, 0xf0c080],
    dirt: [0x2a3430, 0x1e2828, 0x141c20],
    stone: [0x3e4c48, 0x4a5854, 0x2e3c38, 0x5a6860],
    brass: 0xb8a060,
    pipeN: 4,
    lampN: 4,
    gearN: 5,
    stainN: 4,
    rubbleN: 2,
    railRows: [30],
    railCols: [],
    pads: [
      { row0: 18, row1: 22, col0: 4, col1: 38 },
    ],
    edgeRubble: 0,
    grateMod: 19,
    ventN: 3,
    obs: [
      OB_BARREL, OB_BARREL, OB_BARREL, OB_BARREL, OB_BARREL, OB_BARREL,
      OB_GEAR, OB_GEAR, OB_GEAR,
      OB_CRATE, OB_CRATE,
      OB_PIPE, OB_PIPE,
      OB_BOILER,
    ],
    spawnMul: [1, 2, 1, 1, 1, 1, 1],
  },
];

function countObs(): number {
  let n = 0;
  for (let i = 0; i < ZONES.length; i++) n += ZONES[i]?.obs.length ?? 0;
  return n;
}

export const MAX_OBS = countObs();

export function zoneAt(x: number): number {
  const span = YARD_W * ZONE_N;
  if (x <= 0) return ZONE_SCRAP;
  if (x >= span) return ZONE_DOCKS;
  return (x / YARD_W) | 0;
}

export function zoneRow(id: number): ZoneRow {
  return ZONES[id] as ZoneRow;
}
