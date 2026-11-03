import { clock } from "../src/sim/difficulty";
import {
  armDevJump, doubledScrap, FINALE_TICK, harmLich, holdSpawns, isWon, killCount, lichHp,
  lichMaxHp, lichPhase, lichUp, lichX, lichY, NORMAL_BOSS_HP, ringLive, runLabel, seekSeconds,
  setRunEndless, victoryText,
} from "../src/sim/finale";
import { applyUpgrade } from "../src/sim/progress";
import { step } from "../src/sim/step.hot";
import { UPG_DMG, UPG_PIERCE, UPG_TESLA, type Input, type World } from "../src/sim/types";
import { createWorld } from "../src/sim/world";
import {
  devSeconds, ENDLESS_KEY, jumpSeconds, loadCrown, markWon, saveCrown, toggleEndless, WON_KEY,
} from "../src/shell/crown";

const idle = (): Input => ({ dx: 0, dy: 0, pick: 0 });

const countZ = (w: World): number => {
  let n = 0;
  for (let i = 0; i < w.zombies.alive.length; i++) if (w.zombies.alive[i]) n++;
  return n;
};

const mem = () => {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => (m.has(k) ? m.get(k) ?? null : null),
    setItem: (k: string, v: string) => { m.set(k, v); },
  };
};

const tank = (w: World): void => {
  w.hp = 5000;
  w.maxHp = 5000;
};

