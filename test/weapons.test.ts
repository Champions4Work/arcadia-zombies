import { CHAR_BRUTE, CHAR_GUNSLINGER, CHAR_TINKER, RAGE_DMG } from "../src/sim/characters";
import { bulletDmg, fireEvery, applyUpgrade, takeXp, tryPick, upgName, xpNeed } from "../src/sim/progress";
import { step } from "../src/sim/step.hot";
import {
  EV_BOOM, EV_SHOT, MAX_BULLETS, MAX_ZOMBIES, OFFER_N, UPG_COUNT, UPG_DMG, UPG_FIRE, UPG_MAX, UPG_MORTAR, UPG_SHOTGUN,
  UPG_WPN_FLAME, UPG_WPN_HARP, UPG_WPN_MORT, UPG_WPN_RIVET, UPG_WPN_SHOT, WPN_FLAME, WPN_HARP, WPN_MORT,
  WPN_RIVET, WPN_SHOT, type Input, type World,
} from "../src/sim/types";
import {
  flameHit, mortarRadius, pelletCount, pelletLife, upgDetail, weaponEvery,
} from "../src/sim/weapons";
import { createWorld } from "../src/sim/world";

const idle = (pick = 0): Input => ({ dx: 0, dy: 0, pick });

function quiet(w: World): void {
  w.toSpawn = 99;
  w.spawnCd = 99999;
  w.wave = 1;
  w.fireCd = 99999;
}

function addZombie(w: World, x: number, y: number, hp: number): number {
  const z = w.zombies;
  for (let i = 0; i < MAX_ZOMBIES; i++) {
    if (z.alive[i]) continue;
    z.x[i] = x;
    z.y[i] = y;
    z.hp[i] = hp;
    z.vx[i] = 0;
    z.vy[i] = 0;
    z.alive[i] = 1;
    z.kind[i] = 0;
    return i;
  }
  throw new Error("zombies full");
}

function countKind(w: World, gun: number): number {
  let n = 0;
  for (let j = 0; j < MAX_BULLETS; j++) {
    if (w.bullets.alive[j] && (w.bGun[j] ?? 0) === gun) n++;
  }
  return n;
}

function arm(w: World, id: number, lv: number): void {
  w.upgrades[id] = lv;
}

describe("weapon cards", () => {
  it("starts on a level-1 rivet gun and names the five weapons", () => {
    const w = createWorld(1);
    expect(w.upgrades[UPG_WPN_RIVET]).toBe(1);
    expect(w.upgrades[UPG_WPN_SHOT]).toBe(0);
    expect(w.upgrades[UPG_WPN_FLAME]).toBe(0);
    expect(w.upgrades[UPG_WPN_HARP]).toBe(0);
    expect(w.upgrades[UPG_WPN_MORT]).toBe(0);
    expect(upgName(UPG_WPN_RIVET)).toBe("RIVET GUN");
    expect(upgName(UPG_WPN_SHOT)).toBe("STEAM SHOTGUN");
    expect(upgName(UPG_WPN_FLAME)).toBe("FLAME BOILER");
    expect(upgName(UPG_WPN_HARP)).toBe("HARPOON");
    expect(upgName(UPG_WPN_MORT)).toBe("BOMB MORTAR");
    expect(upgName(UPG_MORTAR)).toBe("MORTAR");
    expect(upgName(UPG_SHOTGUN)).toBe("SCATTER VALVE");
    expect(upgDetail(UPG_WPN_SHOT)).toBe("CLOSE CONE");
    expect(upgDetail(UPG_SHOTGUN)).toBe("");
    expect(UPG_WPN_MORT).toBe(UPG_COUNT - 1);
  });

  it("offers weapon cards through the existing picker once brass cards are maxed", () => {
    const w = createWorld(42);
    for (let i = 0; i < UPG_WPN_RIVET; i++) w.upgrades[i] = UPG_MAX;
    takeXp(w, xpNeed(0));
    expect(w.choosing).toBe(1);
    expect(w.offers.length).toBe(OFFER_N);
    const ids = [w.offers[0] ?? -1, w.offers[1] ?? -1];
    for (const id of ids) {
      expect(id).toBeGreaterThanOrEqual(UPG_WPN_RIVET);
      expect(id).toBeLessThan(UPG_COUNT);
    }
    expect(new Set(ids).size).toBe(OFFER_N);
    const id = ids[0] ?? -1;
    const before = w.upgrades[id] ?? 0;
    expect(tryPick(w, 1)).toBe(true);
    expect(w.upgrades[id]).toBe(before + 1);
    expect(w.choosing).toBe(0);
  });

  it("caps every weapon at five levels", () => {
    const w = createWorld(3);
    for (let i = 0; i < 6; i++) applyUpgrade(w, UPG_WPN_RIVET);
    expect(w.upgrades[UPG_WPN_RIVET]).toBe(UPG_MAX);
    for (let i = 0; i < 6; i++) applyUpgrade(w, UPG_WPN_MORT);
    expect(w.upgrades[UPG_WPN_MORT]).toBe(UPG_MAX);
  });
});

