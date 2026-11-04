import { MAX_ZOMBIES, Z_BRUTE, Z_GHOUL, Z_SHAMBLER, type World } from "./types";
import { Z_ELITE, Z_KIND, Z_KNIGHT, Z_SPITTER } from "./foes";

export const WARN_CAP = 24;
export const WARN_BOSS = 1;
export const WARN_ELITE = 2;
export const WARN_ELITE_TICKS = 28;
export const WARN_SEE_R2 = 96 * 96;

export interface WarnBag {
  on: Uint8Array;
  kind: Uint8Array;
  x: Float32Array;
  y: Float32Array;
  rx: Float32Array;
  ry: Float32Array;
  ang: Float32Array;
  t: Int16Array;
  chargeT: Int16Array;
  cursor: number;
}

const bags = new WeakMap<World, WarnBag>();

function create(): WarnBag {
  return {
    on: new Uint8Array(WARN_CAP),
    kind: new Uint8Array(WARN_CAP),
    x: new Float32Array(WARN_CAP),
    y: new Float32Array(WARN_CAP),
    rx: new Float32Array(WARN_CAP),
    ry: new Float32Array(WARN_CAP),
    ang: new Float32Array(WARN_CAP),
    t: new Int16Array(WARN_CAP),
    chargeT: new Int16Array(MAX_ZOMBIES),
    cursor: 0,
  };
}

export function attachWarn(w: World): WarnBag {
  const found = bags.get(w);
  if (found) return found;
  const made = create();
  bags.set(w, made);
  return made;
}

export function warnState(w: World): WarnBag {
  return attachWarn(w);
}

export function plantWarn(
  w: World,
  kind: number,
  x: number,
  y: number,
  rx: number,
  ry: number,
  ang: number,
  life: number,
): number {
  const a = attachWarn(w);
  let slot = -1;
  for (let i = 0; i < WARN_CAP; i++) {
    if (!a.on[i]) { slot = i; break; }
  }
  if (slot < 0) {
    slot = a.cursor;
    a.cursor = slot + 1 < WARN_CAP ? slot + 1 : 0;
  }
  a.on[slot] = 1;
  a.kind[slot] = kind;
  a.x[slot] = x;
  a.y[slot] = y;
  a.rx[slot] = rx;
  a.ry[slot] = ry;
  a.ang[slot] = ang;
  a.t[slot] = life > 0 ? life : 1;
  return slot;
}

export function warnLive(w: World): number {
  const a = attachWarn(w);
  let n = 0;
  for (let i = 0; i < WARN_CAP; i++) if (a.on[i]) n++;
  return n;
}

export function warnBeforeHit(w: World): boolean {
  return warnLive(w) > 0;
}

export function stepWarn(w: World): void {
  const a = attachWarn(w);
  for (let i = 0; i < WARN_CAP; i++) {
    if (!a.on[i]) continue;
    const next = (a.t[i] ?? 1) - 1;
    if (next <= 0) {
      a.on[i] = 0;
      a.t[i] = 0;
    } else a.t[i] = next;
  }
}

export function plantBossWarn(w: World, life: number): void {
  const b = w.boss;
  if (!b.on) return;
  const ticks = life > 0 ? life : 1;
  if (b.phase === 0) {
    const x = b.x + b.aimX * 70;
    const y = b.y + b.aimY * 70;
    plantWarn(w, WARN_BOSS, x, y, 78, 16, Math.atan2(b.aimY, b.aimX || 1), ticks);
    return;
  }
  plantWarn(w, WARN_BOSS, b.x, b.y, 64, 28, 0, ticks);
}

function canCharge(raw: number): boolean {
  if ((raw & Z_ELITE) === 0) return false;
  const kind = raw & Z_KIND;
  if (kind === Z_SPITTER || kind === Z_KNIGHT) return false;
  return kind === Z_SHAMBLER || kind === Z_GHOUL || kind === Z_BRUTE;
}

export function tickEliteCharge(w: World, i: number): number {
  const a = attachWarn(w);
  const z = w.zombies;
  const raw = z.kind[i] ?? 0;
  if (!canCharge(raw)) return 0;
  const t = a.chargeT[i] ?? 0;
  const dx = w.px - (z.x[i] ?? 0);
  const dy = w.py - (z.y[i] ?? 0);
  const d2 = dx * dx + dy * dy;
  if (t > 0) {
    a.chargeT[i] = t - 1;
    return 0;
  }
  if (d2 > WARN_SEE_R2) return 0;
  a.chargeT[i] = WARN_ELITE_TICKS;
  plantWarn(w, WARN_ELITE, w.px, w.py, 22, 12, Math.atan2(dy, dx), WARN_ELITE_TICKS);
  return 0;
}
