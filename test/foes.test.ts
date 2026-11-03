import { killXp, mixWeight, scaledHp, scoreMul } from "../src/sim/difficulty";
import {
  B_ACID, ELITE_PER_MILLE, ELITE_XP, foeContact, foeHitR2, foeHp, foeKillXp, foeScore, GAS_DMG,
  KIND_N, knightBlocks, PACK, rollKind, SPAWN_W, SPIT_CD, SPIT_CD_ELITE, tierForRank,
  Z_ELITE, Z_GAS, Z_KIND, Z_KNIGHT, Z_RAT, Z_SPITTER,
} from "../src/sim/foes";
import { xpNeed } from "../src/sim/progress";
import { step } from "../src/sim/step.hot";
import {
  EV_HURT, EV_KILL, EV_SHIELD, MAX_ZOMBIES, Z_BRUTE, Z_GHOUL, Z_SHAMBLER, type Input, type World,
} from "../src/sim/types";
import { createWorld } from "../src/sim/world";

const idle: Input = { dx: 0, dy: 0, pick: 0 };

function quiet(w: World): void {
  w.toSpawn = 8;
  w.spawnCd = 99999;
  w.fireCd = 99999;
  w.wave = 4;
  w.hurtCd = 0;
}

function tally(rank: number, n: number): { kinds: number[]; elites: number } {
  const w = createWorld(5);
  w.hp = 99999;
  w.fireCd = 999999;
  const kinds = [0, 0, 0, 0, 0, 0, 0];
  let elites = 0;
  for (let t = 0; t < n; t++) {
    w.tick = 0;
    w.rank = rank;
    w.toSpawn = 2;
    w.spawnCd = 0;
    w.over = false;
    w.choosing = 0;
    w.hurtCd = 0;
    for (let i = 0; i < MAX_ZOMBIES; i++) w.zombies.alive[i] = 0;
    w.arena.teleAlive.fill(0);
    step(w, idle);
    w.toSpawn = 0;
    w.spawnCd = 99999;
    for (let k = 0; k < 40; k++) step(w, idle);
    for (let i = 0; i < MAX_ZOMBIES; i++) {
      if (!w.zombies.alive[i]) continue;
      const raw = w.zombies.kind[i] ?? 0;
      const k = raw & Z_KIND;
      kinds[k] = (kinds[k] ?? 0) + 1;
      if ((raw & Z_ELITE) !== 0) elites++;
    }
  }
  return { kinds, elites };
}

