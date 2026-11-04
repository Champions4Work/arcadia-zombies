import { createWorld } from "../src/sim/world";
import { computeFit, worldToCss } from "../src/shell/fit";
import { layoutHud } from "../src/shell/hud-layout";
import { playView } from "../src/shell/play-view";
import { readViewport, ZERO_INSETS } from "../src/shell/viewport";
import {
  gemLive,
  resetXpGain,
  syncXpGain,
  tickXpGain,
  xpFillT,
  xpGlow,
  xpPop,
  xpShown,
  xpLevelText,
} from "../src/render/xp-gain";
import { EV_LEVEL, FX_XP } from "../src/sim/types";
import { pacedXpNeed } from "../src/sim/modifiers";
import { xpNeed } from "../src/sim/progress";

function hudScene() {
  const vp = readViewport({ innerWidth: 390, innerHeight: 844, devicePixelRatio: 3 }, ZERO_INSETS);
  const pv = playView(vp.cssW, vp.cssH);
  const fit = computeFit(vp.cssW, vp.cssH, vp.dpr, pv.viewW, pv.viewH, ZERO_INSETS);
  return { fit, hud: layoutHud(vp, fit) };
}

describe("xp gain juice", () => {
  it("flies gems into the bar, eases the fill, and pops on level up", () => {
    resetXpGain();
    const w = createWorld(1, 0, 0);
    const { fit, hud } = hudScene();
    w.arena.viewW = fit.viewW;
    w.arena.viewH = fit.viewH;
    w.fxKind[0] = FX_XP;
    w.fxX[0] = w.px + 40;
    w.fxY[0] = w.py;
    syncXpGain(w, hud, fit);
    w.xp = 3;
    syncXpGain(w, hud, fit);
    expect(gemLive()).toBeGreaterThan(0);
    expect(xpGlow()).toBeGreaterThan(0);
    const before = xpShown();
    for (let i = 0; i < 40; i++) tickXpGain(16, hud, w.xp);
    expect(xpShown()).toBeGreaterThan(before);
    expect(xpFillT(pacedXpNeed(xpNeed(w.level), w.mods))).toBeGreaterThan(0);
    w.level = 2;
    w.xp = 0;
    w.events[EV_LEVEL] = 1;
    syncXpGain(w, hud, fit);
    expect(xpPop().level).toBe(2);
    expect(xpPop().ms).toBeGreaterThan(0);
  });

  it("prints a 1-based LV label from the 0-based sim level", () => {
    expect(xpLevelText(0)).toBe("LV 1");
    expect(xpLevelText(2)).toBe("LV 3");
  });

  it("maps a world gem onto the CSS bar", () => {
    const { fit, hud } = hudScene();
    const css = worldToCss(fit, 0, 0, fit.viewW * 0.5, fit.viewH * 0.5);
    expect(css.x).toBeGreaterThan(hud.view.w * 0.2);
    expect(css.x).toBeLessThan(hud.view.w * 0.8);
    expect(css.y).toBeGreaterThan(hud.view.h * 0.2);
    expect(css.y).toBeLessThan(hud.view.h * 0.8);
  });
});
