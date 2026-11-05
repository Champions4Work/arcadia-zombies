import { writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { decodePngRgba } from "./midband_pixel_gate.mjs";

export function countSteamCropPixels(pixels, width, height) {
  let whiteish = 0;
  let valveRed = 0;
  let brass = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const o = (y * width + x) * 4;
      const r = pixels[o];
      const g = pixels[o + 1];
      const b = pixels[o + 2];
      const a = pixels[o + 3];
      if (a < 40) continue;
      if (r >= 115 && g >= 110 && b >= 105 && r + g + b >= 335) whiteish += 1;
      if (r >= 145 && g <= 115 && b <= 105 && r > g + 35 && r > b + 45) valveRed += 1;
      if (r >= 125 && g >= 70 && b <= 75 && r > b + 35 && g > b + 10) brass += 1;
    }
  }
  return { whiteish, valveRed, brass };
}

export function steamGateOk(counts) {
  return counts.whiteish >= 800 && counts.valveRed >= 36;
}

const isCli =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isCli) {
  const path = process.argv[2];
  const outPath = process.argv[3];
  if (!path) {
    console.error("usage: node scripts/steam_pixel_gate.mjs <steam_crop.png> [steam_gate.txt]");
    process.exit(1);
  }
  const { width, height, pixels } = decodePngRgba(path);
  const counts = countSteamCropPixels(pixels, width, height);
  const line = `whiteish=${counts.whiteish} valveRed=${counts.valveRed} brass=${counts.brass} size=${width}x${height}`;
  console.log(line);
  if (outPath) writeFileSync(outPath, `${line}\n`);
  process.exit(steamGateOk(counts) ? 0 : 1);
}