describe("clockwork lich", () => {
  it("is three times a normal boss and arrives at 20:00", () => {
    expect(lichMaxHp()).toBe(NORMAL_BOSS_HP * 3);
    expect(lichMaxHp()).toBe(360);
    expect(FINALE_TICK).toBe(1200 * 60);
    const w = createWorld(4);
    tank(w);
    seekSeconds(w, 1199);
    step(w, idle());
    expect(lichUp(w)).toBe(false);
    expect(holdSpawns(w)).toBe(false);
    expect(runLabel(w.tick)).toBe("19:59/20:00");
    seekSeconds(w, 1200);
    expect(clock(w.tick)).toBe("20:00");
    expect(lichUp(w)).toBe(false);
    w.zombies.alive[0] = 1;
    w.zombies.hp[0] = 9;
    w.zombies.x[0] = 30;
    w.zombies.y[0] = 40;
    w.toSpawn = 5;
    const kills = killCount(w);
    step(w, idle());
    expect(lichUp(w)).toBe(true);
    expect(lichHp(w)).toBe(360);
    expect(lichPhase(w)).toBe(0);
    expect(holdSpawns(w)).toBe(true);
    expect(w.toSpawn).toBe(0);
    expect(w.zombies.alive[0]).toBe(0);
    expect(killCount(w)).toBe(kills);
    expect(clock(w.tick)).toBe("20:00");
  });

  it("fires a ring, summons at half health, and shifts through three phases", () => {
    const w = createWorld(6);
    tank(w);
    seekSeconds(w, 1200);
    step(w, idle());
    expect(ringLive(w)).toBe(0);
    for (let t = 0; t < 90 && ringLive(w) < 6; t++) step(w, idle());
    expect(lichPhase(w)).toBe(0);
    expect(ringLive(w)).toBeGreaterThanOrEqual(6);
    expect(countZ(w)).toBe(0);
    const late = createWorld(6);
    tank(late);
    late.fireCd = 99999;
    late.teslaCd = 99999;
    seekSeconds(late, 1200);
    step(late, idle());
    harmLich(late, lichMaxHp() - Math.floor(lichMaxHp() / 2) + 1);
    expect(lichHp(late) * 2).toBeLessThanOrEqual(lichMaxHp());
    step(late, idle());
    expect(lichPhase(late)).toBe(1);
    expect(countZ(late)).toBeGreaterThanOrEqual(6);
    for (let i = 0; i < late.zombies.alive.length; i++) {
      if (late.zombies.alive[i]) expect(late.zombies.kind[i]).toBe(1);
    }
    harmLich(late, lichHp(late) - 1);
    step(late, idle());
    expect(lichPhase(late)).toBe(2);
    expect(isWon(late)).toBe(false);
    let dense = 0;
    for (let t = 0; t < 40; t++) {
      step(late, idle());
      if (ringLive(late) > dense) dense = ringLive(late);
    }
    expect(dense).toBeGreaterThanOrEqual(16);
  });

  it("fast-forwards to 1200s, kills the lich, and keeps the win", () => {
    const w = createWorld(8);
    tank(w);
    for (let i = 0; i < 5; i++) applyUpgrade(w, UPG_DMG);
    applyUpgrade(w, UPG_TESLA);
    seekSeconds(w, 1200);
    step(w, idle());
    expect(clock(w.tick)).toBe("20:00");
    expect(lichUp(w)).toBe(true);
    w.teslaCd = 999999;
    const score = w.score;
    let guard = 0;
    while (!isWon(w) && guard < 800) {
      w.hp = 5000;
      w.teslaCd = 999999;
      if (w.choosing) {
        step(w, { dx: 0, dy: 0, pick: 1 });
      } else {
        w.px = lichX(w);
        w.py = lichY(w);
        w.fireCd = 0;
        step(w, idle());
      }
      guard++;
    }
    expect(isWon(w)).toBe(true);
    expect(w.chestOpen).toBe(1);
    while (!w.over && guard < 900) {
      step(w, { dx: 0, dy: 0, pick: 0, skip: 1 });
      guard++;
    }
    expect(w.over).toBe(true);
    expect(lichUp(w)).toBe(false);
    expect(killCount(w)).toBeGreaterThan(0);
    expect(w.score).toBeGreaterThan(score);
    const store = mem();
    expect(loadCrown(store).won).toBe(false);
    expect(toggleEndless(loadCrown(store)).endless).toBe(false);
    const crowned = markWon(loadCrown(store));
    saveCrown(store, crowned);
    expect(store.getItem(WON_KEY)).toBe("1");
    expect(loadCrown(store)).toEqual({ won: true, endless: false });
    const endless = toggleEndless(loadCrown(store));
    expect(endless.endless).toBe(true);
    saveCrown(store, endless);
    expect(store.getItem(ENDLESS_KEY)).toBe("1");
    expect(loadCrown(store).endless).toBe(true);
    const text = victoryText(w);
    expect(text.startsWith("20:")).toBe(true);
    expect(text).toContain(`KILLS ${killCount(w)}`);
    expect(text).toContain("DAMAGE LV 5");
    expect(text).toContain("TESLA COIL LV 1");
    expect(text).not.toContain("SCRAP");
    expect(doubledScrap(40)).toBe(80);
    expect(victoryText(w, 40)).toContain("BRASS SCRAP 80");
    step(w, idle());
    expect(isWon(w)).toBe(true);
    expect(w.over).toBe(true);
  });

  it("a summoned thrall bites for one hp at the finale rank", () => {
    const w = createWorld(3);
    tank(w);
    w.hp = 20;
    w.fireCd = 99999;
    seekSeconds(w, 1200);
    step(w, idle());
    harmLich(w, lichMaxHp() - Math.floor(lichMaxHp() / 2) + 1);
    step(w, idle());
    let slot = -1;
    for (let i = 0; i < w.zombies.alive.length; i++) {
      if (w.zombies.alive[i]) { slot = i; break; }
    }
    expect(slot).toBeGreaterThanOrEqual(0);
    w.zombies.x[slot] = w.px;
    w.zombies.y[slot] = w.py;
    w.hurtCd = 0;
    const before = w.hp;
    step(w, idle());
    expect(before - w.hp).toBe(1);
    expect(w.over).toBe(false);
  });

  it("a piercing rivet wounds the lich once", () => {
    const w = createWorld(4);
    tank(w);
    w.upgrades[UPG_PIERCE] = 4;
    w.fireCd = 99999;
    seekSeconds(w, 1200);
    step(w, idle());
    w.px = lichX(w);
    w.py = lichY(w);
    w.fireCd = 0;
    const before = lichHp(w);
    step(w, idle());
    const once = before - lichHp(w);
    expect(once).toBe(1);
    w.fireCd = 99999;
    for (let t = 0; t < 12; t++) step(w, idle());
    expect(before - lichHp(w)).toBe(once);
  });

  it("drops summoned ghouls when the lich falls", () => {
    const w = createWorld(9);
    tank(w);
    w.fireCd = 99999;
    setRunEndless(w, true);
    seekSeconds(w, 1200);
    step(w, idle());
    harmLich(w, lichMaxHp() - Math.floor(lichMaxHp() / 2) + 1);
    step(w, idle());
    expect(countZ(w)).toBeGreaterThanOrEqual(6);
    harmLich(w, lichHp(w));
    step(w, idle());
    expect(isWon(w)).toBe(true);
    expect(w.over).toBe(false);
    expect(countZ(w)).toBe(0);
  });

  it("endless keeps the run and the difficulty ranks going", () => {
    const w = createWorld(9);
    tank(w);
    setRunEndless(w, true);
    seekSeconds(w, 1200);
    step(w, idle());
    harmLich(w, lichMaxHp());
    step(w, idle());
    expect(isWon(w)).toBe(true);
    expect(w.over).toBe(false);
    expect(holdSpawns(w)).toBe(false);
    for (let i = 0; i < w.zombies.alive.length; i++) w.zombies.alive[i] = 0;
    w.toSpawn = 0;
    const boundary = (w.rank + 1) * 1800;
    w.tick = boundary - 1;
    step(w, idle());
    expect(w.over).toBe(false);
    expect(w.rank).toBeGreaterThan(0);
    expect(w.tick).toBe(boundary);
    expect(w.toSpawn).toBeGreaterThan(0);
  });

  it("matches a second seed and honors ?t=1190", () => {
    const run = (seed: number): { x: number; y: number; hp: number; rings: number } => {
      const w = createWorld(seed);
      tank(w);
      seekSeconds(w, 1200);
      for (let t = 0; t < 90; t++) step(w, idle());
      return { x: lichX(w), y: lichY(w), hp: lichHp(w), rings: ringLive(w) };
    };
    expect(run(1)).toEqual(run(99));
    expect(jumpSeconds("?t=1190")).toBe(1190);
    expect(jumpSeconds("?t=1190&x=1")).toBe(1190);
    expect(jumpSeconds("?t=1190.8")).toBe(1190);
    expect(jumpSeconds("?t=9000")).toBe(1200);
    expect(jumpSeconds("")).toBe(0);
    expect(jumpSeconds("?t=")).toBe(0);
    expect(jumpSeconds("?t=0")).toBe(0);
    expect(jumpSeconds("?t=-4")).toBe(0);
    expect(jumpSeconds("?t=no")).toBe(0);
    expect(jumpSeconds("?t=Infinity")).toBe(0);
    expect(devSeconds("?t=1190", false)).toBe(0);
    expect(devSeconds("?t=1190", true)).toBe(1190);
    const w = createWorld(2);
    tank(w);
    armDevJump(w, jumpSeconds("?t=1190"));
    expect(clock(w.tick)).toBe("19:50");
    expect(runLabel(w.tick)).toBe("19:50/20:00");
    for (let t = 0; t < 599; t++) step(w, idle());
    expect(lichUp(w)).toBe(false);
    expect(countZ(w)).toBe(0);
    expect(runLabel(w.tick)).toContain("/20:00");
    step(w, idle());
    expect(lichUp(w)).toBe(true);
    expect(clock(w.tick)).toBe("20:00");
    expect(countZ(w)).toBe(0);
  });
});
