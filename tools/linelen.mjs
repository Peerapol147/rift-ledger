// Lists lines over 120 characters in src/core and src/data. Exit 1 if any. node tools/linelen.mjs
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
const walk = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));
const bad = ["src/core", "src/data"].flatMap(walk).filter((f) => f.endsWith(".js")).flatMap((f) =>
  readFileSync(f, "utf8").split("\n").map((l, i) => [f, i + 1, [...l].length]).filter(([, , n]) => n > 120));
for (const [f, i, n] of bad) console.log(`${f}:${i} ${n}`);
process.exitCode = bad.length ? 1 : 0;
