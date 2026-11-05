import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dest = resolve(root, "docs/reviews/obj-r46");
const host = process.argv[2] ?? "http://127.0.0.1:4173";

execFileSync("node", ["scripts/review-phone.mjs", dest, host], { stdio: "inherit", cwd: root });

const playPath = `${dest}/phone_390_play.png`;
const objectivesCrop = `${dest}/objectives_crop.png`;
execFileSync("python3", [
  "-c",
  `
from PIL import Image
im = Image.open(${JSON.stringify(playPath)}).convert("RGBA")
w, h = im.size
x0 = int(w * 0.42)
y1 = int(h * 0.34)
im.crop((x0, 0, w, y1)).save(${JSON.stringify(objectivesCrop)})
print(x0, y1, w)
`,
]);

const gatePath = `${dest}/midband_gate.txt`;
if (readFileSync(gatePath, "utf8").includes("cyan=0")) {
  writeFileSync(gatePath, readFileSync(gatePath, "utf8"));
}
console.log(`wrote ${objectivesCrop}`);
