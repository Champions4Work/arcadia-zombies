import { hurtZombie, killZombie } from "../src/sim/combat.hot";
import { killCount } from "../src/sim/finale";
import { foeScore } from "../src/sim/foes";
import { scoreMul } from "../src/sim/difficulty";
import { Z_ELITE } from "../src/sim/foes";
import { MAX_ZOMBIES, Z_GHOUL, Z_SHAMBLER } from "../src/sim/types";
import { createWorld } from "../src/sim/world";

describe("kill credit", () => {
  it("counts one kill per living foe even when many hits land on the corpse", () => {
    const w = createWorld(4);
    w.toSpawn = 0;
    w.fireCd = 99999;
    w.zombies.alive[0] = 1;
    w.zombies.kind[0] = Z_SHAMBLER;
    w.zombies.hp[0] = 1;
    w.zombies.x[0] = w.px + 20;
    w.zombies.y[0] = w.py;
    hurtZombie(w, 0, 4);
    hurtZombie(w, 0, 4);
    hurtZombie(w, 0, 4);
    killZombie(w, 0);
    expect(w.zombies.alive[0]).toBe(0);
    expect(w.kills).toBe(1);
    expect(killCount(w)).toBe(1);
    expect(w.score).toBe(foeScore(Z_SHAMBLER, w.wave, w.rank));
  });

  it("keeps score on rank, not the wave counter", () => {
    expect(foeScore(Z_SHAMBLER, 200, 3)).toBe(10 * scoreMul(3));
    expect(foeScore(Z_GHOUL, 1, 0)).toBe(20 * scoreMul(0));
    expect(foeScore(Z_SHAMBLER | Z_ELITE, 9, 2)).toBe(foeScore(Z_SHAMBLER, 9, 2) * 2);
  });

  it("does not invent kills on empty slots", () => {
    const w = createWorld(5);
    for (let i = 0; i < MAX_ZOMBIES; i++) w.zombies.alive[i] = 0;
    killZombie(w, 0);
    expect(w.kills).toBe(0);
    expect(w.score).toBe(0);
  });
});
