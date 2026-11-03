import { TELE_LIFE } from "../src/sim/arena";
import { teleCount } from "../src/sim/arena.hot";
import { spawnEvery } from "../src/sim/difficulty";
import {
  CRATE_FALL, DROP_HEAL, DROP_LIVE, DROP_SCORE, GEAR_SCORE, MAP_DROP, MAP_GEAR, MAP_LIVE, mapState,
} from "../src/sim/map-events";
import { stepMapEvents } from "../src/sim/map-events.hot";
import {
  applyScore,
  cannonHit,
  clampMods,
  hasMod,
  hordeBudget,
  hordeGap,
  loadMods,
  MOD_DOUBLE,
  MOD_FAST,
  MOD_GEAR,
  MOD_GLASS,
  MOD_LIST,
  MOD_MASK,
  MOD_NOHEAL,
  MODS_KEY,
  modNames,
  pacedXpNeed,
  saveMods,
  scoreBanner,
  scoreHundredths,
  scoreLabel,
  toggleMod,
} from "../src/sim/modifiers";
import { applyUpgrade, offerable, takeXp, xpNeed } from "../src/sim/progress";
import { step } from "../src/sim/step.hot";
import { EV_KILL, MAX_ZOMBIES, UPG_COOLANT, UPG_HP, Z_SHAMBLER, type Input } from "../src/sim/types";
import { createWorld } from "../src/sim/world";

const modWorld = (seed: number, mods = 0) => createWorld(seed, 0, mods);

const idle: Input = { dx: 0, dy: 0, pick: 0 };
const mem = () => {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => (m.has(k) ? m.get(k) ?? null : null),
    setItem: (k: string, v: string) => { m.set(k, v); },
  };
};
const aliveCount = (alive: Uint8Array): number => {
  let n = 0;
  for (let i = 0; i < alive.length; i++) if (alive[i]) n++;
  return n;
};
const freeze = (mods = 0) => {
  const w = modWorld(1, mods);
  w.toSpawn = 8;
  w.spawnCd = 99999;
  w.wave = 2;
  w.fireCd = 99999;
  return w;
};
const pay = (mods: number): number => {
  const w = freeze(mods);
  w.fireCd = 0;
  w.zombies.alive[0] = 1;
  w.zombies.kind[0] = Z_SHAMBLER;
  w.zombies.hp[0] = 1;
  w.zombies.x[0] = w.px + 20;
  w.zombies.y[0] = w.py;
  w.zombies.vx[0] = 0;
  for (let t = 0; t < 40; t++) {
    step(w, idle);
    if ((w.events[EV_KILL] ?? 0) > 0) return w.score;
  }
  return w.score;
};

