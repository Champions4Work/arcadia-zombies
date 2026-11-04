import type { RunLog } from "./run-log";

export interface RunSendTally {
  fails: number;
}

export type RunPoster = (url: string, body: string) => Promise<{ ok: boolean }>;

export function emptySendTally(): RunSendTally {
  return { fails: 0 };
}

export async function sendRunLog(
  url: string,
  log: RunLog,
  post: RunPoster,
  tally: RunSendTally,
): Promise<boolean> {
  const body = JSON.stringify(log);
  if (await tryPost(post, url, body)) return true;
  if (await tryPost(post, url, body)) return true;
  tally.fails += 1;
  return false;
}

export function fetchPoster(url: string, body: string): Promise<{ ok: boolean }> {
  return fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
  });
}

async function tryPost(post: RunPoster, url: string, body: string): Promise<boolean> {
  try {
    return (await post(url, body)).ok;
  } catch {
    return false;
  }
}
