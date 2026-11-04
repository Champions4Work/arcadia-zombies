import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { execFileSync } from "node:child_process";

const left = process.argv[2];
const right = process.argv[3];
const dest = process.argv[4];
if (!left || !right || !dest) {
  console.error("usage: compare-shots.mjs <play.png> <ref> <out.png>");
  process.exit(1);
}
mkdirSync(dirname(dest), { recursive: true });

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
out.save(${JSON.stringify(dest)})
print(a.height, b.height)
`,
]);