describe("run modifier picks", () => {
  it("stacks score multipliers in list order and labels them", () => {
    expect(scoreHundredths(0)).toBe(100);
    expect(scoreLabel(0)).toBe("×1.00");
    expect(scoreBanner(0)).toBe("SCORE ×1.00");
    expect(scoreLabel(MOD_DOUBLE)).toBe("×1.50");
    expect(scoreLabel(MOD_GLASS)).toBe("×2.00");
    expect(scoreLabel(MOD_NOHEAL)).toBe("×1.50");
    expect(scoreLabel(MOD_FAST)).toBe("×1.40");
    expect(scoreLabel(MOD_GEAR)).toBe("×0.80");
    expect(scoreHundredths(MOD_MASK)).toBe(504);
    expect(scoreLabel(MOD_MASK)).toBe("×5.04");
    expect(scoreLabel(MOD_DOUBLE | MOD_GEAR)).toBe("×1.20");
    expect(modNames(MOD_GLASS | MOD_FAST)).toBe("Glass Cannon · Fast Zombies");
    expect(modNames(0)).toBe("");
  });

  it("ignores unknown bits and toggles a single modifier", () => {
    expect(clampMods(-1)).toBe(0);
    expect(clampMods(Number.NaN)).toBe(0);
    expect(clampMods(32)).toBe(0);
    expect(clampMods(1.9)).toBe(MOD_DOUBLE);
    expect(toggleMod(0, MOD_FAST)).toBe(MOD_FAST);
    expect(toggleMod(MOD_FAST, MOD_FAST)).toBe(0);
    expect(toggleMod(MOD_GLASS, 0)).toBe(MOD_GLASS);
    expect(hasMod(MOD_GLASS | MOD_GEAR, MOD_GEAR)).toBe(true);
    expect(hasMod(MOD_GLASS, MOD_GEAR)).toBe(false);
    expect(MOD_LIST).toHaveLength(5);
  });

  it("saves the pick in localStorage and drops garbage", () => {
    const store = mem();
    expect(loadMods(store)).toBe(0);
    saveMods(store, MOD_FAST | MOD_GLASS | 512);
    expect(store.getItem(MODS_KEY)).toBe(String(MOD_FAST | MOD_GLASS));
    expect(loadMods(store)).toBe(MOD_FAST | MOD_GLASS);
    store.setItem(MODS_KEY, "nope");
    expect(loadMods(store)).toBe(0);
    store.setItem(MODS_KEY, "-4");
    expect(loadMods(store)).toBe(0);
  });

  it("leaves a plain run's score untouched and multiplies a modified kill", () => {
    const plain = pay(0);
    expect(plain).toBeGreaterThan(0);
    expect(applyScore(plain, 0)).toBe(plain);
    expect(pay(MOD_DOUBLE)).toBe(applyScore(plain, MOD_DOUBLE));
    expect(pay(MOD_GEAR)).toBe(applyScore(plain, MOD_GEAR));
    expect(pay(MOD_MASK)).toBe(applyScore(plain, MOD_MASK));
    expect(applyScore(10, MOD_GEAR)).toBe(8);
  });
});

