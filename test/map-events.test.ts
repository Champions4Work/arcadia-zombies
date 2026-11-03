import { step } from "../src/sim/step.hot";
import { createWorld } from "../src/sim/world";
import {
  DROP_HEAL, DROP_SCORE, FOG_SIGHT, GEAR_N, GEAR_SCORE, MAP_DROP, MAP_FOG, MAP_GEAR, MAP_IDLE, MAP_LIVE,
  MAP_VENT, MAP_WARN, VENT_DMG, crateOn, fogCover, fogSight, gearOn, gearX, gearY, mapBanner, mapBannerKind,
  mapKind, mapLabel, mapPhase, mapX, mapY,
} from "../src/sim/map-events";
import type { World } from "../src/sim/types";

const still = { dx: 0, dy: 0, pick: 0 };

function hold(w: World): void {
  w.toSpawn = 0;
  w.fireCd = 9000;
  w.hurtCd = 40;
  const z = w.zombies;
  z.alive[0] = 1;
  z.hp[0] = 5000;
  z.kind[0] = 0;
  z.vx[0] = 0;
  z.vy[0] = 0;
  z.x[0] = 16;
  z.y[0] = 28;
}

function boot(seed: number): World {
  const w = createWorld(seed);
  hold(w);
  return w;
}

function tick(w: World, fire = false): void {
  hold(w);
  if (fire) w.fireCd = 0;
  step(w, still);
}

function find(kind: number, phase: number): World {
  for (let seed = 1; seed < 48; seed++) {
    const w = boot(seed);
    for (let t = 0; t < 7000; t++) {
      tick(w);
      if (mapKind(w) === kind && mapPhase(w) === phase) return w;
    }
  }
  throw new Error(`missing ${kind}/${phase}`);
}

function trail(seed: number): { kind: number; x: number; y: number }[] {
  const w = boot(seed);
  const out: { kind: number; x: number; y: number }[] = [];
  let prev = MAP_IDLE;
  for (let t = 0; t < 5000; t++) {
    tick(w);
    const phase = mapPhase(w);
    if (prev !== MAP_WARN && phase === MAP_WARN) out.push({ kind: mapKind(w), x: mapX(w), y: mapY(w) });
    prev = phase;
  }
  return out;
}

