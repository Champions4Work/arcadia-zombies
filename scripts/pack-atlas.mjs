import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const KEYS = " .ksipxbBdcnMmRyhgGtzWwFfureoa";
const root = "src/art";

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

const files = walk(root).filter((p) => p.endsWith(".ts"));
const hits = [];
for (const file of files) {
  const text = readFileSync(file, "utf8");
  const rows = text.matchAll(/["'`]([.ksipxbBdcnMmRyhgGtzWwFfureoa]{4,})["'`]/g);
  for (const m of rows) {
    const row = m[1] ?? "";
    for (const ch of row) {
      if (!KEYS.includes(ch)) hits.push(`${file}:${ch}`);
    }
  }
}
if (hits.length) {
  console.error(hits.join("\n"));
  process.exit(1);
}
console.log(`atlas sources ok (${files.length} files)`);
