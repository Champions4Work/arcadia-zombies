import { awardRun, applyWorkshop, emptyWorkshop, loadWorkshop, saveWorkshop, tryBuy } from "./meta/workshop";
import { noteFrame, toggleFps, toggleFromKey } from "./render/fps";
import { setNumbersOn, stopRemaining } from "./render/juice";
import { setMusicOn, setMusicWave } from "./render/music";
import { draw } from "./render/draw";
import { pauseHit } from "./render/hud";
import { bootSfx, persistSfx, playSfxCue, playUiClick, playWorldSfx, resetSfxPlayback, setSfxVolume, sfxMuted, sfxVolume, toggleSfxMuted } from "./render/sfx";
import { CUE_BOSS, CUE_SHIELD, sfxMuteLabel, sfxVolumePercent } from "./render/sfx-cues";
import { setMuted, unlockAudio } from "./render/sound";
import { renderBench } from "./shell/bench";
import { codexStamp, emptyCodex, loadCodex, observe, renderBook, saveCodex } from "./shell/codex";
import { applyCanvas, screenToGame, type Fit } from "./shell/fit";
import { mountPicker, paintPicker } from "./shell/picker";
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
  closeCodex,
  closeWorkshop,
  createSession,
  finish,
  loadStore,
  onBlur,
  openCodex,
  openWorkshop,
  PHASE_OVER,
  PHASE_PAUSE,
  PHASE_PLAY,
  PHASE_TITLE,
  PHASE_WORKSHOP,
  shouldStep,
  syncStore,
  toggleMute,
  toggleNumbers,
  togglePause,
  toggleShake,
} from "./shell/session";
import { resetShake } from "./render/shake";
import { mountBriefing } from "./shell/briefing";
import { devSeconds, loadCrown, markWon, saveCrown, toggleEndless } from "./shell/crown";
import { loadGuideSeen, saveGuideSeen } from "./shell/guide";
import {
  applyRun,
  dayKey,
  freshQuests,
  loadQuests,
  openRun,
  questBoard,
  rollDay,
  saveQuests,
  snapshotRun,
} from "./shell/quests";
import { createStick, liftStick, moveStick, pressStick, showRestStick } from "./shell/stick";
import {
  CHAR_TINKER,
  characterAt,
  isUnlocked,
  loadRoster,
  noteWave,
  offerCount,
  saveRoster,
} from "./sim/characters";
import { clock, tierName } from "./sim/difficulty";
import { armDevJump, isWon, killCount, setRunEndless, takeCue, victoryText } from "./sim/finale";
import { fillHorde, HORDE_BULLETS, HORDE_ZOMBIES } from "./sim/horde";
import {
  hasMod,
  loadMods,
  MOD_LIST,
  modNames,
  saveMods,
  scoreBanner,
  scoreLabel,
  toggleMod,
} from "./sim/modifiers";
import { scrapEarned } from "./meta/scrap";
import { cardSlot, summaryText } from "./sim/progress";
import { rerollHit } from "./sim/reroll";
import { step } from "./sim/step.hot";
import { EV_KILL, EV_REVIVE, H, W, type Input } from "./sim/types";
import { createWorld } from "./sim/world";

function tryStore(): { getItem(k: string): string | null; setItem(k: string, v: string): void } | null {
  try { return window.localStorage; } catch { return null; }
}

const store = tryStore();
const saved = store ? loadStore(store) : { best: 0, muted: false, shake: true, numbers: true };
const roster = store ? loadRoster(store) : { index: CHAR_TINKER, bestWave: 0 };
const session = createSession(saved.best, saved.muted, saved.shake, saved.numbers);
const loadedShop = store ? loadWorkshop(store) : { shop: emptyWorkshop(), writable: true };
const shop = loadedShop.shop;
const shopWritable = loadedShop.writable;
let crown = store ? loadCrown(store) : { won: false, endless: false };
let mods = store ? loadMods(store) : 0;
const records = store ? loadLeaderboard(store) : emptyLeaderboard();
const tracker = createTracker();
let runLineText = "";
let runShare: string | null = null;
const codex = store ? loadCodex(store) : emptyCodex();
let codexDrawn = "";
function today(): string {
  return dayKey(new Date());
}
let questState = store ? loadQuests(store, today()) : freshQuests(today());
setMuted(session.muted);
bootSfx(store);
let survivor = roster.index;
let bestWave = roster.bestWave;