describe("run modifier difficulty", () => {
  it("doubles the wave and halves the spawn gap", () => {
    const open = (mods: number) => {
      const w = modWorld(1, mods);
      step(w, idle);
      return w;
    };
    const plain = open(0);
    const dual = open(MOD_DOUBLE);
    expect(plain.wave).toBe(1);
    expect(teleCount(plain)).toBe(1);
    expect(aliveCount(plain.zombies.alive)).toBe(0);
    expect(teleCount(plain) + plain.toSpawn).toBe(6);
    expect(teleCount(dual) + dual.toSpawn).toBe(hordeBudget(6, MOD_DOUBLE));
    expect(dual.spawnCd).toBe(hordeGap(spawnEvery(0), MOD_DOUBLE));
    expect(dual.spawnCd).toBe(plain.spawnCd >> 1);
  });

  it("starts glass cannon on one heart and doubles rivet damage", () => {
    const glass = modWorld(4, MOD_GLASS);
    expect(glass.hp).toBe(1);
    expect(glass.maxHp).toBe(1);
    expect(cannonHit(3, MOD_GLASS)).toBe(6);
    const hit = (mods: number): number => {
      const w = freeze(mods);
      const i = 0;
      w.zombies.alive[i] = 1;
      w.zombies.kind[i] = Z_SHAMBLER;
      w.zombies.hp[i] = 2;
      w.zombies.x[i] = 40;
      w.zombies.y[i] = 40;
      w.bullets.alive[0] = 1;
      w.bullets.x[0] = 40;
      w.bullets.y[0] = 40;
      w.bHit[0] = -1;
      step(w, idle);
      return w.zombies.alive[i] ? (w.zombies.hp[i] ?? 0) : 0;
    };
    expect(hit(0)).toBe(1);
    expect(hit(MOD_GLASS)).toBe(0);
    applyUpgrade(glass, UPG_HP);
    expect(glass.maxHp).toBe(2);
    expect(glass.hp).toBe(2);
  });

  it("blocks coolant and the max-hp refill", () => {
    const w = freeze(MOD_NOHEAL);
    applyUpgrade(w, UPG_COOLANT);
    w.hp = 1;
    w.healCd = 1;
    w.arena.healAlive[0] = 1;
    w.arena.healX[0] = w.px;
    w.arena.healY[0] = w.py;
    step(w, idle);
    expect(w.hp).toBe(1);
    expect(w.arena.healAlive[0]).toBe(1);
    const open = freeze(0);
    open.hp = 1;
    open.arena.healAlive[0] = 1;
    open.arena.healX[0] = open.px;
    open.arena.healY[0] = open.py;
    step(open, idle);
    expect(open.hp).toBe(2);
    expect(open.arena.healAlive[0]).toBe(0);
    w.hp = 2;
    applyUpgrade(w, UPG_HP);
    expect(w.maxHp).toBe(6);
    expect(w.hp).toBe(2);
    const both = modWorld(2, MOD_GLASS | MOD_NOHEAL);
    applyUpgrade(both, UPG_HP);
    expect(both.maxHp).toBe(2);
    expect(both.hp).toBe(1);
    expect(offerable(w, UPG_COOLANT)).toBe(false);
    expect(offerable(modWorld(1, 0), UPG_COOLANT)).toBe(true);
  });

  it("speeds the dead without changing the seed's path", () => {
    const sample = (mods: number): number => {
      const w = modWorld(8, mods);
      w.toSpawn = 1;
      w.spawnCd = 1;
      w.wave = 1;
      w.fireCd = 99999;
      step(w, idle);
      expect(teleCount(w)).toBe(1);
      for (let t = 0; t < TELE_LIFE; t++) step(w, idle);
      for (let i = 0; i < MAX_ZOMBIES; i++) {
        if (w.zombies.alive[i]) return w.zombies.vx[i] ?? 0;
      }
      return 0;
    };
    const plain = sample(0);
    const fast = sample(MOD_FAST);
    expect(plain).toBeGreaterThan(0);
    expect(fast / plain).toBeCloseTo(1.5, 5);
  });

  it("withholds crate healing and multiplies crate and gear scores", () => {
    const plantCrate = (mods: number) => {
      const w = modWorld(5, mods);
      w.hp = 2;
      const m = mapState(w);
      m.kind = MAP_DROP;
      m.phase = MAP_LIVE;
      m.crate = 1;
      m.life = DROP_LIVE - CRATE_FALL;
      m.x = w.px;
      m.y = w.py;
      const before = w.score;
      stepMapEvents(w);
      return { hp: w.hp, gain: w.score - before };
    };
    const plain = plantCrate(0);
    expect(plain.hp).toBe(2 + DROP_HEAL);
    expect(plain.gain).toBe(DROP_SCORE);
    const sealed = plantCrate(MOD_NOHEAL | MOD_DOUBLE);
    expect(sealed.hp).toBe(2);
    expect(sealed.gain).toBe(applyScore(DROP_SCORE, MOD_NOHEAL | MOD_DOUBLE));
    const rain = (mods: number) => {
      const w = modWorld(6, mods);
      const m = mapState(w);
      m.kind = MAP_GEAR;
      m.phase = MAP_LIVE;
      m.life = 40;
      m.gearOn[0] = 1;
      m.gearX[0] = w.px;
      m.gearY[0] = w.py;
      m.gearVy[0] = 0;
      const before = w.score;
      stepMapEvents(w);
      return w.score - before;
    };
    expect(rain(0)).toBe(GEAR_SCORE);
    expect(rain(MOD_GEAR)).toBe(applyScore(GEAR_SCORE, MOD_GEAR));
  });

  it("opens a level at half the scrap", () => {
    expect(pacedXpNeed(xpNeed(0), 0)).toBe(xpNeed(0));
    expect(pacedXpNeed(xpNeed(0), MOD_GEAR)).toBe(2);
    const rush = modWorld(3, MOD_GEAR);
    takeXp(rush, 2);
    expect(rush.level).toBe(1);
    expect(rush.choosing).toBe(1);
    const plain = createWorld(3);
    takeXp(plain, 2);
    expect(plain.level).toBe(0);
    expect(plain.choosing).toBe(0);
  });

  it("stays deterministic for the same seed and modifiers", () => {
    const run = (seed: number, mods: number) => {
      const w = modWorld(seed, mods);
      for (let t = 0; t < 500; t++) step(w, { dx: t & 1 ? 1 : -1, dy: 0, pick: 1 });
      return { score: w.score, wave: w.wave, hp: w.hp, px: w.px, level: w.level, mods: w.mods };
    };
    expect(run(11, MOD_MASK)).toEqual(run(11, MOD_MASK));
    expect(run(11, MOD_MASK)).not.toEqual(run(11, 0));
    expect(run(11, 0).mods).toBe(0);
  });
});
