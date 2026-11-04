import { composeHorde } from "../src/render/blit.hot";
import { bg, buildSprites, zombieSprite } from "../src/render/horde-sprites";
import {
  BLOOD_SPURT,
  burstCount,
  CRIT_COLOR,
  damageNumbersOn,
  enemyFlash,
  FLASH_MS,
  FLASH_SOFT_MS,
  HIT_COLOR,
  hitKnockX,
  hitKnockY,
  juiceFrame,
  juiceHit,
  juicePlayerHurt,
  JUICE_DT,
  lastNumberCrit,
  lastNumberValue,
  NUMBER_CAP,
  numberColor,
  numberCount,
  numberScale,
  numberY,
  ownJuiceClock,
  PART_CAP,
  particleCount,
  resetJuice,
  setNumbersOn,
  STOP_BOSS_MS,
  STOP_BUDGET_MS,
  STOP_CRIT_MS,
  STOP_ELITE_MS,
  STOP_HURT_MS,
  STOP_MAX_MS,
  stopRemaining,
  stopUsed,
  tickJuice,
} from "../src/render/juice";
import { setReduceMotion } from "../src/render/motion";
import { acidTouch, detonateGas } from "../src/sim/foes.hot";
import { lichX, lichY, seekSeconds } from "../src/sim/finale";
import { Z_ELITE, Z_KNIGHT } from "../src/sim/foes";
import { step } from "../src/sim/step.hot";
import { EV_HURT, EV_KILL, EV_SHIELD, H, W, Z_BRUTE, Z_GHOUL, Z_SHAMBLER, type Input, type World } from "../src/sim/types";
import { createWorld } from "../src/sim/world";
import { createSession, loadStore, NUM_KEY, syncStore, toggleNumbers } from "../src/shell/session";

const idle: Input = { dx: 0, dy: 0, pick: 0 };

const mem = () => {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => (m.has(k) ? m.get(k) ?? null : null),
    setItem: (k: string, v: string) => { m.set(k, v); },
  };
};

const arm = (kind: number, hp: number, onPlayer: boolean): World => {
  const w = createWorld(1);
  w.toSpawn = 0;
  w.fireCd = 99999;
  w.spawnCd = 99999;
  w.zombies.alive[0] = 1;
  w.zombies.kind[0] = kind;
  w.zombies.hp[0] = hp;
  w.zombies.vx[0] = 0;
  w.zombies.x[0] = onPlayer ? w.px : w.px + 48;
  w.zombies.y[0] = w.py;
  return w;
};

const bulletOn = (w: World, i = 0): void => {
  w.bullets.alive[i] = 1;
  w.bullets.x[i] = w.zombies.x[i] ?? 0;
  w.bullets.y[i] = w.zombies.y[i] ?? 0;
  w.bullets.vx[i] = 0;
  w.bullets.vy[i] = 0;
  w.bHit[i] = -1;
  w.bPierce[i] = 0;
};

afterEach(() => {
  setNumbersOn(true);
  setReduceMotion(false);
  ownJuiceClock(false);
  resetJuice();
});

describe("damage numbers", () => {
  it("keeps a fixed pool of 256 and floats a crit larger and yellow", () => {
    resetJuice();
    expect(NUMBER_CAP).toBe(256);
    juiceHit(0, 12, 40, 1, Z_SHAMBLER, false, 0);
    expect(numberCount()).toBe(1);
    expect(lastNumberValue()).toBe(1);
    expect(lastNumberCrit()).toBe(0);
    expect(numberScale(0)).toBe(1);
    expect(numberColor(0)).toBe(HIT_COLOR);
    const y0 = numberY(0);
    tickJuice(180);
    expect(numberY(0)).toBeLessThan(y0);
    juiceHit(1, 12, 40, 3, Z_SHAMBLER, true, 1);
    expect(lastNumberCrit()).toBe(0);
    expect(numberScale(1)).toBe(1);
    juiceHit(2, 12, 40, 3, Z_BRUTE, true, 2);
    expect(lastNumberCrit()).toBe(1);
    expect(numberScale(2)).toBe(1);
    expect(numberColor(1)).toBe(CRIT_COLOR);
    expect(CRIT_COLOR).toBe("#ffe14a");
    for (let i = 0; i < 10000; i++) juiceHit(i % 1500, 1, 1, 1, Z_SHAMBLER, false, i);
    expect(numberCount()).toBe(NUMBER_CAP);
    expect(numberCount()).toBeLessThanOrEqual(256);
  });

  it("hides numbers when the switch is off and still flashes", () => {
    resetJuice();
    setNumbersOn(false);
    expect(damageNumbersOn()).toBe(false);
    juiceHit(4, 3, 3, 4, Z_GHOUL, false, 2);
    expect(numberCount()).toBe(0);
    expect(enemyFlash(4)).toBe(FLASH_MS);
  });
});

