import { setMusicOn, setMusicWave } from "./render/music";
import { draw } from "./render/draw";
import { blip, setMuted, unlockAudio } from "./render/sound";
import { applyCanvas, screenToGame, type Fit } from "./shell/fit";
import {
  begin,
  createSession,
  finish,
  loadStore,
  onBlur,
  PHASE_OVER,
  PHASE_PAUSE,
  PHASE_PLAY,
  PHASE_TITLE,
  shouldStep,
  syncStore,
  toggleMute,
  togglePause,
  toggleShake,
} from "./shell/session";
import { resetShake } from "./render/shake";
import { createStick, liftStick, moveStick, pressStick, showRestStick } from "./shell/stick";
import { cardSlot, summaryText } from "./sim/progress";
import { step } from "./sim/step.hot";
import { EV_HURT, EV_KILL, EV_LEVEL, EV_RANK, EV_SHIELD, EV_SHOT, EV_TESLA, EV_WAVE, H, W, type Input } from "./sim/types";
import { createWorld } from "./sim/world";

function tryStore(): { getItem(k: string): string | null; setItem(k: string, v: string): void } | null {
  try { return window.localStorage; } catch { return null; }
}

const store = tryStore();
const saved = store ? loadStore(store) : { best: 0, muted: false, shake: true };
const session = createSession(saved.best, saved.muted, saved.shake);
setMuted(session.muted);

const canvas = document.getElementById("game") as HTMLCanvasElement;
const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
ctx.imageSmoothingEnabled = false;
const veil = document.getElementById("veil") as HTMLElement;
const headline = document.getElementById("headline") as HTMLElement;
const sub = document.getElementById("sub") as HTMLElement;
const goBtn = document.getElementById("go") as HTMLButtonElement;
const muteBtn = document.getElementById("mute") as HTMLButtonElement;
const shakeBtn = document.getElementById("shake") as HTMLButtonElement;
const summary = document.getElementById("summary") as HTMLElement;
const joy = document.getElementById("joy") as HTMLElement;
const knob = document.getElementById("knob") as HTMLElement;

let world = createWorld(1);
let fit: Fit = applyCanvas(canvas, ctx, innerWidth, innerHeight, devicePixelRatio || 1, W, H);
const keys = new Set<string>();
const input: Input = { dx: 0, dy: 0, pick: 0 };
const stick = createStick();
let stickId = -1;
let pendingPick = 0;
const STEP_MS = 1000 / 60;
let acc = 0;
let last = performance.now();

function persist(): void {
  if (store) syncStore(session, store);
}

function paint(): void {
  const playing = session.phase === PHASE_PLAY;
  veil.classList.toggle("on", !playing);
  if (session.phase === PHASE_TITLE) {
    headline.textContent = "Arcadia: Gears of the Dead";
    sub.textContent = `Best ${session.best}`;
    goBtn.textContent = "Play";
  } else if (session.phase === PHASE_PAUSE) {
    headline.textContent = "Paused";
    sub.textContent = "Esc or tap Resume";
    goBtn.textContent = "Resume";
  } else if (session.phase === PHASE_OVER) {
    headline.textContent = "The Gears Stop";
    sub.textContent = `Best ${session.best}`;
    goBtn.textContent = "Play";
  }
  const over = session.phase === PHASE_OVER ? summaryText(world) : "";
  summary.hidden = over.length === 0;
  summary.textContent = over;
  muteBtn.textContent = session.muted ? "Muted" : "Sound";
  muteBtn.setAttribute("aria-pressed", session.muted ? "true" : "false");
  shakeBtn.textContent = session.shake ? "Screen shake: On" : "Screen shake: Off";
  shakeBtn.setAttribute("aria-pressed", session.shake ? "true" : "false");
  setMusicOn(session.phase === PHASE_PLAY || session.phase === PHASE_TITLE);
  setMusicWave(playing ? Math.max(world.wave, world.rank) : 0);
}

function startRun(): void {
  unlockAudio();
  const reset = begin(session);
  if (reset) {
    world = createWorld(Date.now() >>> 0);
    resetShake();
    acc = 0;
    pendingPick = 0;
  }
  persist();
  paint();
}

function mute(): void {
  unlockAudio();
  toggleMute(session);
  setMuted(session.muted);
  persist();
  paint();
}

function shake(): void {
  toggleShake(session);
  if (!session.shake) resetShake();
  persist();
  paint();
}

