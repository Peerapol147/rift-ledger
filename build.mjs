// node build.mjs → play.html (one double-clickable file). Bundles only the pixelfx effects the game names.
import { readFileSync, writeFileSync } from "node:fs";
import esbuild from "../pixelfx-main/node_modules/esbuild/lib/main.js";
import { ELEMENTS, WEAPONS } from "./src/data.js";
import { PRESET, AMBIENT, HIT } from "./src/presets.js";

const used = new Set([...Object.values(ELEMENTS).flatMap((e) => e.fx), ...WEAPONS.map((w) => w.fx), ...Object.values(PRESET).flat(), ...Object.values(AMBIENT), ...HIT, "melee/claw-swipe", "spawn/poof"]);
const list = [...used].sort();
writeFileSync("src/fxreg.gen.js", list.map((n, i) => `import * as f${i} from "../../pixelfx-main/src/fx/${n}.js";`).join("\n") + `\nexport const REG = {${list.map((n, i) => `"${n}":f${i}`).join(",")}};\n`);
const out = await esbuild.build({ entryPoints: ["src/ui.js"], bundle: true, minify: true, format: "iife", target: "es2020", write: false, legalComments: "none" });
const js = out.outputFiles[0].text.replace(/<\/script/g, "<\\/script");
const license = "pixelfx (c) 2026 Patch, MIT License; portions (c) 2026 Hugo Duprez and rehan-remade, MIT License. See THIRD_PARTY.md";
writeFileSync("play.html", readFileSync("src/index.html", "utf8").replace("<script>/*BUNDLE*/</script>", () => `<!-- ${license} -->\n<script>${js}</script>`));
console.log(`play.html: ${(js.length / 1024).toFixed(0)} KB JS, ${list.length} effects`);
