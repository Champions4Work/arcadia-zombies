import { mkdirSync } from "node:fs";
import { chromium } from "@playwright/test";

const dest = process.argv[2] ?? "/opt/cursor/artifacts/ui-before";
const host = process.argv[3] ?? "http://127.0.0.1:5173";
mkdirSync(dest, { recursive: true });

const views = [
  { name: "desktop", w: 1280, h: 800 },
  { name: "phone", w: 390, h: 844 },
];

async function boot(browser, view) {
  const page = await browser.newPage({ viewport: { width: view.w, height: view.h } });
  await page.addInitScript(() => {
    localStorage.setItem("arcadia.howto", "1");
  });
  await page.goto(host, { waitUntil: "domcontentloaded" });
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
  await shot(page, `${p}-settings`);
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
  await page.locator("#lb-open").click();
  await page.waitForTimeout(200);
  await shot(page, `${p}-achievements`);
  await page.close();

  page = await boot(browser, view);
  await page.locator("#go").click();
  await page.waitForTimeout(500);
  await shot(page, `${p}-hud`);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(250);
  await shot(page, `${p}-pause`);
  await page.close();

  page = await boot(browser, view);
  await page.locator("#go").click();
  await page.waitForTimeout(350);
  await page.keyboard.press("e");
  await page.waitForTimeout(250);
  await shot(page, `${p}-cards`);
  await page.close();

  page = await boot(browser, view);
  await page.locator("#go").click();
  await page.waitForTimeout(350);
  await page.keyboard.press("h");
  await page.waitForTimeout(250);
  await shot(page, `${p}-chest`);
  await page.close();

  page = await boot(browser, view);
  await page.locator("#go").click();
  await page.waitForTimeout(350);
  await page.keyboard.press("k");
  await page.waitForTimeout(500);
  await shot(page, `${p}-end`);
  await page.close();
}

const browser = await chromium.launch({ headless: true });
for (const view of views) await capture(browser, view);
await browser.close();
console.log(`shots written to ${dest}`);
