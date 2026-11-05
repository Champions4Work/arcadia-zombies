import { pathToFileURL } from "node:url";
import { decodePngRgba } from "./midband_pixel_gate.mjs";

export function countBeltCargoPixels(pixels, width, height) {
  let amber = 0;
  let yellow = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const a = pixels[i + 3];
      if (a < 200) {
        continue;
      }
      if (r > 180 && g > 140 && b < 100 && r > b + 80) {
        yellow += 1;
      }
      if (r > 210 && g > 170 && b >= 100 && b <= 160) {
        amber += 1;
      }
    }
  }
  return { amber, yellow };
}

export function beltCargoGateOk(counts) {
  return counts.amber >= 80;
}

const isCli =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isCli) {
  const path = process.argv[2];
  if (!path) {
    console.error("usage: node scripts/belt_cargo_pixel_gate.mjs <belt_cargo_crop.png>");
    process.exit(1);
  }

  const { width, height, pixels } = decodePngRgba(path);
  const counts = countBeltCargoPixels(pixels, width, height);
  console.log(`amber=${counts.amber} yellow=${counts.yellow} size=${width}x${height}`);
  process.exit(beltCargoGateOk(counts) ? 0 : 1);
}
