import { applyUpgrade, beginLevel, cardSlot, CARD_H, CARD_W, CARD_X0, CARD_Y, magnetR, moveSpeed, sawAngle, sawRadius, takeXp, teslaRange, tryPick, xpNeed } from "../src/sim/progress";
import { step } from "../src/sim/step.hot";
import {
  EV_KILL, EV_LEVEL, EV_SHIELD, EV_SHOT, EV_TESLA, MAX_BULLETS, MAX_COGS, MAX_ZOMBIES,
  UPG_DMG, UPG_FIRE, UPG_HP, UPG_MAGNET, UPG_MAX, UPG_PIERCE, UPG_SAWS, UPG_SHIELD,
  UPG_SHOTGUN, UPG_SPEED, UPG_TESLA, type Input, type World,
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
const addCog = (w: World, x: number, y: number): number => {
  const c = w.cogs;
  for (let k = 0; k < MAX_COGS; k++) {
    if (c.alive[k]) continue;
    c.x[k] = x; c.y[k] = y; c.alive[k] = 1;
    return k;
  }
  throw new Error("cogs full");
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
  it("collecting a brass cog grants one xp", () => {
    const w = createWorld(1);
    freeze(w);
    addCog(w, w.px, w.py);
    step(w, idle());
    expect(w.xp).toBe(1);
    expect(count(w.cogs.alive, MAX_COGS)).toBe(0);
  });
  it("killing a zombie drops a cog at its corpse", () => {
    const w = createWorld(2);
    freeze(w);
    const i = addZombie(w, w.px + 20, w.py, 1);
    const x = w.zombies.x[i];
    const y = w.zombies.y[i];
    addBullet(w, w.px + 20, w.py, 0, 0);
    step(w, idle());
    expect(w.events[EV_KILL]).toBe(1);
    expect(w.zombies.alive[i]).toBe(0);
    let found = 0;
    for (let k = 0; k < MAX_COGS; k++) {
      if (w.cogs.alive[k] && w.cogs.x[k] === x && w.cogs.y[k] === y) found++;
    }
    expect(found).toBe(1);
  });
  it("enough xp pauses the run and rolls three offers", () => {
    const w = createWorld(3);
    freeze(w);
    w.xp = xpNeed(0) - 1;
    addCog(w, w.px, w.py);
    const tick = w.tick;
    step(w, idle());
    expect(w.choosing).toBe(1);
    expect(w.level).toBe(1);
    expect(w.events[EV_LEVEL]).toBe(1);
    expect(w.offers[0]).toBeGreaterThanOrEqual(0);
    expect(w.offers[1]).toBeGreaterThanOrEqual(0);
    expect(w.offers[2]).toBeGreaterThanOrEqual(0);
    expect(new Set([w.offers[0], w.offers[1], w.offers[2]]).size).toBe(3);
    step(w, idle());
    expect(w.tick).toBe(tick + 1);
    expect(w.choosing).toBe(1);
  });
  it("keys 1-3 apply the matching offer and resume", () => {
    const w = createWorld(4);
    freeze(w);
    takeXp(w, xpNeed(0));
    expect(w.choosing).toBe(1);
    const id = w.offers[1] ?? -1;
    expect(tryPick(w, 2)).toBe(true);
    expect(w.choosing).toBe(0);
    expect(w.upgrades[id]).toBe(1);
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
    expect(cardSlot(CARD_X0 + CARD_W + 20, CARD_Y + 10)).toBe(2);
    expect(cardSlot(CARD_X0 + (CARD_W + 8) * 2 + 10, CARD_Y + 10)).toBe(3);
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
  it("magnet pulls distant cogs that a stock boiler cannot", () => {
    const stock = createWorld(18);
    freeze(stock);
    const far = stock.px + 30;
    addCog(stock, far, stock.py);
    step(stock, idle());
    expect(stock.cogs.x[0]).toBe(far);
    expect(stock.xp).toBe(0);
    const mag = createWorld(18);
    freeze(mag);
    applyUpgrade(mag, UPG_MAGNET);
    addCog(mag, far, mag.py);
    expect(magnetR(mag)).toBeGreaterThan(30);
    step(mag, idle());
    expect(mag.cogs.x[0]).toBeLessThan(far);
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
});
