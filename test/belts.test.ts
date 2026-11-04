import { BELTS, BELT_DROP_EVERY, beltEndX, beltEndY, stepBelts } from "../src/sim/belts";
import { MAX_CHESTS } from "../src/sim/chest";
import { createWorld } from "../src/sim/world";
import { PHONE_CAM, yardKindHits } from "../src/render/yard-fx";

describe("upgrade belts", () => {
  it("keeps painted belts on the phone crop", () => {
    expect(BELTS.length).toBeGreaterThanOrEqual(6);
    expect(yardKindHits("conveyor", PHONE_CAM.x0, PHONE_CAM.y0, PHONE_CAM.x1, PHONE_CAM.y1)).toBe(BELTS.length);
  });

  it("holds the first chest past the eight-minute power window", () => {
    expect(BELT_DROP_EVERY).toBeGreaterThan(60 * 60 * 8);
    const early = createWorld(3);
    early.tick = 7800;
    stepBelts(early);
    expect(Array.from(early.chestOn).some((v) => v === 1)).toBe(false);
  });

  it("drops a chest when a belt finishes a cycle", () => {
    const w = createWorld(3);
    w.tick = BELT_DROP_EVERY;
    stepBelts(w);
    let n = 0;
    let x = 0;
    let y = 0;
    for (let i = 0; i < MAX_CHESTS; i++) {
      if (!w.chestOn[i]) continue;
      n++;
      x = w.chestX[i] ?? 0;
      y = w.chestY[i] ?? 0;
    }
    expect(n).toBe(1);
    const belt = BELTS[((BELT_DROP_EVERY / BELT_DROP_EVERY) | 0) % BELTS.length];
    expect(belt).toBeTruthy();
    expect(x).toBe(beltEndX(belt!));
    expect(y).toBe(beltEndY(belt!));
  });

  it("does not drop on tick zero", () => {
    const w = createWorld(4);
    w.tick = 0;
    stepBelts(w);
    expect(Array.from(w.chestOn).some((v) => v === 1)).toBe(false);
  });
});
