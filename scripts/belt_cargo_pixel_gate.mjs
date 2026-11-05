import { writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { decodePngRgba } from "./midband_pixel_gate.mjs";

export function countBeltCargoPixels(pixels, width, height) {
  let amber = 0;
  let goldHi = 0;
  let yellow = 0;
  let beltGold = 0;
  let chevronCube = 0;
  const beltY0 = Math.floor(height * 0.52);
  const cubeX1 = Math.floor(width * 0.55);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const o = (y * width + x) * 4;
      const r = pixels[o];
      const g = pixels[o + 1];
      const b = pixels[o + 2];
      const a = pixels[o + 3];
      if (a < 48) continue;
      if (r > 180 && g > 140 && b < 100 && r > b + 80) yellow += 1;
      const hi = r >= 210 && g >= 150 && b <= 110 && r > g + 25 && g > b + 35;
      if (hi) goldHi += 1;
      if (r >= 175 && g >= 95 && b <= 95 && r > g + 35 && g >= b + 15) amber += 1;
      if (y >= beltY0 && hi) beltGold += 1;
      if (x <= cubeX1 && y >= beltY0 && r >= 198 && g >= 148 && b >= 85 && b <= 130 && r > g + 5) chevronCube += 1;
    }
  }
  return { amber, goldHi, yellow, beltGold, chevronCube };
}

export function beltCargoGateOk(counts) {
  return counts.chevronCube >= 6 && counts.goldHi >= 8;
}

const isCli =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isCli) {
  const path = process.argv[2];
  const outPath = process.argv[3];
  if (!path) {
    console.error("usage: node scripts/belt_cargo_pixel_gate.mjs <belt_cargo_crop.png> [belt_cargo_gate.txt]");
    process.exit(1);
  }
  const { width, height, pixels } = decodePngRgba(path);
  const counts = countBeltCargoPixels(pixels, width, height);
  const line = `amber=${counts.amber} goldHi=${counts.goldHi} beltGold=${counts.beltGold} chevronCube=${counts.chevronCube} yellow=${counts.yellow} size=${width}x${height}`;
  console.log(line);
  if (outPath) writeFileSync(outPath, `${line}\n`);
  process.exit(beltCargoGateOk(counts) ? 0 : 1);
}
