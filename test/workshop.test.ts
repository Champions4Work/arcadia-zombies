import { scrapEarned, SCRAP_PER_KILL, SCRAP_PER_TIER, SCRAP_TIME_DEN, SCRAP_TIME_NUM } from "../src/meta/scrap";
import {
  applyWorkshop,
  awardRun,
  BONUS_DMG,
  BONUS_GUN,
  BONUS_HP,
  BONUS_SPD,
  cheapestCost,
  emptyWorkshop,
  fitLabel,
  loadWorkshop,
  META_BLURB,
  META_COST,
  META_DMG,
  META_GUN,
  META_HP,
  META_MAX,
  META_N,
  META_NAMES,
  META_REROLL,
  META_REVIVE,
  META_SPD,
  nextCost,
  rackCost,
  saveWorkshop,
  SCRAP_CAP,
  serializeWorkshop,
  tryBuy,
  WORKSHOP_KEY,
  WORKSHOP_VERSION,
  type Workshop,
} from "../src/meta/workshop";
import { CHAR_ALCHEMIST, CHAR_BRUTE, CHAR_GUNSLINGER, offerCount, RAGE_DMG } from "../src/sim/characters";
import { tierAt } from "../src/sim/difficulty";
import { doubledScrap, harmLich, isWon, killCount, lichHp, lichMaxHp, lichUp, seekSeconds } from "../src/sim/finale";
import { cannonHit, MOD_FAST, MOD_GEAR, MOD_GLASS, MOD_NOHEAL } from "../src/sim/modifiers";
import { applyUpgrade, bulletDmg, CARD_H, CARD_Y, fireEvery, maxHpOf, moveSpeed, takeXp, xpNeed } from "../src/sim/progress";
import { REROLL_H, REROLL_W, REROLL_X, REROLL_Y, rerollHit, tryReroll } from "../src/sim/reroll";
import { step } from "../src/sim/step.hot";
import {
  EV_KILL, EV_REVIVE, EV_SHOT, EVOL_CANNON, H, MAX_BULLETS, MAX_ZOMBIES, UPG_DMG, UPG_HP, UPG_MAX, UPG_SPEED, WPN_MORT, type Input, type World,
} from "../src/sim/types";
import { weaponEvery } from "../src/sim/weapons";
import { createWorld } from "../src/sim/world";
import { createTracker, noteKills } from "../src/shell/leaderboard";
import {
  begin,
  closeWorkshop,
  createSession,
  finish,
  onBlur,
  openWorkshop,
  PHASE_OVER,
  PHASE_PAUSE,
  PHASE_TITLE,
  PHASE_WORKSHOP,
  shouldStep,
  togglePause,
} from "../src/shell/session";

const idle = (pick = 0, reroll = 0): Input => ({ dx: 0, dy: 0, pick, reroll });
const freeze = (w: World): void => {
  w.toSpawn = 99;
  w.spawnCd = 99999;
  w.wave = 1;
  w.fireCd = 99999;
};
const mem = () => {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => (m.has(k) ? m.get(k) ?? null : null),
    setItem: (k: string, v: string) => { m.set(k, v); },
  };
};
const addZombie = (w: World, x: number, y: number, hp: number): number => {
  const z = w.zombies;
  for (let i = 0; i < MAX_ZOMBIES; i++) {
    if (z.alive[i]) continue;
    z.x[i] = x;
    z.y[i] = y;
    z.hp[i] = hp;
    z.vx[i] = 0;
    z.alive[i] = 1;
    z.kind[i] = 0;
    return i;
  }
  throw new Error("zombies full");
};
const addBullet = (w: World, x: number, y: number): void => {
  const b = w.bullets;
  for (let j = 0; j < MAX_BULLETS; j++) {
    if (b.alive[j]) continue;
    b.x[j] = x;
    b.y[j] = y;
    b.vx[j] = 0;
    b.vy[j] = 0;
    b.alive[j] = 1;
    w.bHit[j] = -1;
    return;
  }
  throw new Error("bullets full");
};
const fitted = (): Workshop => {
  const shop = emptyWorkshop();
  for (let i = 0; i < META_N; i++) shop.ranks[i] = META_MAX[i] ?? 0;
  return shop;
};

