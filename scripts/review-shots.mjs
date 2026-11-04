import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "@playwright/test";

const dest = process.argv[2] ?? "docs/reviews/world-props";
const host = process.argv[3] ?? "http://127.0.0.1:5173";
mkdirSync(dest, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.addInitScript(() => {
  localStorage.setItem("arcadia.howto", "1");
  const apply = () => {
    const root = document.documentElement;
    root.style.setProperty("--safe-t", "47px");
    root.style.setProperty("--safe-b", "78px");
  };
  apply();
  document.addEventListener("DOMContentLoaded", apply);
});
await page.goto(`${host}/?shot=1`, { waitUntil: "domcontentloaded" });
const skip = page.locator("#guide-skip");
if (await skip.isVisible().catch(() => false)) await skip.click();
await page.waitForFunction(() => {
  const canvas = document.querySelector("#game");
  return !!canvas && "width" in canvas && Number(canvas.width) > 100;
}, { timeout: 20000 });
await page.waitForTimeout(1200);
const play = join(dest, "phone_390_play.png");
await page.screenshot({ path: play, clip: { x: 0, y: 0, width: 390, height: 844 } });
await page.keyboard.press("f");
await page.waitForTimeout(400);
const samples = [];
for (let i = 0; i < 12; i++) {
  await page.waitForTimeout(80);
  samples.push(await page.evaluate(() => ({
    fps: typeof globalThis.__azFps === "function" ? globalThis.__azFps() : -1,
    alive: typeof globalThis.__azAlive === "function" ? globalThis.__azAlive() : -1,
  })));
}
const fps = samples.map((s) => s.fps).filter((v) => v > 0);
const alive = samples.map((s) => s.alive).filter((v) => v >= 0);
const mid = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  return s[s.length >> 1] ?? 0;
};
const stats = {
  mid: mid(fps),
  avg: fps.length ? Math.round(fps.reduce((a, b) => a + b, 0) / fps.length) : 0,
  min: fps.length ? Math.min(...fps) : 0,
  max: fps.length ? Math.max(...fps) : 0,
  alive: mid(alive),
  samples: fps,
};
writeFileSync(join(dest, "world_props_fps.json"), `${JSON.stringify(stats, null, 2)}\n`);
await browser.close();
console.log(`wrote ${play}`);
console.log(JSON.stringify(stats));