describe("rivet gun", () => {
  it("auto-fires one brass rivet and a fifth level adds a second", () => {
    const bolts = (lv: number): number => {
      const w = createWorld(4);
      quiet(w);
      arm(w, UPG_WPN_RIVET, lv);
      addZombie(w, w.px + 70, w.py, 50);
      w.fireCd = 0;
      step(w, idle());
      return countKind(w, WPN_RIVET);
    };
    expect(bolts(1)).toBe(1);
    expect(bolts(5)).toBe(2);
  });

  it("higher rivet levels hit harder and shoot sooner", () => {
    const left = (lv: number): number => {
      const w = createWorld(5);
      quiet(w);
      arm(w, UPG_WPN_RIVET, lv);
      w.fireCd = 0;
      const i = addZombie(w, w.px + 16, w.py, 10);
      for (let t = 0; t < 4; t++) step(w, idle());
      return w.zombies.hp[i] ?? 0;
    };
    expect(left(4)).toBeLessThan(left(1));
    const shots = (lv: number): number => {
      const w = createWorld(6);
      quiet(w);
      arm(w, UPG_WPN_RIVET, lv);
      w.fireCd = 0;
      addZombie(w, w.px + 80, w.py, 999);
      let n = 0;
      for (let t = 0; t < 60; t++) {
        step(w, idle());
        if (w.events[EV_SHOT]) n++;
      }
      return n;
    };
    expect(shots(5)).toBeGreaterThan(shots(1));
  });

  it("the existing steam shotgun card still sprays extra rivets", () => {
    const w = createWorld(12);
    quiet(w);
    applyUpgrade(w, UPG_SHOTGUN);
    addZombie(w, w.px + 80, w.py, 99);
    w.fireCd = 0;
    step(w, idle());
    expect(countKind(w, WPN_RIVET)).toBe(3);
    expect(countKind(w, WPN_SHOT)).toBe(0);
  });
});

describe("steam shotgun", () => {
  it("fires a short-lived cone whose width grows with level", () => {
    const cone = (lv: number): number => {
      const w = createWorld(7);
      quiet(w);
      arm(w, UPG_WPN_SHOT, lv);
      addZombie(w, w.px + 120, w.py, 40);
      step(w, idle());
      return countKind(w, WPN_SHOT);
    };
    expect(cone(1)).toBe(pelletCount(1));
    expect(cone(5)).toBe(pelletCount(5));
    expect(pelletCount(5)).toBeGreaterThan(pelletCount(1));
    const w = createWorld(8);
    quiet(w);
    arm(w, UPG_WPN_SHOT, 1);
    const i = addZombie(w, w.px + 120, w.py, 40);
    step(w, idle());
    const vxs = new Set<number>();
    let life = 0;
    for (let j = 0; j < MAX_BULLETS; j++) {
      if (!w.bullets.alive[j] || (w.bGun[j] ?? 0) !== WPN_SHOT) continue;
      vxs.add(w.bullets.vx[j] ?? 0);
      life = w.bLife[j] ?? 0;
    }
    expect(vxs.size).toBeGreaterThan(1);
    expect(life).toBe(pelletLife(1) - 1);
    const hp = w.zombies.hp[i] ?? 0;
    for (let t = 0; t < 20; t++) step(w, idle());
    expect(countKind(w, WPN_SHOT)).toBe(0);
    expect(w.zombies.hp[i]).toBe(hp);
    const stock = createWorld(8);
    expect(weaponEvery(stock, WPN_SHOT, 5)).toBeLessThan(weaponEvery(stock, WPN_SHOT, 1));
  });

  it("a picked steam shotgun fires beside the rivet gun", () => {
    const w = createWorld(9);
    quiet(w);
    w.offers[0] = UPG_WPN_SHOT;
    w.offers[1] = UPG_WPN_FLAME;
    w.choosing = 1;
    expect(tryPick(w, 1)).toBe(true);
    expect(w.upgrades[UPG_WPN_SHOT]).toBe(1);
    addZombie(w, w.px + 80, w.py, 30);
    w.fireCd = 0;
    step(w, idle());
    expect(countKind(w, WPN_RIVET)).toBeGreaterThan(0);
    expect(countKind(w, WPN_SHOT)).toBe(pelletCount(1));
  });
});

