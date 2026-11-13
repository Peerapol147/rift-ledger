// The main cast exists in every world (P2a Task 1). Spec: docs/superpowers/specs/2026-11-13-main-cast-design.md.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import * as C from "../src/core/index.js";
import { CAST } from "../src/data/cast.js";
import { GUILDS } from "../src/data/guilds.js";

const cast = (s) => Object.values(s.world.people).filter((p) => p.cast).sort((a, b) => a.cast.localeCompare(b.cast));
const shape = (p) => [p.cast, p.name, p.rank, p.cls, p.bornWorldM, p.country, p.city];

test("every seed has the same nine cast members", () => {
  const a = C.newLife("ca1"), b = C.newLife("ca2");
  assert.equal(cast(a).length, 9);
  assert.deepEqual(cast(a).map(shape), cast(b).map(shape));
  assert.deepEqual(cast(a).map((p) => p.cast).sort(), Object.keys(CAST).sort());
});

test("the record holders are poramet and seojin", () => {
  const s = C.newLife("ca3");
  const r = (id) => s.world.roster.find((n) => n.id === id);
  assert.equal(r("silentHolder").n, CAST.poramet.name);
  assert.equal(r("drownedHolder").n, CAST.seojin.name);
  assert.equal(C.personById(s, r("silentHolder").personId).cast, "poramet");
});

test("world draws are unchanged for everyone else", () => {
  const s = C.newLife("w1");
  const rest = s.world.roster.filter((n) => !["silentHolder", "drownedHolder"].includes(n.id))
    .map((n) => [n.id, n.n, n.rank, n.cls]);
  assert.deepEqual(rest, [["unmeasured", "ต้น", 7, "sovereign"], ["npc3", "ภาคิน", 4, "trapper"],
    ["npc4", "ภาคิน", 3, "appraiser"], ["npc5", "นาอึน", 4, "archer"], ["npc6", "ซูอา", 4, "fmage"],
    ["npc7", "นนท์", 4, "sharp"], ["npc8", "แพรว", 5, "healer"], ["npc9", "เอก", 2, "barrier"],
    ["npc10", "บอส", 3, "shield"], ["npc11", "เอก", 3, "fmage"]]);
});

test("an old save gets the cast once", () => {
  const raw = fs.readFileSync(new URL("./fixtures/v2-before.json", import.meta.url), "utf8");
  const s = C.deserialize(raw);
  assert.equal(cast(s).length, 9);
  assert.equal(cast(C.deserialize(C.serialize(s))).length, 9);
  assert.equal(Object.keys(C.deserialize(C.serialize(s)).world.people).length, Object.keys(s.world.people).length);
});

test("guild tiers are labels", () => {
  for (const list of Object.values(GUILDS)) for (const g of list) assert.ok(["legend", "major", "shadow"].includes(g.tier), g.id);
});

test("peers are not hunters before eighteen, and ranks start within their ceiling", () => {
  const s = C.newLife("ca4");
  for (const p of cast(s)) {
    assert.ok(p.rank <= p.ceiling, p.cast);
    if (CAST[p.cast].awakenAt) assert.equal(p.hunter, null, p.cast);
  }
});
