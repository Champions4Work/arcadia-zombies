import { tierName } from "../sim/difficulty";

export const LEADERBOARD_KEY = "arcadia.leaderboard";
export const BOARD_LIMIT = 10;
export const TICKS_PER_SEC = 60;
const CAP = 1_000_000_000;
const CODES: readonly string[] = [
  "TESLA", "SHOT", "SAWS", "FIRE", "DMG", "HP", "SPEED", "VENT", "PIERCE", "SHIELD",
  "SPIKES", "COOLANT", "MORTAR", "WHISTLE", "RICOCHET", "DYNAMO", "STORM", "CANNON", "AEGIS",
];

export interface Store {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface RunRecord {
  score: number;
  time: number;
  tier: number;
  kills: number;
  build: string;
}

export interface Life {
  kills: number;
  bestTime: number;
  runs: number;
}

export interface SavedRecords {
  board: RunRecord[];
  life: Life;
  unlocked: string[];
}

export interface RunInput {
  score: number;
  time: number;
  tier: number;
  kills: number;
  upgrades: ArrayLike<number>;
}

export interface KillTracker {
  kills: number;
}

export interface RowView {
  title: string;
  detail: string;
  share: string;
}

export interface AchView {
  on: boolean;
  line: string;
}

export interface BoardView {
  life: string;
  rows: RowView[];
  achievements: AchView[];
  empty: boolean;
}

export interface Settled {
  toasts: string[];
  line: string;
  share: string;
}

interface Achievement {
  id: string;
  name: string;
  detail: string;
  test: (run: RunRecord, life: Life) => boolean;
}

export const ACHIEVEMENTS: readonly Achievement[] = [
  { id: "first-blood", name: "First Blood", detail: "Kill a zombie", test: (run) => run.kills >= 1 },
  { id: "dozen", name: "Dozen Down", detail: "12 kills in a run", test: (run) => run.kills >= 12 },
  { id: "butcher", name: "The Butcher", detail: "50 kills in a run", test: (run) => run.kills >= 50 },
  { id: "third-gear", name: "Third Gear", detail: "Reach Boiling", test: (run) => run.tier >= 3 },
  { id: "boiler", name: "Boiler Room", detail: "Reach Meltdown", test: (run) => run.tier >= 5 },
  { id: "purse", name: "Brass Purse", detail: "Score 1000", test: (run) => run.score >= 1000 },
  { id: "minute", name: "Sixty Seconds", detail: "Survive one minute", test: (run) => run.time >= TICKS_PER_SEC * 60 },
  { id: "clocked", name: "Clocked In", detail: "Play 5 runs", test: (_run, life) => life.runs >= 5 },
  { id: "century", name: "Century", detail: "100 lifetime kills", test: (_run, life) => life.kills >= 100 },
  { id: "tinkerer", name: "Tinkerer", detail: "8 upgrade ranks", test: (run) => rankSum(run.build) >= 8 },
];

export function emptyLeaderboard(): SavedRecords {
  return { board: [], life: { kills: 0, bestTime: 0, runs: 0 }, unlocked: [] };
}

export function createTracker(): KillTracker {
  return { kills: 0 };
}

export function resetTracker(tracker: KillTracker): void {
  tracker.kills = 0;
}

export function noteKills(tracker: KillTracker, n: number): void {
  const add = clampInt(n, 255);
  if (add <= 0) return;
  tracker.kills = clampInt(tracker.kills + add);
}

export function buildLabel(levels: ArrayLike<number>): string {
  let out = "";
  const n = Math.min(levels.length, CODES.length);
  for (let i = 0; i < n; i++) {
    const code = CODES[i];
    const lv = clampInt(levels[i] ?? 0, 9);
    if (!code || lv <= 0) continue;
    const part = `${code}${lv}`;
    out = out ? `${out} ${part}` : part;
  }
  return out || "STOCK";
}

export function captureRun(input: RunInput): RunRecord {
  return sanitize({
    score: input.score,
    time: input.time,
    tier: input.tier,
    kills: input.kills,
    build: buildLabel(input.upgrades),
  });
}

export function formatTime(ticks: number): string {
  const sec = (clampInt(ticks) / TICKS_PER_SEC) | 0;
  const m = (sec / 60) | 0;
  const s = sec % 60;
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

export function runLine(run: RunRecord): string {
  const row = sanitize(run);
  return `${formatTime(row.time)} · ${tierName(row.tier)} · ${row.kills} kills · ${row.build}`;
}

export function shareText(run: RunRecord): string {
  const row = sanitize(run);
  return `Arcadia: Gears of the Dead — Score ${row.score} · ${formatTime(row.time)} · ${tierName(row.tier)} · ${row.kills} kills · ${row.build}`;
}

export function toastText(name: string): string {
  return `Unlocked: ${name}`;
}

export function achievementName(id: string): string {
  for (const a of ACHIEVEMENTS) if (a.id === id) return a.name;
  return "";
}

export function rankSum(build: string): number {
  if (build === "STOCK") return 0;
  let n = 0;
  for (const part of build.split(" ")) {
    const lv = part.charCodeAt(part.length - 1) - 48;
    if (lv > 0 && lv <= 9) n += lv;
  }
  return n;
}

export function commitRun(saved: SavedRecords, run: RunRecord): string[] {
  const row = sanitize(run);
  saved.life.runs = clampInt(saved.life.runs + 1);
  saved.life.kills = clampInt(saved.life.kills + row.kills);
  if (row.time > saved.life.bestTime) saved.life.bestTime = row.time;
  saved.board.push(row);
  saved.board.sort(compareRuns);
  if (saved.board.length > BOARD_LIMIT) saved.board.length = BOARD_LIMIT;
  const fresh: string[] = [];
  for (const a of ACHIEVEMENTS) {
    if (saved.unlocked.indexOf(a.id) >= 0) continue;
    if (!a.test(row, saved.life)) continue;
    saved.unlocked.push(a.id);
    fresh.push(a.id);
  }
  return fresh;
}

export function settleRun(saved: SavedRecords, run: RunRecord): Settled {
  const fresh = commitRun(saved, run);
  const toasts: string[] = [];
  for (const id of fresh) {
    const name = achievementName(id);
    if (name) toasts.push(toastText(name));
  }
  const row = sanitize(run);
  return { toasts, line: runLine(row), share: shareText(row) };
}

export function presentBoard(saved: SavedRecords): BoardView {
  const rows: RowView[] = [];
  for (let i = 0; i < saved.board.length; i++) {
    const run = saved.board[i];
    if (!run) continue;
    rows.push({
      title: `#${i + 1}  Score ${run.score}`,
      detail: runLine(run),
      share: shareText(run),
    });
  }
  const achievements: AchView[] = [];
  for (const a of ACHIEVEMENTS) {
    const on = saved.unlocked.indexOf(a.id) >= 0;
    achievements.push({ on, line: `${on ? "[x]" : "[ ]"} ${a.name} — ${a.detail}` });
  }
  const best = saved.life.runs > 0 ? formatTime(saved.life.bestTime) : "—";
  return {
    life: `Kills ${saved.life.kills} · Best time ${best} · Runs ${saved.life.runs}`,
    rows,
    achievements,
    empty: rows.length === 0,
  };
}

export function loadLeaderboard(store: Store): SavedRecords {
  try {
    const raw = store.getItem(LEADERBOARD_KEY);
    if (!raw) return emptyLeaderboard();
    return decode(JSON.parse(raw));
  } catch {
    return emptyLeaderboard();
  }
}

export function saveLeaderboard(store: Store, saved: SavedRecords): void {
  try {
    store.setItem(LEADERBOARD_KEY, JSON.stringify({
      v: 1,
      board: saved.board.map((r) => ({ score: r.score, time: r.time, tier: r.tier, kills: r.kills, build: r.build })),
      life: { kills: saved.life.kills, bestTime: saved.life.bestTime, runs: saved.life.runs },
      unlocked: saved.unlocked.slice(),
    }));
  } catch {
    return;
  }
}

function compareRuns(a: RunRecord, b: RunRecord): number {
  if (b.score !== a.score) return b.score - a.score;
  if (b.time !== a.time) return b.time - a.time;
  if (b.kills !== a.kills) return b.kills - a.kills;
  return b.tier - a.tier;
}

function sanitize(run: RunRecord): RunRecord {
  return {
    score: clampInt(run.score),
    time: clampInt(run.time),
    tier: clampInt(run.tier, 9999),
    kills: clampInt(run.kills),
    build: cleanBuild(run.build),
  };
}

function cleanBuild(build: string): string {
  if (build === "STOCK") return "STOCK";
  const parts = build.split(" ");
  const seen: number[] = [];
  for (const part of parts) {
    if (part.length < 2) return "STOCK";
    const code = part.slice(0, -1);
    const lv = part.charCodeAt(part.length - 1) - 48;
    const idx = CODES.indexOf(code);
    if (idx < 0 || lv < 1 || lv > 9 || seen.indexOf(idx) >= 0) return "STOCK";
    seen.push(idx);
  }
  return parts.length ? build : "STOCK";
}

function clampInt(v: unknown, max = CAP): number {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  if (!Number.isFinite(n)) return 0;
  const t = Math.trunc(n);
  if (t < 0) return 0;
  if (t > max) return max;
  return t;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function decode(v: unknown): SavedRecords {
  const saved = emptyLeaderboard();
  if (!isRecord(v)) return saved;
  if (Array.isArray(v.board)) {
    let seen = 0;
    for (const item of v.board) {
      if (seen++ > 30) break;
      if (!isRecord(item)) continue;
      if (typeof item.score !== "number" && typeof item.score !== "string") continue;
      saved.board.push(sanitize({
        score: item.score as number,
        time: item.time as number,
        tier: item.tier as number,
        kills: item.kills as number,
        build: typeof item.build === "string" ? item.build : "",
      }));
    }
    saved.board.sort(compareRuns);
    if (saved.board.length > BOARD_LIMIT) saved.board.length = BOARD_LIMIT;
  }
  if (isRecord(v.life)) {
    saved.life.kills = clampInt(v.life.kills);
    saved.life.bestTime = clampInt(v.life.bestTime);
    saved.life.runs = clampInt(v.life.runs);
  }
  if (Array.isArray(v.unlocked)) {
    for (const id of v.unlocked) {
      if (typeof id !== "string" || !achievementName(id)) continue;
      if (saved.unlocked.indexOf(id) >= 0) continue;
      saved.unlocked.push(id);
    }
  }
  return saved;
}
