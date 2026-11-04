import { mkdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dest = process.argv[2] ?? resolve(root, "docs/reviews/objectives");
const host = process.argv[3] ?? "http://127.0.0.1:5173";
mkdirSync(dest, { recursive: true });

const view = { w: 390, h: 844, safe: { t: 47, b: 78 } };

function dataUrl(path) {
  const raw = readFileSync(path);
  const mime = path.endsWith(".jpg") || path.endsWith(".jpeg") ? "image/jpeg" : "image/png";
  return `data:${mime};base64,${raw.toString("base64")}`;
}

async function writeCompare(browser, playPath, refPath, outPath, playLabel, refLabel) {
  const page = await browser.newPage({ viewport: { width: view.w * 2, height: view.h } });
  const play = dataUrl(playPath);
  const ref = dataUrl(refPath);
  await page.setContent(`<!doctype html>
<html><body style="margin:0;background:#070604;display:flex;font:700 11px/1 ui-sans-serif,system-ui,sans-serif;color:#f0d080">
<div style="position:relative;width:${view.w}px;height:${view.h}px">
<img src="${play}" width="${view.w}" height="${view.h}" alt="${playLabel}">
<div style="position:absolute;left:8px;top:8px;padding:3px 6px;background:#070604cc">${playLabel}</div>
</div>
<div style="position:relative;width:${view.w}px;height:${view.h}px">
<img src="${ref}" width="${view.w}" height="${view.h}" alt="${refLabel}">
<div style="position:absolute;left:8px;top:8px;padding:3px 6px;background:#070604cc">${refLabel}</div>
</div>
</body></html>`);
  await page.screenshot({ path: outPath });
  await page.close();
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: view.w, height: view.h } });
await page.addInitScript((safe) => {
  localStorage.setItem("arcadia.howto", "1");
  const apply = () => {
    const rootEl = document.documentElement;
    rootEl.style.setProperty("--safe-t", `${safe.t}px`);
    rootEl.style.setProperty("--safe-b", `${safe.b}px`);
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
await page.waitForTimeout(240);
await page.evaluate(() => globalThis.__arcadiaE2e.stageObjectives());
await page.waitForTimeout(80);
const playPath = `${dest}/phone_390_play.png`;
await page.screenshot({ path: playPath });
await writeCompare(
  browser,
  playPath,
  resolve(root, "docs/target_look.jpg"),
  `${dest}/compare_390_ref1.png`,
  "PLAY 390",
  "REF 1",
);
await writeCompare(
  browser,
  playPath,
  resolve(root, "docs/target_look2.png"),
  `${dest}/compare_390_ref2.png`,
  "PLAY 390",
  "REF 2",
);

async function writeTrio(browser, playPath, ref1Path, ref2Path, outPath) {
  const page = await browser.newPage({ viewport: { width: view.w * 3, height: view.h } });
  const play = dataUrl(playPath);
  const ref1 = dataUrl(ref1Path);
  const ref2 = dataUrl(ref2Path);
  await page.setContent(`<!doctype html>
<html><body style="margin:0;background:#070604;display:flex;font:700 11px/1 ui-sans-serif,system-ui,sans-serif;color:#f0d080">
<div style="position:relative;width:${view.w}px;height:${view.h}px"><img src="${ref1}" width="${view.w}" height="${view.h}"><div style="position:absolute;left:8px;top:8px;padding:3px 6px;background:#070604cc">REF 1</div></div>
<div style="position:relative;width:${view.w}px;height:${view.h}px"><img src="${play}" width="${view.w}" height="${view.h}"><div style="position:absolute;left:8px;top:8px;padding:3px 6px;background:#070604cc">PLAY</div></div>
<div style="position:relative;width:${view.w}px;height:${view.h}px"><img src="${ref2}" width="${view.w}" height="${view.h}"><div style="position:absolute;left:8px;top:8px;padding:3px 6px;background:#070604cc">REF 2</div></div>
</body></html>`);
  await page.screenshot({ path: outPath });
  await page.close();
}

await writeTrio(
  browser,
  playPath,
  resolve(root, "docs/target_look.jpg"),
  resolve(root, "docs/target_look2.png"),
  `${dest}/trio_ref1_play_ref2.png`,
);

const heroPage = await browser.newPage({ viewport: { width: 390, height: 844 } });
await heroPage.goto(`${host}/?e2e=1&shot=objectives`, { waitUntil: "domcontentloaded" });
const skipHero = heroPage.locator("#guide-skip");
if (await skipHero.isVisible().catch(() => false)) await skipHero.click();
await heroPage.locator("#go").click();
await heroPage.waitForFunction(() => typeof globalThis.__arcadiaE2e?.stageObjectives === "function");
await heroPage.evaluate(() => globalThis.__arcadiaE2e.stageObjectives());
await heroPage.waitForTimeout(200);
await heroPage.screenshot({
  path: `${dest}/hero_crop.png`,
  clip: { x: 115, y: 340, width: 160, height: 200 },
});
await heroPage.close();

await browser.close();
console.log(`wrote ${playPath}`);
console.log(`wrote ${dest}/compare_390_ref1.png`);
console.log(`wrote ${dest}/compare_390_ref2.png`);
