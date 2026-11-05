import { computeFit } from "../src/shell/fit";
import { hudHitAt, layoutHud, stickFrame } from "../src/shell/hud-layout";
import { readViewport, ZERO_INSETS } from "../src/shell/viewport";
import { playView } from "../src/shell/play-view";

it("e2e stick coords sit in playfield off phone bottom chrome", () => {
  const vp = readViewport({ innerWidth: 390, innerHeight: 844, devicePixelRatio: 3 }, ZERO_INSETS);
  const pv = playView(vp.cssW, vp.cssH);
  const fit = computeFit(vp.cssW, vp.cssH, vp.dpr, pv.viewW, pv.viewH, ZERO_INSETS);
  const hud = layoutHud(vp, fit);
  const frame = stickFrame(hud);
  const x = Math.min(110, 390 * 0.22);
  const y = 844 - Math.min(240, 844 * 0.32);
  expect(hudHitAt(hud, x, y)).toBe(false);
  expect(y).toBeLessThan(frame.y + frame.h);
  expect(y).toBeGreaterThan(frame.y);
});