describe("spawn tables", () => {
  it("maps ranks onto rising difficulty tiers", () => {
    expect(tierForRank(0)).toBe(0);
    expect(tierForRank(1)).toBe(1);
    expect(tierForRank(2)).toBe(2);
    expect(tierForRank(3)).toBe(3);
    expect(tierForRank(40)).toBe(3);
    for (let t = 1; t < ELITE_PER_MILLE.length; t++) {
      expect(ELITE_PER_MILLE[t] ?? 0).toBeGreaterThan(ELITE_PER_MILLE[t - 1] ?? 0);
    }
  });

  it("keeps classic foes on the early row and unlocks the new rows later", () => {
    const early = tally(0, 250);
    expect(early.kinds[Z_SHAMBLER]).toBeGreaterThan(0);
    expect(early.kinds[Z_GHOUL]).toBeGreaterThan(0);
    expect(early.kinds[Z_BRUTE]).toBeGreaterThan(0);
    expect(early.kinds[Z_SPITTER]).toBe(0);
    expect(early.kinds[Z_GAS]).toBe(0);
    expect(early.kinds[Z_KNIGHT]).toBe(0);
    expect(early.kinds[Z_RAT]).toBe(0);
    expect(early.elites).toBe(0);
    const mid = tally(1, 400);
    expect(mid.kinds[Z_SPITTER]).toBeGreaterThan(0);
    expect(mid.kinds[Z_RAT]).toBeGreaterThan(0);
    expect(mid.kinds[Z_GAS]).toBe(0);
    expect(mid.kinds[Z_KNIGHT]).toBe(0);
    const late = tally(3, 500);
    for (let k = 0; k < KIND_N; k++) expect(late.kinds[k]).toBeGreaterThan(0);
    expect(late.elites).toBeGreaterThan(0);
  });

  it("spawns only kinds with weight in that rank row", () => {
    for (const rank of [0, 1, 2, 3]) {
      const tier = tierForRank(rank);
      const seen = tally(rank, 400);
      for (let k = 0; k < KIND_N; k++) {
        const classic = k === Z_SHAMBLER || k === Z_GHOUL || k === Z_BRUTE;
        const weight = classic ? mixWeight(rank, k) : (SPAWN_W[tier * KIND_N + k] ?? 0);
        if (weight <= 0) expect(seen.kinds[k]).toBe(0);
        else expect(seen.kinds[k]).toBeGreaterThan(0);
      }
    }
  });

  it("rolls elites more often as the rank rises", () => {
    const count = (rank: number): number => {
      const w = createWorld(99);
      w.rank = rank;
      let n = 0;
      for (let i = 0; i < 800; i++) if ((rollKind(w) & Z_ELITE) !== 0) n++;
      return n;
    };
    const a = count(0);
    const b = count(1);
    const c = count(3);
    const d = count(6);
    expect(a).toBe(0);
    expect(b).toBeGreaterThan(a);
    expect(c).toBeGreaterThan(b);
    expect(d).toBeGreaterThan(c);
  });

  it("releases a rat-gear pack from the pack table", () => {
    expect(PACK[Z_RAT]).toBeGreaterThan(1);
    expect(PACK[Z_SPITTER]).toBe(1);
    expect(PACK[Z_GAS]).toBe(1);
    expect(PACK[Z_KNIGHT]).toBe(1);
    const w = createWorld(3);
    w.hp = 99999;
    w.fireCd = 999999;
    w.rank = 3;
    let packs = 0;
    for (let t = 0; t < 200 && packs < 3; t++) {
      w.toSpawn = 1;
      w.spawnCd = 0;
      w.over = false;
      for (let i = 0; i < MAX_ZOMBIES; i++) w.zombies.alive[i] = 0;
      w.arena.teleAlive.fill(0);
      step(w, idle);
      w.toSpawn = 0;
      w.spawnCd = 99999;
      for (let k = 0; k < 40; k++) step(w, idle);
      let rats = 0;
      let other = 0;
      for (let i = 0; i < MAX_ZOMBIES; i++) {
        if (!w.zombies.alive[i]) continue;
        if (((w.zombies.kind[i] ?? 0) & Z_KIND) === Z_RAT) rats++;
        else other++;
      }
      if (rats === 0) continue;
      packs++;
      expect(other).toBe(0);
      expect(rats).toBe(PACK[Z_RAT]);
    }
    expect(packs).toBeGreaterThan(0);
  });
});

describe("foe stats", () => {
  it("preserves shambler, ghoul, and brute numbers", () => {
    expect(foeHp(Z_GHOUL, 0, false)).toBe(scaledHp(1, 0));
    expect(foeHp(Z_SHAMBLER, 4, false)).toBe(scaledHp(1, 4));
    expect(foeHp(Z_BRUTE, 4, false)).toBe(scaledHp(3, 4));
    expect(foeScore(Z_SHAMBLER, 2, 0)).toBe(10 * 2 * scoreMul(0));
    expect(foeScore(Z_GHOUL, 2, 0)).toBe(20 * 2 * scoreMul(0));
    expect(foeScore(Z_BRUTE, 2, 0)).toBe(40 * 2 * scoreMul(0));
    expect(foeScore(Z_SHAMBLER, 2, 3)).toBe(10 * 2 * scoreMul(3));
    expect(foeContact(Z_BRUTE)).toBe(2);
    expect(foeContact(Z_SHAMBLER)).toBe(1);
    expect(foeHitR2(Z_BRUTE)).toBe(220);
    expect(foeHitR2(Z_GHOUL)).toBe(72);
    expect(foeHitR2(Z_SHAMBLER)).toBe(100);
  });

  it("gives elites more hp, a bigger hit, and double score", () => {
    for (const kind of [Z_SPITTER, Z_GAS, Z_KNIGHT, Z_RAT, Z_SHAMBLER]) {
      expect(foeHp(kind, 6, true)).toBe(foeHp(kind, 6, false) * 2 + 2);
      expect(foeHitR2(kind | Z_ELITE)).toBeGreaterThan(foeHitR2(kind));
      expect(foeScore(kind | Z_ELITE, 3, 2)).toBe(foeScore(kind, 3, 2) * 2);
    }
  });
});

