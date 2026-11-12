import { test } from "node:test";
import assert from "node:assert/strict";
import * as C from "../src/core/index.js";
import { FOCUS } from "../src/data/stats.js";

const at = (seed, years) => { const s = C.newLife(seed); s.ageM = years * 12; s.ev = null; return s; };

test("every plan says what it grows and which kind of event it brings", () => {
  for (const [stage, table] of Object.entries(FOCUS)) for (const [id, p] of Object.entries(table)) {
    assert.ok(p.desc && p.desc.length > 10, `${stage}.${id} desc`);
    assert.ok(p.kinds?.length && p.kinds.every((k) => C.KINDS.includes(k)), `${stage}.${id} kinds`);
  }
});

test("a secondary plan opens at 13, never the main one, never hunting or work", () => {
  assert.deepEqual(C.focus2List(at("p12", 12)), []);
  const t = at("p15", 15); C.setFocus(t, "study");
  assert.ok(!C.focus2List(t).some((f) => f.id === "study"));
  const a = at("p30", 30);
  for (const id of ["work", "hunt"]) { C.setFocus2(a, id); assert.equal(a.focus2, null, id); }
  C.setFocus2(a, "social"); assert.equal(a.focus2, "social");
});

test("a secondary plan grows its stats at half the rate, and nothing else", () => {
  const main = at("half", 30), side = at("half", 30);
  C.setFocus(main, "train"); C.setFocus(side, "rest"); C.setFocus2(side, "train");
  const str0 = main.st.str, mind0 = side.mind;
  C.applyFocus(main, 1); C.applyFocus(side, 1);
  const restOnly = at("half", 30); C.setFocus(restOnly, "rest"); C.applyFocus(restOnly, 1);
  assert.equal(+(side.st.str - str0).toFixed(6), +((main.st.str - str0) / 2).toFixed(6));
  assert.equal(side.mind, restOnly.mind, "train's mind cost is not paid as a secondary");
  assert.ok(side.mind >= mind0);
});

test("moving the main plan onto the secondary clears the secondary", () => {
  const s = at("swap", 30); C.setFocus(s, "work"); C.setFocus2(s, "study");
  C.setFocus(s, "study");
  assert.equal(s.focus2, null);
});

test("a secondary that does not exist in the next stage clears", () => {
  const s = at("stage", 17); C.setFocus(s, "study"); C.setFocus2(s, "social");
  s.focus2 = "work"; // a teen-only id in spirit: 'work' is a teen plan but not allowed as an adult secondary
  s.ageM = 18 * 12; C.applyFocus(s, 1);
  assert.equal(s.focus2, null);
});
