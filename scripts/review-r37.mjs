import { mkdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { chromium } from "@playwright/test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dest = resolve(root, "docs/reviews/r37");
const host = process.argv[2] ?? "http://127.0.0.1:4173";
mkdirSync(dest, { recursive: true });

const view = { w: 390, h: 844 };
const midY0 = Math.round(view.h * 0.22);
const midY1 = Math.round(view.h * 0.58);
const midH = midY1 - midY0;

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
<div style="position:relative;width:${view.w}px;height:${view.h}px"><img src="${play}" width="${view.w}" height="${view.h}"><div style="position:absolute;left:8px;top:8px;background:#070604cc;padding:3px 6px">PLAY</div></div>
<div style="position:relative;width:${view.w}px;height:${view.h}px"><img src="${ref2}" width="${view.w}" height="${view.h}"><div style="position:absolute;left:8px;top:8px;padding:3px 6px;background:#070604cc">REF 2</div></div>
</body></html>`);
  await page.screenshot({ path: outPath });
  await page.close();
}

function sideBySide(left, right, out) {
  execFileSync("python3", [
    "-c",
    `
from PIL import Image
left = Image.open(${JSON.stringify(left)}).convert("RGB")
right = Image.open(${JSON.stringify(right)}).convert("RGB")
h = max(left.height, right.height)
def fit(im):
    w = max(1, round(im.width * h / im.height))
    return im.resize((w, h), Image.Resampling.LANCZOS)
a = fit(left)
b = fit(right)
out = Image.new("RGB", (a.width + b.width, h), (8, 8, 10))
out.paste(a, (0, 0))
out.paste(b, (a.width, 0))
out.save(${JSON.stringify(out)})
`,
  ]);
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: view.w, height: view.h },
  deviceScaleFactor: 1,
});
await page.addInitScript(() => {
  localStorage.setItem("arcadia.howto", "1");
  const rootEl = document.documentElement;
  rootEl.style.setProperty("--safe-t", "0px");
  rootEl.style.setProperty("--safe-b", "0px");
});
await page.goto(`${host}/?shot=1`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1200);
const playPath = `${dest}/phone_390_play.png`;
await page.screenshot({ path: playPath });
await page.screenshot({
  path: `${dest}/midband_crop.png`,
  clip: { x: 0, y: midY0, width: view.w, height: midH },
});
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
await writeTrio(
  browser,
  playPath,
  resolve(root, "docs/target_look.jpg"),
  resolve(root, "docs/target_look2.png"),
  `${dest}/trio_ref1_play_ref2.png`,
);

const mainFail = "/home/ubuntu/.cursor/projects/agent-repos-arcadia-zombies/assets/main_cyan_fail.png";
const r35Fail = "/home/ubuntu/.cursor/projects/agent-repos-arcadia-zombies/assets/r35_105_phone.png";

sideBySide(mainFail, playPath, `${dest}/vs_main_cyan.png`);
sideBySide(r35Fail, playPath, `${dest}/vs_r35_brown.png`);

await browser.close();
console.log(`wrote ${playPath}`);
console.log(`wrote ${dest}/midband_crop.png`);
console.log(`wrote ${dest}/vs_main_cyan.png`);
console.log(`wrote ${dest}/vs_r35_brown.png`);
