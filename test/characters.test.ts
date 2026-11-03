import {
  BEST_WAVE_KEY,
  CHAR_ALCHEMIST,
  CHAR_BRUTE,
  CHAR_GUNSLINGER,
  CHAR_TINKER,
  CHARACTERS,
  characterAt,
  isUnlocked,
  loadRoster,
  noteWave,
  offerCount,
  RAGE_DMG,
  saveRoster,
  SURVIVOR_KEY,
} from "../src/sim/characters";
import {
  applyUpgrade,
  bulletDmg,
  CARD_GAP,
  CARD_W,
  CARD_X0,
  CARD_Y,
  cardFrame,
  cardSlot,
  fireEvery,
  moveSpeed,
  SAW_SPIN,
  sawAngle,
  sawRadius,
  sawSpin,
  takeXp,
  tryPick,
  xpNeed,
} from "../src/sim/progress";
import { step } from "../src/sim/step.hot";
import { EV_SHOT, UPG_COUNT, UPG_FIRE, UPG_HP, UPG_SAWS, UPG_SPEED, UPG_WPN_RIVET, W, type Input, type World } from "../src/sim/types";
import { applyCharacter, createWorld } from "../src/sim/world";

const mem = () => {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => (m.has(k) ? m.get(k) ?? null : null),
    setItem: (k: string, v: string) => { m.set(k, v); },
  };
};

const quiet = (w: World): void => {
  w.toSpawn = 99;
  w.spawnCd = 99999;
  w.fireCd = 99999;
  w.wave = 1;
};

const addZombie = (w: World, x: number, y: number, hp: number): number => {
  const z = w.zombies;
  for (let i = 0; i < z.alive.length; i++) {
    if (z.alive[i]) continue;
    z.x[i] = x;
    z.y[i] = y;
    z.hp[i] = hp;
    z.vx[i] = 0;
    z.alive[i] = 1;
    return i;
  }
  throw new Error("zombies full");
};

const addBullet = (w: World, x: number, y: number): void => {
  const b = w.bullets;
  for (let j = 0; j < b.alive.length; j++) {
    if (b.alive[j]) continue;
    b.x[j] = x;
    b.y[j] = y;
    b.vx[j] = 0;
    b.vy[j] = 0;
    b.alive[j] = 1;
    w.bHit[j] = -1;
    w.bPierce[j] = 0;
    return;
  }
  throw new Error("bullets full");
};

