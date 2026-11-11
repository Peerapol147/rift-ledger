// node build.mjs → play.html (one double-clickable file). Bundles only the pixelfx effects the game names.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import esbuild from "../pixelfx-main/node_modules/esbuild/lib/main.js";
import { ELEMENTS, WEAPONS, CLASSES, CAREERS, MON, BOSS, PLACES } from "./src/data.js";
import { MONSTERS } from "./src/monsters.js";
import { PRESET, AMBIENT, HIT, STYLE, LOOK } from "./src/presets.js";

const used = new Set([...Object.values(ELEMENTS).flatMap((e) => e.fx), ...WEAPONS.map((w) => w.fx), ...Object.values(PRESET).flat(), ...Object.values(AMBIENT), ...HIT, ...Object.values(STYLE).flatMap((s) => Object.values(s)), "melee/claw-swipe", "spawn/poof"]);
const list = [...used].sort();
const missing = [...Object.keys(CLASSES), ...Object.keys(CAREERS)].filter((id) => !STYLE[LOOK[id]]);
if (missing.length) throw new Error(`No skill style in presets.js BY for: ${missing.join(", ")}`);
// moves/* act out a whole stock character, critters/* are creatures: neither is a skill visual.
const body = list.filter((n) => /^(moves|critters)\//.test(n) || /\bo\.actor\b/.test(readFileSync(`../pixelfx-main/src/fx/${n}.js`, "utf8")));
if (body.length) throw new Error(`These effects draw pixelfx's stock character, pick skill-only ones: ${body.join(", ")}`);
// Every creature the world tables name needs a row in monsters.js, and every row a picture on disk.
const noRow = [...MON, ...BOSS, ...PLACES.flatMap((p) => p.mon || [])].filter((n) => !MONSTERS[n]);
if (noRow.length) throw new Error(`No row in src/monsters.js for: ${[...new Set(noRow)].join(", ")}`);
const noArt = [...new Set(Object.values(MONSTERS).map((m) => m.art))].filter((a) => !existsSync(`art/monsters/${a}.png`));
if (noArt.length) throw new Error(`Missing art/monsters picture: ${noArt.join(", ")}`);
writeFileSync("src/fxreg.gen.js", list.map((n, i) => `import * as f${i} from "../../pixelfx-main/src/fx/${n}.js";`).join("\n") + `\nexport const REG = {${list.map((n, i) => `"${n}":f${i}`).join(",")}};\n`);
const out = await esbuild.build({ entryPoints: ["src/ui.js"], bundle: true, minify: true, format: "iife", target: "es2020", loader: { ".png": "dataurl" }, write: false, legalComments: "none" });
const js = out.outputFiles[0].text.replace(/<\/script/g, "<\\/script");
const license = "pixelfx (c) 2026 Patch, MIT License; portions (c) 2026 Hugo Duprez and rehan-remade, MIT License. See THIRD_PARTY.md";
writeFileSync("play.html", readFileSync("src/index.html", "utf8").replace("<script>/*BUNDLE*/</script>", () => `<!-- ${license} -->\n<script>${js}</script>`));
console.log(`play.html: ${(js.length / 1024).toFixed(0)} KB JS, ${list.length} effects`);
