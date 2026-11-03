import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
const budget = 60 * 1024;
const walk = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
const total = walk("dist").reduce((n, f) => n + gzipSync(readFileSync(f)).length, 0);
console.log(`bundle gzip: ${total} bytes / budget ${budget}`);
if (total > budget) { console.error("Bundle over budget"); process.exit(1); }
