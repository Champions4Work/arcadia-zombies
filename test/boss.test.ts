import {
  BOSS_BEHEMOTH, BOSS_EVERY, BOSS_GEAR, BOSS_WARN, BOSS_WITCH, bossMaxHp, bossName, bossScore, bossSlowFactor,
  bossTier, bossXp, MAX_CLOUDS, MAX_BOSS_SHOTS, patternCount,
} from "../src/sim/boss";
import { FINALE_TICK, lichUp } from "../src/sim/finale";
import { applyScore, MOD_FAST, MOD_GEAR } from "../src/sim/modifiers";
import { bulletDmg, teslaPower, xpNeed } from "../src/sim/progress";
import { drawTesla } from "../src/render/progress";
import { step } from "../src/sim/step.hot";
import {
  EV_SIREN, EV_TESLA, MAX_ZOMBIES, TELE_BOSS, TESLA_BOSS, UPG_COUNT, UPG_TESLA, Z_GHOUL, type Input, type World,
} from "../src/sim/types";
import { createWorld } from "../src/sim/world";
const idle: Input = { dx: 0, dy: 0, pick: 0 };
const hold = (w: World): void => {
  w.toSpawn = 80;
  w.spawnCd = 999999;
  w.fireCd = 999999;
  w.wave = 3;
};
const ghouls = (w: World): number => {
  let n = 0;
  for (let i = 0; i < MAX_ZOMBIES; i++) if (w.zombies.alive[i] && w.zombies.kind[i] === Z_GHOUL) n++;
  return n;
};
const shots = (w: World): number => {
  let n = 0;
  for (let i = 0; i < MAX_BOSS_SHOTS; i++) if ((w.boss.shotLife[i] ?? 0) > 0) n++;
  return n;
};
const clouds = (w: World): number => {
  let n = 0;
  for (let i = 0; i < MAX_CLOUDS; i++) if ((w.boss.cloudLife[i] ?? 0) > 0) n++;
  return n;
};
const untilBoss = (w: World, limit: number): void => {
  for (let i = 0; i < limit && !w.boss.on; i++) {
    w.hp = 40;
    step(w, { dx: 0, dy: 0, pick: 1 });
  }
};
function arm(kind: number, phase: number, mode: number, timer: number, tier = 1): World {
  const w = createWorld(1);
  hold(w);
  w.boss.on = 1;
  w.boss.kind = kind;
  w.boss.phase = phase;
  w.boss.mode = mode;
  w.boss.timer = timer;
  w.boss.tier = tier;
  w.boss.hp = 800;
  w.boss.maxHp = 800;
  w.boss.x = 70;
  w.boss.y = 160;
  w.px = 320;
  w.py = 160;
  return w;
}
describe("boss schedule", () => {
  it("warns with a siren and arrives at two minutes", () => {
    const w = createWorld(5);
    hold(w);
    let siren = false;
    let warned = false;
    let early = false;
    let tele = false;
    for (let i = 0; i < BOSS_EVERY + 5 && !w.boss.on; i++) {
      w.hp = 40;
      w.hurtCd = 3;
      step(w, idle);
      if (w.tick === BOSS_EVERY - BOSS_WARN - 1) {
        early = w.boss.on === 0 && w.boss.pending === 0 && w.boss.warn === 0;
      }
      if (w.events[EV_SIREN]) siren = true;
      if (w.boss.pending && w.boss.warn > 0 && !w.boss.on) warned = true;
      for (let t = 0; t < w.arena.teleAlive.length; t++) {
        if (w.arena.teleAlive[t] && w.arena.teleKind[t] === TELE_BOSS) tele = true;
      }
    }
    expect(early).toBe(true);
    expect(warned).toBe(true);
    expect(siren).toBe(true);
    expect(tele).toBe(true);
    expect(w.boss.on).toBe(1);
    expect(w.tick).toBe(BOSS_EVERY);
    expect(w.boss.kind).toBe(BOSS_BEHEMOTH);
  });
  it("rotates behemoth, witch, gearlord, then behemoth again", () => {
    const w = createWorld(6);
    hold(w);
    const kinds: number[] = [];
    for (let n = 0; n < 4; n++) {
      if (n > 0) w.tick = (w.boss.n + 1) * BOSS_EVERY - BOSS_WARN - 1;
      untilBoss(w, BOSS_EVERY + BOSS_WARN + 30);
      expect(w.boss.on).toBe(1);
      kinds.push(w.boss.kind);
      w.boss.hp = 0;
      step(w, { dx: 0, dy: 0, pick: 0 });
      step(w, { dx: 0, dy: 0, pick: 1 });
      expect(w.boss.on).toBe(0);
    }
    expect(kinds).toEqual([BOSS_BEHEMOTH, BOSS_WITCH, BOSS_GEAR, BOSS_BEHEMOTH]);
  });
});
describe("boss attacks", () => {
  it("names the three bosses and gives each two or three patterns", () => {
    expect(bossName(BOSS_BEHEMOTH)).toBe("IRON BEHEMOTH");
    expect(bossName(BOSS_WITCH)).toBe("STEAM WITCH");
    expect(bossName(BOSS_GEAR)).toBe("GEARLORD");
    expect(patternCount(BOSS_BEHEMOTH)).toBe(2);
    expect(patternCount(BOSS_WITCH)).toBe(3);
    expect(patternCount(BOSS_GEAR)).toBe(3);
  });
  it("the iron behemoth charges and grows a ground-slam shockwave", () => {
    const slow = arm(BOSS_BEHEMOTH, 0, 1, 1, 1);
    const fast = arm(BOSS_BEHEMOTH, 0, 1, 1, 5);
    step(slow, idle);
    step(fast, idle);
    expect(slow.boss.mode).toBe(2);
    expect(slow.boss.vx).toBeGreaterThan(3);
    expect(fast.boss.vx).toBeGreaterThan(slow.boss.vx);
    const x = slow.boss.x;
    step(slow, idle);
    expect(slow.boss.x).toBeGreaterThan(x);
    slow.boss.x = slow.px - 16;
    slow.boss.y = slow.py;
    slow.boss.timer = 8;
    slow.hp = 5;
    slow.hurtCd = 0;
    step(slow, idle);
    expect(slow.hp).toBeLessThan(5);
    const slam = arm(BOSS_BEHEMOTH, 1, 1, 1, 1);
    slam.px = 240;
    slam.py = 120;
    slam.boss.x = 240;
    slam.boss.y = 210;
    slam.hp = 5;
    let farHit = false;
    for (let i = 0; i < 70 && !farHit; i++) {
      step(slam, idle);
      const dx = slam.px - slam.boss.x;
      const dy = slam.py - slam.boss.y;
      if (slam.hp < 5 && dx * dx + dy * dy > 2500) farHit = true;
    }
    expect(farHit).toBe(true);
    expect(slam.boss.slam > 8 || slam.boss.slamHit === 1 || slam.hp < 5).toBe(true);
  });
  it("the steam witch summons ghouls and leaves slowing steam", () => {
    const few = arm(BOSS_WITCH, 0, 1, 1, 1);
    const many = arm(BOSS_WITCH, 0, 1, 1, 4);
    step(few, idle);
    step(many, idle);
    expect(ghouls(few)).toBe(2);
    expect(ghouls(many)).toBe(3);
    const steam = arm(BOSS_WITCH, 1, 1, 1, 1);
    steam.px = 240;
    steam.py = 160;
    steam.boss.x = 60;
    steam.boss.y = 180;
    step(steam, idle);
    expect(clouds(steam)).toBeGreaterThanOrEqual(1);
    let radius = 0;
    for (let i = 0; i < MAX_CLOUDS; i++) {
      if ((steam.boss.cloudLife[i] ?? 0) > 0) radius = Math.max(radius, steam.boss.cloudR[i] ?? 0);
    }
    expect(radius).toBeGreaterThanOrEqual(34);
    const aura = arm(BOSS_WITCH, 2, 2, 55, 1);
    step(aura, idle);
    expect(clouds(aura)).toBeGreaterThan(0);
    const open = createWorld(3);
    hold(open);
    open.px = 180;
    const plain = open.px;
    step(open, { dx: 1, dy: 0, pick: 0 });
    const full = open.px - plain;
    const slowed = createWorld(3);
    hold(slowed);
    slowed.px = 180;
    slowed.boss.tier = 1;
    slowed.boss.cloudX[0] = 180;
    slowed.boss.cloudY[0] = slowed.py;
    slowed.boss.cloudR[0] = 50;
    slowed.boss.cloudLife[0] = 90;
    const x0 = slowed.px;
    step(slowed, { dx: 1, dy: 0, pick: 0 });
    const fog = slowed.px - x0;
    expect(fog).toBeLessThan(full * 0.75);
    const heavy = createWorld(3);
    hold(heavy);
    heavy.px = 180;
    heavy.boss.tier = 6;
    heavy.boss.cloudX[0] = 180;
    heavy.boss.cloudY[0] = heavy.py;
    heavy.boss.cloudR[0] = 50;
    heavy.boss.cloudLife[0] = 90;
    const h0 = heavy.px;
    step(heavy, { dx: 1, dy: 0, pick: 0 });
    expect(heavy.px - h0).toBeLessThan(fog);
  });
  it("the gearlord fires spinning saws in rings", () => {
    const ring = arm(BOSS_GEAR, 0, 1, 1, 1);
    step(ring, idle);
    expect(shots(ring)).toBeGreaterThanOrEqual(8);
    const angles = new Set<string>();
    for (let i = 0; i < MAX_BOSS_SHOTS; i++) {
      if ((ring.boss.shotLife[i] ?? 0) <= 0) continue;
      angles.add(Math.atan2(ring.boss.shotVy[i] ?? 0, ring.boss.shotVx[i] ?? 0).toFixed(3));
    }
    expect(angles.size).toBeGreaterThanOrEqual(8);
    ring.boss.x = 40;
    ring.boss.y = 200;
    ring.px = 300;
    ring.py = 160;
    ring.boss.shotX[0] = 300;
    ring.boss.shotY[0] = 160;
    ring.boss.shotVx[0] = 0;
    ring.boss.shotVy[0] = 0;
    ring.boss.shotLife[0] = 40;
    ring.hp = 5;
    ring.hurtCd = 0;
    step(ring, idle);
    expect(ring.hp).toBeLessThan(5);
    const orbit = arm(BOSS_GEAR, 1, 1, 1, 1);
    step(orbit, idle);
    let orbiting = 0;
    let grew = false;
    for (let i = 0; i < MAX_BOSS_SHOTS; i++) {
      if ((orbit.boss.shotKind[i] ?? 0) === 1 && (orbit.boss.shotLife[i] ?? 0) > 0) {
        orbiting++;
        if ((orbit.boss.shotR[i] ?? 0) > 20) grew = true;
      }
    }
    expect(orbiting).toBeGreaterThanOrEqual(6);
    expect(grew).toBe(true);
    const twin = arm(BOSS_GEAR, 2, 1, 1, 1);
    step(twin, idle);
    expect(shots(twin)).toBeGreaterThanOrEqual(12);
  });
  it("a pierce bullet damages the boss once even while it overlaps", () => {
    const w = arm(BOSS_BEHEMOTH, 1, 2, 40, 1);
    w.boss.hp = 800;
    w.bullets.alive[0] = 1;
    w.bullets.x[0] = w.boss.x;
    w.bullets.y[0] = w.boss.y;
    w.bullets.vx[0] = 0;
    w.bullets.vy[0] = 0;
    w.bPierce[0] = 3;
    w.bHit[0] = -1;
    w.boss.bulletMark[0] = 0;
    const dmg = bulletDmg(w);
    const hp0 = w.boss.hp;
    for (let i = 0; i < 5; i++) step(w, idle);
    expect(w.boss.hp).toBe(hp0 - dmg);
    expect(w.bPierce[0]).toBe(2);
    expect(w.bullets.alive[0]).toBe(1);
    expect(w.boss.bulletMark[0]).toBe(1);
    w.zombies.alive[0] = 1;
    w.zombies.kind[0] = 0;
    w.zombies.x[0] = w.bullets.x[0] ?? 0;
    w.zombies.y[0] = w.bullets.y[0] ?? 0;
    w.zombies.vx[0] = 0;
    w.zombies.hp[0] = 40;
    step(w, idle);
    expect(w.bHit[0]).toBe(0);
    expect(w.boss.hp).toBe(hp0 - dmg);
    expect(w.bPierce[0]).toBe(1);
    w.zombies.alive[0] = 0;
    w.bullets.alive[1] = 1;
    w.bullets.x[1] = w.boss.x;
    w.bullets.y[1] = w.boss.y;
    w.bullets.vx[1] = 0;
    w.bullets.vy[1] = 0;
    w.bPierce[1] = 0;
    w.boss.bulletMark[1] = 0;
    step(w, idle);
    expect(w.boss.hp).toBe(hp0 - dmg * 2);
    expect(w.bullets.alive[1]).toBe(0);
    expect(w.bullets.alive[0]).toBe(1);
    const fresh = arm(BOSS_BEHEMOTH, 1, 2, 40, 1);
    fresh.boss.bulletMark[0] = 1;
    fresh.fireCd = 0;
    step(fresh, idle);
    expect(fresh.bullets.alive[0]).toBe(1);
    expect(fresh.boss.bulletMark[0]).toBe(0);
  });
  it("tesla strikes the boss with no zombie and draws the bolt there", () => {
    const w = arm(BOSS_BEHEMOTH, 1, 2, 40, 0);
    w.px = 160;
    w.py = 160;
    w.boss.x = 200;
    w.boss.y = 160;
    w.boss.hp = 400;
    w.upgrades[UPG_TESLA] = 1;
    w.teslaCd = 0;
    const before = w.boss.hp;
    step(w, idle);
    expect(w.boss.hp).toBe(before - teslaPower(w));
    expect(w.teslaN).toBe(1);
    expect(w.teslaHit[0]).toBe(TESLA_BOSS);
    expect(w.events[EV_TESLA]).toBe(1);
    expect(w.teslaFlash).toBeGreaterThan(0);
    const ops: string[] = [];
    const ctx = {
      beginPath() { ops.push("begin"); },
      moveTo(x: number, y: number) { ops.push(`m ${x} ${y}`); },
      lineTo(x: number, y: number) { ops.push(`l ${x} ${y}`); },
      stroke() { ops.push("stroke"); },
      save() { ops.push("save"); },
      restore() { ops.push("restore"); },
    };
    drawTesla(ctx as unknown as CanvasRenderingContext2D, w);
    expect(ops).toContain(`l ${w.boss.x} ${w.boss.y - 16}`);
    const crowd = arm(BOSS_BEHEMOTH, 1, 2, 40, 0);
    crowd.px = 160;
    crowd.py = 160;
    crowd.boss.x = 400;
    crowd.boss.y = 160;
    crowd.boss.hp = 400;
    crowd.upgrades[UPG_TESLA] = 1;
    crowd.teslaCd = 0;
    crowd.zombies.alive[0] = 1;
    crowd.zombies.x[0] = 170;
    crowd.zombies.y[0] = 160;
    crowd.zombies.vx[0] = 0;
    crowd.zombies.hp[0] = 30;
    step(crowd, idle);
    expect(crowd.boss.hp).toBe(400);
    expect(crowd.teslaHit[0]).not.toBe(TESLA_BOSS);
    expect(crowd.zombies.hp[0]).toBeLessThan(30);
    expect(crowd.events[EV_TESLA]).toBe(1);
  });
  it("the slam ring still hits when one tick outgrows the ring thickness", () => {
    const tier = 80;
    const prev = 30;
    const w = arm(BOSS_BEHEMOTH, 1, 2, 20, tier);
    w.boss.x = 240;
    w.boss.y = 200;
    w.px = 240;
    w.py = 160;
    w.boss.slam = prev;
    w.boss.slamHit = 0;
    w.hp = 5;
    w.hurtCd = 0;
    const growth = 3.1 + tier * 0.4;
    const dx = w.px - w.boss.x;
    const dy = w.py - w.boss.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    expect(growth).toBeGreaterThan(18);
    expect(d).toBeGreaterThanOrEqual(prev);
    expect(d).toBeLessThan(prev + growth - 18);
    expect(d * d).toBeGreaterThan(900);
    step(w, idle);
    expect(w.boss.slam).toBeCloseTo(prev + growth);
    expect(w.boss.slamHit).toBe(1);
    expect(w.hp).toBeLessThan(5);
  });
});
describe("boss rewards and tier", () => {
  it("scales from the world's difficulty rank", () => {
    const spawnAt = (rank: number): World => {
      const w = createWorld(9);
      hold(w);
      w.rank = rank;
      w.tick = 30;
      w.boss.pending = 2;
      w.boss.x = w.px + 140;
      w.boss.y = w.py;
      step(w, { dx: 0, dy: 0, pick: 1 });
      return w;
    };
    expect(bossTier(createWorld(1))).toBe(0);
    expect(bossMaxHp(BOSS_BEHEMOTH, 4, 0)).toBeGreaterThan(bossMaxHp(BOSS_BEHEMOTH, 0, 0));
    expect(bossXp(0, 4)).toBeGreaterThan(bossXp(0, 0));
    expect(bossScore(3, 4)).toBeGreaterThan(bossScore(3, 0));
    expect(bossSlowFactor(4)).toBeLessThan(bossSlowFactor(0));
    const calm = spawnAt(0);
    const hard = spawnAt(4);
    expect(calm.boss.on).toBe(1);
    expect(calm.boss.tier).toBe(0);
    expect(hard.boss.tier).toBe(4);
    expect(calm.boss.maxHp).toBe(bossMaxHp(BOSS_BEHEMOTH, 0, 0));
    expect(hard.boss.maxHp).toBe(bossMaxHp(BOSS_BEHEMOTH, 4, 0));
    expect(hard.boss.maxHp).toBeGreaterThan(calm.boss.maxHp);
    const duck = createWorld(9);
    hold(duck);
    duck.rank = 2;
    duck.tick = 30;
    duck.boss.pending = 2;
    duck.boss.x = duck.px + 140;
    duck.boss.y = duck.py;
    const bag = duck as World & { difficulty?: number; tier?: number; difficultyTier?: number };
    bag.difficulty = 9;
    bag.tier = 8;
    bag.difficultyTier = 7;
    step(duck, { dx: 0, dy: 0, pick: 1 });
    expect(duck.boss.tier).toBe(2);
    expect(duck.boss.maxHp).toBe(bossMaxHp(BOSS_BEHEMOTH, 2, 0));
    const geared = createWorld(2);
    hold(geared);
    geared.mods = MOD_GEAR;
    geared.boss.on = 1;
    geared.boss.kind = BOSS_BEHEMOTH;
    geared.boss.tier = 1;
    geared.boss.hp = 0;
    geared.boss.maxHp = 120;
    geared.boss.x = geared.px + 160;
    geared.boss.y = geared.py;
    step(geared, idle);
    expect(geared.boss.on).toBe(0);
    expect(geared.score).toBe(applyScore(bossScore(3, 1), MOD_GEAR));
    const stroll = arm(BOSS_BEHEMOTH, 0, 1, 1, 1);
    const rushed = arm(BOSS_BEHEMOTH, 0, 1, 1, 1);
    rushed.mods = MOD_FAST;
    step(stroll, idle);
    step(rushed, idle);
    expect(rushed.boss.vx).toBeGreaterThan(stroll.boss.vx);
  });
  it("leaves the finale lich as the only boss at twenty minutes", () => {
    const w = createWorld(1);
    hold(w);
    w.boss.n = 9;
    w.tick = FINALE_TICK - 3;
    for (let i = 0; i < 6 && !lichUp(w); i++) {
      w.hp = 80;
      w.hurtCd = 3;
      step(w, { dx: 0, dy: 0, pick: 1 });
    }
    expect(lichUp(w)).toBe(true);
    expect(w.boss.on).toBe(0);
    expect(w.boss.pending).toBe(0);
  });
  it("a kill pays big xp and opens a power-up choice", () => {
    const w = createWorld(2);
    hold(w);
    w.xp = 0;
    w.level = 0;
    w.boss.on = 1;
    w.boss.kind = BOSS_BEHEMOTH;
    w.boss.tier = 1;
    w.boss.hp = 1;
    w.boss.maxHp = 120;
    w.boss.x = 100;
    w.boss.y = 150;
    w.boss.shotLife[0] = 20;
    w.boss.cloudLife[0] = 20;
    w.bullets.alive[0] = 1;
    w.bullets.x[0] = 100;
    w.bullets.y[0] = 150;
    w.bullets.vx[0] = 0;
    w.bullets.vy[0] = 0;
    let start = 0;
    for (let i = 0; i < UPG_COUNT; i++) start += w.upgrades[i] ?? 0;
    expect(bossXp(0, 1)).toBeGreaterThan(xpNeed(0));
    expect(bossScore(3, 1)).toBeGreaterThan(200);
    step(w, idle);
    expect(w.boss.on).toBe(0);
    expect(w.boss.shotLife[0]).toBe(0);
    expect(w.boss.cloudLife[0]).toBe(0);
    expect(w.score).toBe(bossScore(3, 1));
    expect(w.choosing).toBe(1);
    expect(w.level).toBeGreaterThanOrEqual(1);
    expect(w.offers[0]).toBeGreaterThanOrEqual(0);
    expect(w.xp + xpNeed(0)).toBeGreaterThanOrEqual(bossXp(0, 1));
    step(w, { dx: 0, dy: 0, pick: 1 });
    expect(w.choosing).toBe(0);
    let ranks = 0;
    for (let i = 0; i < UPG_COUNT; i++) ranks += w.upgrades[i] ?? 0;
    expect(ranks).toBe(start + 1);
  });
  it("stays deterministic once a boss is in the run", () => {
    const run = (seed: number): string => {
      const w = createWorld(seed);
      const input: Input = { dx: 1, dy: 0, pick: 1 };
      for (let i = 0; i < 8000; i++) {
        w.hp = 40;
        step(w, input);
      }
      const b = w.boss;
      return [b.on, b.kind, b.n, b.hp, b.phase, b.x.toFixed(2), b.y.toFixed(2), w.score].join(":");
    };
    expect(run(4)).toBe(run(4));
    expect(run(4)).not.toBe(run(5));
  });
});
