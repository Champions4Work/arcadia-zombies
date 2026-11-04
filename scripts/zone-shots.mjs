import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dest = process.argv[2] ?? resolve(root, "docs/reviews/zones");
const host = process.argv[3] ?? "http://127.0.0.1:4173";
mkdirSync(dest, { recursive: true });

const zones = [
  { id: "brass", query: "shot=1", file: "phone_390_brass.png" },
  { id: "boiler", query: "shot=1&zone=boiler", file: "phone_390_boiler.png" },
  { id: "tram", query: "shot=1&zone=tram", file: "phone_390_tram.png" },
];

const browser = await chromium.launch({ headless: true });
for (const zone of zones) {
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
  });
  await page.addInitScript(() => {
    localStorage.setItem("arcadia.howto", "1");
    const rootEl = document.documentElement;
    rootEl.style.setProperty("--safe-t", "0px");
    rootEl.style.setProperty("--safe-b", "0px");
  });
  await page.goto(`${host}/?${zone.query}`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(900);
  const path = `${dest}/${zone.file}`;
  await page.screenshot({ path });
  await page.close();
  console.log(`wrote ${path}`);
}
await browser.close();
