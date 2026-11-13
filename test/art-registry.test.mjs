import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { MONSTERS } from "../src/data/monsters.js";

// src/monster-art.js imports PNGs (bundled by build.mjs), so Node cannot load it; read its ART table as text.
const src = readFileSync(new URL("../src/monster-art.js", import.meta.url), "utf8");
const table = src.slice(src.indexOf("const ART = {"), src.indexOf("};", src.indexOf("const ART = {")));
const registered = new Set([...table.matchAll(/"([a-z]+\/[a-z0-9-]+)":/g)].map((m) => m[1]));

test("every monster's picture is registered with the renderer", () => {
  const missing = [...new Set(Object.values(MONSTERS).map((m) => m.art))].filter((a) => !registered.has(a));
  assert.deepEqual(missing, []);
});