describe("character init", () => {
  it("lists tinker, gunslinger, alchemist, and brute with two-line kits", () => {
    expect(CHARACTERS.map((c) => c.id)).toEqual(["tinker", "gunslinger", "alchemist", "brute"]);
    expect(CHARACTERS.map((c) => c.name)).toEqual(["Tinker", "Gunslinger", "Alchemist", "Brute"]);
    expect(CHARACTERS.map((c) => c.unlockWave)).toEqual([0, 5, 8, 12]);
    expect(characterAt(CHAR_TINKER).line1).toMatch(/saws orbit faster/i);
    expect(`${characterAt(CHAR_GUNSLINGER).line1} ${characterAt(CHAR_GUNSLINGER).line2}`).toMatch(/30%/);
    expect(`${characterAt(CHAR_GUNSLINGER).line1} ${characterAt(CHAR_GUNSLINGER).line2}`).toMatch(/HP/);
    expect(`${characterAt(CHAR_ALCHEMIST).line1} ${characterAt(CHAR_ALCHEMIST).line2}`).toMatch(/1 of 3/i);
    expect(`${characterAt(CHAR_BRUTE).line1} ${characterAt(CHAR_BRUTE).line2}`).toMatch(/low HP/);
    for (const row of CHARACTERS) {
      expect(row.line1.length).toBeGreaterThan(0);
      expect(row.line2.length).toBeGreaterThan(0);
      expect(row.line1.includes("\n")).toBe(false);
      expect(row.line2.includes("\n")).toBe(false);
    }
  });

  it("tinker keeps the stock kit aside from faster saws", () => {
    const w = createWorld(41);
    expect(w.charId).toBe(CHAR_TINKER);
    expect(w.hp).toBe(5);
    expect(w.maxHp).toBe(5);
    expect(fireEvery(w)).toBe(12);
    expect(moveSpeed(w)).toBe(2);
    expect(bulletDmg(w)).toBe(1);
    expect(offerCount(w)).toBe(2);
    expect(w.offerExtra).toBe(-1);
    expect(sawSpin(w)).toBe(SAW_SPIN * 1.5);
    const kit = Array.from({ length: UPG_COUNT }, () => 0);
    kit[UPG_WPN_RIVET] = 1;
    expect(Array.from(w.upgrades)).toEqual(kit);
    expect(createWorld(1, 99).charId).toBe(CHAR_TINKER);
    expect(createWorld(1, -1).maxHp).toBe(5);
  });

  it("gunslinger starts one HP down and fires about 30% faster", () => {
    const w = createWorld(2, CHAR_GUNSLINGER);
    const stock = createWorld(2, CHAR_TINKER);
    expect(w.hp).toBe(4);
    expect(w.maxHp).toBe(4);
    expect(w.hp).toBe(5 + characterAt(CHAR_GUNSLINGER).hp);
    expect(moveSpeed(w)).toBe(moveSpeed(stock));
    expect(bulletDmg(w)).toBe(bulletDmg(stock));
    expect(fireEvery(w)).toBe(Math.round(12 * 100 / 130));
    expect(12 / fireEvery(w)).toBeCloseTo(1.3, 1);
    expect(sawSpin(w)).toBe(SAW_SPIN);
    const shots = (id: number): number => {
      const run = createWorld(14, id);
      run.toSpawn = 99;
      run.spawnCd = 99999;
      run.fireCd = 0;
      addZombie(run, run.px + 80, run.py, 500);
      let n = 0;
      const input: Input = { dx: 0, dy: 0, pick: 0 };
      for (let t = 0; t < 60; t++) {
        step(run, input);
        if (run.events[EV_SHOT]) n++;
      }
      return n;
    };
    expect(shots(CHAR_GUNSLINGER)).toBeGreaterThan(shots(CHAR_TINKER));
  });

  it("alchemist adds a third draft card without changing the first two", () => {
    const stock = createWorld(9, CHAR_TINKER);
    const w = createWorld(9, CHAR_ALCHEMIST);
    takeXp(stock, xpNeed(0));
    takeXp(w, xpNeed(0));
    expect(w.hp).toBe(stock.hp);
    expect(moveSpeed(w)).toBe(moveSpeed(stock));
    expect(bulletDmg(w)).toBe(1);
    expect(offerCount(w)).toBe(3);
    expect(stock.offers.length).toBe(2);
    expect(Array.from(w.offers)).toEqual(Array.from(stock.offers));
    expect(stock.offerExtra).toBe(-1);
    expect(w.offerExtra).toBeGreaterThanOrEqual(0);
    expect(w.offerExtra).not.toBe(w.offers[0]);
    expect(w.offerExtra).not.toBe(w.offers[1]);
    expect(tryPick(stock, 3)).toBe(false);
    const id = w.offerExtra;
    const before = w.upgrades[id] ?? 0;
    expect(tryPick(w, 3)).toBe(true);
    expect(w.upgrades[id]).toBe(before + 1);
    expect(w.offerExtra).toBe(-1);
    for (let i = 0; i < 3; i++) {
      const f = cardFrame(i, 3);
      expect(cardSlot(f.x + 2, CARD_Y + 2, 3)).toBe(i + 1);
      expect(f.x).toBeGreaterThanOrEqual(0);
      expect(f.x + f.w).toBeLessThanOrEqual(W);
    }
    expect(cardFrame(0, 2).x).toBe(CARD_X0);
    expect(cardFrame(0, 2).w).toBe(CARD_W);
    expect(cardFrame(1, 2).x).toBe(CARD_X0 + CARD_W + CARD_GAP);
    expect(cardSlot(CARD_X0 + 10, CARD_Y + 10)).toBe(1);
  });

  it("brute starts tougher and slower, and hits harder at half HP or less", () => {
    const w = createWorld(5, CHAR_BRUTE);
    const stock = createWorld(5);
    expect(w.hp).toBe(8);
    expect(w.maxHp).toBe(8);
    expect(characterAt(CHAR_BRUTE).speed).toBeLessThan(0);
    expect(moveSpeed(w)).toBe(1.5);
    expect(moveSpeed(w)).toBeLessThan(moveSpeed(stock));
    expect(bulletDmg(w)).toBe(1);
    w.hp = 5;
    expect(bulletDmg(w)).toBe(1);
    w.hp = 4;
    expect(bulletDmg(w)).toBe(1 + RAGE_DMG);
    const struck = (hp: number): number => {
      const run = createWorld(6, CHAR_BRUTE);
      quiet(run);
      run.hp = hp;
      const i = addZombie(run, run.px + 16, run.py, 8);
      addBullet(run, run.px + 16, run.py);
      step(run, { dx: 0, dy: 0, pick: 0 });
      return run.zombies.hp[i] ?? 0;
    };
    expect(struck(2)).toBeLessThan(struck(8));
    expect(sawSpin(w)).toBe(SAW_SPIN);
    expect(fireEvery(w)).toBe(12);
  });

  it("init applies HP, speed, damage, and a listed starting upgrade", () => {
    for (const id of [CHAR_TINKER, CHAR_GUNSLINGER, CHAR_ALCHEMIST, CHAR_BRUTE]) {
      const row = characterAt(id);
      const w = createWorld(7, id);
      expect(w.maxHp).toBe(5 + row.hp);
      expect(w.hp).toBe(w.maxHp);
      expect(moveSpeed(w)).toBe(2 + row.speed);
      expect(bulletDmg(w)).toBe(1 + row.dmg);
      expect(row.startUpg).toBeLessThan(0);
      expect(w.upgrades[UPG_WPN_RIVET]).toBe(1);
      expect(Array.from(w.upgrades).every((n, i) => i === UPG_WPN_RIVET || n === 0)).toBe(true);
    }
    const gun = createWorld(8, CHAR_GUNSLINGER);
    applyCharacter(gun, CHAR_GUNSLINGER, UPG_FIRE);
    expect(gun.upgrades[UPG_FIRE]).toBe(1);
    expect(gun.maxHp).toBe(4);
    expect(fireEvery(gun)).toBe(Math.max(3, Math.round(10 * 100 / 130)));
    const brute = createWorld(8, CHAR_BRUTE);
    applyCharacter(brute, CHAR_BRUTE, UPG_HP);
    expect(brute.upgrades[UPG_HP]).toBe(1);
    expect(brute.maxHp).toBe(9);
    expect(brute.hp).toBe(9);
    const healed = createWorld(1);
    applyUpgrade(healed, UPG_HP);
    expect(healed.maxHp).toBe(6);
    applyUpgrade(gun, UPG_HP);
    expect(gun.maxHp).toBe(5);
    const speedy = createWorld(1, CHAR_BRUTE);
    applyUpgrade(speedy, UPG_SPEED);
    expect(moveSpeed(speedy)).toBe(1.9);
  });

  it("tinker saws strike along the faster orbit", () => {
    const w = createWorld(13, CHAR_TINKER);
    quiet(w);
    applyUpgrade(w, UPG_SAWS);
    w.tick = 3;
    const r = sawRadius(w);
    const a = sawAngle(4, 0, 1, sawSpin(w));
    const near = addZombie(w, w.px + Math.cos(a) * r, w.py + Math.sin(a) * r, 5);
    const far = addZombie(w, w.px + Math.cos(a + Math.PI) * r, w.py + Math.sin(a + Math.PI) * r, 5);
    expect(Math.abs(a)).toBeGreaterThan(Math.abs(sawAngle(4, 0, 1)));
    step(w, { dx: 0, dy: 0, pick: 0 });
    expect(w.zombies.hp[near]).toBeLessThan(5);
    expect(w.zombies.hp[far]).toBe(5);
  });
});

