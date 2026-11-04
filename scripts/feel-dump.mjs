import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { execFileSync } from "node:child_process";
import { chromium } from "@playwright/test";

const dest = process.argv[2] ?? "docs/reviews/feel";
const host = process.argv[3] ?? "http://127.0.0.1:4173";
const ref1 = process.argv[4] ?? "docs/target_look.jpg";
const ref2 = process.argv[5] ?? "docs/target_look2.png";
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
await page.goto(`${host}/?feel=1`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1200);

const dumps = [];
for (let i = 0; i < 12; i++) {
  await page.waitForTimeout(80);
  dumps.push(await page.evaluate(() => {
    const fps = globalThis.__azFps?.();
    const alive = globalThis.__azAlive?.();
    return { fps, alive };
  }));
}

await page.screenshot({ path: `${dest}/phone_390_play.png` });
await browser.close();

const alive = dumps.map((d) => d.alive ?? 0);
const last = dumps[dumps.length - 1]?.fps ?? { mid: 0, avg: 0, min: 0, max: 0 };
const out = {
  mid: last.mid ?? 0,
  avg: last.avg ?? 0,
  min: last.min ?? 0,
  max: last.max ?? 0,
  alive: alive[alive.length - 1] ?? 0,
  samples: dumps.map((d) => d.fps?.avg ?? 0),
};
writeFileSync(`${dest}/feel_fps.json`, `${JSON.stringify(out, null, 2)}\n`);

function compare(left, right, destPath) {
  mkdirSync(dirname(destPath), { recursive: true });
  execFileSync("node", ["scripts/compare-shots.mjs", left, right, destPath]);
}

compare(`${dest}/phone_390_play.png`, ref1, `${dest}/compare_390_ref1.png`);
compare(`${dest}/phone_390_play.png`, ref2, `${dest}/compare_390_ref2.png`);
console.log(`wrote ${dest} fps ${out.mid}/${out.avg}/${out.min}/${out.max} alive ${out.alive}`);
