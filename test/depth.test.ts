import { readFileSync } from "node:fs";
import { slideUnit } from "../src/sim/arena.hot";
import { HEAL_HP, OB_BARREL, OB_BOILER, OB_CRATE, OB_GEAR, OB_PIPE, propBreaks } from "../src/sim/arena";
import {
  BELT_UPG_CAP, CARGO_HEAL, CARGO_LAND, CARGO_PWR, CARGO_RIDE, CARGO_SLIDE, CARGO_UPG, DROP_ALONG, FIRST_CARGO,
  LANE_X, VENT_SLOW, cargoGranted, cargoKind, cargoOn, cargoPhase, cargoX, cargoY, depthState,
  reviewDepth, ventCount, ventX, ventY,
} from "../src/sim/depth";
import { stepDepth, ventSlowAt, ventSlowMul, ventSlowZombieAt } from "../src/sim/depth.hot";
import { step } from "../src/sim/step.hot";
import { FX_PUFF, UPG_DMG, UPG_FIRE, UPG_HP, UPG_SPEED, UPG_VENT, type Input, type World } from "../src/sim/types";
import { createWorld } from "../src/sim/world";

const idle = (pick = 0): Input => ({ dx: 0, dy: 0, pick });

const fxPuffs = (w: World): number => {
  let n = 0;
  for (let i = 0; i < w.fxKind.length; i++) {
    if (w.fxKind[i] === FX_PUFF && w.fxTick[i] === w.tick) n++;
  }
  return n;
};

const freeze = (w: World): void => {
  w.toSpawn = 99;
  w.spawnCd = 99999;
  w.wave = 1;
  w.fireCd = 99999;
  w.hurtCd = 999999;
  w.hp = 80;
  w.maxHp = 80;
};

const clearProps = (w: World): void => { w.arena.obsAlive.fill(0); };

const smash = (w: World, kind: number): void => {
  freeze(w);
  clearProps(w);
  w.arena.obsN = 1;
  w.arena.obsAlive[0] = 1;
  w.arena.obsKind[0] = kind;
  w.arena.obsX[0] = w.px + 28;
  w.arena.obsY[0] = w.py;
  w.arena.obsHW[0] = 12;
  w.arena.obsHH[0] = 12;
  w.arena.obsR[0] = kind === OB_CRATE ? 0 : 12;
  w.arena.obsHp[0] = 1;
  w.bullets.alive[0] = 1;
  w.bullets.x[0] = w.px + 28;
  w.bullets.y[0] = w.py;
  w.bullets.vx[0] = 0;
  w.bullets.vy[0] = 0;
  w.bHit[0] = -1;
  w.hp = 2;
  w.maxHp = 5;
  step(w, idle());
};