describe("map events", () => {  it("names each telegraph", () => {
    expect(mapLabel(MAP_VENT, 0)).toBe("VENT INCOMING");
    expect(mapLabel(MAP_VENT, 1)).toBe("STEAM VENT");
    expect(mapLabel(MAP_DROP, 0)).toBe("AIRSHIP INBOUND");
    expect(mapLabel(MAP_DROP, 1)).toBe("SUPPLY DROP");
    expect(mapLabel(MAP_FOG, 0)).toBe("FOG INCOMING");
    expect(mapLabel(MAP_FOG, 1)).toBe("FOG SURGE");
    expect(mapLabel(MAP_GEAR, 0)).toBe("GEARS INCOMING");
    expect(mapLabel(MAP_GEAR, 1)).toBe("GEAR RAIN");
  });

  it("repeats the same seed and splits a different one", () => {
    const a = trail(4);
    const b = trail(4);
    const c = trail(9);
    expect(a.length).toBeGreaterThan(2);
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
    const kinds = new Set(a.map((e) => e.kind));
    expect(kinds.size).toBeGreaterThan(1);
  });

  it("leaves the world rng stream untouched", () => {
    const w = boot(8);
    const state = w.rng.state;
    let saw = false;
    for (let t = 0; t < 2500; t++) {
      tick(w);
      if (mapPhase(w) === MAP_WARN) saw = true;
    }
    expect(saw).toBe(true);
    expect(w.rng.state).toBe(state);
  });

  it("warns before a steam vent hurts only the zombies inside it", () => {
    const w = find(MAP_VENT, MAP_WARN);
    expect(mapBanner(w)).toBeGreaterThan(0);
    expect(mapBannerKind(w)).toBe(MAP_VENT);
    const x = mapX(w);
    const y = mapY(w);
    const z = w.zombies;
    z.alive[1] = 1;
    z.hp[1] = 30;
    z.vx[1] = 0;
    z.kind[1] = 0;
    z.x[1] = x;
    z.y[1] = y;
    z.alive[2] = 1;
    z.hp[2] = 30;
    z.vx[2] = 0;
    z.kind[2] = 0;
    z.x[2] = 18;
    z.y[2] = 36;
    let warned = 0;
    while (mapPhase(w) === MAP_WARN) {
      expect(z.hp[1]).toBe(30);
      z.x[1] = x;
      z.y[1] = y;
      z.vx[1] = 0;
      tick(w);
      warned++;
    }
    expect(warned).toBeGreaterThan(60);
    expect(mapPhase(w)).toBe(MAP_LIVE);
    expect(z.hp[1]).toBe(30 - VENT_DMG);
    expect(z.hp[2]).toBe(30);
    expect(z.alive[1]).toBe(1);
  });

  it("drops a supply crate only after the airship warning", () => {
    const w = find(MAP_DROP, MAP_WARN);
    expect(crateOn(w)).toBe(0);
    w.hp = 2;
    w.px = mapX(w);
    w.py = mapY(w);
    while (mapPhase(w) === MAP_WARN) {
      w.px = mapX(w);
      w.py = mapY(w);
      w.hp = 2;
      tick(w);
      expect(w.hp).toBe(2);
    }
    expect(mapPhase(w)).toBe(MAP_LIVE);
    expect(crateOn(w)).toBe(1);
    expect(w.hp).toBe(2);
    const far = boot(1);
    far.hp = 2;
    for (let t = 0; t < 7000 && !(mapKind(far) === MAP_DROP && mapPhase(far) === MAP_LIVE); t++) tick(far);
    expect(mapKind(far)).toBe(MAP_DROP);
    far.px = mapX(far) < 240 ? 460 : 20;
    far.py = 300;
    far.hp = 2;
    for (let i = 0; i < 40; i++) {
      far.px = mapX(far) < 240 ? 460 : 20;
      far.py = 300;
      tick(far);
    }
    expect(crateOn(far)).toBe(1);
    expect(far.hp).toBe(2);
    const score = w.score;
    for (let i = 0; i < 30; i++) {
      w.px = mapX(w);
      w.py = mapY(w);
      tick(w);
    }
    expect(w.hp).toBe(2 + DROP_HEAL);
    expect(w.score - score).toBe(DROP_SCORE);
    expect(crateOn(w)).toBe(0);
  });

  it("hides distant foes for the fog surge and clears after", () => {
    const w = find(MAP_FOG, MAP_WARN);
    expect(fogSight(w)).toBe(1e6);
    expect(fogCover(w)).toBeLessThan(0.2);
    while (mapPhase(w) === MAP_WARN) tick(w);
    expect(mapPhase(w)).toBe(MAP_LIVE);
    expect(fogSight(w)).toBe(FOG_SIGHT);
    expect(fogCover(w)).toBeGreaterThan(0.7);
    w.bullets.alive.fill(0);
    tick(w, true);
    let shots = 0;
    for (let i = 0; i < w.bullets.alive.length; i++) if (w.bullets.alive[i]) shots++;
    expect(shots).toBe(0);
    w.zombies.alive[3] = 1;
    w.zombies.hp[3] = 40;
    w.zombies.kind[3] = 0;
    w.zombies.vx[3] = 0;
    w.zombies.x[3] = w.px + 36;
    w.zombies.y[3] = w.py;
    w.bullets.alive.fill(0);
    tick(w, true);
    let close = 0;
    for (let i = 0; i < w.bullets.alive.length; i++) if (w.bullets.alive[i]) close++;
    expect(close).toBeGreaterThan(0);
    while (mapPhase(w) === MAP_LIVE) tick(w);
    expect(fogSight(w)).toBe(1e6);
    expect(fogCover(w)).toBe(0);
  });

  it("pays a gear rain bonus when a falling gear is caught", () => {
    const w = find(MAP_GEAR, MAP_LIVE);
    let paid = 0;
    for (let t = 0; t < 240 && paid === 0; t++) {
      let gx = 0;
      let gy = 0;
      let on = 0;
      for (let i = 0; i < GEAR_N; i++) {
        if (!gearOn(w, i)) continue;
        gx = gearX(w, i);
        gy = gearY(w, i);
        on = 1;
        break;
      }
      if (on) {
        w.px = gx;
        w.py = gy;
      }
      const score = w.score;
      tick(w);
      paid = w.score - score;
    }
    expect(paid).toBe(GEAR_SCORE);
  });
});
