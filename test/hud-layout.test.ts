import { computeFit } from "../src/shell/fit";
import {
  boxInside,
  boxesOverlap,
  hudBoxes,
  layoutHud,
  offerCards,
  offerHit,
  stickFrame,
} from "../src/shell/hud-layout";
import { menuChromeFits } from "../src/shell/menu-layout";
import { playChromeHidden, showMenuChrome } from "../src/shell/play-chrome";
import { PHASE_PLAY, PHASE_TITLE } from "../src/shell/session";
import { playView } from "../src/shell/play-view";
import { phoneChrome } from "../src/shell/phone";
import { readViewport, ZERO_INSETS } from "../src/shell/viewport";

const PHONES = [
  { w: 390, h: 844, dpr: 3 },
  { w: 844, h: 390, dpr: 3 },
] as const;

function scene(w: number, h: number, dpr: number) {
  const vp = readViewport({ innerWidth: w, innerHeight: h, devicePixelRatio: dpr }, ZERO_INSETS);
  const pv = playView(vp.cssW, vp.cssH);
  const fit = computeFit(vp.cssW, vp.cssH, vp.dpr, pv.viewW, pv.viewH, ZERO_INSETS);
  const hud = layoutHud(vp, fit);
  return { vp, fit, hud, pv };
}

describe("viewport chrome", () => {
  it("fills at least 90% of 390x844 and 844x390 with HUD overlaid and no overlaps", () => {
    for (const phone of PHONES) {
      const { vp, fit, hud } = scene(phone.w, phone.h, phone.dpr);
      expect(fit.cssW).toBe(vp.cssW);
      expect(fit.cssH).toBe(vp.cssH);
      expect(fit.bufW).toBe(Math.round(vp.cssW * vp.dpr));
      expect(fit.bufH).toBe(Math.round(vp.cssH * vp.dpr));
      expect(boxInside(hud.view, { x: 0, y: 0, w: phone.w, h: phone.h })).toBe(true);
      const visW = Math.min(hud.frame.x + hud.frame.w, vp.cssW) - Math.max(hud.frame.x, 0);
      const visH = Math.min(hud.frame.y + hud.frame.h, vp.cssH) - Math.max(hud.frame.y, 0);
      expect(visW).toBeGreaterThanOrEqual(vp.cssW * 0.9);
      expect(visH).toBeGreaterThanOrEqual(vp.cssH * 0.9);
      expect((visW * visH) / (vp.cssW * vp.cssH)).toBeGreaterThanOrEqual(0.9);
      const boxes = hudBoxes(hud);
      for (const box of boxes) expect(boxInside(box, hud.view, 0.5)).toBe(true);
      for (let i = 0; i < boxes.length; i++) {
        for (let j = i + 1; j < boxes.length; j++) {
          expect(boxesOverlap(boxes[i]!, boxes[j]!)).toBe(false);
        }
      }
      expect(hud.hero.y + hud.hero.h).toBeLessThanOrEqual(hud.xp.y + 0.5);
      expect(hud.xp.y + hud.xp.h).toBeCloseTo(vp.cssH - vp.safe.b, 0);
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

  it("hides mute and the volume slider while playing", () => {
    const play = playChromeHidden(true);
    expect(play.mute).toBe(true);
    expect(play.sfx).toBe(true);
    const menu = playChromeHidden(false);
    expect(menu.mute).toBe(false);
    expect(menu.sfx).toBe(false);
    expect(showMenuChrome(PHASE_PLAY)).toBe(false);
    expect(showMenuChrome(PHASE_TITLE)).toBe(true);
  });

  it("keeps offer cards on the view and hit-tests them without a stray overlay box", () => {
    const { hud } = scene(390, 844, 3);
    const cards = offerCards(hud.view, 2);
    expect(cards).toHaveLength(2);
    for (const card of cards) expect(boxInside(card, hud.view, 0.5)).toBe(true);
    const mid = cards[0]!;
    expect(offerHit(hud.view, 2, mid.x + mid.w / 2, mid.y + mid.h / 2)).toBe(1);
    expect(offerHit(hud.view, 2, 4, 4)).toBe(0);
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
