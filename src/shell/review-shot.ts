import { ARENA_H, ARENA_W } from "../sim/arena";
import { Z_ELITE } from "../sim/foes";
import { mapState } from "../sim/map-events";
import { MAX_ZOMBIES, type World } from "../sim/types";

export const REVIEW_HORDE = 36;

const KINDS = [0, 0, 1, 3, 0, 2, 0, 6, 0, Z_ELITE];

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
    const r = 70 + (i % 3) * 20;
    z.alive[i] = 1;
    z.kind[i] = KINDS[i % KINDS.length] ?? 0;
    z.x[i] = w.px + Math.cos(a) * r;
    z.y[i] = w.py + Math.sin(a) * r;
    z.hp[i] = 18;
    z.vx[i] = 0;
    z.vy[i] = 0;
    n++;
  }
  return n;
}
