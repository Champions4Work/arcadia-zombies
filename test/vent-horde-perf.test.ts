import { composeHorde } from "../src/render/blit.hot";
import { copyGroundWindow, stampVentFx } from "../src/render/ground-atlas";
import { bg, buildSprites } from "../src/render/horde-sprites";
import { VENT_FX_CAP, VENT_PUFFS } from "../src/render/ground";
import { juiceHit, resetJuice, tickJuice, JUICE_DT } from "../src/render/juice";
import { fillHorde, HORDE_BULLETS, HORDE_ZOMBIES } from "../src/sim/horde";
import { MAP_LIVE, MAP_VENT, VENT_LIVE, mapState } from "../src/sim/map-events";
import { depthState, VENT_SLOW } from "../src/sim/depth";
import { ventSlowMul } from "../src/sim/depth.hot";
import { step } from "../src/sim/step.hot";
import { H, W, type Input, type World } from "../src/sim/types";
import { createWorld } from "../src/sim/world";
import { applyPlayView } from "../src/shell/play-view";
import {
  PHONE_CSS_H,
  PHONE_CSS_W,
  PHONE_FPS_AVG_MIN,
  PHONE_FPS_MID_MIN,
  PHONE_FRAME_P95_MS,
} from "../src/shell/phone-perf";

const walk: Input = { dx: 0.85, dy: 0.45, pick: 0 };
const frame = new Uint32Array(W * H);

function p95(samples: number[]): number {
  const ranked = samples.slice().sort((a, b) => a - b);
  return ranked[Math.min(ranked.length - 1, (ranked.length * 0.95) | 0)] ?? 0;
}

function hold(w: World): void {
  w.toSpawn = 0;
  w.spawnCd = 99999;
  w.fireCd = 99999;
  w.hurtCd = 40;
  w.over = false;
  w.choosing = 0;
}

function armVentHorde(w: World): void {
  hold(w);
  applyPlayView(w.arena, PHONE_CSS_W, PHONE_CSS_H);
  fillHorde(w, HORDE_ZOMBIES, HORDE_BULLETS);
  const d = depthState(w);
  w.px = d.ventX[0] ?? w.px;
  w.py = d.ventY[0] ?? w.py;
  const vent = mapState(w);
  vent.kind = MAP_VENT;
  vent.phase = MAP_LIVE;
  vent.life = VENT_LIVE;
  vent.x = w.px + 24;
  vent.y = w.py;
  resetJuice();
  for (let i = 0; i < 24; i++) {
    juiceHit(i, w.px + ((i * 19) % 140) - 70, w.py + ((i * 11) % 90) - 45, 2, i % 3, i % 7 === 0, w.tick + i, w.px, w.py);
  }
  tickJuice(JUICE_DT * 4);
}

function frameCost(w: World): number {
  const t0 = performance.now();
  step(w, walk);
  const camX = Math.round(w.arena.camX);
  const camY = Math.round(w.arena.camY);
  copyGroundWindow(bg, camX, camY);
  composeHorde(w, frame);
  stampVentFx(frame, camX, camY, w.tick);
  tickJuice(JUICE_DT);
  if ((w.tick & 3) === 0) {
    const slot = w.tick % 48;
    juiceHit(slot, w.px + slot, w.py - 12, 3, slot % 3, false, w.tick, w.px, w.py);
  }
  return performance.now() - t0;
}

describe("vent horde phone fps budget", () => {
  it("keeps median and average fps above the bar on a vent with a dense horde", () => {
    buildSprites();
    const w = createWorld(19);
    armVentHorde(w);
    expect(ventSlowMul(w)).toBe(VENT_SLOW);
    for (let i = 0; i < 12; i++) frameCost(w);
    const vent = mapState(w);
    const msSamples: number[] = [];
    for (let i = 0; i < 72; i++) {
      vent.x = w.px + 18;
      vent.y = w.py;
      vent.life = VENT_LIVE;
      vent.phase = MAP_LIVE;
      vent.kind = MAP_VENT;
      msSamples.push(frameCost(w));
      expect(w.over).toBe(false);
      expect(stampVentFx(frame, Math.round(w.arena.camX), Math.round(w.arena.camY), w.tick)).toBeLessThanOrEqual(VENT_FX_CAP * VENT_PUFFS);
    }
    const p95ms = p95(msSamples);
    expect(p95ms).toBeLessThan(PHONE_FRAME_P95_MS);
    const fpsSamples = msSamples.map((ms) => 1000 / (ms > 0 ? ms : PHONE_FRAME_P95_MS));
    fpsSamples.sort((a, b) => a - b);
    const mid = Math.round(fpsSamples[fpsSamples.length >> 1] ?? 0);
    const avg = Math.round(fpsSamples.reduce((sum, v) => sum + v, 0) / fpsSamples.length);
    expect(mid).toBeGreaterThanOrEqual(PHONE_FPS_MID_MIN);
    expect(avg).toBeGreaterThanOrEqual(PHONE_FPS_AVG_MIN);
    expect(frame[0] ?? 0).not.toBe(0);
  });
});
