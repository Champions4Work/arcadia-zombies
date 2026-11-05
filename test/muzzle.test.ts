import { particleCount, resetJuice } from "../src/render/juice";
import { fireRivet } from "../src/sim/weapons.hot";
import { createWorld } from "../src/sim/world";
import { bodyReach, FOE_BODY, foeBodyHit } from "../src/sim/hit";
import { MUZZLE_HAND_X, MUZZLE_HAND_Y, MUZZLE_RIVET, muzzleX, muzzleY } from "../src/sim/muzzle";
import { FX_FLASH, MAX_BULLETS, MAX_FX, MAX_ZOMBIES, WPN_RIVET } from "../src/sim/types";

function quietAim(seed: number, dx: number, dy: number): ReturnType<typeof createWorld> {
  const w = createWorld(seed);
  w.toSpawn = 99;
  w.spawnCd = 99999;
  w.wave = 1;
  w.fireCd = 99999;
  w.px = 200;
  w.py = 180;
  const z = w.zombies;
  for (let i = 0; i < MAX_ZOMBIES; i++) {
    if (z.alive[i]) continue;
    z.alive[i] = 1;
    z.x[i] = w.px + dx;
    z.y[i] = w.py + dy;
    z.hp[i] = 40;
    z.kind[i] = 0;
    break;
  }
  return w;
}

function firstShot(w: ReturnType<typeof createWorld>): number {
  const b = w.bullets;
  for (let j = 0; j < MAX_BULLETS; j++) if (b.alive[j]) return j;
  throw new Error("no shot");
}

describe("rivet spawn", () => {
  it("places the shot at the gun muzzle, not the entity origin", () => {
    const w = quietAim(11, 80, 0);
    fireRivet(w);
    const j = firstShot(w);
    const ux = 1;
    const uy = 0;
    expect(w.aimX).toBeGreaterThan(0.9);
    expect(w.bullets.x[j]).toBeCloseTo(muzzleX(w.px, ux, uy, WPN_RIVET), 5);
    expect(w.bullets.y[j]).toBeCloseTo(muzzleY(w.py, ux, uy, WPN_RIVET), 5);
    expect(w.bullets.x[j]).toBeCloseTo(w.px + MUZZLE_HAND_X + MUZZLE_RIVET, 5);
    expect(w.bullets.y[j]).toBeCloseTo(w.py + MUZZLE_HAND_Y, 5);
    expect(w.bullets.x[j]).not.toBeCloseTo(w.px, 5);
    expect(w.bullets.y[j]).not.toBeCloseTo(w.py, 5);
  });

  it("emits the muzzle flash at the same offset", () => {
    const w = quietAim(12, 90, 20);
    fireRivet(w);
    const j = firstShot(w);
    let found = 0;
    for (let i = 0; i < MAX_FX; i++) {
      if ((w.fxKind[i] ?? 0) !== FX_FLASH) continue;
      expect(w.fxX[i]).toBeCloseTo(w.bullets.x[j] ?? 0, 5);
      expect(w.fxY[i]).toBeCloseTo(w.bullets.y[j] ?? 0, 5);
      found = 1;
    }
    expect(found).toBe(1);
  });

  it("ejects flying brass from the same muzzle", () => {
    resetJuice();
    const w = quietAim(14, 70, 0);
    fireRivet(w);
    expect(particleCount()).toBe(4);
  });

  it("aims up-left still leaves the spawn on the barrel, not the feet", () => {
    const w = quietAim(13, -60, -80);
    fireRivet(w);
    const j = firstShot(w);
    const mx = muzzleX(w.px, w.aimX, w.aimY, WPN_RIVET);
    const my = muzzleY(w.py, w.aimX, w.aimY, WPN_RIVET);
    expect(w.bullets.x[j]).toBeCloseTo(mx, 3);
    expect(w.bullets.y[j]).toBeCloseTo(my, 3);
    expect(Math.hypot((w.bullets.x[j] ?? 0) - w.px, (w.bullets.y[j] ?? 0) - w.py)).toBeGreaterThan(20);
  });
});

describe("body reach", () => {
  it("counts a chest-high shot as a hit on a foe standing at the same feet", () => {
    expect(foeBodyHit(0, 200, 180, 200, 180 - FOE_BODY)).toBe(1);
    expect(bodyReach(200, 180, 200, 180 - 36, 100)).toBe(1);
    expect(bodyReach(200, 180, 200, 40, 100)).toBe(0);
  });
});
