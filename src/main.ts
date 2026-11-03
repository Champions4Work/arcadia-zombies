import { setMusicOn, setMusicWave } from "./render/music";
import { draw } from "./render/draw";
import { pauseHit } from "./render/hud";
import { bootSfx, persistSfx, playSfxCue, playUiClick, playWorldSfx, resetSfxPlayback, setSfxVolume, sfxMuted, sfxVolume, toggleSfxMuted } from "./render/sfx";
import { CUE_BOSS, sfxMuteLabel, sfxVolumePercent } from "./render/sfx-cues";
import { setMuted, unlockAudio } from "./render/sound";
import { applyCanvas, screenToGame, type Fit } from "./shell/fit";
import {
  captureRun,
  createTracker,
  emptyLeaderboard,
  loadLeaderboard,
  noteKills,
  presentBoard,
  resetTracker,
  saveLeaderboard,
  settleRun,
} from "./shell/leaderboard";
import { mountLeaderboard } from "./shell/leaderboard-dom";
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
import { devSeconds, loadCrown, markWon, saveCrown, toggleEndless } from "./shell/crown";
import { createStick, liftStick, moveStick, pressStick, showRestStick } from "./shell/stick";
import { clock } from "./sim/difficulty";
import { armDevJump, isWon, killCount, setRunEndless, takeCue, victoryText } from "./sim/finale";
import { cardSlot, summaryText } from "./sim/progress";
import { step } from "./sim/step.hot";
import { EV_KILL, H, OFFER_N, W, type Input } from "./sim/types";
import { createWorld } from "./sim/world";

function tryStore(): { getItem(k: string): string | null; setItem(k: string, v: string): void } | null {
  try { return window.localStorage; } catch { return null; }
}

const store = tryStore();
const saved = store ? loadStore(store) : { best: 0, muted: false, shake: true };
const session = createSession(saved.best, saved.muted, saved.shake);
let crown = store ? loadCrown(store) : { won: false, endless: false };
const records = store ? loadLeaderboard(store) : emptyLeaderboard();
const tracker = createTracker();
let runLineText = "";
let runShare: string | null = null;
setMuted(session.muted);
bootSfx(store);

const canvas = document.getElementById("game") as HTMLCanvasElement;
const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
ctx.imageSmoothingEnabled = true;
const veil = document.getElementById("veil") as HTMLElement;
const headline = document.getElementById("headline") as HTMLElement;
const sub = document.getElementById("sub") as HTMLElement;
const goBtn = document.getElementById("go") as HTMLButtonElement;
const muteBtn = document.getElementById("mute") as HTMLButtonElement;
const shakeBtn = document.getElementById("shake") as HTMLButtonElement;
const endlessBtn = document.getElementById("endless") as HTMLButtonElement;
const summary = document.getElementById("summary") as HTMLElement;
const sfxMuteBtn = document.getElementById("sfx-mute") as HTMLButtonElement;
const sfxVol = document.getElementById("sfx-vol") as HTMLInputElement;
const panel = document.getElementById("panel") as HTMLElement;
const leader = mountLeaderboard(panel, () => presentBoard(records));
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
  if (!store) return;
  syncStore(session, store);
  saveCrown(store, crown);
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
    if (isWon(world)) {
      headline.textContent = "The Lich Falls";
      sub.textContent = `${clock(world.tick)} · ${killCount(world)} KILLS`;
    } else {
      headline.textContent = "The Gears Stop";
      sub.textContent = `Best ${session.best}`;
    }
    goBtn.textContent = "Play";
  }
  const over = session.phase === PHASE_OVER ? (isWon(world) ? victoryText(world) : summaryText(world)) : "";
  summary.hidden = over.length === 0;
  summary.textContent = over;
  muteBtn.textContent = session.muted ? "Muted" : "Sound";
  muteBtn.setAttribute("aria-pressed", session.muted ? "true" : "false");
  shakeBtn.textContent = session.shake ? "Screen shake: On" : "Screen shake: Off";
  shakeBtn.setAttribute("aria-pressed", session.shake ? "true" : "false");
  endlessBtn.hidden = !crown.won;
  endlessBtn.textContent = crown.endless ? "Endless: On" : "Endless: Off";
  endlessBtn.setAttribute("aria-pressed", crown.endless ? "true" : "false");
  sfxMuteBtn.textContent = sfxMuteLabel(sfxMuted());
  sfxMuteBtn.setAttribute("aria-pressed", sfxMuted() ? "true" : "false");
  if (document.activeElement !== sfxVol) sfxVol.value = String(sfxVolumePercent(sfxVolume()));
  leader.sync({
    phase: session.phase,
    line: session.phase === PHASE_OVER ? runLineText : "",
    share: session.phase === PHASE_OVER ? runShare : null,
  });
  setMusicOn(session.phase === PHASE_PLAY || session.phase === PHASE_TITLE);
  setMusicWave(playing ? Math.max(world.wave, world.rank) : 0);
}