describe("flame boiler", () => {
  it("burns a zombie in the jet and burns harder at higher levels", () => {
    const burned = (lv: number): number => {
      const w = createWorld(10);
      quiet(w);
      arm(w, UPG_WPN_FLAME, lv);
      const i = addZombie(w, w.px + 14, w.py, 80);
      for (let t = 0; t < 48; t++) step(w, idle());
      return 80 - (w.zombies.hp[i] ?? 0);
    };
    expect(burned(1)).toBeGreaterThan(0);
    expect(burned(5)).toBeGreaterThan(burned(1));
  });

  it("a planted flame keeps burning after the first scorch", () => {
    const w = createWorld(11);
    quiet(w);
    const i = addZombie(w, 80, 80, 20);
    w.bullets.x[0] = 80;
    w.bullets.y[0] = 80;
    w.bullets.alive[0] = 1;
    w.bGun[0] = WPN_FLAME;
    w.bullets.hp[0] = 1;
    w.bLife[0] = 40;
    w.bHit[0] = -1;
    for (let t = 0; t < 16; t++) step(w, idle());
    expect(w.zombies.hp[i] ?? 0).toBeLessThan(17);
    expect(w.bullets.alive[0]).toBe(1);
  });
});

describe("harpoon launcher", () => {
  it("pierces a line and a higher level reaches farther down that line", () => {
    const alive = (lv: number): number => {
      const w = createWorld(13);
      quiet(w);
      arm(w, UPG_WPN_HARP, lv);
      for (let n = 0; n < 4; n++) addZombie(w, w.px + 24 + n * 24, w.py, 1);
      for (let t = 0; t < 50; t++) step(w, idle());
      let n = 0;
      for (let i = 0; i < 4; i++) if (w.zombies.alive[i]) n++;
      return n;
    };
    expect(alive(1)).toBe(1);
    expect(alive(5)).toBe(0);
  });
});

describe("bomb mortar", () => {
  it("lobs a fused shell whose stored blast grows with level", () => {
    const w = createWorld(14);
    quiet(w);
    arm(w, UPG_WPN_MORT, 1);
    addZombie(w, w.px + 90, w.py, 40);
    step(w, idle());
    expect(countKind(w, WPN_MORT)).toBe(1);
    let radius = 0;
    let life = 0;
    let vy = 0;
    for (let j = 0; j < MAX_BULLETS; j++) {
      if (!w.bullets.alive[j] || (w.bGun[j] ?? 0) !== WPN_MORT) continue;
      radius = w.bRad[j] ?? 0;
      expect(w.bPierce[j] ?? 0).toBe(0);
      life = w.bLife[j] ?? 0;
      vy = w.bullets.vy[j] ?? 0;
    }
    expect(radius).toBe(mortarRadius(1));
    expect(life).toBeGreaterThan(0);
    expect(vy).toBeLessThan(0);
    expect(mortarRadius(5)).toBeGreaterThan(mortarRadius(1));
  });

  it("the blast hurts zombies the shell never touches, and a bigger level reaches farther", () => {
    const hit = (lv: number, dist: number): number => {
      const w = createWorld(15);
      quiet(w);
      const i = addZombie(w, 200 + dist, 180, 9);
      w.bullets.x[0] = 200;
      w.bullets.y[0] = 180;
      w.bullets.alive[0] = 1;
      w.bGun[0] = WPN_MORT;
      w.bullets.hp[0] = 3;
      w.bPierce[0] = 0;
      w.bRad[0] = mortarRadius(lv);
      w.bLife[0] = 1;
      w.bHit[0] = -1;
      step(w, idle());
      return w.zombies.hp[i] ?? 0;
    };
    const far = mortarRadius(1) + 8;
    expect(hit(1, far)).toBe(9);
    expect(hit(5, far)).toBeLessThan(9);
    expect(hit(5, 60)).toBeLessThan(9);
    expect(hit(5, mortarRadius(5) + 8)).toBe(9);
  });

  it("detonates on contact and splashes a neighbor outside the shell", () => {
    const w = createWorld(16);
    quiet(w);
    const on = addZombie(w, 180, 180, 9);
    const near = addZombie(w, 204, 180, 9);
    const far = addZombie(w, 180, 300, 9);
    w.bullets.x[0] = 180;
    w.bullets.y[0] = 180;
    w.bullets.alive[0] = 1;
    w.bGun[0] = WPN_MORT;
    w.bullets.hp[0] = 3;
    w.bPierce[0] = 0;
    w.bRad[0] = 40;
    w.bLife[0] = 20;
    w.bHit[0] = -1;
    step(w, idle());
    expect(w.events[EV_BOOM]).toBe(1);
    expect(w.bullets.alive[0]).toBe(0);
    expect(w.zombies.hp[on] ?? 0).toBeLessThan(9);
    expect(w.zombies.hp[near] ?? 0).toBeLessThan(9);
    expect(w.zombies.hp[far]).toBe(9);
  });
});