describe("hit flash", () => {
  it("holds a per-enemy white flash for 80ms", () => {
    resetJuice();
    juiceHit(7, 1, 1, 1, Z_SHAMBLER, false, 0);
    expect(enemyFlash(7)).toBe(80);
    expect(enemyFlash(8)).toBe(0);
    tickJuice(79);
    expect(enemyFlash(7)).toBeGreaterThan(0);
    tickJuice(1);
    expect(enemyFlash(7)).toBe(0);
    juiceHit(3000, 1, 1, 1, Z_SHAMBLER, false, 0);
    expect(enemyFlash(3000)).toBe(0);
  });
});

describe("death burst", () => {
  it("spawns 4 to 6 brass and gear particles and never past the particle cap", () => {
    expect(burstCount(0, 0)).toBe(4);
    expect(burstCount(1, 0)).toBe(5);
    expect(burstCount(2, 0)).toBe(6);
    for (let s = 0; s < 40; s++) {
      const n = burstCount(s, s * 3);
      expect(n).toBeGreaterThanOrEqual(4);
      expect(n).toBeLessThanOrEqual(6);
    }
    resetJuice();
    juiceHit(0, 20, 20, 1, Z_SHAMBLER, true, 0);
    expect(particleCount()).toBe(4);
    resetJuice();
    juiceHit(2, 20, 20, 1, Z_BRUTE, true, 0);
    expect(particleCount()).toBe(6);
    resetJuice();
    for (let i = 0; i < 80; i++) juiceHit(i, 0, 0, 1, Z_SHAMBLER, true, i);
    expect(particleCount()).toBe(PART_CAP);
    expect(particleCount()).toBeLessThanOrEqual(PART_CAP);
  });
});

describe("crit stop and knockback", () => {
  it("freezes briefly on a big live hit and shoves the drawn foe away", () => {
    resetJuice();
    juiceHit(0, 40, 0, 3, Z_SHAMBLER, false, 0, 0, 0);
    expect(stopRemaining()).toBe(STOP_CRIT_MS);
    expect(STOP_CRIT_MS).toBeGreaterThan(0);
    expect(STOP_CRIT_MS).toBeLessThan(STOP_ELITE_MS);
    expect(hitKnockX(0)).toBeGreaterThan(0);
    expect(hitKnockY(0)).toBe(0);
    const w = arm(Z_SHAMBLER, 8, false);
    const x0 = w.zombies.x[0] ?? 0;
    w.bullets.alive[0] = 1;
    w.bullets.x[0] = x0;
    w.bullets.y[0] = w.zombies.y[0] ?? 0;
    w.bullets.vx[0] = 0;
    w.bullets.vy[0] = 0;
    w.bHit[0] = -1;
    w.bPierce[0] = 0;
    step(w, idle);
    expect(w.zombies.x[0] ?? 0).toBe(x0);
    expect(hitKnockX(0)).toBeGreaterThan(0);
  });
});

