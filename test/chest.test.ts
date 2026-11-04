import { chestContinueHit, chestSkipKey, CONT_H, CONT_W, continueRect } from "../src/render/chestFx";
import { atlasHas, blurbFor } from "../src/render/icons";
import { ARENA_H, ARENA_W } from "../src/sim/arena";
import {
  CHEST_SLOTS, chestLanded, dropChest, ELITE_DROP, ELITE_MARK, MAX_CHESTS, REVEAL_HI, REVEAL_LO,
  rollChestCount, rollEliteDrop, TIER_FIVE, TIER_ONE, TIER_THREE,
} from "../src/sim/chest";
import { killZombie } from "../src/sim/combat.hot";
import { armDevJump, FINALE_SEC, harmLich, lichUp, lichX, lichY, setRunEndless } from "../src/sim/finale";
import { createRng, nextFloat } from "../src/sim/rng";
import { step } from "../src/sim/step.hot";
import {
  EV_CHEST, EVOL_AEGIS, EVOL_CANNON, EVOL_STORM, UPG_COUNT, UPG_FIRE, UPG_HP, UPG_MAX,
  UPG_PIERCE, UPG_SAWS, UPG_SHIELD, UPG_SHOTGUN, UPG_TESLA, UPG_VENT, Z_BRUTE, Z_SHAMBLER,
  type Input, type World,
} from "../src/sim/types";
import { createWorld } from "../src/sim/world";

const idle = (skip = 0): Input => ({ dx: 0, dy: 0, pick: 0, skip });

function freeze(w: World): void {
  w.toSpawn = 80;
  w.spawnCd = 99999;
  w.fireCd = 99999;
  w.wave = 2;
}

function chestCount(w: World): number {
  let n = 0;
  for (let i = 0; i < MAX_CHESTS; i++) if (w.chestOn[i]) n++;
  return n;
}

function prizes(w: World): number[] {
  const out: number[] = [];
  for (let i = 0; i < w.chestCount; i++) out.push(w.chestPrize[i] ?? -1);
  return out;
}

function stir(w: World, n: number): void {
  for (let i = 0; i < n; i++) nextFloat(w.rng);
}

function openAtFeet(seed: number): World {
  const w = createWorld(seed);
  freeze(w);
  dropChest(w, w.px, w.py);
  step(w, idle());
  return w;
}

function killKind(seed: number, kind: number): World {
  const w = createWorld(seed);
  freeze(w);
  w.upgrades.fill(UPG_MAX);
  w.zombies.alive[0] = 1;
  w.zombies.kind[0] = kind;
  w.zombies.hp[0] = 1;
  w.zombies.x[0] = w.px + 40;
  w.zombies.y[0] = w.py;
  const before = w.xp;
  killZombie(w, 0);
  expect(w.xp).toBeGreaterThan(before);
  expect(w.zombies.alive[0]).toBe(0);
  return w;
}

describe("chest tier odds", () => {
  it("rolls 1, 3, and 5 at 70/25/5 across 10000 seeded draws", () => {
    expect(TIER_ONE).toBe(0.7);
    expect(TIER_THREE).toBe(0.25);
    expect(TIER_FIVE).toBe(0.05);
    const rng = createRng(20261103);
    let one = 0;
    let three = 0;
    let five = 0;
    for (let i = 0; i < 10000; i++) {
      const n = rollChestCount(rng);
      if (n === 1) one++;
      else if (n === 3) three++;
      else if (n === 5) five++;
    }
    expect(one + three + five).toBe(10000);
    expect(one / 10000).toBeGreaterThanOrEqual(0.68);
    expect(one / 10000).toBeLessThanOrEqual(0.72);
    expect(three / 10000).toBeGreaterThanOrEqual(0.23);
    expect(three / 10000).toBeLessThanOrEqual(0.27);
    expect(five / 10000).toBeGreaterThanOrEqual(0.035);
    expect(five / 10000).toBeLessThanOrEqual(0.065);
    const again = createRng(20261103);
    let one2 = 0;
    let three2 = 0;
    let five2 = 0;
    for (let i = 0; i < 10000; i++) {
      const n = rollChestCount(again);
      if (n === 1) one2++;
      else if (n === 3) three2++;
      else if (n === 5) five2++;
    }
    expect([one2, three2, five2]).toEqual([one, three, five]);
  });

  it("elite kills drop a chest on 15 percent of seeded rolls and bosses always place one", () => {
    expect(ELITE_DROP).toBe(0.15);
    const rng = createRng(99);
    let hits = 0;
    for (let i = 0; i < 10000; i++) if (rollEliteDrop(rng)) hits++;
    expect(hits / 10000).toBeGreaterThanOrEqual(0.13);
    expect(hits / 10000).toBeLessThanOrEqual(0.17);
    const w = createWorld(3);
    for (let i = 0; i < 30; i++) dropChest(w, 30 + i, 50);
    expect(chestCount(w)).toBe(MAX_CHESTS);
    let found = false;
    for (let i = 0; i < MAX_CHESTS; i++) if ((w.chestX[i] ?? 0) === 30 + 29) found = true;
    expect(found).toBe(true);
  });
});