describe("armed runs", () => {
  it("stays deterministic with every weapon owned", () => {
    const run = () => {
      const w = createWorld(99);
      arm(w, UPG_WPN_SHOT, 4);
      arm(w, UPG_WPN_FLAME, 4);
      arm(w, UPG_WPN_HARP, 4);
      arm(w, UPG_WPN_MORT, 4);
      for (let t = 0; t < 240; t++) step(w, { dx: t % 8 < 4 ? 1 : -1, dy: 0, pick: 1 });
      return { score: w.score, tick: w.tick, px: w.px, hp: w.hp, gun: w.gun, wave: w.wave };
    };
    expect(run()).toEqual(run());
  });
});

describe("bonuses on every weapon", () => {
  const sides = [
    [UPG_WPN_SHOT, WPN_SHOT],
    [UPG_WPN_FLAME, WPN_FLAME],
    [UPG_WPN_HARP, WPN_HARP],
    [UPG_WPN_MORT, WPN_MORT],
  ] as const;

  function armedCd(id: number, fire: number, upg: number, slot: number): number {
    const w = createWorld(30, id);
    quiet(w);
    arm(w, upg, 1);
    w.upgrades[UPG_FIRE] = fire;
    addZombie(w, w.px + 90, w.py, 80);
    step(w, idle());
    return w.wpnCd[slot] ?? 0;
  }

  it("speeds shotgun, flame, harpoon, and mortar with gunslinger and overdrive", () => {
    const stock = createWorld(1, CHAR_TINKER);
    const gun = createWorld(1, CHAR_GUNSLINGER);
    const hot = createWorld(1, CHAR_TINKER);
    hot.upgrades[UPG_FIRE] = 1;
    expect(fireEvery(gun)).toBeLessThan(fireEvery(stock));
    expect(fireEvery(hot)).toBeLessThan(fireEvery(stock));
    for (const [upg, slot] of sides) {
      const base = weaponEvery(stock, slot, 1);
      expect(base).toBeGreaterThan(1);
      expect(weaponEvery(gun, slot, 1)).toBeLessThan(base);
      expect(weaponEvery(hot, slot, 1)).toBeLessThan(base);
      const both = createWorld(1, CHAR_GUNSLINGER);
      both.upgrades[UPG_FIRE] = 2;
      expect(weaponEvery(both, slot, 1)).toBeLessThan(weaponEvery(gun, slot, 1));
      expect(armedCd(CHAR_TINKER, 0, upg, slot)).toBe(base);
      expect(armedCd(CHAR_GUNSLINGER, 0, upg, slot)).toBe(weaponEvery(gun, slot, 1));
      expect(armedCd(CHAR_TINKER, 1, upg, slot)).toBe(weaponEvery(hot, slot, 1));
    }
  });

  it("puts the brute rage bonus on the flame stream", () => {
    const stream = (hp: number, dmgLv = 0): number => {
      const w = createWorld(31, CHAR_BRUTE);
      quiet(w);
      w.hp = hp;
      w.upgrades[UPG_DMG] = dmgLv;
      arm(w, UPG_WPN_FLAME, 1);
      expect(flameHit(w)).toBe(bulletDmg(w));
      const i = addZombie(w, w.px + 14, w.py, 240);
      step(w, idle());
      let dealt = 0;
      for (let j = 0; j < MAX_BULLETS; j++) {
        if (!w.bullets.alive[j] || (w.bGun[j] ?? 0) !== WPN_FLAME) continue;
        dealt = w.bullets.hp[j] ?? 0;
      }
      for (let t = 0; t < 16; t++) step(w, idle());
      const lost = 240 - (w.zombies.hp[i] ?? 0);
      expect(lost).toBeGreaterThan(0);
      return dealt;
    };
    expect(stream(8)).toBe(1);
    expect(stream(4)).toBe(1 + RAGE_DMG);
    expect(stream(8, 2)).toBe(3);
    const burned = (hp: number): number => {
      const w = createWorld(32, CHAR_BRUTE);
      quiet(w);
      w.hp = hp;
      arm(w, UPG_WPN_FLAME, 1);
      const i = addZombie(w, w.px + 14, w.py, 240);
      for (let t = 0; t < 24; t++) step(w, idle());
      return 240 - (w.zombies.hp[i] ?? 0);
    };
    expect(burned(4)).toBeGreaterThan(burned(8));
  });
});
