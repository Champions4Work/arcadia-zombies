import { stampBlood, stampCasing } from "../render/stains";
import { ARENA_H, ARENA_W } from "../sim/arena";
import { Z_ELITE } from "../sim/foes";
import { mapState } from "../sim/map-events";
import {
  EV_SHOT, MAX_BULLETS, MAX_ZOMBIES, UPG_WPN_FLAME, UPG_WPN_HARP, UPG_WPN_MORT, UPG_WPN_RIVET,
  UPG_WPN_SHOT, WPN_RIVET, Z_BRUTE, type World,
} from "../sim/types";

export const REVIEW_HORDE = 40;
export const REVIEW_RING = 58;

const KINDS = [0, 0, 0, 0, 1, 0, 0, 0, 0, 0];

export function wantsReviewShot(search = "", hash = ""): boolean {
  return search.includes("shot=1") || hash === "#review";
}

export function reviewHorde(w: World): number {
  w.px = ARENA_W * 0.5;
  w.py = ARENA_H * 0.5;
  w.aimX = 1;
  w.aimY = 0;
  w.over = false;
  w.choosing = 0;
  w.hurtCd = 0;
  w.banner = 0;
  w.fireCd = 0;
  w.kills = 47;
  w.wave = 4;
  w.level = 11;
  w.xp = 40;
  w.tick = 48;
  w.upgrades[UPG_WPN_RIVET] = 3;
  w.upgrades[UPG_WPN_SHOT] = 2;
  w.upgrades[UPG_WPN_FLAME] = 1;
  w.upgrades[UPG_WPN_HARP] = 1;
  w.upgrades[UPG_WPN_MORT] = 2;
  w.events[EV_SHOT] = 1;
  const bag = mapState(w);
  bag.banner = 0;
  bag.bannerKind = 0;
  bag.kind = 0;
  bag.phase = 0;
  const z = w.zombies;
  for (let i = 0; i < MAX_ZOMBIES; i++) z.alive[i] = 0;
  let n = 0;
  for (let i = 0; i < REVIEW_HORDE; i++) {
    const a = (i / REVIEW_HORDE) * Math.PI * 2;
    const r = i < 16 ? REVIEW_RING + (i % 3) * 10 : REVIEW_RING + 36 + (i % 4) * 12;
    const kind = KINDS[i % KINDS.length] ?? 0;
    z.alive[i] = 1;
    z.kind[i] = kind;
    z.x[i] = w.px + Math.cos(a) * r;
    z.y[i] = w.py + Math.sin(a) * r;
    z.hp[i] = kind === Z_BRUTE || (kind & Z_ELITE) !== 0 ? 18 : 1;
    z.vx[i] = 0;
    z.vy[i] = 0;
    stampBlood(z.x[i] ?? 0, (z.y[i] ?? 0) + 6, i * 3);
    stampBlood((z.x[i] ?? 0) + 8, (z.y[i] ?? 0) + 10, i * 5);
    stampCasing(w.px - 20 - (i % 9) * 5, w.py + 6 + ((i * 4) % 14), i);
    n++;
  }
  stampCasing(w.px - 14, w.py + 8, 9);
  stampCasing(w.px + 10, w.py + 12, 11);
  stampCasing(w.px - 22, w.py + 16, 13);
  stampCasing(w.px + 16, w.py + 4, 15);
  stampCasing(w.px - 8, w.py + 18, 17);
  stampCasing(w.px + 4, w.py + 22, 19);
  stampCasing(w.px - 18, w.py + 26, 21);
  stampCasing(w.px + 22, w.py + 10, 23);
  stampCasing(w.px - 28, w.py + 14, 25);
  stampCasing(w.px - 6, w.py + 28, 27);
  stampCasing(w.px + 12, w.py + 18, 29);
  stampBlood(w.px + 22, w.py + 16, 5);
  stampBlood(w.px - 28, w.py + 20, 7);
  stampBlood(w.px + 8, w.py + 24, 9);
  const b = w.bullets;
  for (let j = 0; j < MAX_BULLETS; j++) b.alive[j] = 0;
  for (let j = 0; j < 10; j++) {
    b.alive[j] = 1;
    b.x[j] = w.px + 30 + j * 11;
    b.y[j] = w.py - 18;
    b.vx[j] = 10;
    b.vy[j] = 0;
    w.bGun[j] = WPN_RIVET;
    w.bLife[j] = 18;
  }
  return n;
}