describe("gameplay depth hooks", () => {
  it("smashes boilers, crates, gear pylons, and barrels into a heal, and leaves pipes standing", () => {
    expect(propBreaks(OB_BOILER)).toBe(true);
    expect(propBreaks(OB_CRATE)).toBe(true);
    expect(propBreaks(OB_GEAR)).toBe(true);
    expect(propBreaks(OB_BARREL)).toBe(true);
    expect(propBreaks(OB_PIPE)).toBe(false);
    const boiler = createWorld(12);
    smash(boiler, OB_BOILER);
    expect(fxPuffs(boiler)).toBeGreaterThanOrEqual(2);
    for (const kind of [OB_BOILER, OB_CRATE, OB_GEAR, OB_BARREL]) {
      const w = createWorld(11 + kind);
      smash(w, kind);
      expect(w.arena.obsAlive[0]).toBe(0);
      let slot = -1;
      for (let k = 0; k < w.arena.healAlive.length; k++) {
        if (w.arena.healAlive[k]) slot = k;
      }
      expect(slot).toBeGreaterThanOrEqual(0);
      w.arena.healX[slot] = w.px;
      w.arena.healY[slot] = w.py;
      step(w, idle());
      expect(w.hp).toBe(2 + HEAL_HP);
    }
    const pipe = createWorld(20);
    smash(pipe, OB_PIPE);
    expect(pipe.arena.obsAlive[0]).toBe(1);
    expect(pipe.arena.healAlive.some(Boolean)).toBe(false);
  });

  it("slows the player to 0.55 on a vent pad and ignores the boiler-vent upgrade", () => {
    const w = createWorld(3);
    freeze(w);
    clearProps(w);
    const d = depthState(w);
    expect(ventCount(w)).toBeGreaterThanOrEqual(3);
    d.ventX[0] = w.px;
    d.ventY[0] = w.py;
    w.upgrades[UPG_VENT] = 0;
    expect(ventSlowMul(w)).toBe(VENT_SLOW);
    expect(VENT_SLOW).toBeCloseTo(0.55);
    w.upgrades[UPG_VENT] = 5;
    expect(ventSlowMul(w)).toBe(VENT_SLOW);
    const x0 = w.px;
    step(w, { dx: 1, dy: 0, pick: 0 });
    const slowed = w.px - x0;
    d.ventX[0] = w.px + 400;
    d.ventY[0] = w.py + 400;
    const x1 = w.px;
    step(w, { dx: 1, dy: 0, pick: 0 });
    const open = w.px - x1;
    expect(slowed).toBeGreaterThan(0);
    expect(open).toBeGreaterThan(slowed * 1.4);
    expect(slowed / open).toBeCloseTo(VENT_SLOW, 1);
  });

  it("slows zombies on vent pads with the same floor multiplier", () => {
    const w = createWorld(31);
    freeze(w);
    clearProps(w);
    const d = depthState(w);
    d.ventX[0] = 400;
    d.ventY[0] = 400;
    expect(ventSlowAt(w, 400, 400)).toBe(VENT_SLOW);
    expect(ventSlowZombieAt(w, 400, 400)).toBe(VENT_SLOW);
    w.zombies.alive[0] = 1;
    w.zombies.x[0] = 400;
    w.zombies.y[0] = 400;
    w.zombies.vx[0] = 2;
    w.zombies.kind[0] = 0;
    slideUnit(w, 0, 1, 0, 2, 9);
    const ventMove = (w.zombies.x[0] ?? 0) - 400;
    w.zombies.x[0] = 400;
    w.zombies.y[0] = 520;
    slideUnit(w, 0, 1, 0, 2, 9);
    const openMove = (w.zombies.x[0] ?? 0) - 400;
    expect(ventMove).toBeGreaterThan(0);
    expect(openMove).toBeGreaterThan(ventMove * 1.35);
    expect(ventMove / openMove).toBeCloseTo(VENT_SLOW, 1);
  });

  it("rides a crate down the belt and delivers it into the fight lane", () => {
    const w = createWorld(4);
    freeze(w);
    clearProps(w);
    w.py = 80;
    w.px = 200;
    const d = depthState(w);
    d.cargoOn.fill(0);
    d.lastSpawn[0] = -9999;
    d.lastSpawn[1] = -9999;
    w.tick = FIRST_CARGO;
    stepDepth(w);
    expect(cargoOn(w, 0) + cargoOn(w, 1)).toBeGreaterThan(0);
    let slot = cargoOn(w, 0) ? 0 : 1;
    expect(cargoPhase(w, slot)).toBe(CARGO_RIDE);
    d.cargoT[slot] = DROP_ALONG - BELT_UPG_CAP;
    for (let t = 0; t < 40; t++) stepDepth(w);
    slot = cargoOn(w, 0) ? 0 : cargoOn(w, 1) ? 1 : slot;
    expect(cargoPhase(w, slot)).toBeGreaterThanOrEqual(CARGO_SLIDE);
    for (let t = 0; t < 200; t++) stepDepth(w);
    slot = cargoOn(w, 0) ? 0 : cargoOn(w, 1) ? 1 : slot;
    expect(cargoOn(w, slot)).toBe(1);
    expect(cargoPhase(w, slot)).toBe(CARGO_LAND);
    expect(Math.abs(cargoX(w, slot) - LANE_X)).toBeLessThan(3);
    expect(cargoY(w, slot)).toBeGreaterThan(200);
    expect(cargoY(w, slot)).toBeLessThan(500);
  });

  it("heals from a landed crate and caps silent belt upgrades", () => {
    const w = createWorld(5);
    freeze(w);
    clearProps(w);
    w.hp = 2;
    w.maxHp = 6;
    const d = depthState(w);
    d.cargoOn[0] = 1;
    d.cargoPhase[0] = CARGO_LAND;
    d.cargoKind[0] = CARGO_HEAL;
    d.cargoX[0] = w.px;
    d.cargoY[0] = w.py;
    stepDepth(w);
    expect(cargoOn(w, 0)).toBe(0);
    expect(w.hp).toBe(2 + HEAL_HP);
    w.upgrades[UPG_SPEED] = 0;
    w.upgrades[UPG_FIRE] = 0;
    w.upgrades[UPG_DMG] = 0;
    w.upgrades[UPG_HP] = 0;
    d.granted = 0;
    d.cargoOn[0] = 1;
    d.cargoPhase[0] = CARGO_LAND;
    d.cargoKind[0] = CARGO_UPG;
    d.cargoX[0] = w.px;
    d.cargoY[0] = w.py;
    stepDepth(w);
    expect(cargoGranted(w)).toBe(1);
    expect((w.upgrades[UPG_SPEED] ?? 0) + (w.upgrades[UPG_FIRE] ?? 0) + (w.upgrades[UPG_DMG] ?? 0) + (w.upgrades[UPG_HP] ?? 0)).toBe(1);
    d.granted = BELT_UPG_CAP;
    w.hp = 3;
    w.ult = 0;
    d.cargoOn[0] = 1;
    d.cargoPhase[0] = CARGO_LAND;
    d.cargoKind[0] = CARGO_UPG;
    d.cargoX[0] = w.px;
    d.cargoY[0] = w.py;
    stepDepth(w);
    expect(cargoGranted(w)).toBe(BELT_UPG_CAP);
    expect(w.hp).toBe(3);
    expect(w.ult).toBe(CARGO_PWR);
    expect(CARGO_PWR).toBeGreaterThan(0);
  });

  it("blits pack sprites for the belt crate, breakables, and vent decals", () => {
    const src = readFileSync("src/render/depth.ts", "utf8");
    expect(src.includes("conveyor")).toBe(true);
    expect(src.includes("crate")).toBe(true);
    expect(src.includes("breakable_boiler")).toBe(true);
    expect(src.includes("breakable_gear_pylon")).toBe(true);
    expect(src.includes("decal_vent")).toBe(true);
    expect(src.includes("decal_grate")).toBe(true);
    expect(src.includes("decal_hazard")).toBe(false);
  });

  it("parks a glowing crate in the review frame and keeps vent pads on the yard", () => {
    const w = createWorld(6);
    reviewDepth(w);
    expect(cargoOn(w, 0)).toBe(1);
    expect(cargoPhase(w, 0)).toBe(CARGO_LAND);
    expect(cargoKind(w, 0)).toBe(CARGO_UPG);
    expect(Math.abs(cargoX(w, 0) - 468)).toBeLessThan(0.1);
    expect(Math.abs(cargoY(w, 0) - 404)).toBeLessThan(0.1);
    expect(ventCount(w)).toBeGreaterThanOrEqual(3);
    expect(ventX(w, 0)).toBeGreaterThan(0);
    expect(ventY(w, 0)).toBeGreaterThan(0);
    expect(w.arena.obsAlive.some((on, i) => on && w.arena.obsKind[i] === OB_BOILER)).toBe(true);
  });
});