describe("brass scrap", () => {
  it("pays for time survived, rank, and kills", () => {
    expect(scrapEarned(0, 0, 0)).toBe(0);
    expect(scrapEarned(-10, -2, -4)).toBe(0);
    expect(scrapEarned(SCRAP_TIME_DEN, 1, 8)).toBe(SCRAP_TIME_NUM + SCRAP_PER_TIER + 8 * SCRAP_PER_KILL);
    expect(tierAt(60 * 15)).toBe(0);
    expect(scrapEarned(60 * 15, tierAt(60 * 15), 6)).toBeLessThan(cheapestCost());
    expect(scrapEarned(60 * 60, tierAt(60 * 60), 20)).toBeLessThan(META_COST[META_DMG]?.[0] ?? 0);
    expect(scrapEarned(60 * 60, tierAt(60 * 60), 20)).toBeLessThan(META_COST[META_REVIVE]?.[0] ?? 0);
    const decent = scrapEarned(60 * 90, tierAt(60 * 90), 40);
    expect(decent).toBeGreaterThanOrEqual(cheapestCost());
    expect(decent).toBeLessThan(META_COST[META_REVIVE]?.[0] ?? 0);
    expect(decent).toBeLessThan(rackCost());
  });

  it("banks a finished run once", () => {
    const w = createWorld(1);
    const shop = emptyWorkshop();
    w.tick = 1200;
    w.rank = 2;
    w.wave = 9;
    w.kills = 8;
    expect(awardRun(shop, w)).toBe(0);
    expect(shop.scrap).toBe(0);
    w.over = true;
    const n = awardRun(shop, w);
    expect(n).toBe(scrapEarned(1200, w.rank, 8));
    expect(n).not.toBe(scrapEarned(1200, w.wave, 8));
    expect(n).toBeGreaterThan(0);
    expect(awardRun(shop, w)).toBe(0);
    expect(shop.scrap).toBe(n);
  });

  it("a standing death in the opening ranks pays for a fitting and not a revive", () => {
    const w = createWorld(10);
    for (let t = 0; t < 60 * 240 && !w.over; t++) step(w, idle(1));
    expect(w.over).toBe(true);
    expect(w.kills).toBeGreaterThan(0);
    expect(w.rank).toBeGreaterThan(0);
    expect(w.wave).not.toBe(w.rank);
    const n = scrapEarned(w.tick, w.rank, w.kills);
    const shop = emptyWorkshop();
    expect(awardRun(shop, w)).toBe(n);
    expect(n).not.toBe(scrapEarned(w.tick, w.wave, w.kills));
    expect(shop.scrap).toBe(n);
    expect(n).toBeGreaterThanOrEqual(cheapestCost());
    expect(n).toBeLessThan(META_COST[META_REVIVE]?.[0] ?? 0);
    expect(n).toBeLessThan(rackCost());
  });

  it("pays a lich win from the same kill total as the tally and the tracker", () => {
    const w = createWorld(4);
    w.hp = 5000;
    w.maxHp = 5000;
    w.fireCd = 99999;
    const tracker = createTracker();
    seekSeconds(w, 1200);
    let guard = 0;
    while (!w.over && guard < 400) {
      if (lichUp(w) && lichHp(w) > 0) harmLich(w, lichMaxHp());
      step(w, { dx: 0, dy: 0, pick: 0, skip: w.chestOpen ? 1 : 0 });
      noteKills(tracker, w.events[EV_KILL] ?? 0);
      guard++;
    }
    expect(isWon(w)).toBe(true);
    expect(w.kills).toBe(killCount(w));
    expect(tracker.kills).toBe(killCount(w));
    expect(w.kills).toBeGreaterThan(0);
    const shop = emptyWorkshop();
    const paid = awardRun(shop, w);
    expect(paid).toBe(doubledScrap(scrapEarned(w.tick, w.rank, killCount(w))));
    expect(paid).toBe(doubledScrap(scrapEarned(w.tick, w.rank, tracker.kills)));
    expect(paid).toBe(doubledScrap(scrapEarned(w.tick, w.rank, w.kills)));
  });
});

