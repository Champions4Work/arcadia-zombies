import { JUICE_DT, juiceFrame, juicePlayerHurt, tickJuice } from "../render/juice";
import {
  chaseZombie, cutProps, pickupHeals, queueSpawn, slidePlayer, teleCount, tickTelegraphs, updateCamera,
} from "./arena.hot";
import { emitFx, hurtZombie, killZombie } from "./combat.hot";
import { scaledDmg, spawnEvery, tierAt } from "./difficulty";
import { holdSpawns, lichMinion, stepFinale, watchFinale } from "./finale";
import {
  foeContact, foeTouchR2, GAS_FUSE_R2, rollKind, Z_GAS, Z_KIND, Z_KNIGHT, Z_SPITTER,
} from "./foes";
import { tickKnight, tickSpitter } from "./foes.hot";
import { beginQuery, nextQuery } from "./grid.hot";
import {
  briarOn, calliopeBite, calliopeOn, heartBite, heartOn, howitzerBite, howitzerShells, shieldCap,
} from "./evolve";
import {
  healEvery, mortarEvery, moveSpeed, SAW_HIT_R2, sawAngle, sawCount, sawDamage, sawSpin,
  sawRadius, shieldReload, teslaChain, teslaEvery, teslaPower, teslaRange, tryPick,
  ventEvery, ventRange, whistleRange,
} from "./progress";
import { stepMapEvents } from "./map-events.hot";
import { clearMapStrike, mapStrikeDmg, mapStrikeOn, mapStrikeR, mapStrikeX, mapStrikeY } from "./map-events";
import {
  EV_HURT, EV_RANK, EV_SAW, EV_SHIELD, EV_TESLA, EV_WAVE, FX_FLASH, FX_SPARK,
  MAX_ZOMBIES, UPG_COOLANT, UPG_MORTAR, UPG_SPIKES, UPG_TESLA,
  UPG_VENT, UPG_WHISTLE, EVOL_AEGIS, type Input, type World,
} from "./types";
import { rivetEvery } from "./weapons";
import { fireRivet, tickProjectiles, tickWeapons } from "./weapons.hot";
function pulseAt(w: World, x: number, y: number, r: number, dmg: number): void {
  const z = w.zombies;
  const r2 = r * r;
  for (let i = 0; i < MAX_ZOMBIES; i++) {
    if (!z.alive[i]) continue;
    const dx = (z.x[i] ?? 0) - x;
    const dy = (z.y[i] ?? 0) - y;
    if (dx * dx + dy * dy < r2) {
      hurtZombie(w, i, dmg);
      if (w.over) return;
    }
  }
}
function zap(w: World): void {
  const z = w.zombies;
  const power = teslaPower(w);
  const firstR2 = teslaRange(w) * teslaRange(w);
  const hopR2 = teslaChain(w) * teslaChain(w);
  for (let i = 0; i < MAX_ZOMBIES; i++) w.zMark[i] = 0;
  w.teslaN = 0;
  let cx = w.px;
  let cy = w.py;
  let lim = firstR2;
  for (let hop = 0; hop < power; hop++) {
    let best = -1;
    let bd = lim;
    for (let i = 0; i < MAX_ZOMBIES; i++) {
      if (!z.alive[i] || w.zMark[i]) continue;
      const dx = (z.x[i] ?? 0) - cx;
      const dy = (z.y[i] ?? 0) - cy;
      const d = dx * dx + dy * dy;
      if (d < bd) { bd = d; best = i; }
    }
    if (best < 0) break;
    w.zMark[best] = 1;
    if (w.teslaN < 8) {
      w.teslaHit[w.teslaN] = best;
      w.teslaN++;
    }
    hurtZombie(w, best, power);
    if (w.over) return;
    cx = z.x[best] ?? 0;
    cy = z.y[best] ?? 0;
    lim = hopR2;
  }
  if (w.teslaN > 0) {
    w.events[EV_TESLA] = 1;
    w.teslaFlash = 8;
  }
}
function spinSaws(w: World): void {
  const n = sawCount(w);
  if (n <= 0 || (w.tick & 3) !== 0) return;
  const z = w.zombies;
  const r = sawRadius(w);
  const dmg = sawDamage(w);
  for (let s = 0; s < n; s++) {
    const a = sawAngle(w.tick, s, n, sawSpin(w));
    const sx = w.px + Math.cos(a) * r;
    const sy = w.py + Math.sin(a) * r;
    beginQuery(sx, sy);
    for (;;) {
      const i = nextQuery();
      if (i < 0) break;
      if (!z.alive[i]) continue;
      const dx = (z.x[i] ?? 0) - sx;
      const dy = (z.y[i] ?? 0) - sy;
      if (dx * dx + dy * dy < SAW_HIT_R2) {
        w.events[EV_SAW] = 1;
        hurtZombie(w, i, dmg);
        if (w.over) return;
      }
    }
    cutProps(w, sx, sy);
  }
}
function ventPulse(w: World): void {
  const lvl = w.upgrades[UPG_VENT] ?? 0;
  if (lvl <= 0) return;
  pulseAt(w, w.px, w.py, ventRange(w), lvl + (w.upgrades[EVOL_AEGIS] ?? 0) + heartBite(w));
  if (heartOn(w) && w.hp < w.maxHp) w.hp++;
  emitFx(w, FX_FLASH, w.px, w.py, 0);
}
function mortarShot(w: World): void {
  const lvl = w.upgrades[UPG_MORTAR] ?? 0;
  if (lvl <= 0) return;
  const volley = 1 + howitzerShells(w);
  const bite = 2 + lvl + howitzerBite(w);
  const z = w.zombies;
  for (let i = 0; i < MAX_ZOMBIES; i++) w.zMark[i] = 0;
  for (let s = 0; s < volley; s++) {
    let best = -1;
    let bd = -1;
    for (let i = 0; i < MAX_ZOMBIES; i++) {
      if (!z.alive[i] || w.zMark[i]) continue;
      const dx = (z.x[i] ?? 0) - w.px;
      const dy = (z.y[i] ?? 0) - w.py;
      const d = dx * dx + dy * dy;
      if (d > bd) { bd = d; best = i; }
    }
    if (best < 0) break;
    w.zMark[best] = 1;
    hurtZombie(w, best, bite);
    if (w.over) return;
    emitFx(w, FX_SPARK, z.x[best] ?? 0, z.y[best] ?? 0, 0);
  }
}
function thorns(w: World, dmg: number): void {
  const z = w.zombies;
  const r2 = 46 * 46;
  for (let i = 0; i < MAX_ZOMBIES; i++) {
    if (!z.alive[i]) continue;
    const dx = (z.x[i] ?? 0) - w.px;
    const dy = (z.y[i] ?? 0) - w.py;
    if (dx * dx + dy * dy < r2) {
      hurtZombie(w, i, dmg);
      if (w.over) return;
    }
  }
}
export function step(w: World, input: Input): void {
  w.events.fill(0);
  if (w.over) return;
  if (juiceFrame(JUICE_DT)) return;
  if (w.choosing) {
    tryPick(w, input.pick ?? 0);
    return;
  }
  w.tick++;
  if (w.rankFlash > 0) w.rankFlash--;
  if (w.banner > 0) w.banner--;
  const next = tierAt(w.tick);
  if (next > w.rank) {
    w.rank = next;
    w.rankFlash = 36;
    w.banner = 150;
    w.events[EV_RANK] = 1;
  }
  if (w.teslaFlash > 0) w.teslaFlash--;
  slidePlayer(w, input.dx, input.dy, moveSpeed(w));
  updateCamera(w);
  const z = w.zombies;
  let alive = 0;
  for (let i = 0; i < MAX_ZOMBIES; i++) if (z.alive[i]) alive++;
  watchFinale(w);
  if (holdSpawns(w)) {
    w.toSpawn = 0;
  } else if (alive === 0 && w.toSpawn === 0 && teleCount(w) === 0) {
    w.wave++;
    w.toSpawn = 4 + w.wave * 2 + w.rank;
    w.events[EV_WAVE] = 1;
  }
  if (!holdSpawns(w) && w.toSpawn > 0 && --w.spawnCd <= 0) {
    queueSpawn(w, rollKind(w));
    w.toSpawn--;
    w.spawnCd = spawnEvery(w.rank);
  }
  if (--w.fireCd <= 0) { fireRivet(w); w.fireCd = rivetEvery(w); }
  tickWeapons(w);
  if (w.hurtCd > 0) w.hurtCd--;
  const cool = w.upgrades[UPG_COOLANT] ?? 0;
  if (cool > 0 && w.hp < w.maxHp && --w.healCd <= 0) {
    w.hp++;
    w.healCd = healEvery(w);
  }
  const cap = shieldCap(w);
  if (cap > 0 && w.shield < cap && --w.shieldCd <= 0) {
    w.shield++;
    w.shieldCd = shieldReload(w);
  }
  const whistle = w.upgrades[UPG_WHISTLE] ?? 0;
  const wr = whistle > 0 ? whistleRange(w) : 0;
  const wr2 = wr * wr;
  for (let i = 0; i < MAX_ZOMBIES; i++) {
    if (!z.alive[i]) continue;
    const raw = z.kind[i] ?? 0;
    const kind = raw & Z_KIND;
    if (kind === Z_SPITTER) tickSpitter(w, i);
    else {
      const dx = w.px - (z.x[i] ?? 0);
      const dy = w.py - (z.y[i] ?? 0);
      const d2 = dx * dx + dy * dy;
      const saved = z.vx[i] ?? 0;
      if (whistle > 0 && d2 < wr2) {
        z.vx[i] = saved * 0.62;
        if (calliopeOn(w) && (w.tick % 10) === 0) {
          hurtZombie(w, i, calliopeBite(w));
          if (w.over) return;
        }
      }
      chaseZombie(w, i);
      z.vx[i] = saved;
      if (kind === Z_KNIGHT) tickKnight(w, i);
    }
    const tx = w.px - (z.x[i] ?? 0);
    const ty = w.py - (z.y[i] ?? 0);
    const td2 = tx * tx + ty * ty;
    if (kind === Z_GAS && td2 < GAS_FUSE_R2) {
      killZombie(w, i);
      if (w.over) return;
      continue;
    }
    if (td2 < foeTouchR2(raw) && w.hurtCd === 0) {
      w.hurtCd = 45;
      if (w.shield > 0) {
        w.shield--;
        w.shieldCd = shieldReload(w);
        w.events[EV_SHIELD] = 1;
        const aegis = w.upgrades[EVOL_AEGIS] ?? 0;
        if (aegis > 0) {
          pulseAt(w, w.px, w.py, 52 + aegis * 8, aegis + 1);
          if (w.over) return;
        }
        if (briarOn(w)) {
          thorns(w, 3);
          if (w.over) return;
        }
      } else {
        w.hp -= lichMinion(w, i) ? 1 : scaledDmg(foeContact(raw), w.rank);
        w.events[EV_HURT] = 1;
        juicePlayerHurt();
        const spikes = w.upgrades[UPG_SPIKES] ?? 0;
        if (spikes > 0) {
          thorns(w, spikes);
          if (w.over) return;
        }
        if (w.hp <= 0) { w.over = true; return; }
      }
    }
  }
  if (tickProjectiles(w)) return;
  if ((w.upgrades[UPG_TESLA] ?? 0) > 0 && --w.teslaCd <= 0) {
    zap(w);
    if (w.over) return;
    w.teslaCd = teslaEvery(w);
  }
  if ((w.upgrades[UPG_VENT] ?? 0) > 0 && --w.ventCd <= 0) {
    ventPulse(w);
    if (w.over) return;
    w.ventCd = ventEvery(w);
  }
  if ((w.upgrades[UPG_MORTAR] ?? 0) > 0 && --w.mortarCd <= 0) {
    mortarShot(w);
    if (w.over) return;
    w.mortarCd = mortarEvery(w);
  }
  spinSaws(w);
  stepMapEvents(w);
  if (mapStrikeOn(w) !== 0) {
    pulseAt(w, mapStrikeX(w), mapStrikeY(w), mapStrikeR(w), mapStrikeDmg(w));
    clearMapStrike(w);
    if (w.over) return;
  }
  stepFinale(w);
  tickTelegraphs(w);
  pickupHeals(w);
  tickJuice(JUICE_DT);
}
