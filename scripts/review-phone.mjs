import { mkdirSync } from "node:fs";
import { chromium } from "@playwright/test";

const dest = process.argv[2] ?? "docs/reviews/hud-polish";
const host = process.argv[3] ?? "http://127.0.0.1:4173";
mkdirSync(dest, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 1,
});
await page.addInitScript(() => {
  localStorage.setItem("arcadia.howto", "1");
  const root = document.documentElement;
  root.style.setProperty("--safe-t", "0px");
  root.style.setProperty("--safe-b", "0px");
});
await page.goto(`${host}/?shot=1`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(900);
await page.screenshot({ path: `${dest}/phone_390_play.png` });
await browser.close();
console.log(`wrote ${dest}/phone_390_play.png`);