describe("hit stop", () => {
  it("stops 40-60ms for elite, boss, and player damage, never a normal kill, and caps at 100ms a second", () => {
    resetJuice();
    juiceHit(0, 0, 0, 1, Z_SHAMBLER, true, 0);
    expect(stopRemaining()).toBe(0);
    expect(stopUsed()).toBe(0);
    juiceHit(9, 0, 0, 1, Z_GHOUL, true, 9);
    expect(stopRemaining()).toBe(0);
    juiceHit(1, 0, 0, 1, Z_GHOUL | Z_ELITE, true, 1);
    expect(stopRemaining()).toBe(STOP_ELITE_MS);
    expect(STOP_ELITE_MS).toBeGreaterThanOrEqual(40);
    expect(STOP_ELITE_MS).toBeLessThanOrEqual(60);
    juicePlayerHurt();
    expect(stopRemaining()).toBe(STOP_ELITE_MS + STOP_HURT_MS);
    expect(STOP_HURT_MS).toBeGreaterThanOrEqual(40);
    expect(STOP_HURT_MS).toBeLessThanOrEqual(60);
    juiceHit(2, 0, 0, 1, Z_BRUTE, true, 2);
    expect(STOP_BOSS_MS).toBeGreaterThanOrEqual(40);
    expect(STOP_BOSS_MS).toBeLessThanOrEqual(60);
    expect(stopRemaining()).toBe(STOP_BUDGET_MS);
    expect(stopUsed()).toBe(100);
    juiceHit(3, 0, 0, 1, Z_BRUTE, true, 3);
    juicePlayerHurt();
    expect(stopRemaining()).toBe(100);
    expect(stopUsed()).toBe(100);
    expect(juiceFrame(1000)).toBe(true);
    expect(stopRemaining()).toBe(0);
    expect(stopUsed()).toBe(0);
    juiceHit(4, 0, 0, 1, Z_KNIGHT, true, 4);
    expect(stopRemaining()).toBe(STOP_BOSS_MS);
    resetJuice();
    juiceHit(5, 0, 0, 1, Z_BRUTE, true, 5);
    expect(stopRemaining()).toBe(STOP_BOSS_MS);
  });

  it("a live shambler hit pops a number and flashes without freezing the next tick", () => {
    const w = arm(Z_SHAMBLER, 6, false);
    bulletOn(w);
    step(w, idle);
    expect(w.events[EV_KILL] ?? 0).toBe(0);
    expect(numberCount()).toBe(1);
    expect(enemyFlash(0)).toBeGreaterThan(0);
    expect(enemyFlash(0)).toBeLessThanOrEqual(FLASH_MS);
    expect(particleCount()).toBe(BLOOD_SPURT);
    expect(stopRemaining()).toBe(0);
    const tick = w.tick;
    step(w, idle);
    expect(w.tick).toBe(tick + 1);
  });

  it("a normal kill bursts gears and does not stall the clock", () => {
    const w = arm(Z_SHAMBLER, 1, false);
    bulletOn(w);
    step(w, idle);
    expect(w.events[EV_KILL]).toBe(1);
    expect(particleCount()).toBeGreaterThanOrEqual(4);
    expect(particleCount()).toBeLessThanOrEqual(6);
    expect(stopRemaining()).toBe(0);
    const tick = w.tick;
    step(w, idle);
    expect(w.tick).toBe(tick + 1);
  });

  it("an elite kill and a boss kill freeze the action, and a shield hit does not", () => {
    const ghoul = arm(Z_GHOUL | Z_ELITE, 1, false);
    bulletOn(ghoul);
    step(ghoul, idle);
    expect(ghoul.events[EV_KILL]).toBe(1);
    expect(stopRemaining()).toBe(STOP_ELITE_MS);
    expect(lastNumberCrit()).toBe(1);
    ghoul.choosing = 0;
    const gTick = ghoul.tick;
    let stalled = 0;
    while (stopRemaining() > 0 && stalled < 8) {
      step(ghoul, idle);
      stalled++;
    }
    expect(ghoul.tick).toBe(gTick);
    expect(stalled * JUICE_DT).toBeGreaterThanOrEqual(STOP_ELITE_MS);
    expect(stalled * JUICE_DT).toBeLessThanOrEqual(STOP_ELITE_MS + JUICE_DT);
    step(ghoul, idle);
    expect(ghoul.tick).toBe(gTick + 1);

    const brute = arm(Z_BRUTE, 1, false);
    bulletOn(brute);
    step(brute, idle);
    expect(stopRemaining()).toBe(STOP_BOSS_MS);
    const bTick = brute.tick;
    step(brute, idle);
    expect(brute.tick).toBe(bTick);

    const shielded = arm(Z_SHAMBLER, 4, true);
    shielded.shield = 2;
    step(shielded, idle);
    expect(shielded.events[EV_SHIELD]).toBe(1);
    expect(shielded.events[EV_HURT] ?? 0).toBe(0);
    expect(stopRemaining()).toBe(0);
  });

  it("player damage freezes and several elites in one second cannot stack past 100ms", () => {
    const w = arm(Z_SHAMBLER, 4, true);
    step(w, idle);
    expect(w.events[EV_HURT]).toBe(1);
    expect(stopRemaining()).toBe(STOP_HURT_MS);
    const tick = w.tick;
    step(w, idle);
    expect(w.tick).toBe(tick);

    const pack = createWorld(9);
    pack.toSpawn = 0;
    pack.fireCd = 99999;
    for (let i = 0; i < 4; i++) {
      pack.zombies.alive[i] = 1;
      pack.zombies.kind[i] = Z_BRUTE;
      pack.zombies.hp[i] = 1;
      pack.zombies.vx[i] = 0;
      pack.zombies.x[i] = 40 + i * 24;
      pack.zombies.y[i] = 50;
      pack.bullets.alive[i] = 1;
      pack.bullets.x[i] = 40 + i * 24;
      pack.bullets.y[i] = 50;
      pack.bullets.vx[i] = 0;
      pack.bullets.vy[i] = 0;
      pack.bHit[i] = -1;
    }
    step(pack, idle);
    expect(stopRemaining()).toBe(STOP_BUDGET_MS);
    expect(stopUsed()).toBe(STOP_BUDGET_MS);
    expect(numberCount()).toBeLessThanOrEqual(NUMBER_CAP);
  });
});

