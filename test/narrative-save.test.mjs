// Schema 3 (lives that remember, Task 1). Fixtures were saved by the sv 2 game at commit 74f39fc:
// v2-before = seed "fx-before" played to 30; v2-office-open = seed "fx-office", office worker at 30 with legacy
// chapter office:1 open; v2-office-done = seed "fx-done", legacy office chain finished (ch:office 5).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import * as C from "../src/core/index.js";

const raw = (f) => fs.readFileSync(new URL(`./fixtures/${f}.json`, import.meta.url), "utf8");

test("v2 loads as v3 and keeps gold, debt, rng and open event", () => {
  for (const f of ["v2-before", "v2-office-open", "v2-office-done"]) {
    const old = JSON.parse(raw(f)), s = C.deserialize(raw(f));
    assert.equal(old.sv, 2);
    assert.equal(s.sv, 3, f);
    for (const k of ["gold", "debt", "r", "ev"]) assert.deepEqual(s[k], old[k], `${f} ${k}`);
    assert.deepEqual(s.narrative, { v: 1, stories: {} });
    assert.deepEqual(s.relations, {});
    assert.ok(s.familyId && s.lifeId);
  }
});

test("a future schema does not load", () => {
  assert.equal(C.deserialize(JSON.stringify({ ...JSON.parse(raw("v2-before")), sv: 999 })), null);
});

test("migration is idempotent", () => {
  const once = C.migrate(JSON.parse(raw("v2-office-open")));
  assert.deepEqual(C.migrate(structuredClone(once)), once);
});

test("world month survives an heir", () => {
  const p = C.newLife("wm"); p.ageM = 40 * 12 + 5;
  const h = C.newHeir(p, "wm-h");
  assert.equal(C.worldMonth(h), C.worldMonth(p));
  assert.equal(C.worldMonth(p), (p.mon0 ?? 0) + p.ageM);
});

test("an heir keeps the family id and gets a new life id", () => {
  const p = C.newLife("fam"); p.ageM = 50 * 12;
  p.narrative.stories.x = { node: "a" }; p.relations.p1 = { trust: 5 };
  const h = C.newHeir(p, "fam-h");
  assert.equal(h.familyId, p.familyId);
  assert.notEqual(h.lifeId, p.lifeId);
  assert.deepEqual(h.narrative.stories, {});
  assert.deepEqual(h.relations, {});
});
