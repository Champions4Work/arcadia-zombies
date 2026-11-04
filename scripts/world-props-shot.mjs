import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dest = process.argv[2] ?? resolve(root, "docs/reviews/world-props-r25");
const host = process.argv[3] ?? "http://127.0.0.1:4173";
mkdirSync(dest, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 1,
});
await page.addInitScript(() => {
  localStorage.setItem("arcadia.howto", "1");
  const rootEl = document.documentElement;
  rootEl.style.setProperty("--safe-t", "47px");
  rootEl.style.setProperty("--safe-b", "78px");
});
await page.goto(`${host}/?shot=1`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(900);
const playPath = `${dest}/phone_390_play.png`;
await page.screenshot({ path: playPath });
await browser.close();

const ref2 = resolve(root, "docs/target_look2.png");
execFileSync("node", ["scripts/compare-shots.mjs", playPath, ref2, `${dest}/compare_390_ref2.png`]);
console.log(`wrote ${playPath}`);
console.log(`wrote ${dest}/compare_390_ref2.png`);
