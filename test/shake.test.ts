import { EV_HURT, EV_KILL, EV_LEVEL, EV_N, EV_SHOT, EV_WAVE, FX_FLASH, FX_PUFF } from "../src/sim/types";
import { createWorld } from "../src/sim/world";
import { juiceHit, resetJuice } from "../src/render/juice";
import { setReduceMotion } from "../src/render/motion";
import {
  SHAKE_CAP,
  TRAUMA_DECAY,
  TRAUMA_HURT,
  absorbShake,
  decayTrauma,
  impulseOf,
  punchShake,
  resetShake,
  shakeEnergy,
  shakeOffset,
  shakePixels,
} from "../src/render/shake";
import { Z_SHAMBLER } from "../src/sim/types";
import {
  createSession,
  loadStore,
  MOTION_KEY,
  SHAKE_KEY,
  syncStore,
  toggleReduceMotion,
  toggleShake,
} from "../src/shell/session";

const mem = () => {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => (m.has(k) ? m.get(k) ?? null : null),
    setItem: (k: string, v: string) => { m.set(k, v); },
  };
};

afterEach(() => {
  setReduceMotion(false);
  resetShake();
});

describe("screen shake", () => {
  it("caps translation and ignores normal hits and kills", () => {
    const quiet = new Uint8Array(EV_N);
    quiet[EV_KILL] = 1;
    quiet[EV_SHOT] = 1;
    expect(impulseOf(quiet)).toBe(0);

    const w = createWorld(1);
    w.fxKind[0] = FX_PUFF;
    w.fxTick[0] = w.tick;
    w.fxKind[1] = FX_FLASH;
    w.fxTick[1] = w.tick;
    w.events[EV_KILL] = 1;
    w.events[EV_SHOT] = 1;
    resetShake();
    absorbShake(w.tick, w.events);
    expect(shakePixels(w.tick, true)).toEqual([0, 0]);
    expect(shakeEnergy()).toBe(0);

    const hurt = new Uint8Array(EV_N);
    hurt[EV_HURT] = 1;
    hurt[EV_KILL] = 1;
    expect(impulseOf(hurt)).toBeCloseTo(TRAUMA_HURT);
    const hurtAt = shakeOffset(impulseOf(hurt), 3);
    expect(Math.abs(hurtAt[0])).toBeLessThanOrEqual(SHAKE_CAP);
    expect(Math.abs(hurtAt[1])).toBeLessThanOrEqual(SHAKE_CAP);
    expect(Math.abs(hurtAt[0]) + Math.abs(hurtAt[1])).toBeGreaterThan(0);

    const big = new Uint8Array(EV_N);
    big[EV_WAVE] = 1;
    big[EV_LEVEL] = 1;
    expect(impulseOf(big)).toBeGreaterThan(0);
    expect(impulseOf(big)).toBeLessThanOrEqual(1);
    expect(impulseOf(big)).toBeLessThan(impulseOf(hurt));

    const slammed = shakeOffset(1, 3);
    expect(Math.abs(slammed[0])).toBeLessThanOrEqual(SHAKE_CAP);
    expect(Math.abs(slammed[1])).toBeLessThanOrEqual(SHAKE_CAP);

    resetShake();
    for (let t = 1; t <= 24; t++) {
      const both = new Uint8Array(EV_N);
      both[EV_HURT] = 1;
      both[EV_WAVE] = 1;
      absorbShake(t, both);
      const p = shakePixels(t, true);
      expect(Math.abs(p[0])).toBeLessThanOrEqual(SHAKE_CAP);
      expect(Math.abs(p[1])).toBeLessThanOrEqual(SHAKE_CAP);
    }
  });

  it("decays trauma with easing instead of a 4-step jitter", () => {
    resetShake();
    punchShake(0.8);
    const start = shakeEnergy();
    expect(start).toBeCloseTo(0.8);
    const x0 = shakeOffset(0.8, 1)[0];
    const y0 = shakeOffset(0.8, 1)[1];
    const x1 = shakeOffset(0.8, 8)[0];
    const y1 = shakeOffset(0.8, 8)[1];
    expect(x0 !== x1 || y0 !== y1).toBe(true);
    const steps = new Set<string>();
    for (let t = 0; t < 16; t++) {
      const p = shakeOffset(0.8, t);
      steps.add(`${p[0].toFixed(2)},${p[1].toFixed(2)}`);
    }
    expect(steps.size).toBeGreaterThan(4);
    decayTrauma(0.25);
    expect(shakeEnergy()).toBeCloseTo(0.8 * Math.exp(-TRAUMA_DECAY * 0.25));
    expect(shakeEnergy()).toBeLessThan(start);
    for (let i = 0; i < 40; i++) shakePixels(i + 1, true, 0.05);
    expect(shakeEnergy()).toBe(0);
  });

  it("overlapping punches add trauma instead of restarting", () => {
    resetShake();
    punchShake(0.4);
    expect(shakeEnergy()).toBeCloseTo(0.4);
    punchShake(0.4);
    expect(shakeEnergy()).toBeCloseTo(0.8);
    punchShake(1);
    expect(shakeEnergy()).toBe(1);
  });

  it("a crit hit punches shake and the setting still zeroes it", () => {
    resetShake();
    resetJuice();
    juiceHit(0, 10, 10, 3, Z_SHAMBLER, false, 0);
    expect(shakeEnergy()).toBeGreaterThan(0);
    expect(shakePixels(1, false)).toEqual([0, 0]);
    resetShake();
    punchShake(0.55);
    expect(shakeEnergy()).toBeGreaterThan(0);
    expect(shakePixels(2, true)[0]).not.toBe(0);
  });

  it("defaults to reduced shake and the toggle persists", () => {
    const store = mem();
    expect(loadStore(store).shake).toBe(true);
    const session = createSession(3, false, loadStore(store).shake);
    expect(session.shake).toBe(true);
    resetShake();
    const hurt = new Uint8Array(EV_N);
    hurt[EV_HURT] = 1;
    absorbShake(4, hurt);
    expect(shakePixels(4, session.shake)[0]).not.toBe(0);
    toggleShake(session);
    expect(session.shake).toBe(false);
    expect(shakePixels(5, session.shake)).toEqual([0, 0]);
    expect(shakeEnergy()).toBe(0);
    syncStore(session, store);
    expect(store.getItem(SHAKE_KEY)).toBe("0");
    expect(loadStore(store).shake).toBe(false);
    toggleShake(session);
    syncStore(session, store);
    expect(store.getItem(SHAKE_KEY)).toBe("1");
    expect(loadStore(store).shake).toBe(true);
  });

  it("reduce motion defaults from the query and kills shake", () => {
    const store = mem();
    expect(loadStore(store, true).reduceMotion).toBe(true);
    expect(loadStore(store, false).reduceMotion).toBe(false);
    const session = createSession(0, false, true, true, true);
    expect(session.reduceMotion).toBe(true);
    setReduceMotion(true);
    punchShake(1);
    expect(shakeEnergy()).toBe(0);
    toggleReduceMotion(session);
    syncStore(session, store);
    expect(store.getItem(MOTION_KEY)).toBe("0");
    expect(loadStore(store, true).reduceMotion).toBe(false);
  });
});
