import type { IncomingMessage, ServerResponse } from "node:http";
import type { Plugin } from "vite";
import { dispatchRuns, type RunStore } from "../src/api/runs";

function memStore(): RunStore {
  const m = new Map<string, string>();
  return {
    get: async (k) => (m.has(k) ? m.get(k) ?? null : null),
    put: async (k, v) => { m.set(k, v); },
  };
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (c: string | Uint8Array) => {
      raw += typeof c === "string" ? c : new TextDecoder().decode(c);
    });
    req.on("end", () => resolve(raw));
    req.on("error", reject);
  });
}

export function runsPreviewPlugin(): Plugin {
  const store = memStore();
  let seq = 0;
  const handle = async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const path = (req.url ?? "").split("?")[0];
    if (path !== "/api/runs" && path !== "/api/runs/") {
      next();
      return;
    }
    const host = typeof req.headers.host === "string" ? req.headers.host : "127.0.0.1";
    const url = new URL(req.url ?? "/api/runs", `http://${host}`);
    const raw = req.method === "POST" ? await readBody(req) : "";
    seq += 1;
    const result = await dispatchRuns(req.method ?? "GET", url, raw, store, Date.now(), `p${seq.toString(36)}`);
    res.statusCode = result.status;
    res.setHeader("content-type", "application/json; charset=utf-8");
    res.setHeader("access-control-allow-origin", "*");
    res.setHeader("access-control-allow-methods", "GET,POST,OPTIONS");
    res.setHeader("access-control-allow-headers", "content-type");
    if (result.status === 204) {
      res.end();
      return;
    }
    res.end(JSON.stringify(result.data));
  };
  return {
    name: "runs-preview",
    configureServer(server) {
      server.middlewares.use(handle);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handle);
    },
  };
}
