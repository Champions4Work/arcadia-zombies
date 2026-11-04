import { ARENA_H, ARENA_W } from "../sim/arena";
import { stampBlood, stampCasing } from "../render/stains";
import { BOSS_TANK, bossMaxHp } from "../sim/boss";
import { UNIONS } from "../sim/evolve";
import {
  B_ACID, foeHp, Z_ELITE, Z_GAS, Z_KIND, Z_KNIGHT, Z_RAT, Z_SPITTER,
} from "../sim/foes";
import { beginLevel, xpNeed } from "../sim/progress";
import {
  MAX_BULLETS, MAX_ZOMBIES, UNION_BRIAR, UPG_DYNAMO, UPG_FIRE, UPG_HP, UPG_MAX, UPG_TESLA,
  EV_SHOT, Z_BRUTE, Z_GHOUL, Z_SHAMBLER, type World,
} from "../sim/types";

const ROW = [Z_SHAMBLER, Z_GHOUL, Z_BRUTE, Z_SPITTER, Z_GAS, Z_KNIGHT, Z_RAT];

export function lineup(w: World): void {
  w.toSpawn = 0;
  w.spawnCd = 99999;
  w.fireCd = 99999;
  w.wave = 8;
  w.hurtCd = 0;
  w.over = false;
  w.choosing = 0;
  w.px = 36;
  w.py = 292;
  w.aimX = 1;
  w.aimY = 0;
  const z = w.zombies;
  for (let i = 0; i < MAX_ZOMBIES; i++) z.alive[i] = 0;
  let n = 0;
  for (let elite = 0; elite < 2; elite++) {
    for (let k = 0; k < ROW.length; k++) {
      const base = ROW[k] ?? Z_SPITTER;
      const raw = elite ? base | Z_ELITE : base;
      const pack = base === Z_RAT ? 4 : 1;
      for (let p = 0; p < pack; p++) {
        const i = n++;
        z.alive[i] = 1;
        z.kind[i] = raw;
        z.x[i] = 56 + k * 58 + (base === Z_RAT ? (p - 1.5) * 12 : 0);
        z.y[i] = (elite ? 230 : 128) + (base === Z_RAT ? (p & 1) * 10 : 0);
        z.vx[i] = 0;
        z.vy[i] = base === Z_KNIGHT ? Math.PI : base === Z_SPITTER ? 40 : 0;
        z.hp[i] = foeHp(raw & Z_KIND, 8, elite === 1);
      }
    }
  }
  const b = w.bullets;
  for (let j = 0; j < MAX_BULLETS; j++) b.alive[j] = 0;
  b.alive[0] = 1;
  b.kind[0] = 0;
  b.hp[0] = B_ACID;
  b.x[0] = 118;
  b.y[0] = 108;
  b.vx[0] = -1.4;
  b.vy[0] = 0.2;
  const boss = w.boss;
  boss.on = 1;
  boss.kind = BOSS_TANK;
  boss.phase = 1;
  boss.mode = 1;
  boss.x = 400;
  boss.y = 300;
  boss.aimX = -1;
  boss.aimY = 0;
  boss.hp = bossMaxHp(BOSS_TANK, 1, 0);
  boss.maxHp = boss.hp;
}

export function stageOffer(w: World): void {
  w.over = false;
  w.choosing = 0;
  w.hurtCd = 0;
  w.upgrades[UPG_TESLA] = UPG_MAX;
  w.upgrades[UPG_DYNAMO] = 1;
  const z = w.zombies;
  for (let i = 0; i < MAX_ZOMBIES; i++) z.alive[i] = 0;
  z.alive[0] = 1;
  z.kind[0] = Z_SHAMBLER;
  z.x[0] = 90;
  z.y[0] = 70;
  z.hp[0] = 40;
  z.vx[0] = 0;
  z.vy[0] = 0;
  w.xp = xpNeed(w.level);
  beginLevel(w);
}

let armed = 0;

export function stageArmed(w: World): void {
  const spec = UNIONS[armed % UNIONS.length];
  armed++;
  if (!spec) return;
  w.over = false;
  w.choosing = 0;
  w.toSpawn = 0;
  w.spawnCd = 99999;
  w.wave = 4;
  w.hurtCd = 0;
  w.px = 210;
  w.py = 168;
  w.aimX = 1;
  w.aimY = 0;
  w.upgrades.fill(0);
  w.upgrades[spec.weapon] = UPG_MAX;
  w.upgrades[spec.passive] = 1;
  w.upgrades[spec.id] = 1;
  w.maxHp = 8;
  w.hp = 6;
  w.shield = spec.id === UNION_BRIAR ? 7 : 0;
  w.teslaCd = 1;
  w.ventCd = 1;
  w.mortarCd = 1;
  w.fireCd = 0;
  w.teslaFlash = 16;
  const z = w.zombies;
  for (let i = 0; i < MAX_ZOMBIES; i++) z.alive[i] = 0;
  z.alive[0] = 1;
  z.kind[0] = Z_SHAMBLER;
  z.x[0] = 360;
  z.y[0] = 168;
  z.hp[0] = 90;
  z.vx[0] = 0;
  z.vy[0] = 0;
  w.teslaN = 1;
  w.teslaHit[0] = 0;
  const b = w.bullets;
  for (let j = 0; j < b.alive.length; j++) b.alive[j] = 0;
}

export function stageObjectives(w: World): void {
  w.over = false;
  w.choosing = 0;
  w.wave = 4;
  w.kills = 72;
  w.gate = 1;
  w.holdLeft = 180 * 60;
  w.toSpawn = 0;
  w.spawnCd = 99999;
  w.fireCd = 99999;
  w.wpnCd.fill(9999);
  w.hurtCd = 0;
  w.px = ARENA_W / 2;
  w.py = ARENA_H / 2;
  w.aimX = 0.92;
  w.aimY = -0.18;
  w.events[EV_SHOT] = 1;
  const z = w.zombies;
  for (let i = 0; i < MAX_ZOMBIES; i++) z.alive[i] = 0;
  const n = 40;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    z.alive[i] = 1;
    z.kind[i] = Z_SHAMBLER;
    z.x[i] = w.px + Math.cos(a) * 90;
    z.y[i] = w.py + Math.sin(a) * 90;
    z.vx[i] = 0;
    z.vy[i] = 0;
    z.hp[i] = foeHp(Z_SHAMBLER, w.rank, false);
  }
  for (let i = 0; i < 96; i++) {
    stampBlood(w.px + ((i * 37) % 140) - 70, w.py + ((i * 53) % 120) - 60, i);
    if ((i & 3) === 0) stampCasing(w.px + ((i * 19) % 80) - 40, w.py + ((i * 23) % 70) - 35, i);
  }
}

export function rush(w: World): void {
  w.wave = 10;
  w.rank = 4;
  w.toSpawn = 48;
  w.spawnCd = 0;
  w.hp = w.maxHp;
  w.over = false;
  w.choosing = 0;
}

export function stageChest(w: World): void {
  w.over = false;
  w.choosing = 0;
  w.hurtCd = 0;
  w.chestOpen = 1;
  w.chestCount = 3;
  w.chestDur = 90;
  w.chestT = 90;
  w.chestGold = 1;
  w.chestLinger = 0;
  w.chestSeal = 0;
  w.chestPrize[0] = UPG_TESLA;
  w.chestPrize[1] = UPG_FIRE;
  w.chestPrize[2] = UPG_HP;
}

export function stageFall(w: World): void {
  w.hp = 0;
  w.over = true;
  w.choosing = 0;
  w.chestOpen = 0;
}