function placeJoy(): void {
  const playing = session.phase === PHASE_PLAY && !world.choosing;
  const rest = showRestStick(
    innerWidth,
    matchMedia("(pointer: coarse)").matches,
    matchMedia("(hover: none)").matches,
  );
  const show = playing && (stick.on || rest);
  joy.hidden = !show;
  if (!show) return;
  joy.style.left = `${stick.on ? stick.x : 88}px`;
  joy.style.top = `${stick.on ? stick.y : innerHeight - 108}px`;
  knob.style.transform = `translate(${stick.dx * 40}px,${stick.dy * 40}px)`;
}

function sfx(): void {
  if (world.events[EV_SHOT]) blip(720, 0.04, "square");
  if (world.events[EV_KILL]) blip(110, 0.16, "sawtooth");
  if (world.events[EV_HURT]) blip(70, 0.28, "triangle");
  if (world.events[EV_WAVE]) blip(360, 0.35, "sine");
  if (world.events[EV_LEVEL]) blip(880, 0.25, "triangle");
  if (world.events[EV_TESLA]) blip(980, 0.08, "square");
  if (world.events[EV_SHIELD]) blip(300, 0.12, "sine");
  if (world.events[EV_RANK]) blip(180, 0.45, "sawtooth");
}

goBtn.addEventListener("click", startRun);
muteBtn.addEventListener("click", mute);
shakeBtn.addEventListener("click", shake);

addEventListener("keydown", (e) => {
  unlockAudio();
  paint();
  const k = e.key.toLowerCase();
  if (k === "escape") {
    e.preventDefault();
    if (e.repeat) return;
    togglePause(session);
    persist();
    paint();
    return;
  }
  if (k === "m") {
    mute();
    return;
  }
  if (k === " " || k === "enter") {
    if (session.phase !== PHASE_PLAY) {
      e.preventDefault();
      startRun();
    }
    return;
  }
  if (k === "r" && session.phase === PHASE_OVER) {
    startRun();
    return;
  }
  if (session.phase === PHASE_PLAY && world.choosing && e.key >= "1" && e.key <= "2") {
    pendingPick = e.key.charCodeAt(0) - 48;
    return;
  }
  keys.add(k);
  if (k === "arrowup" || k === "arrowdown" || k === "arrowleft" || k === "arrowright") e.preventDefault();
});
addEventListener("keyup", (e) => keys.delete(e.key.toLowerCase()));

const fromHud = (t: EventTarget | null): boolean => t instanceof HTMLElement && !!t.closest("button");

addEventListener("pointerdown", (e) => {
  unlockAudio();
  paint();
  if (fromHud(e.target)) return;
  if (session.phase !== PHASE_PLAY) return;
  if (world.choosing) {
    const p = screenToGame(fit, e.clientX, e.clientY);
    pendingPick = cardSlot(p.x, p.y);
    return;
  }
  stickId = e.pointerId;
  pressStick(stick, e.clientX, e.clientY);
  input.dx = 0;
  input.dy = 0;
});
addEventListener("pointermove", (e) => {
  if (!stick.on || e.pointerId !== stickId) return;
  moveStick(stick, e.clientX, e.clientY);
  input.dx = stick.dx;
  input.dy = stick.dy;
});
addEventListener("pointerup", (e) => {
  if (e.pointerId !== stickId) return;
  stickId = -1;
  liftStick(stick);
  input.dx = 0;
  input.dy = 0;
});
addEventListener("pointercancel", (e) => {
  if (e.pointerId !== stickId) return;
  stickId = -1;
  liftStick(stick);
  input.dx = 0;
  input.dy = 0;
});

const hide = (): void => {
  onBlur(session);
  persist();
  paint();
};
addEventListener("blur", hide);
document.addEventListener("visibilitychange", () => { if (document.hidden) hide(); });

function frame(now: number): void {
  acc += Math.min(250, now - last);
  last = now;
  if (shouldStep(session)) {
    if (!stick.on) {
      input.dx = (keys.has("d") || keys.has("arrowright") ? 1 : 0) - (keys.has("a") || keys.has("arrowleft") ? 1 : 0);
      input.dy = (keys.has("s") || keys.has("arrowdown") ? 1 : 0) - (keys.has("w") || keys.has("arrowup") ? 1 : 0);
    }
    while (acc >= STEP_MS) {
      input.pick = pendingPick;
      step(world, input);
      pendingPick = 0;
      input.pick = 0;
      acc -= STEP_MS;
      sfx();
      if (world.over) {
        finish(session, world.score);
        persist();
        paint();
        acc = 0;
        break;
      }
    }
    setMusicWave(Math.max(world.wave, world.rank));
  } else {
    acc = 0;
  }
  fit = applyCanvas(canvas, ctx, innerWidth, innerHeight, devicePixelRatio || 1, W, H);
  draw(ctx, world, session.shake);
  placeJoy();
  requestAnimationFrame(frame);
}

paint();
requestAnimationFrame(frame);
