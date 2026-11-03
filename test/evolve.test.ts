import { PASSIVE_IDS, unionReady, UNIONS, WEAPON_IDS } from "../src/sim/evolve";
import {
  applyUpgrade, beginLevel, bulletDmg, evolutionReady, mortarEvery, offerable, rollOffers, sawAngle,
  sawCount, sawDamage, sawRadius, sawSpin, shieldReload, takeXp, teslaEvery, teslaPower, tryPick, upgName,
  ventRange, whistleRange, xpNeed,
} from "../src/sim/progress";
import { step } from "../src/sim/step.hot";
import {
  MAX_BULLETS, MAX_ZOMBIES, UNION_BELLOWS, UNION_BRIAR, UNION_CALLIOPE, UNION_CROWN, UNION_HALO,
  UNION_HEART, UNION_HOWITZER, UPG_DYNAMO, UPG_MAX, UPG_MORTAR, UPG_RICOCHET, UPG_SAWS,
  UPG_SHIELD, UPG_SHOTGUN, UPG_SPIKES, UPG_TESLA, UPG_VENT, UPG_WHISTLE, UPG_WPN_SHOT, type Input, type World,
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

describe("weapon unions", () => {
  it("pairs each weapon with one passive and one evolved form", () => {
    expect(UNIONS.length).toBe(WEAPON_IDS.length);
    const weapons = new Set<number>();
    const forms = new Set<number>();
    for (let i = 0; i < UNIONS.length; i++) {
      const spec = UNIONS[i];
      expect(spec).toBeTruthy();
      if (!spec) continue;
      expect(WEAPON_IDS).toContain(spec.weapon);
      expect(PASSIVE_IDS).toContain(spec.passive);
      expect(weapons.has(spec.weapon)).toBe(false);
      expect(forms.has(spec.id)).toBe(false);
      weapons.add(spec.weapon);
      forms.add(spec.id);
      expect(spec.recipe.length).toBeGreaterThan(0);
      expect(spec.hint.length).toBeGreaterThan(0);
      expect(spec.effect.length).toBeGreaterThan(0);
    }
  });

  it("names the scatter valve in the bellows recipe", () => {
    let recipe = "";
    for (let i = 0; i < UNIONS.length; i++) {
      if (UNIONS[i]?.id === UNION_BELLOWS) recipe = UNIONS[i]?.recipe ?? "";
    }
    expect(recipe).toContain(upgName(UPG_SHOTGUN));
    expect(recipe).not.toContain(upgName(UPG_WPN_SHOT));
  });

  it("stays sealed until the weapon is maxed and the passive is owned", () => {
    const w = createWorld(4);
    expect(unionReady(w, UNION_CROWN, evolutionReady(w, UNION_CROWN))).toBe(false);
    w.upgrades[UPG_TESLA] = UPG_MAX - 1;
    w.upgrades[UPG_DYNAMO] = 1;
    expect(offerable(w, UNION_CROWN)).toBe(false);
    w.upgrades[UPG_TESLA] = UPG_MAX;
    w.upgrades[UPG_DYNAMO] = 0;
    expect(offerable(w, UNION_CROWN)).toBe(false);
    for (let i = 0; i < 20; i++) {
      rollOffers(w);
      expect(w.offers[0]).not.toBe(UNION_CROWN);
      expect(w.offers[1]).not.toBe(UNION_CROWN);
    }
  });

  it("asks the evolutionReady hook before it will offer a union", () => {
    const w = createWorld(5);
    w.upgrades[UPG_TESLA] = UPG_MAX;
    w.upgrades[UPG_DYNAMO] = 1;
    expect(evolutionReady(w, UNION_CROWN)).toBe(true);
    expect(unionReady(w, UNION_CROWN, false)).toBe(false);
    expect(unionReady(w, UNION_CROWN, evolutionReady(w, UNION_CROWN))).toBe(true);
    expect(offerable(w, UNION_CROWN)).toBe(true);
  });

  it("puts the evolved form on the next level-up, once", () => {
    const w = createWorld(6);
    w.upgrades[UPG_TESLA] = UPG_MAX;
    w.upgrades[UPG_DYNAMO] = 1;
    rollOffers(w);
    expect(w.offers[0]).toBe(UNION_CROWN);
    expect(w.offers[1]).not.toBe(UNION_CROWN);
    w.xp = 0;
    w.choosing = 1;
    expect(tryPick(w, 1)).toBe(true);
    expect(w.upgrades[UNION_CROWN]).toBe(1);
    expect(w.upgrades[UPG_TESLA]).toBe(UPG_MAX);
    applyUpgrade(w, UNION_CROWN);
    expect(w.upgrades[UNION_CROWN]).toBe(1);
    rollOffers(w);
    expect(w.offers[0]).not.toBe(UNION_CROWN);
    expect(w.offers[1]).not.toBe(UNION_CROWN);
    expect(offerable(w, UNION_CROWN)).toBe(false);
  });

  it("offers every ready union ahead of a normal draft", () => {
    const w = createWorld(7);
    w.upgrades[UPG_TESLA] = UPG_MAX;
    w.upgrades[UPG_DYNAMO] = 1;
    w.upgrades[UPG_SHOTGUN] = UPG_MAX;
    w.upgrades[UPG_RICOCHET] = 1;
    rollOffers(w);
    expect(w.offers[0]).toBe(UNION_CROWN);
    expect(w.offers[1]).toBe(UNION_BELLOWS);
  });

  it("a fresh level-up still offers the union when the bar fills", () => {
    const w = createWorld(8);
    freeze(w);
    w.upgrades[UPG_TESLA] = UPG_MAX;
    w.upgrades[UPG_DYNAMO] = 1;
    takeXp(w, xpNeed(w.level));
    expect(w.choosing).toBe(1);
    expect(w.offers[0]).toBe(UNION_CROWN);
  });

  it("does not open a union by spending a normal upgrade pick early", () => {
    const w = createWorld(9);
    applyUpgrade(w, UNION_CROWN);
    expect(w.upgrades[UNION_CROWN]).toBe(0);
  });

  it("thunder crown chains harder and cycles faster than a maxed coil", () => {
    const tally = (crown: boolean): number => {
      const w = createWorld(11);
      freeze(w);
      w.upgrades[UPG_TESLA] = UPG_MAX;
      if (crown) w.upgrades[UNION_CROWN] = 1;
      w.teslaCd = 1;
      const ids = [
        addZombie(w, w.px + 18, w.py, 40),
        addZombie(w, w.px + 46, w.py, 40),
        addZombie(w, w.px + 74, w.py, 40),
      ];
      step(w, idle());
      let left = 0;
      for (let i = 0; i < ids.length; i++) left += w.zombies.hp[ids[i] ?? 0] ?? 0;
      return left;
    };
    const plain = createWorld(1);
    plain.upgrades[UPG_TESLA] = UPG_MAX;
    const crowned = createWorld(1);
    crowned.upgrades[UPG_TESLA] = UPG_MAX;
    crowned.upgrades[UNION_CROWN] = 1;
    expect(teslaPower(crowned)).toBeGreaterThan(teslaPower(plain));
    expect(teslaEvery(crowned)).toBeLessThan(teslaEvery(plain));
    expect(tally(true)).toBeLessThan(tally(false));
  });

  it("gatling bellows throws more, heavier, bouncing slugs", () => {
    const volley = (on: boolean): { n: number; pierce: number; kind: number } => {
      const w = createWorld(12);
      freeze(w);
      w.upgrades[UPG_SHOTGUN] = UPG_MAX;
      if (on) w.upgrades[UNION_BELLOWS] = 1;
      addZombie(w, w.px + 90, w.py, 99);
      w.fireCd = 0;
      step(w, idle());
      let pierce = 0;
      let kind = 0;
      const b = w.bullets;
      for (let j = 0; j < MAX_BULLETS; j++) {
        if (!b.alive[j]) continue;
        pierce = w.bPierce[j] ?? 0;
        kind = b.kind[j] ?? 0;
        break;
      }
      return { n: count(b.alive, MAX_BULLETS), pierce, kind };
    };
    const plain = volley(false);
    const evolved = volley(true);
    expect(evolved.n).toBeGreaterThan(plain.n);
    expect(evolved.pierce).toBeGreaterThan(plain.pierce);
    expect(evolved.kind).toBeGreaterThan(plain.kind);
    const a = createWorld(1);
    const b = createWorld(1);
    b.upgrades[UNION_BELLOWS] = 1;
    expect(bulletDmg(b)).toBeGreaterThan(bulletDmg(a));
  });

  it("buzzsaw halo cuts deeper than the base gears", () => {
    const bite = (on: boolean): number => {
      const w = createWorld(13);
      freeze(w);
      w.upgrades[UPG_SAWS] = UPG_MAX;
      if (on) w.upgrades[UNION_HALO] = 1;
      expect(sawCount(w)).toBe(UPG_MAX + (on ? 2 : 0));
      w.tick = 3;
      const n = sawCount(w);
      const r = sawRadius(w);
      const a = sawAngle(w.tick + 1, 0, n, sawSpin(w));
      const i = addZombie(w, w.px + Math.cos(a) * r, w.py + Math.sin(a) * r, 12);
      step(w, idle());
      expect(n).toBeGreaterThan(0);
      return w.zombies.hp[i] ?? 0;
    };
    const plain = createWorld(1);
    plain.upgrades[UPG_SAWS] = 1;
    const halo = createWorld(1);
    halo.upgrades[UPG_SAWS] = 1;
    halo.upgrades[UNION_HALO] = 1;
    expect(sawDamage(halo)).toBeGreaterThan(sawDamage(plain));
    expect(bite(true)).toBeLessThan(bite(false));
  });

  it("boiler heart reaches farther and mends on the pulse", () => {
    const w = createWorld(14);
    freeze(w);
    w.upgrades[UPG_VENT] = UPG_MAX;
    w.hp = 2;
    w.maxHp = 6;
    const before = ventRange(w);
    w.upgrades[UNION_HEART] = 1;
    expect(ventRange(w)).toBeGreaterThan(before);
    w.ventCd = 1;
    addZombie(w, w.px + 20, w.py, 30);
    step(w, idle());
    expect(w.hp).toBe(3);
  });

  it("briar aegis adds charges and bites back when the shield takes a hit", () => {
    const w = createWorld(15);
    freeze(w);
    w.upgrades[UPG_SHIELD] = UPG_MAX;
    w.upgrades[UPG_SPIKES] = 1;
    applyUpgrade(w, UNION_BRIAR);
    expect(w.upgrades[UNION_BRIAR]).toBe(1);
    expect(w.shield).toBe(UPG_MAX + 2);
    expect(shieldReload(w)).toBeLessThan(180 - UPG_MAX * 20);
    const bare = createWorld(16);
    freeze(bare);
    bare.upgrades[UPG_SHIELD] = UPG_MAX;
    bare.shield = 1;
    bare.hurtCd = 0;
    const foe = addZombie(bare, bare.px + 8, bare.py, 12);
    step(bare, idle());
    const plainHp = bare.zombies.hp[foe] ?? 0;
    w.shield = 1;
    w.hurtCd = 0;
    const hit = addZombie(w, w.px + 8, w.py, 12);
    step(w, idle());
    expect(w.hp).toBe(w.maxHp);
    expect(w.zombies.hp[hit] ?? 0).toBeLessThan(plainHp);
  });

  it("siege howitzer shells three targets and reloads faster", () => {
    const hits = (on: boolean): number => {
      const w = createWorld(17);
      freeze(w);
      w.upgrades[UPG_MORTAR] = 1;
      if (on) w.upgrades[UNION_HOWITZER] = 1;
      w.mortarCd = 1;
      const ids = [
        addZombie(w, 24, 24, 20),
        addZombie(w, 430, 40, 20),
        addZombie(w, 40, 280, 20),
      ];
      step(w, idle());
      let n = 0;
      for (let i = 0; i < ids.length; i++) if ((w.zombies.hp[ids[i] ?? 0] ?? 20) < 20) n++;
      return n;
    };
    const slow = createWorld(1);
    slow.upgrades[UPG_MORTAR] = UPG_MAX;
    const fast = createWorld(1);
    fast.upgrades[UPG_MORTAR] = UPG_MAX;
    fast.upgrades[UNION_HOWITZER] = 1;
    expect(mortarEvery(fast)).toBeLessThan(mortarEvery(slow));
    expect(hits(false)).toBe(1);
    expect(hits(true)).toBe(3);
  });

  it("steam calliope scalds past the whistle's old edge", () => {
    const scald = (on: boolean): number => {
      const w = createWorld(18);
      freeze(w);
      w.upgrades[UPG_WHISTLE] = 1;
      if (on) w.upgrades[UNION_CALLIOPE] = 1;
      w.tick = 9;
      const i = addZombie(w, w.px + 60, w.py, 10);
      step(w, idle());
      return w.zombies.hp[i] ?? 0;
    };
    const plain = createWorld(1);
    plain.upgrades[UPG_WHISTLE] = 1;
    const evolved = createWorld(1);
    evolved.upgrades[UPG_WHISTLE] = 1;
    evolved.upgrades[UNION_CALLIOPE] = 1;
    expect(whistleRange(evolved)).toBeGreaterThan(60);
    expect(whistleRange(plain)).toBeLessThan(60);
    expect(scald(true)).toBeLessThan(scald(false));
  });

  it("a full loadout still refuses another level when every union is forged", () => {
    const w = createWorld(19);
    w.upgrades.fill(UPG_MAX);
    w.xp = 99;
    beginLevel(w);
    expect(w.choosing).toBe(0);
    expect(w.level).toBe(0);
  });
});
