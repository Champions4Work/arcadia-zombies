import { characterAt } from "../sim/characters";
import { clock, tierName } from "../sim/difficulty";
import { Z_ELITE } from "../sim/foes";
import { upgName } from "../sim/progress";
import { MAX_ZOMBIES, UPG_COUNT, UPG_WPN_FLAME, UPG_WPN_HARP, UPG_WPN_MORT, UPG_WPN_RIVET, UPG_WPN_SHOT, type World } from "../sim/types";
import { modNames } from "../sim/modifiers";

export const RUN_LOG_V = 1;
export const SAMPLE_TICK = 3600;
export const FPS_CAP = 8;
export const DEBUG_KEY = "arcadia.debug";
export const RUNS_PATH = "/api/runs";

const WPN_IDS = [UPG_WPN_RIVET, UPG_WPN_SHOT, UPG_WPN_FLAME, UPG_WPN_HARP, UPG_WPN_MORT] as const;
const ALL_IDS: number[] = Array.from({ length: UPG_COUNT }, (_, i) => i);

export interface GearRow {
  name: string;
  lv: number;
}

export interface RunSample {
  t: number;
  level: number;
  hp: number;
  maxHp: number;
  hurt: number;
  dps: number;
  kills: number;
  alive: number;
  elites: number;
  weapons: GearRow[];
  upgrades: GearRow[];
  character: string;
  modifier: string;
  death: string;
  viewW: number;
  viewH: number;
  fps: number[];
}

export interface RunLog {
  v: number;
  samples: RunSample[];
}

export interface ViewSize {
  w: number;
  h: number;
}

export function emptyLog(): RunLog {
  return { v: RUN_LOG_V, samples: [] };
}

export function gearRows(levels: ArrayLike<number>, ids: ArrayLike<number>): GearRow[] {
  const rows: GearRow[] = [];
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i] ?? -1;
    const lv = levels[id] ?? 0;
    if (lv <= 0) continue;
    const name = upgName(id);
    if (!name) continue;
    rows.push({ name, lv });
  }
  return rows;
}

export function countAlive(w: World): { alive: number; elites: number } {
  const z = w.zombies;
  let alive = 0;
  let elites = 0;
  for (let i = 0; i < MAX_ZOMBIES; i++) {
    if (!z.alive[i]) continue;
    alive++;
    if (((z.kind[i] ?? 0) & Z_ELITE) !== 0) elites++;
  }
  return { alive, elites };
}

export function sampleRun(
  w: World,
  view: ViewSize,
  fps: number[],
  death = "",
): RunSample {
  const field = countAlive(w);
  const sec = w.tick / 60;
  const dps = sec > 0 ? Math.round((w.dealt / sec) * 10) / 10 : 0;
  return {
    t: Math.floor(sec),
    level: w.level,
    hp: w.hp,
    maxHp: w.maxHp,
    hurt: w.hurt,
    dps,
    kills: w.kills,
    alive: field.alive,
    elites: field.elites,
    weapons: gearRows(w.upgrades, WPN_IDS),
    upgrades: gearRows(w.upgrades, ALL_IDS),
    character: characterAt(w.charId).id,
    modifier: modNames(w.mods) || "none",
    death,
    viewW: Math.max(0, view.w | 0),
    viewH: Math.max(0, view.h | 0),
    fps: clipFps(fps),
  };
}

export function shouldSample(tick: number, lastTick: number): boolean {
  if (tick < SAMPLE_TICK) return false;
  return Math.floor(tick / SAMPLE_TICK) > Math.floor(lastTick / SAMPLE_TICK);
}

export function pushSample(log: RunLog, sample: RunSample): void {
  if (!isSample(sample)) return;
  log.v = RUN_LOG_V;
  log.samples.push(sample);
}

export function formatRunLog(log: RunLog): string {
  const rows = [headerLine()];
  for (const s of log.samples) {
    rows.push([
      clock(s.t * 60),
      `LV${s.level}`,
      `HP${s.hp}/${s.maxHp}`,
      `HURT${s.hurt}`,
      `DPS${s.dps}`,
      `K${s.kills}`,
      `A${s.alive}`,
      `E${s.elites}`,
      s.weapons.map((g) => `${g.name}${g.lv}`).join("+") || "STOCK",
      s.upgrades.map((g) => `${g.name}${g.lv}`).join("+") || "-",
      s.character,
      s.modifier,
      s.death || "-",
      `${s.viewW}x${s.viewH}`,
      s.fps.join("/") || "-",
    ].join("\t"));
  }
  return rows.join("\n");
}

