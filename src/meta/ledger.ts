import { BONUS_DMG, BONUS_GUN, BONUS_HP, META_DMG, META_GUN, META_HP, META_MAX } from "./workshop";
import { maxHpOf } from "../sim/progress";
import {
  UPG_WPN_FLAME, UPG_WPN_HARP, UPG_WPN_MORT, UPG_WPN_SHOT, type World,
} from "../sim/types";

export const LEDGER_KEY = "arcadia.ledger";
export const LEDGER_VERSION = 1;

export const KIND_LOADOUT = 0;
export const KIND_YARD = 1;
export const KIND_MARK = 2;

export const LOADOUT_N = 5;
export const YARD_N = 4;
export const MARK_N = 3;

export const LOADOUT_RIVET = 0;
export const LOADOUT_SCATTER = 1;
export const LOADOUT_JET = 2;
export const LOADOUT_LINE = 3;
export const LOADOUT_SHELL = 4;

export const YARD_FOUNDRY = 0;
export const YARD_BRASS = 1;
export const YARD_LAMP = 2;
export const YARD_BOILER = 3;

export const MARK_GOGGLES = 0;
export const MARK_COAT = 1;
export const MARK_MASK = 2;

export const SCATTER_WAVE = 4;
export const JET_WAVE = 8;
export const LINE_TICKS = 6 * 60 * 60;
export const SHELL_KILLS = 400;
export const BRASS_WAVE = 6;
export const LAMP_TICKS = 8 * 60 * 60;
export const BOILER_KILLS = 250;
export const GOGGLES_RUNS = 3;
export const COAT_SCORE = 1000;

const SHIFT = 8;
const CAP = 1_000_000_000;

export interface Ledger {
  v: number;
  owned: number;
  loadout: number;
  yard: number;
}

export interface LedgerFacts {
  bestWave: number;
  bestTicks: number;
  lifeKills: number;
  runs: number;
  score: number;
  forged: boolean;
  gate: boolean;
}

export interface LedgerLine {
  kind: number;
  index: number;
  name: string;
  detail: string;
  owned: boolean;
  on: boolean;
  need: string;
}

export interface LedgerStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface LedgerFile {
  ledger: Ledger;
  writable: boolean;
}

interface Row {
  kind: number;
  index: number;
  name: string;
  detail: string;
  need: string;
  weapon: number;
  hp: number;
  dmg: number;
  gun: number;
  earn: (facts: LedgerFacts) => boolean;
}

const ROWS: readonly Row[] = [
  {
    kind: KIND_LOADOUT, index: LOADOUT_RIVET, name: "RIVET RIFLE", detail: "The stock rifle.", need: "",
    weapon: -1, hp: 0, dmg: 0, gun: 0, earn: () => true,
  },
  {
    kind: KIND_LOADOUT, index: LOADOUT_SCATTER, name: "SCATTER RIG", detail: "Start with the close cone.", need: "WAVE 4",
    weapon: UPG_WPN_SHOT, hp: 0, dmg: 0, gun: 0, earn: (f) => f.bestWave >= SCATTER_WAVE,
  },
  {
    kind: KIND_LOADOUT, index: LOADOUT_JET, name: "BOILER JET", detail: "Start with the boiler jet.", need: "WAVE 8",
    weapon: UPG_WPN_FLAME, hp: 0, dmg: 0, gun: 0, earn: (f) => f.bestWave >= JET_WAVE,
  },
  {
    kind: KIND_LOADOUT, index: LOADOUT_LINE, name: "HARPOON LINE", detail: "Start with the piercing line.", need: "6:00",
    weapon: UPG_WPN_HARP, hp: 0, dmg: 0, gun: 0, earn: (f) => f.bestTicks >= LINE_TICKS,
  },
  {
    kind: KIND_LOADOUT, index: LOADOUT_SHELL, name: "MORTAR CROWN", detail: "Start with the area blast.", need: "400 KILLS",
    weapon: UPG_WPN_MORT, hp: 0, dmg: 0, gun: 0, earn: (f) => f.lifeKills >= SHELL_KILLS,
  },
  {
    kind: KIND_YARD, index: YARD_FOUNDRY, name: "FOUNDRY YARD", detail: "The home yard.", need: "",
    weapon: -1, hp: 0, dmg: 0, gun: 0, earn: () => true,
  },
  {
    kind: KIND_YARD, index: YARD_BRASS, name: "BRASS DISTRICT", detail: "Plate +1, capped by the bench.", need: "WAVE 6",
    weapon: -1, hp: 1, dmg: 0, gun: 0, earn: (f) => f.bestWave >= BRASS_WAVE || f.gate,
  },
  {
    kind: KIND_YARD, index: YARD_LAMP, name: "LAMP WALK", detail: "Gun start +1, capped by the bench.", need: "8:00",
    weapon: -1, hp: 0, dmg: 0, gun: 1, earn: (f) => f.bestTicks >= LAMP_TICKS,
  },
  {
    kind: KIND_YARD, index: YARD_BOILER, name: "BOILER ROW", detail: "Damage +1, capped by the bench.", need: "250 KILLS",
    weapon: -1, hp: 0, dmg: 1, gun: 0, earn: (f) => f.lifeKills >= BOILER_KILLS,
  },
  {
    kind: KIND_MARK, index: MARK_GOGGLES, name: "AMBER GOGGLES", detail: "Kept mark. The yard does not change.", need: "3 RUNS",
    weapon: -1, hp: 0, dmg: 0, gun: 0, earn: (f) => f.runs >= GOGGLES_RUNS,
  },
  {
    kind: KIND_MARK, index: MARK_COAT, name: "SOOT COAT", detail: "Kept mark. The yard does not change.", need: "SCORE 1000",
    weapon: -1, hp: 0, dmg: 0, gun: 0, earn: (f) => f.score >= COAT_SCORE,
  },
  {
    kind: KIND_MARK, index: MARK_MASK, name: "BRASS MASK", detail: "Kept mark. The yard does not change.", need: "FORGE A UNION",
    weapon: -1, hp: 0, dmg: 0, gun: 0, earn: (f) => f.forged,
  },
];

