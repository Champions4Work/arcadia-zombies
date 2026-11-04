export const PHASE_TITLE = "title";
export const PHASE_PLAY = "play";
export const PHASE_PAUSE = "pause";
export const PHASE_OVER = "over";
export const PHASE_WORKSHOP = "workshop";
export type Phase = typeof PHASE_TITLE | typeof PHASE_PLAY | typeof PHASE_PAUSE | typeof PHASE_OVER | typeof PHASE_WORKSHOP;

export const BEST_KEY = "arcadia.best";
export const MUTE_KEY = "arcadia.muted";
export const SHAKE_KEY = "arcadia.shake";
export const NUM_KEY = "arcadia.damageNumbers";
export const MOTION_KEY = "arcadia.reduceMotion";

export interface Session {
  phase: Phase;
  best: number;
  last: number;
  muted: boolean;
  shake: boolean;
  numbers: boolean;
  reduceMotion: boolean;
  codex: boolean;
  shopFrom: Phase;
}

export interface Store {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function createSession(best = 0, muted = false, shake = true, numbers = true, reduceMotion = false): Session {
  return {
    phase: PHASE_TITLE,
    best: Math.max(0, best | 0),
    last: 0,
    muted,
    shake,
    numbers,
    reduceMotion,
    codex: false,
    shopFrom: PHASE_TITLE,
  };
}

export function openWorkshop(s: Session): boolean {
  if (s.phase !== PHASE_TITLE && s.phase !== PHASE_OVER) return false;
  s.codex = false;
  s.shopFrom = s.phase;
  s.phase = PHASE_WORKSHOP;
  return true;
}

export function closeWorkshop(s: Session): void {
  if (s.phase !== PHASE_WORKSHOP) return;
  s.phase = s.shopFrom === PHASE_OVER ? PHASE_OVER : PHASE_TITLE;
}

export function shouldStep(s: Session): boolean {
  return s.phase === PHASE_PLAY;
}

export function openCodex(s: Session): void {
  if (s.phase === PHASE_TITLE || s.phase === PHASE_OVER) s.codex = true;
}

export function closeCodex(s: Session): void {
  s.codex = false;
}

export function begin(s: Session): boolean {
  if (s.phase === PHASE_WORKSHOP) return false;
  s.codex = false;
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

export function toggleNumbers(s: Session): void {
  s.numbers = !s.numbers;
}

export function toggleReduceMotion(s: Session): void {
  s.reduceMotion = !s.reduceMotion;
}

export function loadStore(
  store: Store,
  preferReduce = false,
): { best: number; muted: boolean; shake: boolean; numbers: boolean; reduceMotion: boolean } {
  const best = Math.max(0, Math.floor(Number(store.getItem(BEST_KEY)) || 0));
  const raw = store.getItem(SHAKE_KEY);
  const motion = store.getItem(MOTION_KEY);
  return {
    best,
    muted: store.getItem(MUTE_KEY) === "1",
    shake: raw !== "0",
    numbers: store.getItem(NUM_KEY) !== "0",
    reduceMotion: motion === "1" ? true : motion === "0" ? false : preferReduce,
  };
}

export function syncStore(s: Session, store: Store): void {
  store.setItem(BEST_KEY, String(s.best));
  store.setItem(MUTE_KEY, s.muted ? "1" : "0");
  store.setItem(SHAKE_KEY, s.shake ? "1" : "0");
  store.setItem(NUM_KEY, s.numbers ? "1" : "0");
  store.setItem(MOTION_KEY, s.reduceMotion ? "1" : "0");
}