const canvas = document.getElementById("game") as HTMLCanvasElement;
const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
ctx.imageSmoothingEnabled = true;
const veil = document.getElementById("veil") as HTMLElement;
const headline = document.getElementById("headline") as HTMLElement;
const sub = document.getElementById("sub") as HTMLElement;
const goBtn = document.getElementById("go") as HTMLButtonElement;
const workshopBtn = document.getElementById("workshop") as HTMLButtonElement;
const backBtn = document.getElementById("back") as HTMLButtonElement;
const bench = document.getElementById("bench") as HTMLElement;
const opts = document.getElementById("opts") as HTMLElement;
const sfxBox = document.getElementById("sfx") as HTMLElement;
const muteBtn = document.getElementById("mute") as HTMLButtonElement;
const shakeBtn = document.getElementById("shake") as HTMLButtonElement;
const endlessBtn = document.getElementById("endless") as HTMLButtonElement;
const numbersBtn = document.getElementById("numbers") as HTMLButtonElement;
const summary = document.getElementById("summary") as HTMLElement;
const rosterEl = document.getElementById("roster") as HTMLElement;
const codexBtn = document.getElementById("codex") as HTMLButtonElement;
const book = document.getElementById("book") as HTMLElement;
const modRead = document.getElementById("mod-read") as HTMLElement;
const modsRoot = document.getElementById("mods") as HTMLElement;
const sfxMuteBtn = document.getElementById("sfx-mute") as HTMLButtonElement;
const sfxVol = document.getElementById("sfx-vol") as HTMLInputElement;
const panel = document.getElementById("panel") as HTMLElement;
const leader = mountLeaderboard(panel, () => presentBoard(records));
const joy = document.getElementById("joy") as HTMLElement;
const knob = document.getElementById("knob") as HTMLElement;
function dismissGuide(): boolean {
  if (!briefing.guideOpen()) return false;
  briefing.hideGuide();
  if (store) saveGuideSeen(store);
  return true;
}
const briefing = mountBriefing(() => {
  if (!dismissGuide()) return;
  unlockAudio();
  playUiClick();
  paint();
});
if ((!store || !loadGuideSeen(store)) && location.hash !== "#horde") briefing.showGuide();

function makeWorld(seed: number) {
  const next = createWorld(seed, survivor, mods);
  if (location.hash === "#horde") fillHorde(next, HORDE_ZOMBIES, HORDE_BULLETS);
  return next;
}

let world = makeWorld(1);
applyWorkshop(world, shop);
let fit: Fit = applyCanvas(canvas, ctx, innerWidth, innerHeight, devicePixelRatio || 1, W, H);
const keys = new Set<string>();
const input: Input = { dx: 0, dy: 0, pick: 0, reroll: 0 };
const stick = createStick();
let stickId = -1;
let pendingPick = 0;
let pendingReroll = 0;
let lastScrap = 0;
let lastBase = 0;
const STEP_MS = 1000 / 60;
let acc = 0;
let last = performance.now();

function persist(): void {
  if (!store) return;
  syncStore(session, store);
  saveWorkshop(store, shop, shopWritable);
  saveCrown(store, crown);
  saveRoster(store, survivor, bestWave);
  saveMods(store, mods);
  saveQuests(store, questState);
}

function noteCodex(): void {
  if (!observe(codex, world)) return;
  if (store) saveCodex(store, codex);
}

