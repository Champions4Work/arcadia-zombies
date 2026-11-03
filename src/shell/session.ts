export const PHASE_TITLE = "title";
export const PHASE_PLAY = "play";
export const PHASE_PAUSE = "pause";
export const PHASE_OVER = "over";
export type Phase = typeof PHASE_TITLE | typeof PHASE_PLAY | typeof PHASE_PAUSE | typeof PHASE_OVER;

export const BEST_KEY = "arcadia.best";
export const MUTE_KEY = "arcadia.muted";
export const SHAKE_KEY = "arcadia.shake";

export interface Session {
  phase: Phase;
  best: number;
  last: number;
  muted: boolean;
  shake: boolean;
}

export interface Store {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function createSession(best = 0, muted = false, shake = true): Session {
  return { phase: PHASE_TITLE, best: Math.max(0, best | 0), last: 0, muted, shake };
}

export function shouldStep(s: Session): boolean {
  return s.phase === PHASE_PLAY;
}

export function begin(s: Session): boolean {
  if (s.phase === PHASE_TITLE || s.phase === PHASE_OVER) {
    s.phase = PHASE_PLAY;
    return true;
  }
  if (s.phase === PHASE_PAUSE) {
    s.phase = PHASE_PLAY;
    return false;
  }
  return false;
}

export function togglePause(s: Session): void {
  if (s.phase === PHASE_PLAY) s.phase = PHASE_PAUSE;
  else if (s.phase === PHASE_PAUSE) s.phase = PHASE_PLAY;
}

export function onBlur(s: Session): void {
  if (s.phase === PHASE_PLAY) s.phase = PHASE_PAUSE;
}

export function finish(s: Session, score: number): boolean {
  if (s.phase !== PHASE_PLAY && s.phase !== PHASE_PAUSE) return false;
  s.phase = PHASE_OVER;
  s.last = Math.max(0, score | 0);
  if (s.last > s.best) {
    s.best = s.last;
    return true;
  }
  return false;
}

export function toggleMute(s: Session): void {
  s.muted = !s.muted;
}

export function toggleShake(s: Session): void {
  s.shake = !s.shake;
}

export function loadStore(store: Store): { best: number; muted: boolean; shake: boolean } {
  const best = Math.max(0, Math.floor(Number(store.getItem(BEST_KEY)) || 0));
  const raw = store.getItem(SHAKE_KEY);
  return { best, muted: store.getItem(MUTE_KEY) === "1", shake: raw !== "0" };
}

export function syncStore(s: Session, store: Store): void {
  store.setItem(BEST_KEY, String(s.best));
  store.setItem(MUTE_KEY, s.muted ? "1" : "0");
  store.setItem(SHAKE_KEY, s.shake ? "1" : "0");
}
