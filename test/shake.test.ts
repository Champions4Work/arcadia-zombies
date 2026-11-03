import { EV_HURT, EV_KILL, EV_LEVEL, EV_N, EV_SHOT, EV_WAVE, FX_FLASH, FX_PUFF } from "../src/sim/types";
import { createWorld } from "../src/sim/world";
import {
  SHAKE_AMP,
  SHAKE_CAP,
  absorbShake,
  impulseOf,
  resetShake,
  shakeEnergy,
  shakeOffset,
  shakePixels,
} from "../src/render/shake";
import {
  createSession,
  loadStore,
  SHAKE_KEY,
  syncStore,
  toggleShake,
} from "../src/shell/session";

const mem = () => {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => (m.has(k) ? m.get(k) ?? null : null),
    setItem: (k: string, v: string) => { m.set(k, v); },
  };
};

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
    const peak = 6 * 0.3 * SHAKE_AMP * 2;
    expect(impulseOf(hurt)).toBeCloseTo(6 * 0.3);
    const hurtAt = shakeOffset(impulseOf(hurt), 3);
    expect(hurtAt[0]).toBeCloseTo(peak);
    expect(hurtAt[1]).toBeCloseTo(peak);
    expect(Math.abs(hurtAt[0])).toBeLessThanOrEqual(SHAKE_CAP);
    expect(Math.abs(hurtAt[1])).toBeLessThanOrEqual(SHAKE_CAP);

    const big = new Uint8Array(EV_N);
    big[EV_WAVE] = 1;
    big[EV_LEVEL] = 1;
    expect(impulseOf(big)).toBeGreaterThan(0);
    expect(impulseOf(big)).toBeLessThanOrEqual(SHAKE_CAP);
    expect(impulseOf(big)).toBeLessThan(impulseOf(hurt));

    const slammed = shakeOffset(100, 3);
    expect(slammed[0]).toBe(SHAKE_CAP);
    expect(slammed[1]).toBe(SHAKE_CAP);
    const slammedNeg = shakeOffset(100, 0);
    expect(slammedNeg[0]).toBe(-SHAKE_CAP);
    expect(slammedNeg[1]).toBe(-SHAKE_CAP);

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

  it("decays a hurt impulse inside a short window", () => {
    resetShake();
    const hurt = new Uint8Array(EV_N);
    hurt[EV_HURT] = 1;
    absorbShake(1, hurt);
    expect(shakeEnergy()).toBeGreaterThan(0);
    for (let i = 0; i < 10; i++) shakePixels(i + 1, true);
    expect(shakeEnergy()).toBe(0);
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
});
