import { hurtZombie, killZombie } from "../src/sim/combat.hot";
import {
  CHAPTER_WAVES,
  GATE_X,
  GATE_Y,
  HOLD_TICKS,
  holdClock,
  holdDone,
  objectiveRows,
  waveFace,
} from "../src/sim/objectives";
import { step } from "../src/sim/step.hot";
import { Z_SHAMBLER } from "../src/sim/types";
import { createWorld } from "../src/sim/world";

const idle = { dx: 0, dy: 0, pick: 0 };

function freezeYard(w: ReturnType<typeof createWorld>): void {
  w.toSpawn = 0;
  w.spawnCd = 99999;
  w.fireCd = 99999;
  const z = w.zombies;
  for (let i = 0; i < z.alive.length; i++) z.alive[i] = 0;
}

describe("chapter objectives", () => {
  it("starts with wave 1/8 and an open checklist", () => {
    const w = createWorld(1);
    const face = waveFace(w);
    const rows = objectiveRows(w);
    expect(face).toEqual({ n: 1, of: CHAPTER_WAVES });
    expect(w.gate).toBe(0);
    expect(w.holdLeft).toBe(0);
    expect(rows[0]?.done).toBe(false);
    expect(rows[1]?.done).toBe(false);
    expect(rows[1]?.clock).toBe("");
    expect(rows[2]?.done).toBe(false);
    expect(rows.map((r) => r.label)).toEqual([
      "Activate the Steam Gate",
      "Hold the Area",
      "Survive All Waves",
    ]);
  });

  it("does not treat rank as a steam gate", () => {
    const w = createWorld(2);
    w.rank = 4;
    expect(objectiveRows(w)[0]?.done).toBe(false);
  });

  it("leaves the gate closed when the hunter stays away", () => {
    const w = createWorld(3);
    freezeYard(w);
    w.px = GATE_X + 120;
    w.py = GATE_Y;
    for (let i = 0; i < 40; i++) step(w, idle);
    expect(w.gate).toBe(0);
    expect(w.holdLeft).toBe(0);
  });

  it("opens the gate on contact and starts a 04:00 hold", () => {
    const w = createWorld(4);
    freezeYard(w);
    w.px = GATE_X;
    w.py = GATE_Y;
    step(w, idle);
    expect(w.gate).toBe(1);
    expect(w.holdLeft).toBe(HOLD_TICKS);
    expect(holdClock(w.holdLeft)).toBe("04:00");
    const rows = objectiveRows(w);
    expect(rows[0]?.done).toBe(true);
    expect(rows[1]?.done).toBe(false);
    expect(rows[1]?.clock).toBe("(04:00)");
  });

  it("does not reset an open hold when the hunter stays on the gate", () => {
    const w = createWorld(5);
    freezeYard(w);
    w.px = GATE_X;
    w.py = GATE_Y;
    step(w, idle);
    const left = w.holdLeft;
    step(w, idle);
    expect(w.gate).toBe(1);
    expect(w.holdLeft).toBe(left - 1);
  });

  it("checks hold the area when the timer expires", () => {
    const w = createWorld(6);
    freezeYard(w);
    w.gate = 1;
    w.holdLeft = 2;
    step(w, idle);
    expect(holdDone(w)).toBe(false);
    step(w, idle);
    expect(w.holdLeft).toBe(0);
    expect(holdDone(w)).toBe(true);
    expect(objectiveRows(w)[1]?.done).toBe(true);
    expect(objectiveRows(w)[1]?.clock).toBe("");
  });

  it("shows wave 4/8 mid chapter and 8/8 after the last wave", () => {
    const w = createWorld(7);
    w.wave = 4;
    expect(waveFace(w)).toEqual({ n: 4, of: 8 });
    expect(objectiveRows(w)[2]?.done).toBe(false);
    w.wave = 8;
    expect(waveFace(w)).toEqual({ n: 8, of: 8 });
    expect(objectiveRows(w)[2]?.done).toBe(true);
    w.wave = 12;
    expect(waveFace(w)).toEqual({ n: 8, of: 8 });
  });

  it("counts a kill without using it as an objective flag", () => {
    const w = createWorld(8);
    freezeYard(w);
    w.zombies.alive[0] = 1;
    w.zombies.kind[0] = Z_SHAMBLER;
    w.zombies.hp[0] = 1;
    w.zombies.x[0] = w.px + 20;
    w.zombies.y[0] = w.py;
    hurtZombie(w, 0, 4);
    killZombie(w, 0);
    const rows = objectiveRows(w);
    expect(rows[0]?.done).toBe(false);
    expect(rows[1]?.done).toBe(false);
    expect(rows[2]?.done).toBe(false);
    expect(w.kills).toBe(1);
  });
});
