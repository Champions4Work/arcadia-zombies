export const PHONE_MAX_W = 720;
export const PHONE_JOY_R = 84;
export const DESK_JOY_R = 72;
export const JOY_INSET = 24;

const PLAY_GESTURES = ["gesturestart", "gesturechange", "gestureend", "touchmove"] as const;
const PINCH = new Set(["gesturestart", "gesturechange", "gestureend"]);
const SCROLL_CHROME = "#panel, #book, #bench, #summary, #sfx, #guide, #lb-board";

export interface PhoneChrome {
  phone: boolean;
  joyR: number;
  restX: number;
  restY: number;
  knobTravel: number;
}

export function isPhone(vw: number): boolean {
  return vw <= PHONE_MAX_W;
}

export function phoneChrome(
  vw: number,
  vh: number,
  safeL = 0,
  safeB = 0,
  frame?: { x: number; y: number; w: number; h: number },
): PhoneChrome {
  const phone = isPhone(vw);
  const joyR = phone ? PHONE_JOY_R : DESK_JOY_R;
  const inset = JOY_INSET;
  const left = frame ? frame.x : 0;
  const top = frame ? frame.y : 0;
  const right = frame ? frame.x + frame.w : Math.max(1, vw);
  const bottom = frame ? frame.y + frame.h : Math.max(1, vh);
  const restX = clamp(left + Math.max(0, safeL) + inset + joyR, left + inset + joyR, right - inset - joyR);
  const restY = clamp(bottom - Math.max(0, safeB) - inset - joyR, top + inset + joyR, bottom - inset - joyR);
  return {
    phone,
    joyR,
    restX,
    restY,
    knobTravel: joyR * 0.625,
  };
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

export function playGestureTarget(t: EventTarget | null): boolean {
  const el = t as { closest?: (sel: string) => unknown } | null;
  if (!el || typeof el.closest !== "function") return true;
  return !el.closest(SCROLL_CHROME);
}

export function lockPlayGestures(target: EventTarget): () => void {
  const stop = (e: Event): void => {
    if (!e.cancelable) return;
    if (!PINCH.has(e.type) && !playGestureTarget(e.target)) return;
    e.preventDefault();
  };
  for (const name of PLAY_GESTURES) target.addEventListener(name, stop, { passive: false });
  return () => {
    for (const name of PLAY_GESTURES) target.removeEventListener(name, stop);
  };
}
