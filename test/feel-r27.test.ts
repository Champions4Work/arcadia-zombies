import { readFileSync } from "node:fs";
import { PLAYER_FLASH_MS } from "../src/render/juice";
import { PHONE_SHAKE_SCALE, setShakeView, shakeOffset } from "../src/render/shake";
import { hurtAlpha } from "../src/render/veil";
import { DASH_CD, DASH_PUSH, DASH_TICKS, dashActive } from "../src/sim/dash";
import { stepDash, tryDash } from "../src/sim/dash.hot";
import { createWorld } from "../src/sim/world";

const idle = { dx: 0, dy: 0 };

describe("feel r27 dash and juice", () => {
  it("bursts forward on dash input then cools down", () => {
    const w = createWorld(3);
    const x0 = w.px;
    tryDash(w, { dx: 1, dy: 0, dash: 1 });
    expect(dashActive(w)).toBe(true);
    expect(w.dashT).toBe(DASH_TICKS);
    while (dashActive(w)) stepDash(w);
    expect(w.px).toBeGreaterThan(x0 + DASH_PUSH * 2);
    expect(w.dashCd).toBe(DASH_CD);
    tryDash(w, { dx: 1, dy: 0, dash: 1 });
    expect(dashActive(w)).toBe(false);
  });

  it("keeps player hurt readable without a full-screen wash", () => {
    expect(PLAYER_FLASH_MS).toBeGreaterThanOrEqual(60);
    expect(hurtAlpha(45)).toBeLessThanOrEqual(0.28);
    const blit = readFileSync("src/render/blit.hot.ts", "utf8");
    expect(blit.includes("flashPix")).toBe(true);
    expect(blit.includes("0xffffffff")).toBe(false);
    const actors = readFileSync("src/render/actors.ts", "utf8");
    expect(actors.includes("hurtCd % 6")).toBe(false);
    expect(actors.includes("playerFlashAlpha")).toBe(true);
  });

  it("scales shake on phone widths", () => {
    setShakeView(390);
    const phone = shakeOffset(0.8, 4);
    setShakeView(480);
    const desk = shakeOffset(0.8, 4);
    expect(Math.abs(phone[0])).toBeLessThan(Math.abs(desk[0]) + 0.01);
    expect(PHONE_SHAKE_SCALE).toBeGreaterThan(0.5);
    expect(PHONE_SHAKE_SCALE).toBeLessThan(1);
  });

  it("ignores dash while choosing", () => {
    const w = createWorld(1);
    w.choosing = 1;
    tryDash(w, { dx: 1, dy: 0, dash: 1 });
    expect(dashActive(w)).toBe(false);
    w.choosing = 0;
    stepDash(w);
    void idle;
  });
});
