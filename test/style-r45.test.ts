import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { PHONE_BOTTOM_CROP_FRAC } from "../src/render/hud-bottom";

describe("hud r45 orange sun ult ring", () => {
  it("uses brass heart_ring and paintPhoneUltSun without weapon badge or blue XP arc", () => {
    const bottom = readFileSync("src/render/hud-bottom.ts", "utf8");
    const ult = bottom.slice(bottom.indexOf("export function drawPhoneUlt"));
    expect(bottom.includes("paintPhoneUltSun")).toBe(true);
    expect(ult.includes("heart_ring")).toBe(true);
    expect(ult.includes("ultimate_button")).toBe(false);
    expect(ult.includes("badgeIcon")).toBe(false);
    expect(ult.includes("weaponBadge")).toBe(false);
    expect(ult.includes("ready ? XP")).toBe(false);
    expect(ult.includes("ULT_CHARGE_READY")).toBe(true);
  });

  it("stores hud-r45 review captures and passes ult orange pixel gate", () => {
    const dir = "docs/reviews/hud-r45";
    for (const name of ["phone_390_play.png", "hud_bottom_crop.png", "compare_390_ref1.png"]) {
      expect(readFileSync(`${dir}/${name}`, "utf8").length).toBeGreaterThan(4000);
    }
    expect(PHONE_BOTTOM_CROP_FRAC).toBe(0.28);
    const gate = execFileSync("node", ["scripts/hud_ult_pixel_gate.mjs", `${dir}/hud_bottom_crop.png`], {
      encoding: "utf8",
    });
    expect(gate).toMatch(/orange=\d+/);
    const orange = Number(gate.match(/orange=(\d+)/)?.[1] ?? 0);
    expect(orange).toBeGreaterThanOrEqual(420);
    expect(readFileSync(`${dir}/NOTE.md`, "utf8")).toMatch(/#122|hud-r42|r45/i);
  });
});
