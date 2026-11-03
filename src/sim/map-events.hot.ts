import { lichUp } from "./finale";
import { applyScore, hasMod, MOD_NOHEAL } from "./modifiers";
import {
  CRATE_FALL, CRATE_R2, DROP_HEAL, DROP_LIVE, DROP_SCORE, FOG_LIVE, GAP_MIN, GAP_SPAN,
  GEAR_LIVE, GEAR_N, GEAR_R2, GEAR_SCORE, MAP_DROP, MAP_FOG, MAP_GEAR, MAP_IDLE, MAP_LIVE, MAP_NONE,
  MAP_VENT, MAP_WARN, VENT_DMG, VENT_LIVE, VENT_R, WARN_TICKS, type MapBag, mapState,
} from "./map-events";
import { nextFloat } from "./rng";
import { H, W, type World } from "./types";

function rollKind(m: MapBag): number {
  if (m.lastKind <= 0) return 1 + ((nextFloat(m.rng) * 4) | 0);
  let k = 1 + ((nextFloat(m.rng) * 3) | 0);
  if (k >= m.lastKind) k++;
  return k;
}

function rollSpot(w: World, m: MapBag): void {
  m.x = w.arena.camX + 48 + nextFloat(m.rng) * (W - 96);
  m.y = w.arena.camY + 108 + nextFloat(m.rng) * (H - 156);
}

function schedule(w: World, m: MapBag): void {
  m.nextAt = w.tick + GAP_MIN + ((nextFloat(m.rng) * GAP_SPAN) | 0);
}

function finish(w: World, m: MapBag): void {
  m.phase = MAP_IDLE;
  m.kind = MAP_NONE;
  m.life = 0;
  m.crate = 0;
  schedule(w, m);
}

function startWarn(w: World, m: MapBag): void {
  const kind = rollKind(m);
  m.kind = kind;
  m.lastKind = kind;
  m.phase = MAP_WARN;
  m.life = WARN_TICKS;
  m.crate = 0;
  m.spawnCd = 6;
  rollSpot(w, m);
  m.bannerKind = kind;
  m.banner = WARN_TICKS + liveSpan(kind);
}

function liveSpan(kind: number): number {
  if (kind === MAP_VENT) return VENT_LIVE;
  if (kind === MAP_DROP) return DROP_LIVE;
  if (kind === MAP_FOG) return FOG_LIVE;
  return GEAR_LIVE;
}

function beginLive(m: MapBag): void {
  m.phase = MAP_LIVE;
  if (m.kind === MAP_VENT) {
    m.life = VENT_LIVE;
    m.strike = 1;
    m.strikeX = m.x;
    m.strikeY = m.y;
    m.strikeR = VENT_R;
    m.strikeDmg = VENT_DMG;
    return;
  }
  if (m.kind === MAP_DROP) {
    m.life = DROP_LIVE;
    m.crate = 1;
    return;
  }
  if (m.kind === MAP_FOG) {
    m.life = FOG_LIVE;
    return;
  }
  m.life = GEAR_LIVE;
  m.spawnCd = 0;
}

function gearsAlive(m: MapBag): number {
  for (let i = 0; i < GEAR_N; i++) if (m.gearOn[i]) return 1;
  return 0;
}

function tickGears(w: World, m: MapBag): void {
  for (let i = 0; i < GEAR_N; i++) {
    if (!m.gearOn[i]) continue;
    const y = (m.gearY[i] ?? 0) + (m.gearVy[i] ?? 0);
    m.gearY[i] = y;
    if (y > w.arena.camY + H + 12) {
      m.gearOn[i] = 0;
      continue;
    }
    const dx = (m.gearX[i] ?? 0) - w.px;
    const dy = y - w.py;
    if (dx * dx + dy * dy < GEAR_R2) {
      m.gearOn[i] = 0;
      w.score += applyScore(GEAR_SCORE, w.mods);
    }
  }
}

function crateReady(m: MapBag): number {
  if (m.crate !== 1 || m.kind !== MAP_DROP || m.phase !== MAP_LIVE) return 0;
  return DROP_LIVE - m.life >= CRATE_FALL ? 1 : 0;
}

function tickCrate(w: World, m: MapBag): void {
  if (!crateReady(m)) return;
  const dx = m.x - w.px;
  const dy = m.y - w.py;
  if (dx * dx + dy * dy >= CRATE_R2) return;
  if (!hasMod(w.mods, MOD_NOHEAL) && w.hp < w.maxHp) w.hp += DROP_HEAL;
  w.score += applyScore(DROP_SCORE, w.mods);
  finish(w, m);
}

function spawnGear(w: World, m: MapBag): void {
  if (m.spawnCd > 0) {
    m.spawnCd--;
    return;
  }
  for (let i = 0; i < GEAR_N; i++) {
    if (m.gearOn[i]) continue;
    m.gearOn[i] = 1;
    m.gearX[i] = w.arena.camX + 28 + nextFloat(m.rng) * (W - 56);
    m.gearY[i] = w.arena.camY + 16;
    m.gearVy[i] = 2.5 + nextFloat(m.rng) * 1.3;
    m.spawnCd = 8;
    return;
  }
}

export function stepMapEvents(w: World): void {
  const m = mapState(w);
  if (m.banner > 0) m.banner--;
  tickGears(w, m);
  tickCrate(w, m);
  if (m.phase === MAP_WARN) {
    m.life--;
    if (m.life <= 0) beginLive(m);
    return;
  }
  if (m.phase === MAP_LIVE) {
    if (m.kind === MAP_GEAR) spawnGear(w, m);
    m.life--;
    if (m.life <= 0) finish(w, m);
    return;
  }
  if (lichUp(w)) return;
  if (gearsAlive(m)) return;
  if (w.tick < m.nextAt) return;
  startWarn(w, m);
}
