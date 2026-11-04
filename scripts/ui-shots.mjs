import { mkdirSync } from "node:fs";
import { chromium } from "@playwright/test";

const dest = process.argv[2] ?? "/opt/cursor/artifacts/ui-before";
const host = process.argv[3] ?? "http://127.0.0.1:5173";
mkdirSync(dest, { recursive: true });

const views = [
  { name: "desktop", w: 1280, h: 800, safe: { t: 0, b: 0 } },
  { name: "phone", w: 390, h: 844, safe: { t: 47, b: 78 } },
  { name: "phone-pro", w: 430, h: 932, safe: { t: 59, b: 80 } },
];

async function applySafe(page, safe) {
  await page.evaluate((next) => {
    const root = document.documentElement;
    root.style.setProperty("--safe-t", `${next.t}px`);
    root.style.setProperty("--safe-b", `${next.b}px`);
    window.dispatchEvent(new Event("resize"));
  }, safe);
}

async function boot(browser, view) {
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
  await page.goto(host, { waitUntil: "domcontentloaded" });
  await applySafe(page, view.safe);
  const skip = page.locator("#guide-skip");
  if (await skip.isVisible().catch(() => false)) await skip.click();
  await page.waitForTimeout(250);
  return page;
}

async function shot(page, name) {
  await page.screenshot({ path: `${dest}/${name}.png` });
}

async function capture(browser, view) {
  const p = view.name;
  let page = await boot(browser, view);
  await shot(page, `${p}-title`);
  await page.locator("#workshop").click();
  await page.waitForTimeout(200);
  await shot(page, `${p}-workshop`);
  await page.locator("#back").click();
  await page.waitForTimeout(120);
  await page.locator("#codex").click();
  await page.waitForTimeout(200);
  await shot(page, `${p}-codex`);
  await page.locator("#codex").click();
  await page.waitForTimeout(120);
  await page.close();

  page = await boot(browser, view);
  await page.locator("#go").click();
  await page.waitForTimeout(500);
  await applySafe(page, view.safe);
  await page.waitForTimeout(200);
  await shot(page, `${p}-hud`);
  await page.close();
}

const browser = await chromium.launch({ headless: true });
for (const view of views) await capture(browser, view);
await browser.close();
console.log(`shots written to ${dest}`);
