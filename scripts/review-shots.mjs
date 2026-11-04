import { mkdirSync } from "node:fs";
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
await browser.close();
console.log(`wrote ${play}`);
