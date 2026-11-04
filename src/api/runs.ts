import { isRunLog, parseRunLog, RUN_LOG_V, type RunLog } from "../shell/run-log";

export const RUNS_INDEX = "runs:index";
export const RUN_LIMIT = 40;
export const BODY_CAP = 24_000;

export interface RunStore {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
}

export interface RunRow {
  id: string;
  at: number;
  log: RunLog;
}

export function runKey(id: string): string {
  return `run:${id}`;
}

export async function listRuns(store: RunStore, limit: number): Promise<RunRow[]> {
  const n = clampLimit(limit);
  const ids = await readIndex(store);
  const out: RunRow[] = [];
  for (let i = 0; i < ids.length && out.length < n; i++) {
    const id = ids[i] ?? "";
    if (!id) continue;
    const raw = await store.get(runKey(id));
    if (!raw) continue;
    const row = decodeRow(raw);
    if (row) out.push(row);
  }
  return out;
}

export async function saveRun(store: RunStore, body: unknown, now: number, id: string): Promise<RunRow | null> {
  const log = parseRunLog(body);
  if (!log) return null;
  const row: RunRow = { id, at: now, log };
  await store.put(runKey(id), JSON.stringify(row));
  const ids = await readIndex(store);
  const next = [id, ...ids.filter((x) => x !== id)];
  if (next.length > RUN_LIMIT) next.length = RUN_LIMIT;
  await store.put(RUNS_INDEX, JSON.stringify(next));
  return row;
}

export function parseLimit(url: URL): number {
  return clampLimit(Number(url.searchParams.get("limit") ?? 20));
}

export function clampLimit(n: number): number {
  if (!Number.isFinite(n)) return 20;
  const t = Math.floor(n);
  if (t < 1) return 1;
  if (t > RUN_LIMIT) return RUN_LIMIT;
  return t;
}

export function jsonBody(status: number, data: unknown): { status: number; body: string } {
  return { status, body: JSON.stringify(data) };
}

export function rejectBody(raw: string): string | null {
  if (raw.length > BODY_CAP) return "too large";
  if (raw.includes("email") || raw.includes("ip") || raw.includes("userAgent")) return "personal";
  return null;
}

export function acceptLog(body: unknown): boolean {
  return isRunLog(body) && body.v === RUN_LOG_V;
}

async function readIndex(store: RunStore): Promise<string[]> {
  const raw = await store.get(RUNS_INDEX);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === "string" && id.length > 0 && id.length < 40);
  } catch {
    return [];
  }
}

function decodeRow(raw: string): RunRow | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    const row = parsed as { id?: unknown; at?: unknown; log?: unknown };
    if (typeof row.id !== "string" || typeof row.at !== "number") return null;
    const log = parseRunLog(row.log);
    if (!log) return null;
    return { id: row.id, at: row.at, log };
  } catch {
    return null;
  }
}
