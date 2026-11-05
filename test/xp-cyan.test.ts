import { readFileSync } from "node:fs";

it("phone xp gradient uses literal hex stops", () => {
  const src = readFileSync("src/render/xp-gain.ts", "utf8");
  expect(src.includes('addColorStop(0, glowMs > 0 ? "#f0c878"')).toBe(true);
  expect(src.includes('addColorStop(0.55, glowMs > 0 ? "#f0b44a"')).toBe(true);
});
