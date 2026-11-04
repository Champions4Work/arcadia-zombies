import { readFileSync } from "node:fs";
import { createWorld } from "../src/sim/world";
import { drawHud } from "../src/render/hud";
import { bindHud, layoutHud } from "../src/shell/hud-layout";
import { computeFit } from "../src/shell/fit";
import { playView } from "../src/shell/play-view";
import { readViewport, ZERO_INSETS } from "../src/shell/viewport";

function stubCtx(texts: string[]): CanvasRenderingContext2D {
  const grad = { addColorStop() {} };
  const noop = () => {};
  const ctx: Record<string, unknown> = {
    canvas: { width: 390 },
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 1,
    font: "",
    textAlign: "left",
    textBaseline: "alphabetic",
    globalAlpha: 1,
    lineJoin: "round",
    lineCap: "round",
    fillText(text: string) { texts.push(text); },
    strokeText(text: string) { texts.push(text); },
    measureText(text: string) { return { width: String(text).length * 6 }; },
    createLinearGradient() { return grad; },
    createRadialGradient() { return grad; },
  };
  return new Proxy(ctx, {
    get(target, key) {
      if (key in target) return target[key as string];
      return noop;
    },
    set(target, key, value) {
      target[key as string] = value;
      return true;
    },
  }) as unknown as CanvasRenderingContext2D;
}

function bindPhone(): void {
  const vp = readViewport({ innerWidth: 390, innerHeight: 844, devicePixelRatio: 3 }, ZERO_INSETS);
  const pv = playView(vp.cssW, vp.cssH);
  const fit = computeFit(vp.cssW, vp.cssH, vp.dpr, pv.viewW, pv.viewH, ZERO_INSETS);
  bindHud(layoutHud(vp, fit));
}

describe("phone HUD chrome", () => {
  it("keeps heart, loadout, wave, and objectives and drops the energy bar", () => {
    const texts: string[] = [];
    bindPhone();
    const hud = layoutHud(
      readViewport({ innerWidth: 390, innerHeight: 844, devicePixelRatio: 3 }, ZERO_INSETS),
      computeFit(390, 844, 3, playView(390, 844).viewW, playView(390, 844).viewH, ZERO_INSETS),
    );
    expect(hud.face.w).toBe(0);
    expect(hud.hero.w).toBeGreaterThanOrEqual(52);
    expect(hud.weapons.h).toBeGreaterThanOrEqual(40);
    expect(hud.minimap.w).toBeGreaterThanOrEqual(80);
    expect(hud.xp.h).toBeGreaterThanOrEqual(18);
    drawHud(stubCtx(texts), createWorld(1));
    expect(texts).toContain("Objectives");
    expect(texts).toContain("Chapter 1");
    expect(texts).toContain("The Brass District");
    expect(texts.some((t) => t.startsWith("Wave "))).toBe(true);
    expect(texts).not.toContain("120/120");
    expect(texts).not.toContain("Q");
    expect(texts).not.toContain("E");
    expect(texts).not.toContain("R");
  });

  it("does not fill a same-color disc under the heart glyph", () => {
    const hud = readFileSync(new URL("../src/render/hud.ts", import.meta.url), "utf8");
    const start = hud.indexOf("function drawHealth");
    const body = hud.slice(start, hud.indexOf("function drawXp"));
    expect(body.includes("heartIcon")).toBe(true);
    expect(body.includes("ctx.arc(cx, cy, r * 0.58")).toBe(false);
    expect(body.includes("low ? DANGER : STEAM")).toBe(true);
  });
});
