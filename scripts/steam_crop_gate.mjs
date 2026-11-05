import { decodePngRgba } from "./midband_pixel_gate.mjs";

export function countNearWhitePixels(pixels, width, height) {
  let white = 0;
  let valveRed = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const a = pixels[i + 3];
      if (a < 160) continue;
      if (r > 188 && g > 188 && b > 188) white += 1;
      if (r > 150 && g < 110 && b < 110 && r > g + 40) valveRed += 1;
    }
  }
  return { white, valveRed };
}

export function steamCropGateOk(counts, minWhite = 12, minValveRed = 8) {
  return counts.white >= minWhite && counts.valveRed >= minValveRed;
}

const isCli = process.argv[1]?.endsWith("steam_crop_gate.mjs");
if (isCli) {
  const path = process.argv[2];
  if (!path) {
    console.error("usage: node scripts/steam_crop_gate.mjs <steam_crop.png>");
    process.exit(1);
  }
  const { width, height, pixels } = decodePngRgba(path);
  const counts = countNearWhitePixels(pixels, width, height);
  console.log(`white=${counts.white} valveRed=${counts.valveRed} size=${width}x${height}`);
  process.exit(steamCropGateOk(counts) ? 0 : 1);
}
