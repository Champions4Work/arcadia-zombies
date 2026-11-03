import { isUnion } from "../sim/evolve";
import { EVOL_AEGIS, EVOL_CANNON, EVOL_STORM } from "../sim/types";

export const QUEST_KEY = "arcadia.quests";
export const QUEST_HEADING = "Daily quests";
export const QUEST_KILLS = "kills";
export const QUEST_SECONDS = "seconds";
export const QUEST_UNION = "union";
export const QUEST_LEVEL = "level";
export const QUEST_SCORE = "score";

export type QuestKind =
  | typeof QUEST_KILLS
  | typeof QUEST_SECONDS
  | typeof QUEST_UNION
  | typeof QUEST_LEVEL
  | typeof QUEST_SCORE;

export interface Quest {
  id: string;
  label: string;
  goal: number;
  kind: QuestKind;
}

export const KILL_QUESTS: readonly Quest[] = [
  { id: "kills-100", label: "Kill 100 zombies", goal: 100, kind: QUEST_KILLS },
  { id: "kills-300", label: "Kill 300 zombies", goal: 300, kind: QUEST_KILLS },
  { id: "kills-500", label: "Kill 500 zombies", goal: 500, kind: QUEST_KILLS },
];

export const SURVIVE_QUESTS: readonly Quest[] = [
  { id: "survive-3", label: "Survive 3 minutes", goal: 180, kind: QUEST_SECONDS },
  { id: "survive-8", label: "Survive 8 minutes", goal: 480, kind: QUEST_SECONDS },
  { id: "survive-12", label: "Survive 12 minutes", goal: 720, kind: QUEST_SECONDS },
];

export const FORGE_QUESTS: readonly Quest[] = [
  { id: "forge-union", label: "Forge a union", goal: 1, kind: QUEST_UNION },
  { id: "reach-6", label: "Reach level 6", goal: 6, kind: QUEST_LEVEL },
  { id: "score-2500", label: "Score 2500", goal: 2500, kind: QUEST_SCORE },
];

const CAP = 1_000_000_000;

export interface QuestState {
  day: string;
  quests: readonly [Quest, Quest, Quest];
  kills: number;
  bestSeconds: number;
  unions: number;
  bestScore: number;
  bestLevel: number;
  open: boolean;
}

export interface RunSnapshot {
  kills: number;
  seconds: number;
  union: boolean;
  score: number;
  level: number;
}

export interface QuestStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function mix(day: string): number {
  let h = 2166136261;
  for (let i = 0; i < day.length; i++) {
    h ^= day.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function at(list: readonly Quest[], index: number): Quest {
  const q = list[index % list.length];
  if (q) return q;
  return KILL_QUESTS[0] ?? { id: "kills-300", label: "Kill 300 zombies", goal: 300, kind: QUEST_KILLS };
}

export function questsForDay(day: string): readonly [Quest, Quest, Quest] {
  const h = mix(day);
  return [
    at(KILL_QUESTS, h),
    at(SURVIVE_QUESTS, h >>> 8),
    at(FORGE_QUESTS, h >>> 16),
  ];
}

export function freshQuests(day: string): QuestState {
  return {
    day,
    quests: questsForDay(day),
    kills: 0,
    bestSeconds: 0,
    unions: 0,
    bestScore: 0,
    bestLevel: 0,
    open: false,
  };
}

export function dayKey(date: Date): string {
  if (!Number.isFinite(date.getTime())) return "1970-01-01";
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return `${y}-${m < 10 ? "0" : ""}${m}-${d < 10 ? "0" : ""}${d}`;
}

function posInt(v: unknown): number {
  if (typeof v !== "number" || !Number.isFinite(v) || v <= 0) return 0;
  return Math.min(CAP, Math.floor(v));
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

export function parseQuestSave(raw: string | null, today: string): QuestState {
  const fresh = freshQuests(today);
  if (typeof raw !== "string" || raw.length === 0) return fresh;
  let data: unknown;
  try { data = JSON.parse(raw); } catch { return fresh; }
  if (!isRecord(data) || data["day"] !== today) return fresh;
  return {
    ...fresh,
    kills: posInt(data["kills"]),
    bestSeconds: posInt(data["bestSeconds"]),
    unions: posInt(data["unions"]),
    bestScore: posInt(data["bestScore"]),
    bestLevel: posInt(data["bestLevel"]),
  };
}

export function loadQuests(store: QuestStore, today: string): QuestState {
  try { return parseQuestSave(store.getItem(QUEST_KEY), today); } catch { return freshQuests(today); }
}

export function saveQuests(store: QuestStore, state: QuestState): void {
  const body = JSON.stringify({
    "day": state.day,
    "kills": state.kills,
    "bestSeconds": state.bestSeconds,
    "unions": state.unions,
    "bestScore": state.bestScore,
    "bestLevel": state.bestLevel,
  });
  try { store.setItem(QUEST_KEY, body); } catch { return; }
}

export function rollDay(state: QuestState, today: string): QuestState {
  if (state.day === today) return state;
  return { ...freshQuests(today), open: state.open };
}

export function openRun(state: QuestState): QuestState {
  if (state.open) return state;
  return { ...state, open: true };
}

export function unionForged(upgrades: ArrayLike<number> | null | undefined): boolean {
  if (!upgrades) return false;
  for (let i = 0; i < upgrades.length; i++) {
    if ((upgrades[i] ?? 0) <= 0) continue;
    if (isUnion(i) || i === EVOL_STORM || i === EVOL_CANNON || i === EVOL_AEGIS) return true;
  }
  return false;
}

export function snapshotRun(input: {
  kills: number;
  tick: number;
  upgrades: ArrayLike<number> | null | undefined;
  score: number;
  level: number;
}): RunSnapshot {
  const tick = Number.isFinite(input.tick) ? Math.max(0, input.tick) : 0;
  return {
    kills: input.kills,
    seconds: Math.floor(tick / 60),
    union: unionForged(input.upgrades),
    score: input.score,
    level: input.level,
  };
}

export function applyRun(state: QuestState, run: RunSnapshot): QuestState {
  if (!state.open) return state;
  return {
    ...state,
    open: false,
    kills: Math.min(CAP, state.kills + posInt(run.kills)),
    bestSeconds: Math.max(state.bestSeconds, posInt(run.seconds)),
    unions: Math.min(CAP, state.unions + (run.union ? 1 : 0)),
    bestScore: Math.max(state.bestScore, posInt(run.score)),
    bestLevel: Math.max(state.bestLevel, posInt(run.level)),
  };
}

export function questValue(state: QuestState, kind: QuestKind): number {
  switch (kind) {
    case QUEST_KILLS: return state.kills;
    case QUEST_SECONDS: return state.bestSeconds;
    case QUEST_UNION: return state.unions;
    case QUEST_LEVEL: return state.bestLevel;
    case QUEST_SCORE: return state.bestScore;
    default: return 0;
  }
}

function mmss(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r < 10 ? "0" : ""}${r}`;
}

export function formatQuest(q: Quest, value: number): string {
  const v = Math.max(0, Math.min(q.goal, posInt(value)));
  if (v >= q.goal) return `${q.label} · done`;
  if (q.kind === QUEST_SECONDS) return `${q.label} · ${mmss(v)}/${mmss(q.goal)}`;
  return `${q.label} · ${v}/${q.goal}`;
}

export function questBoard(state: QuestState): string {
  const lines = [QUEST_HEADING];
  for (const q of state.quests) lines.push(formatQuest(q, questValue(state, q.kind)));
  return lines.join("\n");
}