describe("chest rewards", () => {
  it("gives a ready evolution before any other upgrade", () => {
    let saw: number[] = [];
    for (let seed = 1; seed < 200 && saw.length < 3; seed++) {
      const w = createWorld(seed);
      freeze(w);
      w.upgrades.fill(UPG_MAX);
      w.upgrades[EVOL_STORM] = 0;
      w.upgrades[EVOL_CANNON] = 0;
      w.upgrades[EVOL_AEGIS] = 0;
      stir(w, 8);
      dropChest(w, w.px, w.py);
      step(w, idle());
      expect(w.chestOpen).toBe(1);
      expect(w.chestPrize[0]).toBe(EVOL_STORM);
      expect(w.upgrades[EVOL_STORM]).toBe(1);
      if (w.chestCount >= 3) saw = prizes(w);
    }
    expect(saw.length).toBe(3);
    expect(new Set(saw)).toEqual(new Set([EVOL_STORM, EVOL_CANNON, EVOL_AEGIS]));
    expect(saw[0]).toBe(EVOL_STORM);
  });

  it("never grants a maxed upgrade or an evolution that is not ready", () => {
    const seen = new Set<number>();
    for (let seed = 1; seed <= 25; seed++) {
      const w = createWorld(seed);
      freeze(w);
      w.upgrades[UPG_HP] = UPG_MAX;
      w.upgrades[EVOL_STORM] = UPG_MAX;
      dropChest(w, w.px, w.py);
      step(w, idle());
      expect(w.chestCount).toBeGreaterThan(0);
      for (let i = 0; i < w.chestCount; i++) {
        const id = w.chestPrize[i] ?? -1;
        seen.add(id);
        expect(id).not.toBe(UPG_HP);
        expect(id).not.toBe(EVOL_STORM);
        expect(id).not.toBe(EVOL_CANNON);
        expect(id).not.toBe(EVOL_AEGIS);
        expect(w.upgrades[id] ?? 0).toBeLessThanOrEqual(UPG_MAX);
      }
      expect(w.upgrades[UPG_HP]).toBe(UPG_MAX);
      expect(w.upgrades[EVOL_STORM]).toBe(UPG_MAX);
    }
    expect(seen.size).toBeGreaterThan(3);
    const only = createWorld(7);
    freeze(only);
    only.upgrades.fill(UPG_MAX);
    only.upgrades[UPG_FIRE] = UPG_MAX - 2;
    dropChest(only, only.px, only.py);
    step(only, idle());
    expect(prizes(only)).toEqual([UPG_FIRE]);
    expect(only.upgrades[UPG_FIRE]).toBe(UPG_MAX - 1);
    dropChest(only, only.px, only.py);
    while (!chestLanded(only)) step(only, idle());
    step(only, idle(1));
    step(only, idle());
    expect(prizes(only)).toEqual([UPG_FIRE]);
    expect(only.upgrades[UPG_FIRE]).toBe(UPG_MAX);
    while (!chestLanded(only)) step(only, idle());
    step(only, idle(1));
    dropChest(only, only.px, only.py);
    step(only, idle());
    expect(only.chestOpen).toBe(0);
    expect(only.upgrades[UPG_FIRE]).toBe(UPG_MAX);
    expect(chestCount(only)).toBe(0);
  });

  it("same seed grants the same chest", () => {
    const a = openAtFeet(42);
    const b = openAtFeet(42);
    expect(prizes(a)).toEqual(prizes(b));
    expect(a.chestDur).toBe(b.chestDur);
    expect(Array.from(a.upgrades)).toEqual(Array.from(b.upgrades));
    expect(prizes(openAtFeet(42))).not.toEqual(prizes(openAtFeet(99)));
  });
});

