import { juiceHit, juiceShot, tickJuice } from "../render/juice";
import { stampBlood, stampCasing } from "../render/stains";
import { HERO_R } from "../render/yard-fx";
import { ARENA_H, ARENA_W } from "../sim/arena";
import { DASH_TICKS } from "../sim/dash";
import { Z_ELITE } from "../sim/foes";
import { reviewDepth } from "../sim/depth";
import { mapState } from "../sim/map-events";
import {
  EV_SHOT, MAX_BULLETS, MAX_ZOMBIES, UPG_WPN_FLAME, UPG_WPN_HARP, UPG_WPN_MORT, UPG_WPN_RIVET,
  UPG_WPN_SHOT, WPN_RIVET, Z_BRUTE, type World,
} from "../sim/types";
import { ZONE_BOILER, ZONE_BRASS, ZONE_TRAM, ZONE_WAVE } from "../sim/zones";

export const REVIEW_HORDE = 40;
export const REVIEW_RING = 58;

const KINDS = [0, 0, 0, 0, 1, 0, 0, 0, 0, 0];

const HERO_LANE_R2 = (HERO_R * 0.58) * (HERO_R * 0.58);

function outsideHeroLane(x: number, y: number, px: number, py: number): boolean {
  const dx = x - px;
  const dy = y - py;
  return dx * dx + dy * dy >= HERO_LANE_R2;
}

let walkOn = false;

export function wantsReviewShot(search = "", hash = ""): boolean {
  return search.includes("shot=1") || search.includes("feel=1") || hash === "#review" || hash === "#feel";
}

export function wantsFeelShot(search = "", hash = ""): boolean {
  return search.includes("feel=1") || hash === "#feel";
}

export function reviewZoneFromSearch(search = ""): number {
  if (search.includes("zone=tram")) return ZONE_TRAM;
  if (search.includes("zone=boiler")) return ZONE_BOILER;
  return ZONE_BRASS;
}

export function reviewWalkOn(): boolean {
  return walkOn;
}

export function setReviewWalk(on: boolean): void {
  walkOn = on;
}

export function reviewHorde(w: World, zone = ZONE_BRASS): number {
  walkOn = true;
  w.px = ARENA_W * 0.5;
  w.py = ARENA_H * 0.5;
  w.aimX = 0.82;
  w.aimY = -0.42;
  w.over = false;
  w.choosing = 0;
  w.hurtCd = 0;
  w.banner = 0;
  w.fireCd = 0;
  w.kills = 47;
  w.rank = 0;
  w.gate = 1;
  w.holdLeft = 240 * 60;
  w.wave = zone === ZONE_TRAM ? ZONE_WAVE[ZONE_TRAM] : zone === ZONE_BOILER ? ZONE_WAVE[ZONE_BOILER] : 4;
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
    const ring = REVIEW_RING + (i % 22);
    if (d2 < 1) {
      dx = ring;
      dy = ((i * 11) % 25) - 12;
    } else if (d2 < 46 * 46) {
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
    z.vx[i] = (w.px - (z.x[i] ?? 0)) < 0 ? -0.2 : 0.2;
    z.vy[i] = 0;
    stampBlood(z.x[i] ?? 0, (z.y[i] ?? 0) + 6, i * 3);
    if (outsideHeroLane(z.x[i] ?? 0, z.y[i] ?? 0, w.px, w.py) && (i & 1) === 0) {
      stampBlood((z.x[i] ?? 0) + 4, (z.y[i] ?? 0) + 10, i * 5 + 2);
    }
    n++;
  }
  for (let c = 0; c < 22; c++) {
    stampCasing(w.px - 58 + ((c * 31) % 104), w.py + 6 + ((c * 17) % 56), c * 5);
  }
  juiceHit(3, z.x[3] ?? w.px, z.y[3] ?? w.py, 2, z.kind[3] ?? 0, false, w.tick, w.px, w.py);
  juiceHit(7, z.x[7] ?? w.px, z.y[7] ?? w.py, 4, Z_BRUTE, false, w.tick, w.px, w.py);
  juiceShot(w.px + 20, w.py - 22, 0.82, -0.42, w.tick);
  w.dashT = DASH_TICKS - 1;
  w.dashUx = 0.86;
  w.dashUy = -0.38;
  w.dashCd = 0;
  tickJuice(70);
  for (let c = 0; c < 28; c++) {
    stampCasing(w.px - 52 + ((c * 37) % 96), w.py + 8 + ((c * 19) % 52), c * 7);
  }
  for (const spot of [[92, 44], [-94, 48], [88, 72], [-86, 68], [104, 34], [-78, 26], [96, 16], [-100, 20], [72, -54], [-82, -48], [108, 58], [-96, 62], [84, -28], [-104, -22]] as const) {
    if (outsideHeroLane(w.px + spot[0], w.py + spot[1], w.px, w.py)) stampBlood(w.px + spot[0], w.py + spot[1], 60 + spot[0]);
  }
  stampBlood(w.px + 86, w.py + 48, 5);
  stampBlood(w.px - 94, w.py + 52, 9);
  stampBlood(w.px + 78, w.py + 72, 15);
  stampBlood(w.px - 88, w.py + 68, 21);
  stampBlood(w.px + 102, w.py + 36, 27);
  stampBlood(w.px - 76, w.py + 28, 33);
  stampBlood(w.px + 92, w.py + 18, 39);
  stampBlood(w.px - 98, w.py + 22, 45);
  stampBlood(w.px + 68, w.py - 52, 51);
  reviewDepth(w);
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
