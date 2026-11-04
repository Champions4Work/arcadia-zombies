import { fillHorde, HORDE_BULLETS, HORDE_ZOMBIES } from "../src/sim/horde";
import { MAP_LIVE, MAP_VENT, VENT_LIVE, mapState } from "../src/sim/map-events";
import { step } from "../src/sim/step.hot";
import { H, W, type Input, type World } from "../src/sim/types";
import { createWorld } from "../src/sim/world";
import { composeHorde } from "../src/render/blit.hot";
import { copyGroundWindow } from "../src/render/ground-atlas";
import { bg, buildSprites } from "../src/render/horde-sprites";
import { VENT_FX_CAP, VENT_PUFFS, ventFxCount } from "../src/render/ground";

const walk: Input = { dx: 1, dy: 0.25, pick: 0 };
const frame = new Uint32Array(W * H);

function hold(w: World): void {
  w.toSpawn = 0;
  w.spawnCd = 99999;
  w.fireCd = 99999;
  w.hurtCd = 40;
  w.over = false;
  w.choosing = 0;
}

function p95(samples: number[]): number {
  const ranked = samples.slice().sort((a, b) => a - b);
  return ranked[Math.min(ranked.length - 1, (ranked.length * 0.95) | 0)] ?? 0;
}

function frameCost(w: World): number {
  const t0 = performance.now();
  step(w, walk);
  const camX = Math.round(w.arena.camX);
  const camY = Math.round(w.arena.camY);
  copyGroundWindow(bg, camX, camY);
  composeHorde(w, frame);
  ventFxCount(camX, camY);
  return performance.now() - t0;
}

describe("yard scroll budget", () => {
  it("holds p95 step plus ground plus horde under 16ms while walking past vents", () => {
    buildSprites();
    const w = createWorld(7);
    hold(w);
    fillHorde(w, HORDE_ZOMBIES, HORDE_BULLETS);
    const vent = mapState(w);
    vent.kind = MAP_VENT;
    vent.phase = MAP_LIVE;
    vent.life = VENT_LIVE;
    vent.x = w.px;
    vent.y = w.py;
    for (let i = 0; i < 12; i++) frameCost(w);
    const samples: number[] = [];
    for (let i = 0; i < 80; i++) {
      vent.x = w.px + 18;
      vent.y = w.py;
      vent.life = VENT_LIVE;
      vent.phase = MAP_LIVE;
      vent.kind = MAP_VENT;
      samples.push(frameCost(w));
      expect(w.over).toBe(false);
      expect(ventFxCount(Math.round(w.arena.camX), Math.round(w.arena.camY))).toBeLessThanOrEqual(VENT_FX_CAP * VENT_PUFFS);
    }
    expect(p95(samples)).toBeLessThan(16);
    expect(frame[0] ?? 0).not.toBe(0);
  });
});