function flag(kind: number, index: number): number {
  return 1 << (kind * SHIFT + index);
}

const ALWAYS = flag(KIND_LOADOUT, LOADOUT_RIVET) | flag(KIND_YARD, YARD_FOUNDRY);

function knownMask(): number {
  let mask = 0;
  for (let i = 0; i < ROWS.length; i++) {
    const row = ROWS[i];
    if (!row) continue;
    mask |= flag(row.kind, row.index);
  }
  return mask;
}

const KNOWN = knownMask();

function pos(n: number): number {
  if (typeof n !== "number" || !Number.isFinite(n) || n <= 0) return 0;
  return Math.min(CAP, Math.floor(n));
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function owns(owned: number, kind: number, index: number): boolean {
  return (owned & flag(kind, index)) !== 0;
}

function rowAt(kind: number, index: number): Row | null {
  for (let i = 0; i < ROWS.length; i++) {
    const row = ROWS[i];
    if (row && row.kind === kind && row.index === index) return row;
  }
  return null;
}

export function emptyFacts(): LedgerFacts {
  return { bestWave: 0, bestTicks: 0, lifeKills: 0, runs: 0, score: 0, forged: false, gate: false };
}

export function readFacts(raw: LedgerFacts): LedgerFacts {
  return {
    bestWave: pos(raw.bestWave),
    bestTicks: pos(raw.bestTicks),
    lifeKills: pos(raw.lifeKills),
    runs: pos(raw.runs),
    score: pos(raw.score),
    forged: raw.forged === true,
    gate: raw.gate === true,
  };
}

export function emptyLedger(): Ledger {
  return { v: LEDGER_VERSION, owned: ALWAYS, loadout: LOADOUT_RIVET, yard: YARD_FOUNDRY };
}

function clampOwned(n: unknown): number {
  if (typeof n !== "number" || !Number.isFinite(n)) return ALWAYS;
  const bits = Math.floor(n);
  if (bits <= 0) return ALWAYS;
  return (bits & KNOWN) | ALWAYS;
}

function clampPick(n: unknown, kind: number, owned: number, max: number): number {
  if (typeof n !== "number" || !Number.isFinite(n)) return 0;
  const index = Math.floor(n);
  if (index <= 0 || index >= max) return 0;
  return owns(owned, kind, index) ? index : 0;
}

export function grantLedger(ledger: Ledger, raw: LedgerFacts): string[] {
  const facts = readFacts(raw);
  const fresh: string[] = [];
  for (let i = 0; i < ROWS.length; i++) {
    const row = ROWS[i];
    if (!row) continue;
    const bit = flag(row.kind, row.index);
    if ((ledger.owned & bit) !== 0) continue;
    if (!row.earn(facts)) continue;
    ledger.owned |= bit;
    fresh.push(row.name);
  }
  return fresh;
}

export function chooseLoadout(ledger: Ledger, index: number): boolean {
  if (index < 0 || index >= LOADOUT_N) return false;
  if (!owns(ledger.owned, KIND_LOADOUT, index)) return false;
  ledger.loadout = index;
  return true;
}

export function chooseYard(ledger: Ledger, index: number): boolean {
  if (index < 0 || index >= YARD_N) return false;
  if (!owns(ledger.owned, KIND_YARD, index)) return false;
  ledger.yard = index;
  return true;
}

function cap(id: number, step: number): number {
  return (META_MAX[id] ?? 0) * step;
}

export function applyLedger(w: World, ledger: Ledger): void {
  const load = rowAt(KIND_LOADOUT, ledger.loadout);
  if (load && load.weapon >= 0 && owns(ledger.owned, KIND_LOADOUT, ledger.loadout)) {
    const cur = w.upgrades[load.weapon] ?? 0;
    if (cur < 1) w.upgrades[load.weapon] = 1;
  }
  const yard = rowAt(KIND_YARD, ledger.yard);
  if (yard && owns(ledger.owned, KIND_YARD, ledger.yard)) {
    w.meta.hp = Math.min(cap(META_HP, BONUS_HP), w.meta.hp + yard.hp);
    w.meta.dmg = Math.min(cap(META_DMG, BONUS_DMG), w.meta.dmg + yard.dmg);
    w.meta.gun = Math.min(cap(META_GUN, BONUS_GUN), w.meta.gun + yard.gun);
  }
  w.maxHp = maxHpOf(w);
  w.hp = w.maxHp;
}

export function ledgerLines(ledger: Ledger): LedgerLine[] {
  const out: LedgerLine[] = [];
  for (let i = 0; i < ROWS.length; i++) {
    const row = ROWS[i];
    if (!row) continue;
    const owned = owns(ledger.owned, row.kind, row.index);
    const on = owned && (
      (row.kind === KIND_LOADOUT && ledger.loadout === row.index)
      || (row.kind === KIND_YARD && ledger.yard === row.index)
    );
    out.push({
      kind: row.kind,
      index: row.index,
      name: row.name,
      detail: row.detail,
      owned,
      on,
      need: row.need,
    });
  }
  return out;
}

export function ledgerAction(line: LedgerLine): string {
  if (line.kind === KIND_MARK) return line.owned ? "KEPT" : "LOCKED";
  if (!line.owned) return line.need;
  return line.on ? "USING" : "USE";
}

export function serializeLedger(ledger: Ledger): string {
  return JSON.stringify({
    "v": LEDGER_VERSION,
    "owned": ledger.owned | 0,
    "loadout": ledger.loadout | 0,
    "yard": ledger.yard | 0,
  });
}

export function loadLedger(store: LedgerStore): LedgerFile {
  try {
    const raw = store.getItem(LEDGER_KEY);
    if (!raw) return { ledger: emptyLedger(), writable: true };
    let data: unknown;
    try { data = JSON.parse(raw); } catch { return { ledger: emptyLedger(), writable: true }; }
    if (!isRecord(data)) return { ledger: emptyLedger(), writable: true };
    const version = data["v"];
    if (typeof version === "number" && version > LEDGER_VERSION) return { ledger: emptyLedger(), writable: false };
    if (version !== LEDGER_VERSION) return { ledger: emptyLedger(), writable: true };
    const owned = clampOwned(data["owned"]);
    return {
      ledger: {
        v: LEDGER_VERSION,
        owned,
        loadout: clampPick(data["loadout"], KIND_LOADOUT, owned, LOADOUT_N),
        yard: clampPick(data["yard"], KIND_YARD, owned, YARD_N),
      },
      writable: true,
    };
  } catch {
    return { ledger: emptyLedger(), writable: false };
  }
}

export function saveLedger(store: LedgerStore, ledger: Ledger, writable: boolean): void {
  if (!writable) return;
  try {
    store.setItem(LEDGER_KEY, serializeLedger(ledger));
  } catch {
    return;
  }
}
