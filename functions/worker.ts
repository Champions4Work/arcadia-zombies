import { acceptLog, jsonBody, listRuns, parseLimit, rejectBody, saveRun } from "../src/api/runs";

export interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
  RUNS?: {
    get(key: string): Promise<string | null>;
    put(key: string, value: string): Promise<void>;
  };
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "content-type",
  "Content-Type": "application/json; charset=utf-8",
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/api/runs" || url.pathname === "/api/runs/") {
      return handleRuns(request, url, env);
    }
    return env.ASSETS.fetch(request);
  },
};

async function handleRuns(request: Request, url: URL, env: Env): Promise<Response> {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (!env.RUNS) return reply(503, { error: "runs store missing" });
  if (request.method === "GET") {
    const rows = await listRuns(env.RUNS, parseLimit(url));
    return reply(200, { runs: rows });
  }
  if (request.method !== "POST") return reply(405, { error: "method" });
  const raw = await request.text();
  const banned = rejectBody(raw);
  if (banned) return reply(400, { error: banned });
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return reply(400, { error: "json" });
  }
  if (!acceptLog(body)) return reply(400, { error: "schema" });
  const id = `${Date.now().toString(36)}${Math.floor(Math.random() * 1e9).toString(36)}`;
  const row = await saveRun(env.RUNS, body, Date.now(), id);
  if (!row) return reply(400, { error: "schema" });
  return reply(201, { id: row.id });
}

function reply(status: number, data: unknown): Response {
  const pack = jsonBody(status, data);
  return new Response(pack.body, { status: pack.status, headers: CORS });
}