function paint(): void {
  const playing = session.phase === PHASE_PLAY;
  const fitting = session.phase === PHASE_WORKSHOP;
  veil.classList.toggle("on", !playing);
  const picking = (session.phase === PHASE_TITLE || session.phase === PHASE_OVER) && !session.codex && !fitting;
  modsRoot.hidden = !picking;
  modRead.hidden = !picking;
  goBtn.hidden = fitting;
  workshopBtn.hidden = fitting || session.codex || !(session.phase === PHASE_TITLE || session.phase === PHASE_OVER);
  backBtn.hidden = !fitting;
  bench.hidden = !fitting;
  opts.hidden = fitting;
  sfxBox.hidden = fitting;
  if (session.phase === PHASE_TITLE) {
    headline.textContent = "Arcadia: Gears of the Dead";
    sub.textContent = `Best ${session.best} · Scrap ${shop.scrap} · ${scoreLabel(mods)}`;
    goBtn.textContent = "Play";
  } else if (session.phase === PHASE_PAUSE) {
    headline.textContent = "Paused";
    sub.textContent = "Esc or tap Resume";
    goBtn.textContent = "Resume";
  } else if (session.phase === PHASE_OVER) {
    const runMul = scoreLabel(world.mods);
    if (isWon(world)) {
      headline.textContent = "The Lich Falls";
      sub.textContent = `${clock(world.tick)} · ${killCount(world)} KILLS · ${runMul}`;
    } else {
      headline.textContent = "The Gears Stop";
      sub.textContent = `Best ${session.best} · ${tierName(world.rank)} · ${clock(world.tick)} · ${runMul} · +${lastScrap} scrap`;
    }
    goBtn.textContent = "Play";
  } else if (fitting) {
    headline.textContent = "Workshop";
    sub.textContent = `Brass Scrap ${shop.scrap}`;
  }
  if (session.codex && (session.phase === PHASE_TITLE || session.phase === PHASE_OVER)) {
    headline.textContent = "Codex";
    sub.textContent = "Unions stay sealed until you forge them";
  }
  const menu = session.phase === PHASE_TITLE || session.phase === PHASE_OVER;
  if (picking) {
    const names = modNames(mods);
    const next = scoreLabel(mods);
    modRead.textContent = session.phase === PHASE_OVER
      ? `Next ${next}${names ? ` · ${names}` : ""}`
      : (names || "Optional modifiers");
    for (let i = 0; i < modButtons.length; i++) {
      const btn = modButtons[i];
      if (!btn) continue;
      const on = hasMod(mods, Number(btn.dataset.mod));
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    }
  }
  const overBody = session.phase === PHASE_OVER && !session.codex
    ? (isWon(world) ? victoryText(world, lastBase) : summaryText(world))
    : "";
  const over = overBody.length > 0 ? `${scoreBanner(world.mods)}\n${overBody}` : "";
  summary.hidden = over.length === 0;
  summary.textContent = over;
  const showRoster = menu && !session.codex;
  rosterEl.hidden = !showRoster;
  if (showRoster) paintPicker(rosterEl, survivor, bestWave);
  codexBtn.hidden = !menu;
  codexBtn.textContent = session.codex ? "Back" : "Codex";
  codexBtn.setAttribute("aria-expanded", session.codex ? "true" : "false");
  const showBook = menu && session.codex;
  book.hidden = !showBook;
  if (showBook) {
    const stamp = codexStamp(codex);
    if (stamp !== codexDrawn) {
      renderBook(book, codex);
      codexDrawn = stamp;
    }
  }
  muteBtn.textContent = session.muted ? "Muted" : "Sound";
  muteBtn.setAttribute("aria-pressed", session.muted ? "true" : "false");
  shakeBtn.textContent = session.shake ? "Screen shake: On" : "Screen shake: Off";
  shakeBtn.setAttribute("aria-pressed", session.shake ? "true" : "false");
  endlessBtn.hidden = !crown.won;
  endlessBtn.textContent = crown.endless ? "Endless: On" : "Endless: Off";
  endlessBtn.setAttribute("aria-pressed", crown.endless ? "true" : "false");
  numbersBtn.textContent = session.numbers ? "Damage numbers: On" : "Damage numbers: Off";
  numbersBtn.setAttribute("aria-pressed", session.numbers ? "true" : "false");
  setNumbersOn(session.numbers);
  sfxMuteBtn.textContent = sfxMuteLabel(sfxMuted());
  sfxMuteBtn.setAttribute("aria-pressed", sfxMuted() ? "true" : "false");
  if (document.activeElement !== sfxVol) sfxVol.value = String(sfxVolumePercent(sfxVolume()));
  leader.sync({
    phase: session.phase,
    line: session.phase === PHASE_OVER ? runLineText : "",
    share: session.phase === PHASE_OVER ? runShare : null,
  });
  questState = rollDay(questState, today());
  const showQuests = (session.phase === PHASE_TITLE || session.phase === PHASE_OVER) && !session.codex;
  briefing.setQuests(questBoard(questState), showQuests);
  setMusicOn(playing || session.phase === PHASE_TITLE || fitting);
  setMusicWave(playing ? Math.max(world.wave, world.rank) : 0);
}