describe("workshop schema", () => {
  it("lists six fittings with a cost for every rank", () => {
    expect(META_NAMES.length).toBe(META_N);
    expect(META_BLURB.length).toBe(META_N);
    expect(META_MAX.length).toBe(META_N);
    expect(META_COST.length).toBe(META_N);
    for (let i = 0; i < META_N; i++) expect(META_COST[i]?.length).toBe(META_MAX[i]);
    expect(cheapestCost()).toBe(META_COST[META_SPD]?.[0]);
  });

  it("round-trips version 1 and clamps junk", () => {
    const shop = emptyWorkshop();
    shop.scrap = 80;
    expect(tryBuy(shop, META_HP)).toBe(true);
    expect(shop.scrap).toBe(40);
    expect(shop.ranks[META_HP]).toBe(1);
    const raw = serializeWorkshop(shop);
    expect(JSON.parse(raw).v).toBe(WORKSHOP_VERSION);
    const store = mem();
    saveWorkshop(store, shop, true);
    expect(store.getItem(WORKSHOP_KEY)).toBe(raw);
    expect(loadWorkshop(store).shop).toEqual(shop);
    store.setItem(WORKSHOP_KEY, JSON.stringify({
      v: 1, scrap: 12.9, ranks: [9, -3, 1.8, "x", 1, 0, 7],
    }));
    const messy = loadWorkshop(store);
    expect(messy.writable).toBe(true);
    expect(messy.shop.scrap).toBe(12);
    expect(messy.shop.ranks).toEqual([3, 0, 1, 0, 1, 0]);
    store.setItem(WORKSHOP_KEY, JSON.stringify({ v: 1, scrap: SCRAP_CAP + 50 }));
    expect(loadWorkshop(store).shop.scrap).toBe(SCRAP_CAP);
    store.setItem(WORKSHOP_KEY, "{");
    expect(loadWorkshop(store).shop).toEqual(emptyWorkshop());
  });

  it("leaves a newer schema untouched", () => {
    const store = mem();
    const raw = JSON.stringify({ v: WORKSHOP_VERSION + 1, scrap: 50, ranks: [1, 1, 1, 1, 1, 1] });
    store.setItem(WORKSHOP_KEY, raw);
    const loaded = loadWorkshop(store);
    expect(loaded.writable).toBe(false);
    expect(loaded.shop.scrap).toBe(0);
    saveWorkshop(store, loaded.shop, loaded.writable);
    expect(store.getItem(WORKSHOP_KEY)).toBe(raw);
  });

  it("keeps the saved bench when storage throws", () => {
    const store = mem();
    const shop = emptyWorkshop();
    shop.scrap = 40;
    saveWorkshop(store, shop, true);
    expect(() => saveWorkshop({
      getItem: (k: string) => store.getItem(k),
      setItem: () => { throw new Error("quota"); },
    }, emptyWorkshop(), true)).not.toThrow();
    expect(loadWorkshop(store).shop.scrap).toBe(40);
    const broken = loadWorkshop({
      getItem: () => { throw new Error("quota"); },
      setItem: () => { throw new Error("quota"); },
    });
    expect(broken.writable).toBe(false);
    expect(broken.shop).toEqual(emptyWorkshop());
    expect(() => saveWorkshop({
      getItem: () => { throw new Error("quota"); },
      setItem: () => { store.setItem(WORKSHOP_KEY, "wiped"); },
    }, shop, broken.writable)).not.toThrow();
    expect(store.getItem(WORKSHOP_KEY)).not.toBe("wiped");
  });

  it("refuses a buy the boiler cannot afford and stops at the cap", () => {
    const shop = emptyWorkshop();
    expect(tryBuy(shop, META_SPD)).toBe(false);
    expect(nextCost(shop, META_SPD)).toBe(cheapestCost());
    shop.scrap = cheapestCost();
    expect(tryBuy(shop, META_SPD)).toBe(true);
    expect(shop.scrap).toBe(0);
    expect(tryBuy(shop, META_SPD)).toBe(false);
    const full = emptyWorkshop();
    full.scrap = rackCost();
    for (let i = 0; i < META_N; i++) {
      while (nextCost(full, i) >= 0) expect(tryBuy(full, i)).toBe(true);
    }
    expect(full.scrap).toBe(0);
    expect(tryBuy(full, META_HP)).toBe(false);
    expect(tryBuy(shop, META_HP)).toBe(false);
    expect(nextCost(shop, 99)).toBe(-1);
  });
});

