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
    let dx = ((i * 149) % 241) - 120;
    let dy = ((i * 197) % 331) - 190;
    dx += ((i * 13) % 19) - 9;
    dy += ((i * 29) % 23) - 11;
    const d2 = dx * dx + dy * dy;
    const ring = REVIEW_RING + (i % 28);
    if (d2 < 1) {
      dx = ring;
      dy = ((i * 11) % 25) - 12;
    } else if (d2 < 52 * 52) {
      const m = ring / Math.sqrt(d2);
      const dx0 = dx * m;
      const dy0 = dy * m;
      const inv = 1 / ring;
      const t = ((i * 11) % 17) - 8;
      dx = dx0 + -dy0 * inv * t;
      dy = dy0 + dx0 * inv * t;
    }
    const kind = i === 7 || i === 24 ? Z_BRUTE : (KINDS[i % KINDS.length] ?? 0);
    z.alive[i] = 1;
    z.kind[i] = kind;
    z.x[i] = w.px + dx;
    z.y[i] = w.py + dy;
    z.hp[i] = kind === Z_BRUTE || (kind & Z_ELITE) !== 0 ? 18 : 1;
    z.vx[i] = 0;
    z.vy[i] = 0;
    stampBlood(z.x[i] ?? 0, (z.y[i] ?? 0) + 6, i * 3);
    n++;
  }
  for (let c = 0; c < 24; c++) {
    stampCasing(w.px - 28 + ((c * 17) % 51), w.py + 4 + ((c * 13) % 23), c * 5);
  }
  stampBlood(w.px + 18, w.py + 14, 5);
  stampBlood(w.px - 24, w.py + 22, 9);
  stampBlood(w.px + 8, w.py + 36, 15);
  stampBlood(w.px - 36, w.py + 44, 21);
  stampBlood(w.px + 42, w.py + 58, 27);
  stampBlood(w.px + 28, w.py - 18, 33);
  stampBlood(w.px - 16, w.py - 12, 39);
  stampBlood(w.px + 52, w.py + 8, 45);
  stampBlood(w.px - 44, w.py + 16, 51);
  const b = w.bullets;
  for (let j = 0; j < MAX_BULLETS; j++) b.alive[j] = 0;
  for (let j = 0; j < 5; j++) {
    b.alive[j] = 1;
    b.x[j] = w.px + 38 + j * 22;
    b.y[j] = w.py - 22;
    b.vx[j] = 10;
    b.vy[j] = 0;
    w.bGun[j] = WPN_RIVET;
    w.bLife[j] = 18;
  }
  return n;
}
