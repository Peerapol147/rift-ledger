// Checks the art contract shared with other agents (see AGENTS.md). Exit 1 on any problem.
// node tools/artcheck.mjs
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { MONSTERS } from "../src/data/monsters.js";
import { CLASSES } from "../src/data/classes.js";

const bad = [];
const KINDS = ["beast", "construct", "spirit", "boss"];
const SIZES = ["56x56", "64x64"]; // square sprites; bosses may use the larger size

function dims(p) {
  const b = readFileSync(p);
  return b.readUInt32BE(0) === 0x89504e47 ? [b.readUInt32BE(16), b.readUInt32BE(20)] : null;
}

for (const [name, m] of Object.entries(MONSTERS)) {
  const p = `art/monsters/${m.art}.png`;
  if (!existsSync(p)) { bad.push(`${name}: missing ${p}`); continue; }
  const d = dims(p);
  if (!d) bad.push(`${p}: not a PNG`);
  else if (!SIZES.includes(d.join("x"))) bad.push(`${p}: ${d.join("x")}, want one of ${SIZES.join(", ")}`);
}
for (const c of Object.values(CLASSES)) if (!existsSync(`art/professions/${c.art}.png`)) bad.push(`class art missing: ${c.art}`);
for (const dir of KINDS.map((k) => `art/monsters/${k}`)) {
  for (const f of readdirSync(dir)) if (!/^[a-z0-9]+(-[a-z0-9]+)*\.png$/.test(f)) bad.push(`${dir}/${f}: name must be kebab-case .png`);
}
const req = JSON.parse(readFileSync("art/requests.json", "utf8"));
for (const r of req) {
  if (!["open", "done"].includes(r.status)) bad.push(`request ${r.id}: status must be open or done`);
  if (r.status === "done" && MONSTERS[r.name]?.borrow) bad.push(`request ${r.id} is done but ${r.name} still borrows art`);
  if (r.status === "open" && !MONSTERS[r.name]?.borrow) bad.push(`request ${r.id} is open but ${r.name} already has its own art`);
}
for (const b of bad) console.log(b);
console.log(bad.length ? `${bad.length} problem(s)` : `art ok · ${req.filter((r) => r.status === "open").length} open request(s)`);
process.exitCode = bad.length ? 1 : 0;
