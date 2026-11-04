import { computeFit, screenToGame } from "../src/shell/fit";
import { playView } from "../src/shell/play-view";
import {
  begin,
  BEST_KEY,
  createSession,
  finish,
  loadStore,
  MUTE_KEY,
  onBlur,
  SHAKE_KEY,
  PHASE_OVER,
  PHASE_PAUSE,
  PHASE_PLAY,
  PHASE_TITLE,
  shouldStep,
  syncStore,
  toggleMute,
  togglePause,
} from "../src/shell/session";
import { aimStick, createStick, liftStick, moveStick, pressStick, showRestStick, STICK_R } from "../src/shell/stick";

const mem = () => {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => (m.has(k) ? m.get(k) ?? null : null),
    setItem: (k: string, v: string) => { m.set(k, v); },
  };
};

describe("session phases", () => {
  it("starts on the title screen and does not step", () => {
    const s = createSession(12, false);
    expect(s.phase).toBe(PHASE_TITLE);
    expect(s.best).toBe(12);
    expect(shouldStep(s)).toBe(false);
  });

  it("Play from title starts a new run", () => {
    const s = createSession();
    expect(begin(s)).toBe(true);
    expect(s.phase).toBe(PHASE_PLAY);
    expect(shouldStep(s)).toBe(true);
    expect(begin(s)).toBe(false);
  });

  it("Esc toggles pause only while a run is live", () => {
    const s = createSession();
    togglePause(s);
    expect(s.phase).toBe(PHASE_TITLE);
    begin(s);
    togglePause(s);
    expect(s.phase).toBe(PHASE_PAUSE);
    expect(shouldStep(s)).toBe(false);
    togglePause(s);
    expect(s.phase).toBe(PHASE_PLAY);
  });

  it("Resume from pause does not reset the run", () => {
    const s = createSession();
    begin(s);
    togglePause(s);
    expect(begin(s)).toBe(false);
    expect(s.phase).toBe(PHASE_PLAY);
  });

  it("losing focus pauses a live run and leaves other phases alone", () => {
    const live = createSession();
    begin(live);
    onBlur(live);
    expect(live.phase).toBe(PHASE_PAUSE);
    onBlur(live);
    expect(live.phase).toBe(PHASE_PAUSE);
    const title = createSession();
    onBlur(title);
    expect(title.phase).toBe(PHASE_TITLE);
    const dead = createSession();
    begin(dead);
    finish(dead, 10);
    onBlur(dead);
    expect(dead.phase).toBe(PHASE_OVER);
  });

  it("game over records the last score and a new local best", () => {
    const s = createSession(40);
    begin(s);
    expect(finish(s, 90)).toBe(true);
    expect(s.phase).toBe(PHASE_OVER);
    expect(s.last).toBe(90);
    expect(s.best).toBe(90);
    expect(shouldStep(s)).toBe(false);
    expect(begin(s)).toBe(true);
    expect(s.phase).toBe(PHASE_PLAY);
    expect(finish(s, 20)).toBe(false);
    expect(s.last).toBe(20);
    expect(s.best).toBe(90);
  });

  it("game over is a no-op from the title screen", () => {
    const s = createSession(5);
    expect(finish(s, 99)).toBe(false);
    expect(s.phase).toBe(PHASE_TITLE);
    expect(s.best).toBe(5);
  });

  it("pause can still resolve into game over", () => {
    const s = createSession();
    begin(s);
    togglePause(s);
    expect(finish(s, 15)).toBe(true);
    expect(s.phase).toBe(PHASE_OVER);
    expect(s.best).toBe(15);
  });

  it("mute toggles and persists with the best score", () => {
    const s = createSession(7, false);
    const store = mem();
    toggleMute(s);
    expect(s.muted).toBe(true);
    syncStore(s, store);
    expect(store.getItem(BEST_KEY)).toBe("7");
    expect(store.getItem(MUTE_KEY)).toBe("1");
    expect(loadStore(store)).toEqual({ best: 7, muted: true, shake: true, numbers: true, reduceMotion: false });
    expect(store.getItem(SHAKE_KEY)).toBe("1");
    store.setItem(BEST_KEY, "nope");
    expect(loadStore(store).best).toBe(0);
  });
});

describe("virtual stick", () => {
  it("maps a press along the radius to unit input and clamps past the rim", () => {
    expect(aimStick(0, 0, 0, 0, STICK_R)).toEqual({ dx: 0, dy: 0 });
    expect(aimStick(10, 10, 10 + STICK_R, 10, STICK_R)).toEqual({ dx: 1, dy: 0 });
    const far = aimStick(0, 0, 200, 0, STICK_R);
    expect(far.dx).toBe(1);
    expect(far.dy).toBe(0);
    const diag = aimStick(0, 0, 3, 4, 5);
    expect(diag.dx).toBeCloseTo(0.6);
    expect(diag.dy).toBeCloseTo(0.8);
  });

  it("tracks press, move, and lift on a stick handle", () => {
    const s = createStick();
    pressStick(s, 40, 80);
    expect(s.on).toBe(true);
    moveStick(s, 40 + STICK_R, 80);
    expect(s.dx).toBeCloseTo(1);
    expect(s.dy).toBeCloseTo(0);
    liftStick(s);
    expect(s.on).toBe(false);
    expect(s.dx).toBe(0);
    moveStick(s, 100, 100);
    expect(s.dx).toBe(0);
  });

  it("shows a resting stick on coarse, hoverless, or narrow viewports", () => {
    expect(showRestStick(1280, false, false)).toBe(false);
    expect(showRestStick(1280, true, false)).toBe(true);
    expect(showRestStick(1280, false, true)).toBe(true);
    expect(showRestStick(390, false, false)).toBe(true);
  });
});

describe("fullscreen fit", () => {
  it("fills a matching play view and still letterboxes a fixed 480x320 window", () => {
    const wide = computeFit(960, 640, 2, 480, 320);
    expect(wide.scale).toBe(2);
    expect(wide.ox).toBe(0);
    expect(wide.oy).toBe(0);
    expect(wide.bufW).toBe(1920);
    expect(wide.bufH).toBe(1280);
    const pv = playView(390, 844);
    const filled = computeFit(390, 844, 3, pv.viewW, pv.viewH);
    expect(filled.ox).toBeCloseTo(0);
    expect(filled.oy).toBeCloseTo(0);
    expect(filled.scale * pv.viewW).toBeCloseTo(390);
    expect(filled.scale * pv.viewH).toBeCloseTo(844);
    const phone = computeFit(390, 844, 3, 480, 320);
    expect(phone.scale).toBeCloseTo(390 / 480);
    expect(phone.ox).toBe(0);
    expect(phone.oy).toBeCloseTo((844 - 320 * (390 / 480)) / 2);
    expect(phone.bufW).toBe(1170);
    expect(phone.bufH).toBe(2532);
    const g = screenToGame(phone, 0, phone.oy);
    expect(g.x).toBeCloseTo(0);
    expect(g.y).toBeCloseTo(0);
  });
});