describe("spitter", () => {
  function place(w: World, x: number, elite = false): void {
    quiet(w);
    w.zombies.alive[0] = 1;
    w.zombies.kind[0] = elite ? Z_SPITTER | Z_ELITE : Z_SPITTER;
    w.zombies.hp[0] = 40;
    w.zombies.x[0] = x;
    w.zombies.y[0] = w.py;
    w.zombies.vx[0] = 1;
    w.zombies.vy[0] = 0;
  }

  it("backs away when crowded and closes from far out", () => {
    const near = createWorld(1);
    place(near, near.px + 30);
    for (let t = 0; t < 12; t++) step(near, idle);
    expect(Math.abs((near.zombies.x[0] ?? 0) - near.px)).toBeGreaterThan(36);
    const far = createWorld(1);
    place(far, far.px + 170);
    const d0 = Math.abs((far.zombies.x[0] ?? 0) - far.px);
    for (let t = 0; t < 20; t++) step(far, idle);
    expect(Math.abs((far.zombies.x[0] ?? 0) - far.px)).toBeLessThan(d0);
  });

  it("spits an acid glob that hurts the player and ignores other foes", () => {
    const w = createWorld(2);
    place(w, w.px + 140);
    w.zombies.vx[0] = 0;
    w.zombies.alive[1] = 1;
    w.zombies.kind[1] = Z_SHAMBLER;
    w.zombies.hp[1] = 9;
    w.zombies.x[1] = w.px + 70;
    w.zombies.y[1] = w.py;
    w.zombies.vx[1] = 0;
    const hp = w.hp;
    let sawAcid = false;
    for (let t = 0; t < 100 && w.hp === hp; t++) {
      step(w, idle);
      for (let j = 0; j < w.bullets.alive.length; j++) {
        if (w.bullets.alive[j] && (w.bullets.hp[j] ?? 0) === B_ACID) sawAcid = true;
      }
    }
    expect(sawAcid).toBe(true);
    expect(w.hp).toBe(hp - 1);
    expect(w.events[EV_HURT]).toBe(1);
    expect(w.zombies.hp[1]).toBe(9);
    expect(w.zombies.alive[0]).toBe(1);
  });

  it("charges an elite spitter faster and lets a shield soak the glob", () => {
    const elite = createWorld(3);
    place(elite, elite.px + 140, true);
    elite.zombies.vx[0] = 0;
    step(elite, idle);
    expect(elite.zombies.vy[0]).toBe(SPIT_CD_ELITE);
    const plain = createWorld(3);
    place(plain, plain.px + 140, false);
    plain.zombies.vx[0] = 0;
    step(plain, idle);
    expect(plain.zombies.vy[0]).toBe(SPIT_CD);
    const w = createWorld(4);
    place(w, w.px + 140);
    w.zombies.vx[0] = 0;
    w.shield = 1;
    w.upgrades[9] = 1;
    const hp = w.hp;
    for (let t = 0; t < 100 && w.shield === 1; t++) step(w, idle);
    expect(w.shield).toBe(0);
    expect(w.hp).toBe(hp);
    expect(w.events[EV_SHIELD]).toBe(1);
  });
});