function startRun(): void {
  unlockAudio();
  leader.close();
  const reset = begin(session);
  if (reset) {
    world = createWorld(Date.now() >>> 0);
    const jump = devSeconds(location.search, import.meta.env.DEV);
    if (jump > 0) armDevJump(world, jump);
    setRunEndless(world, crown.endless);
    resetShake();
    acc = 0;
    pendingPick = 0;
    resetSfxPlayback();
    resetTracker(tracker);
    runLineText = "";
    runShare = null;
  }
  playUiClick();
  persist();
  paint();
}

function mute(): void {
  unlockAudio();
  toggleMute(session);
  setMuted(session.muted);
  if (!session.muted) playUiClick();
  persist();
  paint();
}

function shake(): void {
  unlockAudio();
  toggleShake(session);
  if (!session.shake) resetShake();
  playUiClick();
  persist();
  paint();
}

function sfxMute(): void {
  unlockAudio();
  toggleSfxMuted();
  if (!sfxMuted()) playUiClick();
  if (store) persistSfx(store);
  paint();
}

function sfxVolInput(): void {
  unlockAudio();
  setSfxVolume(Number(sfxVol.value) / 100);
  if (store) persistSfx(store);
  playUiClick();
}

function endless(): void {
  unlockAudio();
  crown = toggleEndless(crown);
  setRunEndless(world, crown.endless);
  playUiClick();
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
  playWorldSfx(world);
  if (takeCue(world)) playSfxCue(CUE_BOSS);
}

goBtn.addEventListener("click", startRun);
muteBtn.addEventListener("click", mute);
shakeBtn.addEventListener("click", shake);
sfxMuteBtn.addEventListener("click", sfxMute);
sfxVol.addEventListener("input", sfxVolInput);
endlessBtn.addEventListener("click", endless);

addEventListener("keydown", (e) => {
  const inSfx = e.target instanceof HTMLElement && !!e.target.closest("#sfx");
  if (inSfx && e.key !== "Escape") return;
  unlockAudio();
  paint();
  const k = e.key.toLowerCase();
  if (k === "escape") {
    e.preventDefault();
    if (e.repeat) return;
    if (leader.isOpen()) {
      leader.close();
      paint();
      return;
    }
    togglePause(session);
    playUiClick();
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
  if (import.meta.env.DEV && session.phase === PHASE_PLAY && !e.repeat && (k === "b" || k === "n")) {
    const key = k;
    void import("./dev/lineup").then((m) => {
      if (key === "b") m.lineup(world);
      else m.rush(world);
    });
    return;
  }
  if (session.phase === PHASE_PLAY && world.choosing && e.key >= "1" && e.key <= String(OFFER_N)) {
    pendingPick = e.key.charCodeAt(0) - 48;
    return;
  }
  keys.add(k);
  if (k === "arrowup" || k === "arrowdown" || k === "arrowleft" || k === "arrowright") e.preventDefault();
});
addEventListener("keyup", (e) => keys.delete(e.key.toLowerCase()));

const fromHud = (t: EventTarget | null): boolean => t instanceof HTMLElement && !!t.closest("button, #sfx");

addEventListener("pointerdown", (e) => {
  unlockAudio();
  paint();
  if (fromHud(e.target)) return;
  if (session.phase !== PHASE_PLAY) return;
  const p = screenToGame(fit, e.clientX, e.clientY);
  if (pauseHit(p.x, p.y)) {
    togglePause(session);
    playUiClick();
    persist();
    paint();
    return;
  }
  if (world.choosing) {
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
      noteKills(tracker, world.events[EV_KILL] ?? 0);
      pendingPick = 0;
      input.pick = 0;
      acc -= STEP_MS;
      sfx();
      if (isWon(world) && !crown.won) {
        crown = markWon(crown);
        persist();
        paint();
      }
      if (world.over) {
        finish(session, world.score);
        const settled = settleRun(records, captureRun({
          score: world.score,
          time: world.tick,
          tier: world.rank,
          kills: tracker.kills,
          upgrades: world.upgrades,
        }));
        runLineText = settled.line;
        runShare = settled.share;
        if (store) saveLeaderboard(store, records);
        leader.toast(settled.toasts);
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
  const showHud = session.phase === PHASE_PLAY || session.phase === PHASE_PAUSE;
  draw(ctx, world, { hud: showHud, shake: session.shake });
  placeJoy();
  requestAnimationFrame(frame);
}

paint();
requestAnimationFrame(frame);
