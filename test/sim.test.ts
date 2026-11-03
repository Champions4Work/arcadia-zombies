import { ARENA_H, ARENA_W, EDGE_PAD } from "../src/sim/arena";
import { createRng, nextFloat } from "../src/sim/rng";
import { simulate } from "../src/sim/run";
import { step } from "../src/sim/step.hot";
import { EV_HURT, EV_KILL, H, MAX_ZOMBIES, W, Z_BRUTE, Z_GHOUL, Z_SHAMBLER, type Input } from "../src/sim/types";
import { createWorld } from "../src/sim/world";
const script = (n: number, seed: number): Input[] => {
  const r = createRng(seed);
  return Array.from({ length: n }, () => ({ dx: Math.round(nextFloat(r) * 2 - 1), dy: Math.round(nextFloat(r) * 2 - 1), pick: 1 }));
};
const roam = (n: number): Input[] =>
  Array.from({ length: n }, (_, t) => ({ dx: Math.cos(t * 0.07), dy: Math.sin(t * 0.05), pick: 1 }));
describe("headless simulation", () => {
  it("same seed and inputs give identical results", () => {
    const inputs = script(6000, 7);
    expect(simulate(42, inputs)).toEqual(simulate(42, inputs));
  });
  it("different seeds diverge", () => {
    const inputs = script(3000, 7);
    expect(simulate(1, inputs)).not.toEqual(simulate(2, inputs));
  });
  it("a standing player scores across waves", () => {
    const r = simulate(5, Array.from({ length: 60 * 600 }, () => ({ dx: 0, dy: 0, pick: 1 })));
    expect(r.score).toBeGreaterThan(0);
    expect(r.wave).toBeGreaterThanOrEqual(1);
  });
  it("player stays inside the arena", () => {
    const r = simulate(3, Array.from({ length: 600 }, () => ({ dx: 1, dy: 1, pick: 0 })));
    expect(r.px).toBeGreaterThanOrEqual(EDGE_PAD);
    expect(r.py).toBeGreaterThanOrEqual(EDGE_PAD);
    expect(r.px).toBeLessThanOrEqual(ARENA_W - EDGE_PAD);
    expect(r.py).toBeLessThanOrEqual(ARENA_H - EDGE_PAD);
    expect(r.px).toBeGreaterThan(W);
    expect(r.py).toBeGreaterThan(H);
  });
});
describe("zombie kinds", () => {
  it("spawns shamblers, clockwork ghouls, and boiler brutes", () => {
    const w = createWorld(11);
    const seen = [false, false, false];
    for (const inp of roam(9000)) {
      if (w.over) break;
      step(w, inp);
      const z = w.zombies;
      for (let i = 0; i < MAX_ZOMBIES; i++) {
        if (z.alive[i]) seen[z.kind[i] ?? 0] = true;
      }
      if (seen[Z_SHAMBLER] && seen[Z_GHOUL] && seen[Z_BRUTE]) break;
    }
    expect(seen[Z_SHAMBLER]).toBe(true);
    expect(seen[Z_GHOUL]).toBe(true);
    expect(seen[Z_BRUTE]).toBe(true);
  });
  it("gives ghouls more speed and brutes more hp", () => {
    const w = createWorld(21);
    const hp = [-1, -1, -1];
    const sp = [-1, -1, -1];
    const slot = new Uint8Array(MAX_ZOMBIES);
    for (const inp of roam(9000)) {
      if (w.over) break;
      step(w, inp);
      const z = w.zombies;
      for (let i = 0; i < MAX_ZOMBIES; i++) {
        if (z.alive[i] && !slot[i]) {
          const k = z.kind[i] ?? 0;
          if ((hp[k] ?? 0) < 0) {
            hp[k] = z.hp[i] ?? 0;
            sp[k] = z.vx[i] ?? 0;
          }
        }
        slot[i] = z.alive[i] ?? 0;
      }
      if ((hp[0] ?? 0) >= 0 && (hp[1] ?? 0) >= 0 && (hp[2] ?? 0) >= 0) break;
    }
    expect(sp[Z_GHOUL] ?? 0).toBeGreaterThan(sp[Z_SHAMBLER] ?? 0);
    expect(sp[Z_SHAMBLER] ?? 0).toBeGreaterThan(sp[Z_BRUTE] ?? 0);
    expect(hp[Z_BRUTE] ?? 0).toBeGreaterThan(hp[Z_GHOUL] ?? 0);
    expect(hp[Z_BRUTE] ?? 0).toBeGreaterThan(hp[Z_SHAMBLER] ?? 0);
  });
  it("pays more score for a brute than a ghoul or shambler", () => {
    const pay = (kind: number): number => {
      const w = createWorld(1);
      w.wave = 2;
      w.toSpawn = 0;
      w.fireCd = 0;
      w.zombies.alive[0] = 1;
      w.zombies.kind[0] = kind;
      w.zombies.hp[0] = 1;
      w.zombies.x[0] = w.px + 20;
      w.zombies.y[0] = w.py;
      w.zombies.vx[0] = 0;
      for (let t = 0; t < 40; t++) {
        step(w, { dx: 0, dy: 0, pick: 0 });
        if (w.events[EV_KILL]) return w.score;
      }
      return w.score;
    };
    expect(pay(Z_BRUTE)).toBeGreaterThan(pay(Z_GHOUL));
    expect(pay(Z_GHOUL)).toBeGreaterThan(pay(Z_SHAMBLER));
  });
  it("a brute hit costs two hp and a shambler hit costs one", () => {
    const bump = (kind: number): number => {
      const w = createWorld(1);
      w.toSpawn = 0;
      w.fireCd = 99;
      w.hurtCd = 0;
      w.zombies.alive[0] = 1;
      w.zombies.kind[0] = kind;
      w.zombies.x[0] = w.px;
      w.zombies.y[0] = w.py;
      w.zombies.vx[0] = 0;
      const before = w.hp;
      step(w, { dx: 0, dy: 0, pick: 0 });
      expect(w.events[EV_HURT]).toBe(1);
      return before - w.hp;
    };
    expect(bump(Z_BRUTE)).toBe(2);
    expect(bump(Z_SHAMBLER)).toBe(1);
    expect(bump(Z_GHOUL)).toBe(1);
  });
});
