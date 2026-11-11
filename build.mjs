// node build.mjs → play.html (one double-clickable file). Bundles only the pixelfx effects the game names.
// Effects come from vendor/pixelfx (MIT). Run `npm install` once for esbuild.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import esbuild from "esbuild";
import { ELEMENTS, CLASSES, MONSTERS } from "./src/data/index.js";
import { PRESET, AMBIENT, HIT, STYLE, LOOK } from "./src/presets.js";
import { classArt, careerArt } from "./src/ui/art.js";
import { CAREERS } from "./src/data/careers.js";

const fail = (msg) => { throw new Error(msg); };
const used = new Set([
  ...Object.values(ELEMENTS).flatMap((e) => e.fx), ...Object.values(PRESET).flat(), ...Object.values(AMBIENT), ...HIT,
  ...Object.values(STYLE).flatMap((s) => Object.values(s)), "melee/claw-swipe", "spawn/poof",
]);
const list = [...used].sort();

// Every class and career must have a picture and a fighting style.
const artIds = [...Object.keys(CLASSES).map(classArt), ...Object.keys(CAREERS).map(careerArt)];
const noStyle = artIds.filter((id) => !id || !STYLE[LOOK[id]]);
if (noStyle.length) fail(`No style in presets.js for art ids: ${noStyle.join(", ")}`);
const noArt = [...new Set(Object.values(MONSTERS).map((m) => m.art))].filter((a) => !existsSync(`art/monsters/${a}.png`));
if (noArt.length) fail(`Missing art/monsters picture: ${noArt.join(", ")}`);
// moves/* act out a whole stock character, critters/* are creatures: neither is a skill visual.
// Effects under rift/ are this game's own (src/fx/rift), the rest come from vendor/pixelfx.
const fxFile = (n) => (n.startsWith("rift/") ? `src/fx/${n}.js` : `vendor/pixelfx/src/fx/${n}.js`);
const fxImport = (n) => (n.startsWith("rift/") ? `./fx/${n}.js` : `../vendor/pixelfx/src/fx/${n}.js`);
const body = list.filter((n) => /^(moves|critters)\//.test(n) || /\bo\.actor\b/.test(readFileSync(fxFile(n), "utf8")));
if (body.length) fail(`These effects draw pixelfx's stock character, pick skill-only ones: ${body.join(", ")}`);

writeFileSync("src/fxreg.gen.js", list.map((n, i) => `import * as f${i} from "${fxImport(n)}";`).join("\n")
  + `\nexport const REG = {${list.map((n, i) => `"${n}":f${i}`).join(",")}};\n`);
const out = await esbuild.build({
  entryPoints: ["src/ui/main.js"], bundle: true, minify: true, format: "iife", target: "es2020",
  loader: { ".png": "dataurl" }, write: false, legalComments: "none",
});
const js = out.outputFiles[0].text.replace(/<\/script/g, "<\\/script");
const license = "pixelfx (c) 2026 Patch, MIT License; portions (c) 2026 Hugo Duprez and rehan-remade, MIT License. See THIRD_PARTY.md";
const html = readFileSync("src/index.html", "utf8").replace("<script>/*BUNDLE*/</script>", () => `<!-- ${license} -->\n<script>${js}</script>`);
writeFileSync("play.html", html);
console.log(`play.html: ${(js.length / 1024).toFixed(0)} KB JS, ${list.length} effects`);