describe("unlock persistence", () => {
  it("keeps the last pick and opens survivors at waves 5, 8, and 12", () => {
    expect(isUnlocked(CHAR_TINKER, 0)).toBe(true);
    expect(isUnlocked(CHAR_GUNSLINGER, 4)).toBe(false);
    expect(isUnlocked(CHAR_GUNSLINGER, 5)).toBe(true);
    expect(isUnlocked(CHAR_ALCHEMIST, 7)).toBe(false);
    expect(isUnlocked(CHAR_ALCHEMIST, 8)).toBe(true);
    expect(isUnlocked(CHAR_BRUTE, 11)).toBe(false);
    expect(isUnlocked(CHAR_BRUTE, 12)).toBe(true);
    const store = mem();
    expect(loadRoster(store)).toEqual({ index: CHAR_TINKER, bestWave: 0 });
    saveRoster(store, CHAR_GUNSLINGER, 0);
    expect(loadRoster(store).index).toBe(CHAR_TINKER);
    expect(store.getItem(SURVIVOR_KEY)).toBe("tinker");
    saveRoster(store, CHAR_GUNSLINGER, 5);
    expect(loadRoster(store)).toEqual({ index: CHAR_GUNSLINGER, bestWave: 5 });
    saveRoster(store, CHAR_BRUTE, 5);
    expect(loadRoster(store).index).toBe(CHAR_GUNSLINGER);
    saveRoster(store, CHAR_ALCHEMIST, 8);
    expect(loadRoster(store)).toEqual({ index: CHAR_ALCHEMIST, bestWave: 8 });
    saveRoster(store, CHAR_BRUTE, 12);
    expect(loadRoster(store)).toEqual({ index: CHAR_BRUTE, bestWave: 12 });
    saveRoster(store, CHAR_TINKER, 0);
    expect(loadRoster(store)).toEqual({ index: CHAR_TINKER, bestWave: 12 });
    expect(store.getItem(BEST_WAVE_KEY)).toBe("12");
    store.setItem(SURVIVOR_KEY, "wizard");
    expect(loadRoster(store).index).toBe(CHAR_TINKER);
    expect(loadRoster(store).bestWave).toBe(12);
    store.setItem(BEST_WAVE_KEY, "8.9");
    store.setItem(SURVIVOR_KEY, "alchemist");
    expect(loadRoster(store)).toEqual({ index: CHAR_ALCHEMIST, bestWave: 8 });
    store.setItem(BEST_WAVE_KEY, "-4");
    store.setItem(SURVIVOR_KEY, "brute");
    expect(loadRoster(store)).toEqual({ index: CHAR_TINKER, bestWave: 0 });
    store.setItem(BEST_WAVE_KEY, "nope");
    expect(loadRoster(store).bestWave).toBe(0);
    expect(noteWave(4, 5)).toBe(5);
    expect(noteWave(12, 3)).toBe(12);
    expect(noteWave(0, -2)).toBe(0);
  });

  it("keeps the last roster when localStorage throws a quota error", () => {
    const store = mem();
    saveRoster(store, CHAR_GUNSLINGER, 5);
    const quota = {
      getItem: (k: string) => store.getItem(k),
      setItem: () => { throw new Error("quota"); },
    };
    expect(() => saveRoster(quota, CHAR_BRUTE, 12)).not.toThrow();
    expect(loadRoster(store)).toEqual({ index: CHAR_GUNSLINGER, bestWave: 5 });
    expect(loadRoster({
      getItem: () => { throw new Error("quota"); },
      setItem: () => undefined,
    })).toEqual({ index: CHAR_TINKER, bestWave: 0 });
    expect(() => saveRoster({
      getItem: () => { throw new Error("quota"); },
      setItem: (k: string, v: string) => { store.setItem(k, v); },
    }, CHAR_TINKER, 0)).not.toThrow();
    expect(loadRoster(store)).toEqual({ index: CHAR_GUNSLINGER, bestWave: 5 });
  });
});
