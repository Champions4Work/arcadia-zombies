import { mkdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dest = process.argv[2] ?? resolve(root, "docs/reviews/fx-r46");
const baseline = resolve(root, process.argv[3] ?? "docs/reviews/fx-r35/phone_390_play.png");
const play = resolve(root, process.argv[4] ?? `${dest}/phone_390_play.png`);
const ref2 = resolve(root, "docs/target_look2.png");
mkdirSync(dest, { recursive: true });

const muzzleClip = { x: 108, y: 332, width: 176, height: 208 };
const bloodClip = { x: 0, y: 300, width: 390, height: 280 };

execFileSync(
  "python3",
  [
    "-c",
    `
from PIL import Image, ImageDraw
play_im = Image.open(${JSON.stringify(play)}).convert("RGB")
ref_im = Image.open(${JSON.stringify(ref2)}).convert("RGB")
baseline_im = Image.open(${JSON.stringify(baseline)}).convert("RGB")
muzzle = ${JSON.stringify(muzzleClip)}
blood = ${JSON.stringify(bloodClip)}

def crop(im, box):
    return im.crop((box["x"], box["y"], box["x"] + box["width"], box["y"] + box["height"]))

def label_row(left_label, left_im, right_label, right_im):
    pad = 8
    label_h = 22
    row_h = max(left_im.height, right_im.height)
    w = left_im.width + right_im.width + pad * 3
    row = Image.new("RGB", (w, row_h + label_h + pad), (8, 8, 10))
    draw = ImageDraw.Draw(row)
    draw.text((pad, 4), left_label, fill=(240, 208, 128))
    draw.text((left_im.width + pad * 2, 4), right_label, fill=(240, 208, 128))
    row.paste(left_im, (pad, label_h))
    row.paste(right_im, (left_im.width + pad * 2, label_h))
    return row

muzzle_play = crop(play_im, muzzle)
muzzle_ref = ref_im.crop((int(ref_im.width * 0.38), int(ref_im.height * 0.36), int(ref_im.width * 0.72), int(ref_im.height * 0.58)))
muzzle_play.save(${JSON.stringify(resolve(dest, "muzzle_crop.png"))})
blood_play = crop(play_im, blood)
blood_ref = ref_im.crop((int(ref_im.width * 0.08), int(ref_im.height * 0.42), int(ref_im.width * 0.92), int(ref_im.height * 0.78)))
blood_play.save(${JSON.stringify(resolve(dest, "blood_crop.png"))})

pairs = [
    ("MUZZLE play", muzzle_play, "REF2 muzzle", muzzle_ref.resize(muzzle_play.size)),
    ("BLOOD play", blood_play, "REF2 blood", blood_ref.resize(blood_play.size)),
    ("fx-r35 baseline", crop(baseline_im, muzzle), "fx-r46 play", muzzle_play),
]
rows = [label_row(a, b, c, d) for a, b, c, d in pairs]
total_h = sum(r.height for r in rows) + 8
sheet = Image.new("RGB", (max(r.width for r in rows), total_h), (8, 8, 10))
y = 0
for r in rows:
    sheet.paste(r, (0, y))
    y += r.height
sheet.save(${JSON.stringify(resolve(dest, "vs_baseline.png"))})
`,
  ],
  { stdio: "inherit" },
);

const a = readFileSync(baseline);
const b = readFileSync(play);
if (a.equals(b)) {
  console.error("fx-r46 play shot is pixel-identical to fx-r35 baseline; iterate before PR");
  process.exit(2);
}
console.log(`wrote ${dest}/muzzle_crop.png`);
console.log(`wrote ${dest}/blood_crop.png`);
console.log(`wrote ${dest}/vs_baseline.png`);