describe("opening a chest", () => {
  it("opens when the boiler walks over it and pauses the run", () => {
    const w = createWorld(4);
    freeze(w);
    dropChest(w, w.px + 90, w.py);
    step(w, idle());
    expect(w.chestOpen).toBe(0);
    expect(chestCount(w)).toBe(1);
    for (let t = 0; t < 80 && !w.chestOpen; t++) step(w, { dx: 1, dy: 0, pick: 0 });
    expect(w.chestOpen).toBe(1);
    expect(chestCount(w)).toBe(0);
    expect(w.events[EV_CHEST]).toBe(1);
    const tick = w.tick;
    const px = w.px;
    const far = w.zombies;
    far.alive[0] = 1;
    far.x[0] = 20;
    far.y[0] = 40;
    far.vx[0] = 1;
    far.hp[0] = 9;
    step(w, { dx: 1, dy: 0, pick: 0 });
    expect(w.tick).toBe(tick);
    expect(w.px).toBe(px);
    expect(w.zombies.x[0]).toBe(20);
    expect(w.chestDur).toBeGreaterThanOrEqual(REVEAL_LO);
    expect(w.chestDur).toBeLessThanOrEqual(REVEAL_HI);
    let n = 1;
    while (!chestLanded(w) && n < 200) {
      step(w, idle());
      n++;
    }
    expect(w.chestOpen).toBe(1);
    expect(chestLanded(w)).toBe(true);
    expect(n).toBe(w.chestDur);
    const granted = prizes(w);
    expect(granted.length).toBeGreaterThan(0);
    const levels = Array.from(w.upgrades);
    step(w, idle());
    expect(w.chestOpen).toBe(1);
    expect(w.tick).toBe(tick);
    expect(Array.from(w.upgrades)).toEqual(levels);
    step(w, idle(1));
    expect(w.chestOpen).toBe(0);
    expect(Array.from(w.upgrades)).toEqual(levels);
    const moved = w.px;
    step(w, { dx: 1, dy: 0, pick: 0 });
    expect(w.tick).toBe(tick + 1);
    expect(w.px).toBeGreaterThan(moved);
  });

  it("space skips a reveal and a held move key does not", () => {
    expect(chestSkipKey(" ", false)).toBe(true);
    expect(chestSkipKey("Enter", false)).toBe(true);
    expect(chestSkipKey("f", false)).toBe(true);
    expect(chestSkipKey(" ", true)).toBe(false);
    expect(chestSkipKey("ArrowRight", false)).toBe(false);
    expect(chestSkipKey("d", false)).toBe(false);
    expect(chestSkipKey("Escape", false)).toBe(false);
    const btn = continueRect();
    expect(btn.w).toBe(CONT_W);
    expect(btn.h).toBe(CONT_H);
    expect(chestContinueHit(btn.x + 4, btn.y + 4)).toBe(true);
    expect(chestContinueHit(0, 0)).toBe(false);
  });

  it("a tap or key during the spin does not close, and continue after the land resumes", () => {
    const w = openAtFeet(11);
    const granted = prizes(w);
    const levels = Array.from(w.upgrades);
    const tick = w.tick;
    expect(chestLanded(w)).toBe(false);
    step(w, idle(1));
    expect(w.chestOpen).toBe(1);
    expect(chestLanded(w)).toBe(false);
    expect(w.tick).toBe(tick);
    while (!chestLanded(w)) step(w, idle());
    expect(w.chestOpen).toBe(1);
    step(w, idle(1));
    expect(w.chestOpen).toBe(0);
    expect(w.tick).toBe(tick);
    expect(Array.from(w.upgrades)).toEqual(levels);
    expect(granted.length).toBeGreaterThan(0);
    expect(granted.length).toBeLessThanOrEqual(CHEST_SLOTS);
    step(w, { dx: 0, dy: 1, pick: 0 });
    expect(w.tick).toBe(tick + 1);
  });

  it("a normal kill pays xp instantly and does not drop a chest", () => {
    const w = killKind(5, Z_SHAMBLER);
    expect(chestCount(w)).toBe(0);
    const tally = (elite: boolean, n: number): number => {
      const w = createWorld(11);
      freeze(w);
      w.upgrades.fill(UPG_MAX);
      let drops = 0;
      for (let i = 0; i < n; i++) {
        w.chestOn.fill(0);
        w.zombies.alive[0] = 1;
        w.zombies.kind[0] = elite ? Z_BRUTE | ELITE_MARK : Z_BRUTE;
        w.zombies.hp[0] = 1;
        w.zombies.x[0] = w.px + 40;
        w.zombies.y[0] = w.py;
        killZombie(w, 0);
        if (chestCount(w) > 0) drops++;
      }
      return drops;
    };
    const elites = tally(true, 2000);
    expect(elites / 2000).toBeGreaterThanOrEqual(0.12);
    expect(elites / 2000).toBeLessThanOrEqual(0.18);
    expect(tally(false, 400)).toBe(0);
  });

  it("does not offer an evolution until its parts are ready", () => {
    const w = createWorld(8);
    freeze(w);
    w.upgrades[UPG_TESLA] = 2;
    w.upgrades[UPG_SAWS] = 1;
    w.upgrades[UPG_SHOTGUN] = 2;
    w.upgrades[UPG_PIERCE] = 1;
    w.upgrades[UPG_SHIELD] = 2;
    w.upgrades[UPG_VENT] = 1;
    dropChest(w, w.px, w.py);
    step(w, idle());
    for (let i = 0; i < w.chestCount; i++) {
      const id = w.chestPrize[i] ?? -1;
      expect(id).not.toBe(EVOL_STORM);
      expect(id).not.toBe(EVOL_CANNON);
      expect(id).not.toBe(EVOL_AEGIS);
    }
    expect(w.upgrades[EVOL_STORM] ?? 0).toBe(0);
  });

  it("clamps a chest back into the arena", () => {
    const w = createWorld(1);
    dropChest(w, -40, 9000);
    expect(w.chestX[0]).toBe(16);
    expect(w.chestY[0]).toBe(ARENA_H - 16);
    expect(w.chestX[0]).toBeLessThanOrEqual(ARENA_W - 16);
    expect(w.chestY[0]).toBeGreaterThanOrEqual(24);
  });

  it("a lich always drops a chest, and a finished run opens it before the gears stop", () => {
    const ended = createWorld(3);
    armDevJump(ended, FINALE_SEC);
    freeze(ended);
    ended.wpnCd.fill(9999);
    setRunEndless(ended, false);
    step(ended, idle());
    expect(lichUp(ended)).toBe(true);
    harmLich(ended, 99999);
    step(ended, idle());
    expect(ended.chestOpen).toBe(1);
    expect(ended.over).toBe(false);
    expect(chestCount(ended)).toBe(0);
    expect(ended.chestCount).toBeGreaterThan(0);
    const tick = ended.tick;
    step(ended, idle());
    expect(ended.tick).toBe(tick);
    while (ended.chestOpen) step(ended, idle(1));
    let guard = 0;
    while (!ended.over && guard < 40) {
      step(ended, idle());
      guard++;
    }
    expect(ended.over).toBe(true);

    const endless = createWorld(4);
    armDevJump(endless, FINALE_SEC);
    freeze(endless);
    endless.wpnCd.fill(9999);
    setRunEndless(endless, true);
    step(endless, idle());
    harmLich(endless, 99999);
    step(endless, idle());
    expect(endless.over).toBe(false);
    expect(endless.chestOpen).toBe(0);
    expect(chestCount(endless)).toBe(1);
    expect(endless.chestX[0] ?? 0).toBeCloseTo(lichX(endless), 4);
    expect(endless.chestY[0] ?? 0).toBeCloseTo(lichY(endless), 4);
  });
});

describe("chest cards", () => {
  it("keeps every upgrade on the icon atlas with a name and a description", () => {
    for (let id = 0; id < UPG_COUNT; id++) {
      expect(atlasHas(id)).toBe(true);
      expect(blurbFor(id).length).toBeGreaterThan(8);
    }
    expect(atlasHas(-1)).toBe(false);
    expect(blurbFor(99)).toBe("A new gear for the boiler heart.");
  });
});