describe("frame budget", () => {
  it("updates 1500 enemy flashes inside a frame and stays inside the pool", () => {
    resetJuice();
    const spawnAt = performance.now();
    for (let i = 0; i < 1500; i++) juiceHit(i, i & 255, 24, (i % 5) + 1, i % 3, false, i);
    const spawnMs = performance.now() - spawnAt;
    expect(numberCount()).toBe(NUMBER_CAP);
    expect(enemyFlash(0)).toBe(FLASH_MS);
    expect(enemyFlash(1499)).toBe(FLASH_MS);
    const tickAt = performance.now();
    for (let f = 0; f < 60; f++) tickJuice(JUICE_DT);
    const tickMs = performance.now() - tickAt;
    expect(spawnMs).toBeLessThan(80);
    expect(tickMs).toBeLessThan(80);
    expect(numberCount()).toBeLessThanOrEqual(256);
    expect(enemyFlash(1499)).toBe(0);
  });
});

describe("damage number setting", () => {
  it("defaults on and persists the off switch in localStorage", () => {
    const store = mem();
    expect(loadStore(store).numbers).toBe(true);
    const session = createSession(4, false, true, loadStore(store).numbers);
    expect(session.numbers).toBe(true);
    toggleNumbers(session);
    expect(session.numbers).toBe(false);
    syncStore(session, store);
    expect(store.getItem(NUM_KEY)).toBe("0");
    expect(loadStore(store).numbers).toBe(false);
    const again = createSession(loadStore(store).best, loadStore(store).muted, loadStore(store).shake, loadStore(store).numbers, loadStore(store).reduceMotion);
    expect(again.numbers).toBe(false);
    toggleNumbers(again);
    syncStore(again, store);
    expect(store.getItem(NUM_KEY)).toBe("1");
    expect(loadStore(store).numbers).toBe(true);
  });
});

const stamp = new Uint32Array(W * H);

describe("horde blit flash", () => {
  it("whites out a blitted stamp while that enemy is flashing", () => {
    buildSprites();
    bg.fill(0);
    resetJuice();
    const w = createWorld(3);
    w.toSpawn = 0;
    w.arena.camX = 0;
    w.arena.camY = 0;
    w.zombies.alive[0] = 1;
    w.zombies.kind[0] = Z_SHAMBLER;
    w.zombies.x[0] = 80;
    w.zombies.y[0] = 100;
    composeHorde(w, stamp);
    const spr = zombieSprite(Z_SHAMBLER, (w.tick >> 4) & 1);
    const dx = (80 - spr.ox) | 0;
    const dy = (100 - spr.oy) | 0;
    let ink = 0;
    let colored = 0;
    for (let y = 0; y < spr.h; y++) {
      for (let x = 0; x < spr.w; x++) {
        if ((spr.pix[y * spr.w + x] ?? 0) === 0) continue;
        ink++;
        const got = stamp[(dy + y) * W + dx + x] ?? 0;
        if (got !== 0 && got !== 0xffffffff) colored++;
      }
    }
    expect(ink).toBeGreaterThan(8);
    expect(colored).toBe(ink);
    juiceHit(0, 80, 100, 1, Z_SHAMBLER, false, w.tick);
    composeHorde(w, stamp);
    let white = 0;
    for (let y = 0; y < spr.h; y++) {
      for (let x = 0; x < spr.w; x++) {
        if ((spr.pix[y * spr.w + x] ?? 0) === 0) continue;
        if ((stamp[(dy + y) * W + dx + x] ?? 0) === 0xffffffff) white++;
      }
    }
    expect(white).toBe(ink);
    expect(stopRemaining()).toBe(0);
  });

  it("mirrors a flashing knight the same way as the stamp", () => {
    buildSprites();
    bg.fill(0);
    resetJuice();
    const w = createWorld(3);
    w.toSpawn = 0;
    w.arena.camX = 0;
    w.arena.camY = 0;
    w.px = 40;
    w.py = 100;
    w.zombies.alive[0] = 1;
    w.zombies.kind[0] = Z_KNIGHT;
    w.zombies.x[0] = 80;
    w.zombies.y[0] = 100;
    const spr = zombieSprite(Z_KNIGHT, (w.tick >> 4) & 1);
    let sx = -1;
    let sy = -1;
    for (let y = 0; y < spr.h && sx < 0; y++) {
      for (let x = 0; x < spr.w; x++) {
        const src = spr.pix[y * spr.w + x] ?? 0;
        const mirror = spr.pix[y * spr.w + (spr.w - 1 - x)] ?? 0;
        if (src !== 0 && mirror === 0) {
          sx = x;
          sy = y;
          break;
        }
      }
    }
    expect(sx).toBeGreaterThanOrEqual(0);
    juiceHit(0, 80, 100, 1, Z_KNIGHT, false, w.tick);
    composeHorde(w, stamp);
    const dx = (80 - spr.ox) | 0;
    const dy = (100 - spr.oy) | 0;
    expect(stamp[(dy + sy) * W + dx + (spr.w - 1 - sx)]).toBe(0xffffffff);
    expect(stamp[(dy + sy) * W + dx + sx]).not.toBe(0xffffffff);
  });
});