describe("gas tank", () => {
  function arm(w: World, x: number, elite = false): void {
    quiet(w);
    w.zombies.alive[0] = 1;
    w.zombies.kind[0] = elite ? Z_GAS | Z_ELITE : Z_GAS;
    w.zombies.hp[0] = 1;
    w.zombies.x[0] = x;
    w.zombies.y[0] = w.py;
    w.zombies.vx[0] = 0;
    w.bullets.alive[0] = 1;
    w.bullets.kind[0] = 0;
    w.bullets.x[0] = x;
    w.bullets.y[0] = w.py;
    w.bullets.vx[0] = 0;
    w.bullets.vy[0] = 0;
    w.bHit[0] = -1;
  }

  it("explodes on a close kill, stays safe at range, and detonates on contact", () => {
    const far = createWorld(5);
    arm(far, far.px - 140);
    const farHp = far.hp;
    step(far, idle);
    expect(far.zombies.alive[0]).toBe(0);
    expect(far.hp).toBe(farHp);
    expect(far.events[EV_KILL]).toBe(1);
    const close = createWorld(5);
    arm(close, close.px + 40);
    const closeHp = close.hp;
    step(close, idle);
    expect(close.zombies.alive[0]).toBe(0);
    expect(closeHp - close.hp).toBe(GAS_DMG);
    expect(close.events[EV_HURT]).toBe(1);
    const fuse = createWorld(5);
    quiet(fuse);
    fuse.zombies.alive[0] = 1;
    fuse.zombies.kind[0] = Z_GAS;
    fuse.zombies.hp[0] = 8;
    fuse.zombies.x[0] = fuse.px;
    fuse.zombies.y[0] = fuse.py;
    fuse.zombies.vx[0] = 0;
    const fuseHp = fuse.hp;
    step(fuse, idle);
    expect(fuse.zombies.alive[0]).toBe(0);
    expect(fuseHp - fuse.hp).toBe(GAS_DMG);
  });

  it("gives an elite tank a wider blast and lets a shield eat the boom", () => {
    const normal = createWorld(6);
    arm(normal, normal.px + 60, false);
    const normalHp = normal.hp;
    step(normal, idle);
    expect(normal.hp).toBe(normalHp);
    const elite = createWorld(6);
    arm(elite, elite.px + 60, true);
    const eliteHp = elite.hp;
    step(elite, idle);
    expect(eliteHp - elite.hp).toBe(GAS_DMG);
    const shielded = createWorld(6);
    arm(shielded, shielded.px + 40);
    shielded.shield = 1;
    const hp = shielded.hp;
    step(shielded, idle);
    expect(shielded.hp).toBe(hp);
    expect(shielded.shield).toBe(0);
    expect(shielded.events[EV_SHIELD]).toBe(1);
  });
});

describe("copper knight", () => {
  function plant(w: World, face: number, bulletX: number, bulletVx: number, elite = false): void {
    quiet(w);
    w.px = 300;
    w.py = 160;
    w.zombies.alive[0] = 1;
    w.zombies.kind[0] = elite ? Z_KNIGHT | Z_ELITE : Z_KNIGHT;
    w.zombies.hp[0] = 8;
    w.zombies.x[0] = 200;
    w.zombies.y[0] = 160;
    w.zombies.vx[0] = 0;
    w.zombies.vy[0] = face;
    w.bullets.alive[0] = 1;
    w.bullets.kind[0] = 0;
    w.bullets.x[0] = bulletX;
    w.bullets.y[0] = 160;
    w.bullets.vx[0] = bulletVx;
    w.bullets.vy[0] = 0;
    w.bHit[0] = -1;
  }

  it("blocks a frontal rivet and takes a shot in the back", () => {
    expect(knightBlocks(0, 200, 160, 215, 160)).toBe(true);
    expect(knightBlocks(0, 200, 160, 185, 160)).toBe(false);
    const front = createWorld(7);
    plant(front, 0, 216, -4);
    step(front, idle);
    expect(front.zombies.hp[0]).toBe(8);
    expect(front.zombies.alive[0]).toBe(1);
    expect(front.bullets.alive[0]).toBe(0);
    expect(front.events[EV_KILL]).toBe(0);
    const back = createWorld(7);
    plant(back, 0, 184, 4);
    step(back, idle);
    expect(back.zombies.hp[0]).toBe(7);
    expect(back.bullets.alive[0]).toBe(0);
    const elite = createWorld(7);
    plant(elite, 0, 216, -4, true);
    step(elite, idle);
    expect(elite.zombies.hp[0]).toBe(8);
    expect(elite.bullets.alive[0]).toBe(0);
  });
});

