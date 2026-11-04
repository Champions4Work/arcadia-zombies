import { showRestStick } from "../src/shell/stick";
import { applyCanvas, computeFit } from "../src/shell/fit";
import { SOOT } from "../src/shell/theme";
import { readFileSync } from "node:fs";
import { catalogHits } from "../src/art/catalog";
import { PX } from "../src/art/palette";

describe("style reset gates", () => {
  it("never parks a resting joystick on the playfield", () => {
    expect(showRestStick(390, true, true)).toBe(false);
    expect(showRestStick(1280, false, false)).toBe(false);
  });

  it("fills the letterbox with soot and disables smoothing", () => {
    const canvas = {
      style: {} as CSSStyleDeclaration,
      width: 0,
      height: 0,
    } as HTMLCanvasElement;
    const fills: string[] = [];
    let smooth = true;
    const ctx = {
      setTransform() {},
      fillRect() {},
      fillStyle: "",
      set imageSmoothingEnabled(v: boolean) { smooth = v; },
      get imageSmoothingEnabled() { return smooth; },
    } as unknown as CanvasRenderingContext2D;
    Object.defineProperty(ctx, "fillStyle", {
      set(v: string) { fills.push(String(v)); },
      get() { return fills[fills.length - 1] ?? ""; },
    });
    applyCanvas(canvas, ctx, 390, 844, 3, 320, 394);
    expect(fills).toContain(SOOT);
    expect(smooth).toBe(true);
    expect(computeFit(390, 844, 3, 320, 394).scale).toBeGreaterThan(0);
  });

  it("keeps every authored sprite on the locked palette", () => {
    expect(catalogHits()).toEqual([]);
    expect(PX.g).toBe("#2a2824");
    expect(PX.R).toBe("#e24a32");
    expect(PX.h).toBe("#3ec8c0");
  });

  it("locks the owner polish checklist in STYLE.md", () => {
    const bible = readFileSync("docs/STYLE.md", "utf8");
    expect(bible.includes("target_look.jpg")).toBe(true);
    expect(bible.includes("target_look2.png")).toBe(true);
    expect(bible.includes("heart_ring")).toBe(true);
    expect(bible.includes("muzzle flash")).toBe(true);
    expect(bible.includes("az_art_v2")).toBe(true);
    expect(bible.includes("power_slot")).toBe(true);
    expect(bible.includes("minimap_frame")).toBe(true);
  });
});
