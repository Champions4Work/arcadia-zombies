import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { chromium } from "@playwright/test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dest = process.argv[2] ?? "docs/reviews/art-r47";
const host = process.argv[3] ?? "http://127.0.0.1:4173";
mkdirSync(dest, { recursive: true });

const view = { w: 390, h: 844 };

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

async function writeTrio(browser, playPath, ref1Path, ref2Path, outPath) {
  const page = await browser.newPage({ viewport: { width: view.w * 3, height: view.h } });
  const play = dataUrl(playPath);
  const ref1 = dataUrl(ref1Path);
  const ref2 = dataUrl(ref2Path);
  await page.setContent(`<!doctype html>
<html><body style="margin:0;background:#070604;display:flex;font:700 11px/1 ui-sans-serif,system-ui,sans-serif;color:#f0d080">
<div style="position:relative;width:${view.w}px;height:${view.h}px"><img src="${ref1}" width="${view.w}" height="${view.h}"><div style="position:absolute;left:8px;top:8px;padding:3px 6px;background:#070604cc">REF 1</div></div>
<div style="position:relative;width:${view.w}px;height:${view.h}px"><img src="${play}" width="${view.w}" height="${view.h}"><div style="position:absolute;left:8px;top:8px;padding:3px 6px;background:#070604cc">PLAY</div></div>
<div style="position:relative;width:${view.w}px;height:${view.h}px"><img src="${ref2}" width="${view.w}" height="${view.h}"><div style="position:absolute;left:8px;top:8px;background:#070604cc">REF 2</div></div>
</body></html>`);
  await page.screenshot({ path: outPath });
  await page.close();
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: view.w, height: view.h },
  deviceScaleFactor: 1,
});
await page.addInitScript(() => {
  localStorage.setItem("arcadia.howto", "1");
  const root = document.documentElement;
  root.style.setProperty("--safe-t", "0px");
  root.style.setProperty("--safe-b", "0px");
});
await page.goto(`${host}/?shot=1`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1200);
const playPath = `${dest}/phone_390_play.png`;
await page.screenshot({ path: playPath });

const midbandPath = `${dest}/midband_crop.png`;
const heroCropPath = `${dest}/hero_crop.png`;
const propsCropPath = `${dest}/props_crop.png`;
execFileSync("python3", [
  "-c",
  `
from PIL import Image
im = Image.open(${JSON.stringify(playPath)}).convert("RGBA")
w, h = im.size
y0 = int(h * 0.22)
y1 = int(h * 0.58)
im.crop((0, y0, w, y1)).save(${JSON.stringify(midbandPath)})
cx, cy = w // 2, int(h * 0.42)
hw, hh = 120, 200
im.crop((max(0, cx - hw // 2), max(0, cy - hh // 2), min(w, cx + hw // 2), min(h, cy + hh // 2))).save(${JSON.stringify(heroCropPath)})
im.crop((0, int(h * 0.32), w, int(h * 0.62))).save(${JSON.stringify(propsCropPath)})
print(y0, y1, w)
`,
]);

try {
  const gateOut = execFileSync("node", ["scripts/midband_pixel_gate.mjs", midbandPath], {
    encoding: "utf8",
    cwd: root,
  });
  writeFileSync(`${dest}/midband_gate.txt`, gateOut);
  console.log(`midband gate ${gateOut.trim()}`);
} catch (e) {
  const gateOut = e.stdout?.toString?.() ?? "";
  if (gateOut) writeFileSync(`${dest}/midband_gate.txt`, gateOut);
  throw e;
}

const ref1 = resolve(root, "docs/target_look.jpg");
const ref2 = resolve(root, "docs/target_look2.png");
await writeCompare(browser, heroCropPath, ref1, `${dest}/hero_vs_ref1.png`, "HERO CROP", "REF 1");
await writeCompare(browser, propsCropPath, ref2, `${dest}/props_vs_ref2.png`, "PROPS CROP", "REF 2");
await writeCompare(
  browser,
  playPath,
  ref1,
  `${dest}/compare_390_ref1.png`,
  "PLAY 390",
  "REF 1",
);
await writeCompare(
  browser,
  playPath,
  ref2,
  `${dest}/compare_390_ref2.png`,
  "PLAY 390",
  "REF 2",
);
await writeTrio(browser, playPath, ref1, ref2, `${dest}/trio_ref1_play_ref2.png`);
await browser.close();

console.log(`wrote ${playPath}`);
console.log(`wrote ${midbandPath}`);
console.log(`wrote ${heroCropPath}`);
console.log(`wrote ${propsCropPath}`);
