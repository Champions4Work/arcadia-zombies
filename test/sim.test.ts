import { createRng, nextFloat } from "../src/sim/rng";
import { simulate } from "../src/sim/run";
import type { Input } from "../src/sim/types";
const script = (n: number, seed: number): Input[] => {
  const r = createRng(seed);
  return Array.from({ length: n }, () => ({ dx: Math.round(nextFloat(r) * 2 - 1), dy: Math.round(nextFloat(r) * 2 - 1), pick: 1 }));
};
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
    expect(r.px).toBeLessThanOrEqual(474);
    expect(r.py).toBeLessThanOrEqual(314);
  });
});
