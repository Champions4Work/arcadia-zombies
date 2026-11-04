import { mkdirSync } from "node:fs";
import { chromium } from "@playwright/test";

const dest = process.argv[2] ?? "/opt/cursor/artifacts";
const host = process.argv[3] ?? "http://127.0.0.1:5173";
mkdirSync(dest, { recursive: true });

const view = { w: 390, h: 844, safe: { t: 47, b: 78 } };

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: view.w, height: view.h } });
await page.addInitScript((safe) => {
  localStorage.setItem("arcadia.howto", "1");
  const apply = () => {
    const root = document.documentElement;
    root.style.setProperty("--safe-t", `${safe.t}px`);
    root.style.setProperty("--safe-b", `${safe.b}px`);
  };
  apply();
  document.addEventListener("DOMContentLoaded", apply);
}, view.safe);
await page.goto(`${host}/?e2e=1&shot=objectives`, { waitUntil: "domcontentloaded" });
const skip = page.locator("#guide-skip");
if (await skip.isVisible().catch(() => false)) await skip.click();
await page.locator("#go").click();
await page.waitForFunction(() => typeof globalThis.__arcadiaE2e?.stageObjectives === "function");
await page.evaluate(() => globalThis.__arcadiaE2e.stageObjectives());
await page.waitForTimeout(500);
await page.screenshot({ path: `${dest}/phone_390_objectives_play.png` });
await browser.close();
console.log(`wrote ${dest}/phone_390_objectives_play.png`);