describe("elite reward", () => {
  function slay(raw: number, rank: number): World {
    const w = createWorld(8);
    quiet(w);
    w.rank = rank;
    w.zombies.alive[0] = 1;
    w.zombies.kind[0] = raw;
    w.zombies.hp[0] = 1;
    w.zombies.x[0] = w.px + 28;
    w.zombies.y[0] = w.py;
    w.zombies.vx[0] = 0;
    w.bullets.alive[0] = 1;
    w.bullets.kind[0] = 0;
    w.bullets.x[0] = w.px + 28;
    w.bullets.y[0] = w.py;
    w.bullets.vx[0] = 0;
    w.bullets.vy[0] = 0;
    w.bHit[0] = -1;
    step(w, idle);
    return w;
  }

  it("pays guaranteed bonus xp on an elite kill through the instant grant", () => {
    const rank = 2;
    expect(foeKillXp(Z_SHAMBLER, rank)).toBe(killXp(Z_SHAMBLER, rank));
    expect(foeKillXp(Z_GHOUL, rank)).toBe(killXp(Z_GHOUL, rank));
    expect(foeKillXp(Z_BRUTE, rank)).toBe(killXp(Z_BRUTE, rank));
    expect(foeKillXp(Z_SPITTER, rank)).toBe(killXp(Z_SHAMBLER, rank) + 1);
    expect(foeKillXp(Z_GAS, 0)).toBe(killXp(Z_SHAMBLER, 0) + 2);
    expect(foeKillXp(Z_KNIGHT | Z_ELITE, 0)).toBe(killXp(Z_SHAMBLER, 0) + 2 + ELITE_XP);
    const grant = killXp(Z_SHAMBLER, rank) + ELITE_XP;
    expect(foeKillXp(Z_SHAMBLER | Z_ELITE, rank)).toBe(grant);
    const elite = slay(Z_SHAMBLER | Z_ELITE, rank);
    const plain = slay(Z_SHAMBLER, rank);
    expect(elite.events[EV_KILL]).toBe(1);
    expect(plain.xp).toBe(killXp(Z_SHAMBLER, rank));
    expect(plain.level).toBe(0);
    expect(plain.choosing).toBe(0);
    expect(elite.level).toBe(1);
    expect(elite.xp).toBe(grant - xpNeed(0));
    expect(elite.choosing).toBe(1);
    expect(elite).not.toHaveProperty("cogs");
    expect(plain).not.toHaveProperty("cogs");
    expect(elite.score).toBeGreaterThan(plain.score);
  });
});

describe("determinism", () => {
  it("repeats foe waves from the same seed", () => {
    const run = () => {
      const w = createWorld(42);
      const input: Input = { dx: 1, dy: 0, pick: 1 };
      for (let t = 0; t < 1500; t++) step(w, input);
      let mix = 0;
      for (let i = 0; i < MAX_ZOMBIES; i++) mix = (mix + (w.zombies.kind[i] ?? 0) * (i + 1) + (w.zombies.hp[i] ?? 0)) >>> 0;
      return { mix, score: w.score, hp: w.hp, wave: w.wave, px: w.px };
    };
    expect(run()).toEqual(run());
  });
});
