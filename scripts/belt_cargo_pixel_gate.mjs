import { writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { decodePngRgba } from "./midband_pixel_gate.mjs";

export function beltCargoGateOk(counts) {
  return counts.gold >= 48 && counts.warm >= 120;
}

export function countBeltCargoPixels(pixels, width, height) {
  let gold = 0;
  let amber = 0;
  let yellow = 0;
  let warm = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const o = (y * width + x) * 4;
      const r = pixels[o];
      const g = pixels[o + 1];
      const b = pixels[o + 2];
      const a = pixels[o + 3];
      if (a < 160) continue;
      if (r > 180 && g > 140 && b < 110 && r > b + 70 && g > b + 20) gold += 1;
      if (r > 200 && g > 110 && b < 90 && r > g + 35) amber += 1;
      if (r > 180 && g > 140 && b < 100 && r > b + 80) yellow += 1;
      if (r > 150 && g > 85 && b < 115 && r > g + 12 && r > b + 45) warm += 1;
    }
  }
  return { gold, amber, yellow, warm };
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
  const line = `gold=${counts.gold} amber=${counts.amber} yellow=${counts.yellow} warm=${counts.warm} size=${width}x${height}`;
  console.log(line);
  if (outPath) writeFileSync(outPath, `${line}\n`);
  process.exit(beltCargoGateOk(counts) ? 0 : 1);
}
