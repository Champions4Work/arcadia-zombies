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

const BANNED_KEYS = new Set(["ip", "email", "userAgent"]);

export function rejectBody(raw: string): string | null {
  if (raw.length > BODY_CAP) return "too large";
  try {
    if (hasBannedKey(JSON.parse(raw))) return "personal";
  } catch {
    return null;
  }
  return null;
}

export async function dispatchRuns(
  method: string,
  url: URL,
  raw: string,
  store: RunStore | undefined,
  now: number,
  id: string,
): Promise<{ status: number; data: unknown }> {
  if (method === "OPTIONS") return { status: 204, data: null };
  if (!store) return { status: 503, data: { error: "runs store missing" } };
  if (method === "GET") return { status: 200, data: { runs: await listRuns(store, parseLimit(url)) } };
  if (method !== "POST") return { status: 405, data: { error: "method" } };
  const banned = rejectBody(raw);
  if (banned) return { status: 400, data: { error: banned } };
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return { status: 400, data: { error: "json" } };
  }
  if (!acceptLog(body)) return { status: 400, data: { error: "schema" } };
  const row = await saveRun(store, body, now, id);
  if (!row) return { status: 400, data: { error: "schema" } };
  return { status: 201, data: { id: row.id } };
}

function hasBannedKey(v: unknown): boolean {
  if (Array.isArray(v)) {
    for (const item of v) {
      if (hasBannedKey(item)) return true;
    }
    return false;
  }
  if (!v || typeof v !== "object") return false;
  for (const [key, child] of Object.entries(v as Record<string, unknown>)) {
    if (BANNED_KEYS.has(key)) return true;
    if (hasBannedKey(child)) return true;
  }
  return false;
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
