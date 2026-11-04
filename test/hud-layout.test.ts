import { computeFit } from "../src/shell/fit";
import {
  boxInside,
  boxesOverlap,
  hudBoxes,
  layoutHud,
  stickFrame,
} from "../src/shell/hud-layout";
import { menuChromeFits } from "../src/shell/menu-layout";
import { phoneChrome } from "../src/shell/phone";
import { readViewport, ZERO_INSETS } from "../src/shell/viewport";
import { H, W } from "../src/sim/types";

const PHONES = [
  { w: 390, h: 844, dpr: 3 },
  { w: 844, h: 390, dpr: 3 },
] as const;

function scene(w: number, h: number, dpr: number) {
  const vp = readViewport({ innerWidth: w, innerHeight: h, devicePixelRatio: dpr }, ZERO_INSETS);
  const fit = computeFit(vp.cssW, vp.cssH, vp.dpr, W, H, vp.safe);
  const hud = layoutHud(vp, fit);
  return { vp, fit, hud };
}

describe("viewport chrome", () => {
  it("keeps canvas, frame, HUD, and stick inside 390x844 and 844x390 with no HUD overlaps", () => {
    for (const phone of PHONES) {
      const { vp, fit, hud } = scene(phone.w, phone.h, phone.dpr);
      expect(fit.cssW).toBe(vp.cssW);
      expect(fit.cssH).toBe(vp.cssH);
      expect(fit.bufW).toBe(Math.round(vp.cssW * vp.dpr));
      expect(fit.bufH).toBe(Math.round(vp.cssH * vp.dpr));
      expect(boxInside(hud.view, { x: 0, y: 0, w: phone.w, h: phone.h })).toBe(true);
      expect(boxInside(hud.frame, hud.view, 0.5)).toBe(true);
      const boxes = hudBoxes(hud);
      for (const box of boxes) expect(boxInside(box, hud.view, 0.5)).toBe(true);
      for (let i = 0; i < boxes.length; i++) {
        for (let j = i + 1; j < boxes.length; j++) {
          expect(boxesOverlap(boxes[i]!, boxes[j]!)).toBe(false);
        }
      }
      expect(hud.hero.y + hud.hero.h).toBeLessThanOrEqual(hud.xp.y + 0.5);
      expect(hud.xp.y + hud.xp.h).toBeCloseTo(vp.cssH - vp.safe.b, 0);
      expect(hud.xp.w).toBeCloseTo(vp.cssW - vp.safe.l - vp.safe.r, 0);
      expect(hud.hero.x).toBeLessThan(vp.cssW * 0.4);
      const frame = stickFrame(hud);
      const chrome = phoneChrome(vp.cssW, vp.cssH, vp.safe.l, vp.safe.b, frame);
      const joy = {
        x: chrome.restX - chrome.joyR,
        y: chrome.restY - chrome.joyR,
        w: chrome.joyR * 2,
        h: chrome.joyR * 2,
      };
      expect(boxInside(joy, { x: 0, y: 0, w: vp.cssW, h: vp.cssH }, 1)).toBe(true);
      expect(joy.y + joy.h).toBeLessThanOrEqual(hud.xp.y + 1);
    }
  });

  it("reads visualViewport over inner size and keeps menu mute off the roster", () => {
    const vp = readViewport({
      innerWidth: 390,
      innerHeight: 900,
      devicePixelRatio: 3,
      visualViewport: { width: 390, height: 844 },
    }, { l: 0, r: 0, t: 47, b: 34 });
    expect(vp.cssW).toBe(390);
    expect(vp.cssH).toBe(844);
    expect(vp.safe.t).toBe(47);
    expect(menuChromeFits(390, 844, ZERO_INSETS, true)).toBe(true);
    expect(menuChromeFits(844, 390, ZERO_INSETS, false)).toBe(true);
  });
});
