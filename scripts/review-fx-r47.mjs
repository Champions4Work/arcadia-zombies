import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dest = resolve(root, "docs/reviews/fx-r47");
const host = process.argv[2] ?? "http://127.0.0.1:4173";

execFileSync("node", ["scripts/review-phone.mjs", dest, host], { stdio: "inherit", cwd: root });

const playPath = `${dest}/phone_390_play.png`;
const muzzleClip = { x: 108, y: 332, width: 176, height: 208 };
const bloodClip = { x: 0, y: 360, width: 390, height: 220 };

function cropPlay(box, outPath) {
  execFileSync("python3", [
    "-c",
    `
from PIL import Image
im = Image.open(${JSON.stringify(playPath)}).convert("RGBA")
box = ${JSON.stringify(box)}
im.crop((box["x"], box["y"], box["x"] + box["width"], box["y"] + box["height"])).save(${JSON.stringify(outPath)})
`,
  ]);
}

cropPlay(muzzleClip, `${dest}/muzzle_crop.png`);
cropPlay(bloodClip, `${dest}/blood_crop.png`);

const before = resolve(root, "docs/reviews/fx-r35/phone_390_play.png");
execFileSync("node", [resolve(root, "scripts/fx-r35-baseline.mjs"), dest, before, playPath]);

const midbandPath = `${dest}/midband_crop.png`;
const gateOut = execFileSync("node", ["scripts/midband_pixel_gate.mjs", midbandPath], { encoding: "utf8" });
writeFileSync(`${dest}/midband_gate.txt`, gateOut);
console.log(`midband gate ${gateOut.trim()}`);
console.log(`wrote ${dest}/muzzle_crop.png`);
console.log(`wrote ${dest}/blood_crop.png`);
console.log(`wrote ${dest}/vs_baseline.png`);
