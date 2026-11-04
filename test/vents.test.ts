import { KIND_GRATE, KIND_VENT, TILE, VENT_SLOW, groundKind, ventSlow } from "../src/render/ground";
import { step } from "../src/sim/step.hot";
import { createWorld } from "../src/sim/world";

describe("vent slowdown", () => {
  it("returns the slow factor only on vent and grate cells", () => {
    let ventX = 0;
    let ventY = 0;
    let grateX = 0;
    let grateY = 0;
    let openX = 0;
    let openY = 0;
    for (let r = 8; r < 36 && (!ventX || !grateX || !openX); r++) {
      for (let c = 2; c < 56; c++) {
        const k = groundKind(c, r);
        const x = c * TILE + 8;
        const y = r * TILE + 8;
        if (!ventX && k === KIND_VENT) { ventX = x; ventY = y; }
        else if (!grateX && k === KIND_GRATE) { grateX = x; grateY = y; }
        else if (!openX && k !== KIND_VENT && k !== KIND_GRATE) { openX = x; openY = y; }
      }
    }
    expect(ventX).toBeGreaterThan(0);
    expect(grateX).toBeGreaterThan(0);
    expect(ventSlow(ventX, ventY)).toBe(VENT_SLOW);
    expect(ventSlow(grateX, grateY)).toBe(VENT_SLOW);
    expect(ventSlow(openX, openY)).toBe(1);
  });

  it("cuts player travel on a vent compared with open cobble", () => {
    const walk = { dx: 1, dy: 0, pick: 0 };
    const open = createWorld(2);
    open.toSpawn = 99;
    open.spawnCd = 99999;
    open.fireCd = 99999;
    open.hurtCd = 99999;
    open.px = 480;
    open.py = 320;
    const x0 = open.px;
    step(open, walk);
    const openRun = open.px - x0;
    const vent = createWorld(2);
    vent.toSpawn = 99;
    vent.spawnCd = 99999;
    vent.fireCd = 99999;
    vent.hurtCd = 99999;
    vent.px = 8 * TILE + 8;
    vent.py = 10 * TILE + 8;
    const vx0 = vent.px;
    step(vent, walk);
    expect(openRun).toBeGreaterThan(0);
    expect(vent.px - vx0).toBeLessThan(openRun);
    expect(ventSlow(vent.px, vent.py) === VENT_SLOW || ventSlow(vx0, vent.py) === VENT_SLOW).toBe(true);
  });
});
