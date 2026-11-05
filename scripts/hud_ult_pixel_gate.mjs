import { writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { decodePngRgba } from "./midband_pixel_gate.mjs";

export function countUltOrangePixels(pixels, width, height) {
  const x0 = Math.floor(width * 0.52);
  let orange = 0;
  let tealHeart = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const o = (y * width + x) * 4;
      const r = pixels[o];
      const g = pixels[o + 1];
      const b = pixels[o + 2];
      const a = pixels[o + 3];
      if (a < 48) continue;
      if (x >= x0 && r >= 150 && g >= 70 && b <= 120 && r > g + 18 && r > b + 40) orange += 1;
      if (x < width * 0.28 && g >= 150 && b >= 140 && g > r + 8 && b > r - 20) tealHeart += 1;
    }
  }
  return { orange, tealHeart, x0 };
}

export function ultGateOk(counts) {
  return counts.orange >= 420 && counts.tealHeart >= 80;
}

const isCli =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isCli) {
  const path = process.argv[2];
  const outPath = process.argv[3];
  if (!path) {
    console.error("usage: node scripts/hud_ult_pixel_gate.mjs <hud_bottom_crop.png> [ult_gate.txt]");
    process.exit(1);
  }
  const { width, height, pixels } = decodePngRgba(path);
  const counts = countUltOrangePixels(pixels, width, height);
  const line = `orange=${counts.orange} tealHeart=${counts.tealHeart} x0=${counts.x0} size=${width}x${height}`;
  console.log(line);
  if (outPath) writeFileSync(outPath, `${line}\n`);
  process.exit(ultGateOk(counts) ? 0 : 1);
}
