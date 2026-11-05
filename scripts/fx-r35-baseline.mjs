import { mkdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dest = process.argv[2] ?? resolve(root, "docs/reviews/fx-r35");
const before = resolve(root, process.argv[3] ?? "docs/reviews/fx-r32/phone_390_play.png");
const after = resolve(root, process.argv[4] ?? `${dest}/phone_390_play.png`);
const out = resolve(dest, "vs_baseline.png");
mkdirSync(dest, { recursive: true });

const steamClip = { x: 0, y: 292, width: 196, height: 210 };
const muzzleClip = { x: 108, y: 332, width: 176, height: 208 };

execFileSync(
  "python3",
  [
    "-c",
    `
from PIL import Image, ImageDraw
before = Image.open(${JSON.stringify(before)}).convert("RGB")
after = Image.open(${JSON.stringify(after)}).convert("RGB")
steam = ${JSON.stringify(steamClip)}
muzzle = ${JSON.stringify(muzzleClip)}

def crop(im, box):
    return im.crop((box["x"], box["y"], box["x"] + box["width"], box["y"] + box["height"]))

pairs = [
    ("STEAM baseline", crop(before, steam), "STEAM r35", crop(after, steam)),
    ("MUZZLE baseline", crop(before, muzzle), "MUZZLE r35", crop(after, muzzle)),
]
pad = 8
label_h = 22
rows = []
for left_label, left_im, right_label, right_im in pairs:
    row_h = max(left_im.height, right_im.height)
    w = left_im.width + right_im.width + pad * 3
    row = Image.new("RGB", (w, row_h + label_h + pad), (8, 8, 10))
    draw = ImageDraw.Draw(row)
    draw.text((pad, 4), left_label, fill=(240, 208, 128))
    draw.text((left_im.width + pad * 2, 4), right_label, fill=(240, 208, 128))
    row.paste(left_im, (pad, label_h))
    row.paste(right_im, (left_im.width + pad * 2, label_h))
    rows.append(row)
total_h = sum(r.height for r in rows) + pad
sheet = Image.new("RGB", (max(r.width for r in rows), total_h), (8, 8, 10))
y = 0
for r in rows:
    sheet.paste(r, (0, y))
    y += r.height
sheet.save(${JSON.stringify(out)})
`,
  ],
  { stdio: "inherit" },
);

const a = readFileSync(before);
const b = readFileSync(after);
if (a.equals(b)) {
  console.error("fx-r35 play shot is pixel-identical to baseline; iterate before PR");
  process.exit(2);
}
console.log(`wrote ${out}`);