function buyFitting(id: number): void {
  if (!tryBuy(shop, id)) return;
  persist();
  renderBench(bench, shop, buyFitting);
  paint();
}

function showWorkshop(): void {
  unlockAudio();
  if (!openWorkshop(session)) return;
  renderBench(bench, shop, buyFitting);
  playUiClick();
  paint();
}

function leaveWorkshop(): void {
  closeWorkshop(session);
  playUiClick();
  paint();
}

function startRun(): void {
  if (session.phase === PHASE_WORKSHOP) return;
  dismissGuide();
  unlockAudio();
  leader.close();
  closeCodex(session);
  const reset = begin(session);
  if (reset) {
    questState = openRun(rollDay(questState, today()));
    const seedQuery = import.meta.env.DEV ? Number(new URLSearchParams(location.search).get("seed")) : NaN;
    const seed = Number.isFinite(seedQuery) && seedQuery > 0 ? seedQuery >>> 0 : Date.now() >>> 0;
    world = makeWorld(seed);
    applyWorkshop(world, shop);
    const jump = devSeconds(location.search, import.meta.env.DEV);
    if (jump > 0) armDevJump(world, jump);
    setRunEndless(world, crown.endless);
    resetShake();
    acc = 0;
    pendingPick = 0;
    pendingReroll = 0;
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

function numbers(): void {
  unlockAudio();
  toggleNumbers(session);
  setNumbersOn(session.numbers);
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

function codexToggle(): void {
  unlockAudio();
  if (session.codex) closeCodex(session);
  else openCodex(session);
  playUiClick();
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
  if (world.events[EV_REVIVE]) playSfxCue(CUE_SHIELD);
  if (takeCue(world)) playSfxCue(CUE_BOSS);
}

function flipMod(bit: number): void {
  if (session.phase === PHASE_PLAY || session.phase === PHASE_PAUSE) return;
  unlockAudio();
  mods = toggleMod(mods, bit);
  playUiClick();
  persist();
  paint();
}

const modButtons: HTMLButtonElement[] = [];
for (let i = 0; i < MOD_LIST.length; i++) {
  const mod = MOD_LIST[i];
  if (!mod) continue;
  const btn = document.createElement("button");
  btn.type = "button";
  btn.dataset.mod = String(mod.bit);
  btn.textContent = `${mod.name} ${scoreLabel(mod.bit)}`;
  btn.title = mod.blurb;
  btn.setAttribute("aria-pressed", hasMod(mods, mod.bit) ? "true" : "false");
  const bit = mod.bit;
  btn.addEventListener("click", () => flipMod(bit));
  modsRoot.append(btn);
  modButtons.push(btn);
}

goBtn.addEventListener("click", startRun);
workshopBtn.addEventListener("click", showWorkshop);
backBtn.addEventListener("click", leaveWorkshop);
codexBtn.addEventListener("click", codexToggle);
muteBtn.addEventListener("click", mute);
shakeBtn.addEventListener("click", shake);
numbersBtn.addEventListener("click", numbers);
sfxMuteBtn.addEventListener("click", sfxMute);
sfxVol.addEventListener("input", sfxVolInput);
endlessBtn.addEventListener("click", endless);

addEventListener("keydown", (e) => {
  const inSfx = e.target instanceof HTMLElement && !!e.target.closest("#sfx");
  if (inSfx && e.key !== "Escape") return;
  const inMods = e.target instanceof HTMLElement && !!e.target.closest("#mods");
  if (inMods && e.key !== "Escape") return;
  const k = e.key.toLowerCase();
  if (briefing.guideOpen()) {
    if (k === "escape" || k === " " || k === "enter") {
      e.preventDefault();
      if (e.repeat) return;
      unlockAudio();
      if (dismissGuide()) playUiClick();
      paint();
    }
    return;
  }
  unlockAudio();
  paint();
  if (k === "escape") {
    e.preventDefault();
    if (e.repeat) return;
    if (session.phase === PHASE_WORKSHOP) {
      leaveWorkshop();
      return;
    }
    if (session.codex) {
      closeCodex(session);
      playUiClick();
      paint();
      return;
    }
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
  if (toggleFromKey(k, e.repeat)) {
    e.preventDefault();
    toggleFps();
    return;
  }
  if (k === "c" && (session.phase === PHASE_TITLE || session.phase === PHASE_OVER)) {
    codexToggle();
    return;
  }
  if (session.phase === PHASE_WORKSHOP) return;
  if (k === " " || k === "enter") {
    if (session.phase !== PHASE_PLAY) {
      const target = e.target;
      if (target instanceof HTMLElement && target.closest("#roster")) return;
      e.preventDefault();
      startRun();
    }
    return;
  }
  if (k === "r" && session.phase === PHASE_OVER) {
    startRun();
    return;
  }
  if (session.phase === PHASE_PLAY && world.choosing && k === "r" && !e.repeat) {
    pendingReroll = 1;
    return;
  }
  if (import.meta.env.DEV && session.phase === PHASE_PLAY && !e.repeat && (k === "b" || k === "n" || k === "e" || k === "v")) {
    const key = k;
    void import("./dev/lineup").then((m) => {
      if (key === "b") m.lineup(world);
      else if (key === "n") m.rush(world);
      else if (key === "e") m.stageOffer(world);
      else m.stageArmed(world);
    });
    return;
  }
  if (session.phase === PHASE_PLAY && world.choosing && e.key >= "1" && e.key <= String(offerCount(world))) {
    pendingPick = e.key.charCodeAt(0) - 48;
    return;
  }
  keys.add(k);
  if (k === "arrowup" || k === "arrowdown" || k === "arrowleft" || k === "arrowright") e.preventDefault();
});
addEventListener("keyup", (e) => keys.delete(e.key.toLowerCase()));

const fromHud = (t: EventTarget | null): boolean => t instanceof HTMLElement && !!t.closest("button, #sfx, #book");

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
    if (rerollHit(p.x, p.y)) pendingReroll = 1;
    else pendingPick = cardSlot(p.x, p.y, offerCount(world));
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
  noteFrame(now);
  acc += Math.min(250, now - last);
  last = now;
  setNumbersOn(session.numbers);
  if (shouldStep(session)) {
    if (!stick.on) {
      input.dx = (keys.has("d") || keys.has("arrowright") ? 1 : 0) - (keys.has("a") || keys.has("arrowleft") ? 1 : 0);
      input.dy = (keys.has("s") || keys.has("arrowdown") ? 1 : 0) - (keys.has("w") || keys.has("arrowup") ? 1 : 0);
    }
    while (acc >= STEP_MS) {
      input.pick = pendingPick;
      input.reroll = pendingReroll;
      step(world, input);
      noteKills(tracker, world.events[EV_KILL] ?? 0);
      pendingPick = 0;
      pendingReroll = 0;
      input.pick = 0;
      input.reroll = 0;
      acc -= STEP_MS;
      const reached = noteWave(bestWave, world.wave);
      const waveUp = reached !== bestWave;
      if (waveUp) bestWave = reached;
      sfx();
      if (isWon(world) && !crown.won) {
        crown = markWon(crown);
        persist();
        paint();
      }
      noteCodex();
      if (world.over) {
        lastBase = scrapEarned(world.tick, world.rank, world.kills);
        lastScrap = awardRun(shop, world);
        questState = applyRun(rollDay(questState, today()), snapshotRun({
          kills: killCount(world),
          tick: world.tick,
          upgrades: world.upgrades,
          score: world.score,
          level: world.level,
        }));
        finish(session, world.score);
        const settled = settleRun(records, captureRun({
          score: world.score,
          time: world.tick,
          tier: world.rank,
          kills: tracker.kills,
          upgrades: world.upgrades,
          character: characterAt(world.charId).id,
          mods: world.mods,
          workshop: world.workshop,
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
      if (waveUp) persist();
      if (stopRemaining() > 0) {
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

if (location.hash === "#horde") {
  begin(session);
  setRunEndless(world, crown.endless);
}
mountPicker(rosterEl, (index) => {
  if (session.phase !== PHASE_TITLE && session.phase !== PHASE_OVER) return;
  if (!isUnlocked(index, bestWave)) return;
  survivor = index;
  persist();
  paint();
});
paint();
requestAnimationFrame(frame);