export function isRunLog(v: unknown): v is RunLog {
  if (!isRecord(v)) return false;
  if ((v["v"] as number) !== RUN_LOG_V) return false;
  const samples = v["samples"];
  if (!Array.isArray(samples)) return false;
  if (samples.length > 48) return false;
  for (const row of samples) {
    if (!isSample(row)) return false;
  }
  return true;
}

export function parseRunLog(v: unknown): RunLog | null {
  if (!isRunLog(v)) return null;
  return { v: RUN_LOG_V, samples: v.samples.map(cleanSample) };
}

export function loadDebug(store: { getItem(key: string): string | null }): boolean {
  return store.getItem(DEBUG_KEY) === "1";
}

export function saveDebug(store: { setItem(key: string, value: string): void }, on: boolean): void {
  store.setItem(DEBUG_KEY, on ? "1" : "0");
}

export function deathCause(w: World, won: boolean, lich: boolean): string {
  if (won) return "victory";
  if (lich) return "lich";
  return `overrun:${tierName(w.rank)}`;
}

function clipFps(fps: number[]): number[] {
  const out: number[] = [];
  const n = fps.length < FPS_CAP ? fps.length : FPS_CAP;
  const start = fps.length - n;
  for (let i = 0; i < n; i++) {
    const v = fps[start + i] ?? 0;
    if (!Number.isFinite(v)) continue;
    out.push(Math.max(0, Math.min(240, Math.round(v))));
  }
  return out;
}

function headerLine(): string {
  return ["t", "level", "hp", "hurt", "dps", "kills", "alive", "elites", "weapons", "upgrades", "character", "modifier", "death", "view", "fps"].join("\t");
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isSample(v: unknown): v is RunSample {
  if (!isRecord(v)) return false;
  if (!intField(v, "t") || !intField(v, "level") || !intField(v, "hp") || !intField(v, "maxHp")) return false;
  if (!intField(v, "hurt") || !numField(v, "dps") || !intField(v, "kills")) return false;
  if (!intField(v, "alive") || !intField(v, "elites")) return false;
  if (!intField(v, "viewW") || !intField(v, "viewH")) return false;
  if (typeof v["character"] !== "string" || typeof v["modifier"] !== "string" || typeof v["death"] !== "string") return false;
  if (v["character"].length > 24 || v["modifier"].length > 80 || v["death"].length > 48) return false;
  if (!Array.isArray(v["weapons"]) || !Array.isArray(v["upgrades"]) || !Array.isArray(v["fps"])) return false;
  if (v["weapons"].length > 8 || v["upgrades"].length > 32 || v["fps"].length > FPS_CAP) return false;
  return true;
}

function intField(v: Record<string, unknown>, key: string): boolean {
  const n = v[key];
  return typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= 1_000_000_000;
}

function numField(v: Record<string, unknown>, key: string): boolean {
  const n = v[key];
  return typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= 1_000_000;
}

function cleanSample(s: RunSample): RunSample {
  return {
    t: s.t | 0,
    level: s.level | 0,
    hp: s.hp | 0,
    maxHp: s.maxHp | 0,
    hurt: s.hurt | 0,
    dps: s.dps,
    kills: s.kills | 0,
    alive: s.alive | 0,
    elites: s.elites | 0,
    weapons: s.weapons.map((g) => ({ name: String(g.name).slice(0, 24), lv: g.lv | 0 })),
    upgrades: s.upgrades.map((g) => ({ name: String(g.name).slice(0, 24), lv: g.lv | 0 })),
    character: s.character.slice(0, 24),
    modifier: s.modifier.slice(0, 80),
    death: s.death.slice(0, 48),
    viewW: s.viewW | 0,
    viewH: s.viewH | 0,
    fps: clipFps(s.fps),
  };
}
