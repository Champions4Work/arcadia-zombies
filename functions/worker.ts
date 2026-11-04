import { dispatchRuns, jsonBody } from "../src/api/runs";

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
  const raw = request.method === "POST" ? await request.text() : "";
  const id = `${Date.now().toString(36)}${Math.floor(Math.random() * 1e9).toString(36)}`;
  const result = await dispatchRuns(request.method, url, raw, env.RUNS, Date.now(), id);
  if (result.status === 204) return new Response(null, { status: 204, headers: CORS });
  return reply(result.status, result.data);
}

function reply(status: number, data: unknown): Response {
  const pack = jsonBody(status, data);
  return new Response(pack.body, { status: pack.status, headers: CORS });
}