describe("splashes and the lich", () => {
  it("grants hit-stop for acid and a gas blast, skips a shield, and stays inside 100ms", () => {
    resetJuice();
    const w = createWorld(1);
    w.hurtCd = 0;
    acidTouch(w, w.px, w.py);
    expect(w.events[EV_HURT]).toBe(1);
    expect(stopRemaining()).toBe(STOP_HURT_MS);
    w.hurtCd = 0;
    detonateGas(w, w.px, w.py, 0);
    expect(stopRemaining()).toBe(STOP_HURT_MS * 2);
    juicePlayerHurt();
    expect(stopRemaining()).toBe(STOP_BUDGET_MS);
    expect(stopUsed()).toBe(STOP_BUDGET_MS);
    resetJuice();
    const shielded = createWorld(2);
    shielded.shield = 2;
    shielded.hurtCd = 0;
    acidTouch(shielded, shielded.px, shielded.py);
    expect(shielded.events[EV_SHIELD]).toBe(1);
    expect(stopRemaining()).toBe(0);
  });

  it("grants hit-stop when the lich body takes HP", () => {
    resetJuice();
    const w = createWorld(8);
    w.hp = 40;
    w.maxHp = 40;
    w.fireCd = 99999;
    w.toSpawn = 0;
    w.spawnCd = 99999;
    seekSeconds(w, 1200);
    step(w, idle);
    w.px = lichX(w);
    w.py = lichY(w);
    w.hurtCd = 0;
    const before = w.hp;
    resetJuice();
    step(w, idle);
    expect(w.hp).toBeLessThan(before);
    expect(stopRemaining()).toBe(STOP_HURT_MS);
    expect(stopUsed()).toBeLessThanOrEqual(STOP_BUDGET_MS);
  });
});

describe("hit-stop overlap and real-time decay", () => {
  it("extends overlapping crits instead of restarting and hard-caps remaining time", () => {
    resetJuice();
    juiceHit(0, 12, 40, 4, Z_SHAMBLER, false, 0);
    expect(stopRemaining()).toBe(STOP_CRIT_MS);
    juiceFrame(10);
    expect(stopRemaining()).toBe(STOP_CRIT_MS - 10);
    juiceHit(1, 12, 40, 4, Z_SHAMBLER, false, 1);
    expect(stopRemaining()).toBe(STOP_CRIT_MS - 10 + STOP_CRIT_MS);
    expect(stopRemaining()).toBeLessThanOrEqual(STOP_MAX_MS);
    expect(stopRemaining()).not.toBe(STOP_CRIT_MS);
    juiceHit(2, 0, 0, 1, Z_BRUTE, true, 2);
    expect(stopRemaining()).toBeGreaterThan(STOP_CRIT_MS);
    expect(stopRemaining()).toBeLessThanOrEqual(STOP_MAX_MS);
  });

  it("decays on juiceFrame wall time", () => {
    resetJuice();
    ownJuiceClock(true);
    juiceHit(0, 0, 0, 1, Z_GHOUL | Z_ELITE, true, 0);
    expect(stopRemaining()).toBe(STOP_ELITE_MS);
    juiceFrame(10);
    expect(stopRemaining()).toBe(STOP_ELITE_MS - 10);
    juiceFrame(STOP_ELITE_MS - 10);
    expect(stopRemaining()).toBe(0);
  });

  it("reduce motion skips hit-stop and shortens flashes", () => {
    resetJuice();
    setReduceMotion(true);
    juiceHit(4, 3, 3, 4, Z_SHAMBLER, false, 2);
    expect(stopRemaining()).toBe(0);
    expect(enemyFlash(4)).toBe(FLASH_SOFT_MS);
    juicePlayerHurt();
    expect(stopRemaining()).toBe(0);
  });
});
