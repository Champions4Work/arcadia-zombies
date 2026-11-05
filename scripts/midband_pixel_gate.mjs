import { readFileSync } from "node:fs";
import { Buffer } from "node:buffer";
import { inflateSync } from "node:zlib";
import { pathToFileURL } from "node:url";

export function decodePngRgba(path) {
  const buf = readFileSync(path);
  let pos = 8;
  let width = 0;
  let height = 0;
  let colorType = 0;
  const idat = [];
  while (pos + 8 <= buf.length) {
    const len = buf.readUInt32BE(pos);
    pos += 4;
    const type = buf.toString("ascii", pos, pos + 4);
    pos += 4;
    const chunk = buf.subarray(pos, pos + len);
    pos += len + 4;
    if (type === "IHDR") {
      width = chunk.readUInt32BE(0);
      height = chunk.readUInt32BE(4);
      colorType = chunk[9];
    } else if (type === "IDAT") {
      idat.push(chunk);
    } else if (type === "IEND") {
      break;
    }
  }
  if (colorType !== 6) {
    throw new Error(`midband_pixel_gate: need RGBA PNG (color type 6), got ${colorType}`);
  }
  const raw = inflateSync(Buffer.concat(idat));
  const pixels = new Uint8Array(width * height * 4);
  const rowBytes = width * 4;
  let src = 0;
  const cur = new Uint8Array(rowBytes);
  const prev = new Uint8Array(rowBytes);
  for (let y = 0; y < height; y++) {
    const filter = raw[src++];
    for (let i = 0; i < rowBytes; i++) {
      cur[i] = raw[src++];
    }
    if (filter === 1) {
      for (let i = 4; i < rowBytes; i++) {
        cur[i] = (cur[i] + cur[i - 4]) & 255;
      }
    } else if (filter === 2) {
      for (let i = 0; i < rowBytes; i++) {
        cur[i] = (cur[i] + prev[i]) & 255;
      }
    } else if (filter === 3) {
      for (let i = 0; i < rowBytes; i++) {
        const left = i >= 4 ? cur[i - 4] : 0;
        cur[i] = (cur[i] + ((prev[i] + left) >> 1)) & 255;
      }
    } else if (filter === 4) {
      for (let i = 0; i < rowBytes; i++) {
        const left = i >= 4 ? cur[i - 4] : 0;
        const up = prev[i];
        const upLeft = i >= 4 ? prev[i - 4] : 0;
        cur[i] = (cur[i] + paeth(left, up, upLeft)) & 255;
      }
    }
    pixels.set(cur, y * rowBytes);
    prev.set(cur);
  }
  return { width, height, pixels };
}

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) {
    return a;
  }
  if (pb <= pc) {
    return b;
  }
  return c;
}

export function countMidbandPixels(pixels, width, height) {
  let cyan = 0;
  let blue = 0;
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
      if (
        r < 130 &&
        g > 200 &&
        b > 200 &&
        g >= b - 8 &&
        Math.abs(g - b) < 36 &&
        (g + b) / 2 > r + 60
      ) {
        cyan += 1;
      }
      if (b > 150 && r < 100 && g < 140 && b > g + 40 && b > r + 80) {
        blue += 1;
      }
      if (r > 180 && g > 140 && b < 100 && r > b + 80) {
        yellow += 1;
      }
    }
  }
  return { cyan, blue, yellow };
}

export function midbandGateOk(counts) {
  return counts.cyan === 0 && counts.blue >= 200;
}

const isCli =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isCli) {
  const path = process.argv[2];
  if (!path) {
    console.error("usage: node scripts/midband_pixel_gate.mjs <midband_crop.png>");
    process.exit(1);
  }

  const { width, height, pixels } = decodePngRgba(path);
  const counts = countMidbandPixels(pixels, width, height);
  console.log(`cyan=${counts.cyan} blue=${counts.blue} yellow=${counts.yellow} size=${width}x${height}`);
  process.exit(midbandGateOk(counts) ? 0 : 1);
}
