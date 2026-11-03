import { killXp } from "../src/sim/difficulty";
import {
  applyUpgrade, beginLevel, cardSlot, CARD_GAP, CARD_H, CARD_W, CARD_X0, CARD_Y, evolutionReady,
  moveSpeed, rarityName, rollOffers, sawAngle, sawDamage, sawRadius, summaryText, takeXp, teslaRange,
  tryPick, UPG_NAMES, UPG_RARITY, xpNeed,
} from "../src/sim/progress";
import { step } from "../src/sim/step.hot";
import {
  EV_HURT, EV_KILL, EV_LEVEL, EV_SHIELD, EV_SHOT, EV_TESLA, EVOL_AEGIS, EVOL_CANNON, EVOL_STORM, MAX_BULLETS,
  MAX_ZOMBIES, UPG_COOLANT, UPG_COUNT, UPG_DMG, UPG_DYNAMO, UPG_FIRE, UPG_HP, UPG_MAX, UPG_MORTAR,
  UPG_PIERCE, UPG_RICOCHET, UPG_SAWS, UPG_SHIELD, UPG_SHOTGUN, UPG_SPIKES, UPG_SPEED, UPG_TESLA,
  UPG_VENT, UPG_WHISTLE, W, Z_SHAMBLER, type Input, type World,
} from "../src/sim/types";
import { createWorld } from "../src/sim/world";
const idle = (pick = 0): Input => ({ dx: 0, dy: 0, pick });
const freeze = (w: World): void => { w.toSpawn = 99; w.spawnCd = 99999; w.wave = 1; w.fireCd = 99999; };
const count = (alive: Uint8Array, n: number): number => {
  let k = 0;
  for (let i = 0; i < n; i++) if (alive[i]) k++;
  return k;
};
const addZombie = (w: World, x: number, y: number, hp: number, speed = 0): number => {
  const z = w.zombies;
  for (let i = 0; i < MAX_ZOMBIES; i++) {
    if (z.alive[i]) continue;
    z.x[i] = x; z.y[i] = y; z.hp[i] = hp; z.vx[i] = speed; z.alive[i] = 1;
    return i;
  }
  throw new Error("zombies full");
};
const addBullet = (w: World, x: number, y: number, vx: number, vy: number): number => {
  const b = w.bullets;
  for (let j = 0; j < MAX_BULLETS; j++) {
    if (b.alive[j]) continue;
    b.x[j] = x; b.y[j] = y; b.vx[j] = vx; b.vy[j] = vy; b.alive[j] = 1;
    w.bHit[j] = -1;
    w.bPierce[j] = w.upgrades[UPG_PIERCE] ?? 0;
    return j;
  }
  throw new Error("bullets full");
};
describe("xp and level-up", () => {
  it("a kill grants xp immediately and leaves no pickup", () => {
    const w = createWorld(2);
    freeze(w);
    const i = addZombie(w, w.px + 20, w.py, 1);
    addBullet(w, w.px + 20, w.py, 0, 0);
    step(w, idle());
    expect(w.events[EV_KILL]).toBe(1);
    expect(w.zombies.alive[i]).toBe(0);
    expect(w.xp).toBe(killXp(Z_SHAMBLER, w.rank));
    expect(w).not.toHaveProperty("cogs");
  });
  it("enough xp pauses the run and rolls exactly two offers", () => {
    const w = createWorld(3);
    freeze(w);
    w.xp = xpNeed(0) - killXp(Z_SHAMBLER, 0);
    addZombie(w, w.px + 16, w.py, 1);
    addBullet(w, w.px + 16, w.py, 0, 0);
    const tick = w.tick;
    step(w, idle());
    expect(w.choosing).toBe(1);
    expect(w.level).toBe(1);
    expect(w.events[EV_LEVEL]).toBe(1);
    expect(w.offers.length).toBe(2);
    expect(w.offers[0]).toBeGreaterThanOrEqual(0);
    expect(w.offers[1]).toBeGreaterThanOrEqual(0);
    expect(w.offers[0]).not.toBe(w.offers[1]);
    step(w, idle());
    expect(w.tick).toBe(tick + 1);
    expect(w.choosing).toBe(1);
  });
  it("keys 1-2 apply the matching offer and resume", () => {
    const w = createWorld(4);
    freeze(w);
    takeXp(w, xpNeed(0));
    expect(w.choosing).toBe(1);
    const id = w.offers[1] ?? -1;
    expect(tryPick(w, 3)).toBe(false);
    expect(w.choosing).toBe(1);
    expect(tryPick(w, 2)).toBe(true);
    expect(w.choosing).toBe(0);
    expect(w.upgrades[id]).toBe(1);
  });
  it("step consumes input.pick while paused and does not advance tick", () => {
    const w = createWorld(6);
    freeze(w);
    takeXp(w, xpNeed(0));
    const id = w.offers[0] ?? -1;
    const tick = w.tick;
    step(w, idle(1));
    expect(w.choosing).toBe(0);
    expect(w.upgrades[id]).toBe(1);
    expect(w.tick).toBe(tick);
  });
  it("leftover xp queues another pick after a choice", () => {
    const w = createWorld(5);
    freeze(w);
    takeXp(w, xpNeed(0) + xpNeed(1));
    expect(w.choosing).toBe(1);
    tryPick(w, 1);
    expect(w.choosing).toBe(1);
    expect(w.level).toBe(2);
  });
  it("same seed rolls the same offers", () => {
    const a = createWorld(9);
    const b = createWorld(9);
    takeXp(a, xpNeed(0));
    takeXp(b, xpNeed(0));
    expect(Array.from(a.offers)).toEqual(Array.from(b.offers));
  });
  it("cardSlot maps each card and misses empty space", () => {
    expect(cardSlot(CARD_X0 + 10, CARD_Y + 10)).toBe(1);
    expect(cardSlot(CARD_X0 + CARD_W + CARD_GAP + 10, CARD_Y + 10)).toBe(2);
    expect(cardSlot(CARD_X0 + (CARD_W + CARD_GAP) * 2 + 4, CARD_Y + 10)).toBe(0);
    expect(cardSlot(4, 4)).toBe(0);
    expect(cardSlot(CARD_X0 + 10, CARD_Y + CARD_H + 8)).toBe(0);
  });
  it("beginLevel does nothing when every upgrade is maxed", () => {
    const w = createWorld(8);
    w.upgrades.fill(UPG_MAX);
    w.xp = 99;
    beginLevel(w);
    expect(w.choosing).toBe(0);
    expect(w.level).toBe(0);
  });
});
describe("upgrade effects", () => {
  it("tesla coil zaps the nearest zombie and chains", () => {
    const w = createWorld(11);
    freeze(w);
    applyUpgrade(w, UPG_TESLA);
    applyUpgrade(w, UPG_TESLA);
    w.teslaCd = 1;
    const a = addZombie(w, w.px + 20, w.py, 6);
    const b = addZombie(w, w.px + 40, w.py, 6);
    step(w, idle());
    expect(w.events[EV_TESLA]).toBe(1);
    expect(w.zombies.hp[a]).toBe(4);
    expect(w.zombies.hp[b]).toBe(4);
    expect(teslaRange(w)).toBeGreaterThan(64);
  });
  it("steam shotgun fires extra spread pellets", () => {
    const w = createWorld(12);
    freeze(w);
    applyUpgrade(w, UPG_SHOTGUN);
    addZombie(w, w.px + 80, w.py, 99);
    w.fireCd = 0;
    step(w, idle());
    expect(count(w.bullets.alive, MAX_BULLETS)).toBe(3);
    expect(w.events[EV_SHOT]).toBe(1);
  });
  it("orbiting saw gears cut a zombie on their path", () => {
    const w = createWorld(13);
    freeze(w);
    applyUpgrade(w, UPG_SAWS);
    w.tick = 3;
    const n = 1;
    const r = sawRadius(w);
    const a = sawAngle(4, 0, n);
    const i = addZombie(w, w.px + Math.cos(a) * r, w.py + Math.sin(a) * r, 3);
    step(w, idle());
    expect(w.tick).toBe(4);
    expect(w.zombies.hp[i]).toBeLessThan(3);
  });
  it("fire rate shortens the shot interval", () => {
    const shots = (levels: number, seed: number): number => {
      const w = createWorld(seed);
      freeze(w);
      w.fireCd = 0;
      for (let i = 0; i < levels; i++) applyUpgrade(w, UPG_FIRE);
      addZombie(w, w.px + 90, w.py, 9999);
      let n = 0;
      for (let t = 0; t < 60; t++) {
        step(w, idle());
        if (w.events[EV_SHOT]) n++;
      }
      return n;
    };
    expect(shots(3, 14)).toBeGreaterThan(shots(0, 14));
  });
  it("damage makes a rivet hit harder", () => {
    const hit = (levels: number): number => {
      const w = createWorld(15);
      freeze(w);
      for (let i = 0; i < levels; i++) applyUpgrade(w, UPG_DMG);
      const i = addZombie(w, w.px + 16, w.py, 8);
      addBullet(w, w.px + 16, w.py, 0, 0);
      step(w, idle());
      return w.zombies.hp[i] ?? 0;
    };
    expect(hit(2)).toBeLessThan(hit(0));
  });
  it("max hp raises the cap and heals to full", () => {
    const w = createWorld(16);
    w.hp = 1;
    applyUpgrade(w, UPG_HP);
    expect(w.maxHp).toBe(6);
    expect(w.hp).toBe(6);
    applyUpgrade(w, UPG_HP);
    expect(w.maxHp).toBe(7);
    expect(w.hp).toBe(7);
  });
  it("move speed covers more ground per tick", () => {
    const run = (levels: number): number => {
      const w = createWorld(17);
      freeze(w);
      for (let i = 0; i < levels; i++) applyUpgrade(w, UPG_SPEED);
      const x0 = w.px;
      step(w, { dx: 1, dy: 0, pick: 0 });
      return w.px - x0;
    };
    expect(run(3)).toBeGreaterThan(run(0));
    const w = createWorld(17);
    applyUpgrade(w, UPG_SPEED);
    expect(moveSpeed(w)).toBeGreaterThan(2);
  });
  it("boiler vent pulses damage around the player", () => {
    const w = createWorld(18);
    freeze(w);
    applyUpgrade(w, UPG_VENT);
    w.ventCd = 1;
    const near = addZombie(w, w.px + 20, w.py, 9);
    const far = addZombie(w, 12, 12, 9);
    step(w, idle());
    expect(w.zombies.hp[near]).toBeLessThan(9);
    expect(w.zombies.hp[far]).toBe(9);
  });
  it("spiked plate bites back when a zombie connects", () => {
    const w = createWorld(22);
    freeze(w);
    applyUpgrade(w, UPG_SPIKES);
    const i = addZombie(w, w.px, w.py, 9);
    const hp = w.hp;
    step(w, idle());
    expect(w.events[EV_HURT] ?? 0).toBe(1);
    expect(w.hp).toBeLessThan(hp);
    expect(w.zombies.hp[i]).toBeLessThan(9);
  });
  it("coolant restores a missing pip of hp", () => {
    const w = createWorld(23);
    freeze(w);
    applyUpgrade(w, UPG_COOLANT);
    w.hp = 1;
    w.healCd = 1;
    step(w, idle());
    expect(w.hp).toBe(2);
  });
  it("mortar hits the farthest zombie", () => {
    const w = createWorld(24);
    freeze(w);
    applyUpgrade(w, UPG_MORTAR);
    w.mortarCd = 1;
    const far = addZombie(w, 12, 12, 20);
    const near = addZombie(w, w.px + 18, w.py, 20);
    step(w, idle());
    expect(w.zombies.hp[far]).toBeLessThan(20);
    expect(w.zombies.hp[near]).toBe(20);
  });
  it("steam whistle slows a zombie inside its aura", () => {
    const run = (whistle: boolean): number => {
      const w = createWorld(25);
      freeze(w);
      if (whistle) applyUpgrade(w, UPG_WHISTLE);
      const i = addZombie(w, w.px + 20, w.py, 9, 1);
      const x0 = w.zombies.x[i] ?? 0;
      step(w, idle());
      return (w.zombies.x[i] ?? 0) - x0;
    };
    expect(run(true)).toBeGreaterThan(run(false));
  });
  it("ricochet sends a rivet back off the arena edge", () => {
    const w = createWorld(26);
    freeze(w);
    applyUpgrade(w, UPG_RICOCHET);
    const j = addBullet(w, W - 3, 40, 6, 0);
    w.bullets.kind[j] = 1;
    step(w, idle());
    expect(w.bullets.alive[j]).toBe(1);
    expect(w.bullets.vx[j] ?? 0).toBeLessThan(0);
  });
  it("dynamo shortens the next shot after a kill", () => {
    const bare = createWorld(27);
    freeze(bare);
    bare.fireCd = 40;
    addZombie(bare, bare.px + 16, bare.py, 1);
    addBullet(bare, bare.px + 16, bare.py, 0, 0);
    step(bare, idle());
    const fed = createWorld(27);
    freeze(fed);
    applyUpgrade(fed, UPG_DYNAMO);
    fed.fireCd = 40;
    addZombie(fed, fed.px + 16, fed.py, 1);
    addBullet(fed, fed.px + 16, fed.py, 0, 0);
    step(fed, idle());
    expect(fed.events[EV_KILL]).toBe(1);
    expect(fed.fireCd).toBeLessThan(bare.fireCd);
  });
  it("storm gear makes the saws cut deeper", () => {
    const w = createWorld(28);
    freeze(w);
    applyUpgrade(w, UPG_SAWS);
    applyUpgrade(w, EVOL_STORM);
    w.tick = 3;
    const r = sawRadius(w);
    const a = sawAngle(4, 0, 1);
    const i = addZombie(w, w.px + Math.cos(a) * r, w.py + Math.sin(a) * r, 6);
    step(w, idle());
    expect(w.zombies.hp[i]).toBe(6 - sawDamage(w));
    expect(sawDamage(w)).toBeGreaterThan(1);
  });
  it("piercing rivets keep flying through a first corpse", () => {
    const through = createWorld(19);
    freeze(through);
    applyUpgrade(through, UPG_PIERCE);
    const a = addZombie(through, through.px + 18, through.py, 1);
    const b = addZombie(through, through.px + 40, through.py, 1);
    addBullet(through, through.px + 8, through.py, 5, 0);
    for (let t = 0; t < 10; t++) step(through, idle());
    expect(through.zombies.alive[a]).toBe(0);
    expect(through.zombies.alive[b]).toBe(0);
    const stop = createWorld(19);
    freeze(stop);
    const c = addZombie(stop, stop.px + 18, stop.py, 1);
    const d = addZombie(stop, stop.px + 40, stop.py, 1);
    addBullet(stop, stop.px + 8, stop.py, 5, 0);
    for (let t = 0; t < 10; t++) step(stop, idle());
    expect(stop.zombies.alive[c]).toBe(0);
    expect(stop.zombies.alive[d]).toBe(1);
  });
  it("boiler shield eats a hit then recharges", () => {
    const w = createWorld(20);
    freeze(w);
    applyUpgrade(w, UPG_SHIELD);
    expect(w.shield).toBe(1);
    addZombie(w, w.px, w.py, 9);
    const hp = w.hp;
    step(w, idle());
    expect(w.events[EV_SHIELD]).toBe(1);
    expect(w.hp).toBe(hp);
    expect(w.shield).toBe(0);
    w.zombies.x[0] = 8;
    w.zombies.y[0] = 8;
    w.hurtCd = 0;
    for (let t = 0; t < 200; t++) step(w, idle());
    expect(w.shield).toBe(1);
    expect(w.hp).toBe(hp);
  });
  it("a player with no shield still dies when swarmed", () => {
    const w = createWorld(21);
    freeze(w);
    for (let i = 0; i < 6; i++) addZombie(w, w.px, w.py, 9);
    for (let t = 0; t < 300 && !w.over; t++) step(w, idle());
    expect(w.over).toBe(true);
    expect(w.hp).toBeLessThanOrEqual(0);
  });
  it("aegis engine bursts when the shield breaks", () => {
    const w = createWorld(29);
    freeze(w);
    applyUpgrade(w, UPG_SHIELD);
    applyUpgrade(w, EVOL_AEGIS);
    const i = addZombie(w, w.px, w.py, 9);
    const hp = w.hp;
    step(w, idle());
    expect(w.events[EV_SHIELD]).toBe(1);
    expect(w.hp).toBe(hp);
    expect(w.zombies.hp[i]).toBeLessThan(9);
  });
  it("cannon adds a spread pellet", () => {
    const w = createWorld(31);
    freeze(w);
    applyUpgrade(w, UPG_SHOTGUN);
    applyUpgrade(w, EVOL_CANNON);
    addZombie(w, w.px + 80, w.py, 99);
    w.fireCd = 0;
    step(w, idle());
    expect(count(w.bullets.alive, MAX_BULLETS)).toBe(5);
  });
});
describe("rarity, evolutions, and the run summary", () => {
  it("names and rarities cover the whole upgrade pool", () => {
    expect(UPG_NAMES.length).toBe(UPG_COUNT);
    expect(UPG_RARITY.length).toBe(UPG_COUNT);
    expect(UPG_NAMES).not.toContain("MAGNET");
    expect(rarityName(0)).toBe("COMMON");
    expect(rarityName(1)).toBe("RARE");
    expect(rarityName(2)).toBe("LEGENDARY");
  });
  it("legendary offers become more common as the tier climbs", () => {
    const tally = (tier: number): number[] => {
      const counts = [0, 0, 0];
      const w = createWorld(11);
      w.rank = tier;
      for (let i = 0; i < 240; i++) {
        w.upgrades.fill(0);
        rollOffers(w);
        const id = w.offers[0] ?? 0;
        const r = UPG_RARITY[id] ?? 0;
        counts[r] = (counts[r] ?? 0) + 1;
      }
      return counts;
    };
    const calm = tally(0);
    const hot = tally(10);
    expect(calm[0] ?? 0).toBeGreaterThan(calm[2] ?? 0);
    expect(hot[2] ?? 0).toBeGreaterThan(calm[2] ?? 0);
    expect(calm[0] ?? 0).toBeGreaterThan(hot[0] ?? 0);
  });
  it("hides evolutions until both parents are stacked, then offers them", () => {
    const w = createWorld(4);
    expect(evolutionReady(w, EVOL_STORM)).toBe(false);
    expect(evolutionReady(w, EVOL_CANNON)).toBe(false);
    expect(evolutionReady(w, EVOL_AEGIS)).toBe(false);
    const evolution = (id: number): boolean => id === EVOL_STORM || id === EVOL_CANNON || id === EVOL_AEGIS;
    for (let i = 0; i < 40; i++) {
      rollOffers(w);
      expect(evolution(w.offers[0] ?? -1)).toBe(false);
      expect(evolution(w.offers[1] ?? -1)).toBe(false);
    }
    applyUpgrade(w, UPG_TESLA);
    applyUpgrade(w, UPG_TESLA);
    expect(evolutionReady(w, EVOL_STORM)).toBe(false);
    applyUpgrade(w, UPG_SAWS);
    applyUpgrade(w, UPG_SAWS);
    expect(evolutionReady(w, EVOL_STORM)).toBe(true);
    w.upgrades.fill(UPG_MAX);
    w.upgrades[EVOL_STORM] = 0;
    w.upgrades[EVOL_CANNON] = 0;
    w.upgrades[EVOL_AEGIS] = 0;
    rollOffers(w);
    expect(w.offers[0] ?? -1).toBeGreaterThanOrEqual(EVOL_STORM);
    expect(w.offers[1] ?? -1).toBeGreaterThanOrEqual(EVOL_STORM);
    expect(w.offers[0]).not.toBe(w.offers[1]);
  });
  it("summarizes the tier, time, power-ups, and score", () => {
    const w = createWorld(1);
    w.tick = 1800 * 4 + 90;
    w.rank = 4;
    w.score = 250;
    w.upgrades[UPG_TESLA] = 2;
    w.upgrades[UPG_VENT] = 1;
    const text = summaryText(w);
    expect(text).toContain("OVERPRESSURE");
    expect(text).toContain("2:01");
    expect(text).toContain("SCORE 250");
    expect(text).toContain("TESLA COIL LV 2");
    expect(text).toContain("BOILER VENT LV 1");
  });
});