describe("permanent fittings", () => {
  it("leaves a fresh boiler at stock power", () => {
    const w = createWorld(1);
    applyWorkshop(w, emptyWorkshop());
    expect(w.maxHp).toBe(5);
    expect(w.hp).toBe(5);
    expect(maxHpOf(w)).toBe(5);
    expect(bulletDmg(w)).toBe(1);
    expect(moveSpeed(w)).toBe(2);
    expect(fireEvery(w)).toBe(12);
    expect(w.meta.revive).toBe(0);
    expect(w.meta.reroll).toBe(0);
    expect(w.workshop).toBe("");
  });

  it("snapshots the fittings applied at the start of the run", () => {
    const w = createWorld(3);
    const shop = emptyWorkshop();
    shop.ranks[META_HP] = 2;
    shop.ranks[META_DMG] = 1;
    shop.ranks[META_REVIVE] = 1;
    shop.ranks[META_REROLL] = 1;
    applyWorkshop(w, shop);
    expect(w.workshop).toBe("P2R1V1L1");
    expect(w.workshop).toBe(fitLabel(shop.ranks));
    w.meta.revive = 0;
    shop.ranks[META_HP] = 3;
    expect(w.workshop).toBe("P2R1V1L1");
    expect(fitLabel(emptyWorkshop().ranks)).toBe("");
  });

  it("stays weaker than maxing the same stats inside a run", () => {
    const w = createWorld(1);
    applyWorkshop(w, fitted());
    expect(w.maxHp).toBe(5 + (META_MAX[META_HP] ?? 0) * BONUS_HP);
    expect(w.maxHp).toBeLessThan(5 + UPG_MAX);
    expect(bulletDmg(w)).toBe(1 + (META_MAX[META_DMG] ?? 0) * BONUS_DMG);
    expect(bulletDmg(w)).toBeLessThan(1 + UPG_MAX);
    expect(moveSpeed(w)).toBe(2 + (META_MAX[META_SPD] ?? 0) * BONUS_SPD);
    expect(moveSpeed(w)).toBeLessThan(2 + 0.4 * 2);
    expect(fireEvery(w)).toBe(12 - (META_MAX[META_GUN] ?? 0) * BONUS_GUN * 2);
    expect(fireEvery(w)).toBeGreaterThan(3);
  });

  it("stacks plate with an in-run max hp pick", () => {
    const w = createWorld(1);
    const shop = emptyWorkshop();
    shop.ranks[META_HP] = 2;
    applyWorkshop(w, shop);
    expect(w.maxHp).toBe(7);
    expect(w.hp).toBe(7);
    applyUpgrade(w, UPG_HP);
    expect(w.maxHp).toBe(8);
    expect(w.hp).toBe(8);
  });

  it("stacks fittings with the survivor and the run modifiers", () => {
    const shop = emptyWorkshop();
    shop.ranks[META_HP] = 2;
    shop.ranks[META_DMG] = 1;
    shop.ranks[META_SPD] = 1;
    shop.ranks[META_GUN] = 1;
    const gun = createWorld(1, CHAR_GUNSLINGER);
    const gunBare = createWorld(1, CHAR_GUNSLINGER);
    applyWorkshop(gun, shop);
    expect(gun.maxHp).toBe(6);
    expect(fireEvery(gun)).toBe(Math.max(3, Math.round((12 - BONUS_GUN * 2) * 100 / 130)));
    expect(fireEvery(gun)).toBeLessThan(fireEvery(gunBare));
    expect(weaponEvery(gun, WPN_MORT, 1)).toBeLessThan(weaponEvery(gunBare, WPN_MORT, 1));
    const brute = createWorld(1, CHAR_BRUTE, MOD_FAST);
    const bruteBare = createWorld(1, CHAR_BRUTE);
    applyWorkshop(brute, shop);
    expect(brute.maxHp).toBe(10);
    expect(moveSpeed(brute)).toBeCloseTo(1.5 + BONUS_SPD);
    expect(moveSpeed(brute)).toBeCloseTo(moveSpeed(bruteBare) + BONUS_SPD);
    expect(bulletDmg(brute)).toBe(1 + BONUS_DMG);
    brute.hp = 5;
    expect(bulletDmg(brute)).toBe(1 + BONUS_DMG + RAGE_DMG);
    brute.hp = 6;
    expect(bulletDmg(brute)).toBe(1 + BONUS_DMG);
    const glass = createWorld(1, CHAR_BRUTE, MOD_GLASS);
    applyWorkshop(glass, shop);
    expect(glass.maxHp).toBe(3);
    expect(glass.hp).toBe(3);
    expect(bulletDmg(glass)).toBe(1 + BONUS_DMG);
    glass.hp = 1;
    expect(bulletDmg(glass)).toBe(1 + BONUS_DMG + RAGE_DMG);
    expect(cannonHit(bulletDmg(glass), MOD_GLASS)).toBe((1 + BONUS_DMG + RAGE_DMG) * 2);
    const dry = createWorld(1, 0, MOD_NOHEAL);
    applyWorkshop(dry, shop);
    expect(dry.maxHp).toBe(7);
    dry.hp = 2;
    applyUpgrade(dry, UPG_HP);
    expect(dry.maxHp).toBe(8);
    expect(dry.hp).toBe(2);
    const rush = createWorld(1, 0, MOD_GEAR);
    const plain = createWorld(1);
    rush.tick = 1800;
    plain.tick = 1800;
    rush.rank = 1;
    plain.rank = 1;
    rush.kills = 4;
    plain.kills = 4;
    rush.over = true;
    plain.over = true;
    expect(awardRun(emptyWorkshop(), rush)).toBe(awardRun(emptyWorkshop(), plain));
    const alch = createWorld(4, CHAR_ALCHEMIST);
    alch.meta.reroll = 1;
    takeXp(alch, xpNeed(0));
    expect(offerCount(alch)).toBe(3);
    expect(alch.meta.rerollLeft).toBe(1);
    expect(tryReroll(alch)).toBe(true);
    expect(alch.choosing).toBe(1);
    expect(alch.meta.rerollLeft).toBe(0);
  });

  it("adds rivet damage on top of the in-run track", () => {
    const hit = (meta: number, ranks: number): number => {
      const w = createWorld(1);
      freeze(w);
      w.meta.dmg = meta;
      for (let i = 0; i < ranks; i++) applyUpgrade(w, UPG_DMG);
      const i = addZombie(w, w.px + 16, w.py, 8);
      addBullet(w, w.px + 16, w.py);
      step(w, idle());
      return w.zombies.hp[i] ?? 0;
    };
    expect(hit(1, 0)).toBeLessThan(hit(0, 0));
    expect(hit(1, 1)).toBeLessThan(hit(1, 0));
    const cannon = createWorld(1);
    cannon.meta.dmg = BONUS_DMG;
    cannon.upgrades[EVOL_CANNON] = 1;
    cannon.upgrades[UPG_DMG] = 2;
    expect(bulletDmg(cannon)).toBe(1 + 2 + 1 + BONUS_DMG);
  });

  it("stride bonus covers more ground", () => {
    const run = (spd: number): number => {
      const w = createWorld(1);
      freeze(w);
      w.meta.spd = spd;
      const x0 = w.px;
      step(w, { dx: 1, dy: 0, pick: 0 });
      return w.px - x0;
    };
    expect(run(BONUS_SPD)).toBeCloseTo(2 + BONUS_SPD);
    expect(run(BONUS_SPD)).toBeGreaterThan(run(0));
    const w = createWorld(1);
    w.meta.spd = BONUS_SPD;
    applyUpgrade(w, UPG_SPEED);
    expect(moveSpeed(w)).toBeCloseTo(2 + 0.4 + BONUS_SPD);
  });

  it("starting gun level shortens the rivet interval before any pick", () => {
    const shots = (gun: number): number => {
      const w = createWorld(1);
      freeze(w);
      w.fireCd = 0;
      w.meta.gun = gun;
      addZombie(w, w.px + 90, w.py, 999);
      let n = 0;
      for (let t = 0; t < 60; t++) {
        step(w, idle());
        if (w.events[EV_SHOT]) n++;
      }
      return n;
    };
    const tuned = createWorld(1);
    tuned.meta.gun = 1;
    expect(fireEvery(tuned)).toBe(10);
    expect(shots(2)).toBeGreaterThan(shots(0));
  });

  it("spends one revive and the next killing blow ends the run", () => {
    const w = createWorld(1);
    freeze(w);
    w.meta.revive = 1;
    w.hp = 1;
    addZombie(w, w.px, w.py, 9);
    step(w, idle());
    expect(w.over).toBe(false);
    expect(w.meta.revive).toBe(0);
    expect(w.hp).toBe(2);
    expect(w.events[EV_REVIVE]).toBe(1);
    for (let t = 0; t < 200 && !w.over; t++) step(w, idle());
    expect(w.over).toBe(true);
    expect(w.hp).toBeLessThanOrEqual(0);
  });

  it("rerolls one brass choice and refreshes on the next level", () => {
    let found = false;
    for (let seed = 1; seed < 40 && !found; seed++) {
      const w = createWorld(seed);
      w.meta.reroll = 1;
      takeXp(w, xpNeed(0));
      expect(w.meta.rerollLeft).toBe(1);
      const before = Array.from(w.offers);
      const tick = w.tick;
      step(w, idle(0, 1));
      expect(w.tick).toBe(tick);
      expect(w.choosing).toBe(1);
      expect(w.meta.rerollLeft).toBe(0);
      expect(tryReroll(w)).toBe(false);
      if (before.some((v, i) => v !== w.offers[i])) found = true;
      const again = createWorld(seed);
      again.meta.reroll = 1;
      takeXp(again, xpNeed(0));
      step(again, idle(0, 1));
      expect(Array.from(again.offers)).toEqual(Array.from(w.offers));
    }
    expect(found).toBe(true);
    const bare = createWorld(3);
    takeXp(bare, xpNeed(0));
    const offers = Array.from(bare.offers);
    step(bare, idle(0, 1));
    expect(Array.from(bare.offers)).toEqual(offers);
    const chain = createWorld(4);
    chain.meta.reroll = 1;
    takeXp(chain, xpNeed(0) + xpNeed(1));
    expect(tryReroll(chain)).toBe(true);
    expect(chain.meta.rerollLeft).toBe(0);
    step(chain, idle(1, 0));
    expect(chain.choosing).toBe(1);
    expect(chain.meta.rerollLeft).toBe(1);
  });

  it("hits the reroll plate and misses the cards", () => {
    expect(REROLL_Y).toBeGreaterThanOrEqual(CARD_Y + CARD_H);
    expect(REROLL_Y + REROLL_H).toBeLessThanOrEqual(H);
    expect(rerollHit(REROLL_X + 4, REROLL_Y + 4)).toBe(true);
    expect(rerollHit(REROLL_X + REROLL_W, REROLL_Y + REROLL_H)).toBe(true);
    expect(rerollHit(REROLL_X - 1, REROLL_Y + 4)).toBe(false);
    expect(rerollHit(REROLL_X + 4, CARD_Y + 10)).toBe(false);
    expect(rerollHit(34, 80)).toBe(false);
  });
});

describe("workshop screen", () => {
  it("opens from the title and from game over, and closes back", () => {
    const title = createSession();
    expect(openWorkshop(title)).toBe(true);
    expect(title.phase).toBe(PHASE_WORKSHOP);
    expect(shouldStep(title)).toBe(false);
    expect(begin(title)).toBe(false);
    onBlur(title);
    expect(title.phase).toBe(PHASE_WORKSHOP);
    closeWorkshop(title);
    expect(title.phase).toBe(PHASE_TITLE);
    begin(title);
    finish(title, 10);
    expect(title.phase).toBe(PHASE_OVER);
    expect(openWorkshop(title)).toBe(true);
    closeWorkshop(title);
    expect(title.phase).toBe(PHASE_OVER);
    const live = createSession();
    begin(live);
    togglePause(live);
    expect(live.phase).toBe(PHASE_PAUSE);
    expect(openWorkshop(live)).toBe(false);
    expect(live.phase).toBe(PHASE_PAUSE);
  });
});
