import { stampBlood, stampCasing } from "../render/stains";
import { ARENA_H, ARENA_W } from "../sim/arena";
import { Z_ELITE } from "../sim/foes";
import { mapState } from "../sim/map-events";
import { EV_SHOT, MAX_ZOMBIES, Z_BRUTE, type World } from "../sim/types";

export const REVIEW_HORDE = 36;
export const REVIEW_RING = 108;

const KINDS = [0, 0, 0, 0, 1, 0, 0, 0, 2, Z_ELITE];

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
    const r = REVIEW_RING + (i % 4) * 18;
    const kind = KINDS[i % KINDS.length] ?? 0;
    z.alive[i] = 1;
    z.kind[i] = kind;
    z.x[i] = w.px + Math.cos(a) * r;
    z.y[i] = w.py + Math.sin(a) * r;
    z.hp[i] = kind === Z_BRUTE || (kind & Z_ELITE) !== 0 ? 18 : 1;
    z.vx[i] = 0;
    z.vy[i] = 0;
    stampBlood(z.x[i] ?? 0, (z.y[i] ?? 0) + 6, i * 3);
    if ((i & 1) === 0) stampCasing(w.px - 18 - (i % 7) * 4, w.py + 8 + ((i * 3) % 9), i);
    n++;
  }
  stampCasing(w.px - 14, w.py + 8, 9);
  stampCasing(w.px + 10, w.py + 12, 11);
  stampBlood(w.px + 22, w.py + 16, 5);
  return n;
}
