import { test } from "node:test";
import assert from "node:assert/strict";
import * as C from "../src/core/index.js";

const adult = () => { const s = C.newLife("mi"); s.ageM = 30 * 12; s.ev = null; s.job = { id: "office", tier: 0, xp: 0 }; return s; };

test("a worn-out mind makes stat checks harder; a rested one does not", () => {
  const s = adult(), opt = { l: "x", s: "cha", diff: 10, y: {} };
  s.mind = 80; const fresh = C.optionView(s, opt).odds;
  s.mind = 10; const tired = C.optionView(s, opt).odds;
  assert.ok(tired < fresh, `${tired} vs ${fresh}`);
});

test("a year of work wears mind down and a year of rest brings it back", () => {
  const s = adult(); s.mind = 80; C.setFocus(s, "work");
  for (let i = 0; i < 12; i++) { C.advance(s); s.ev = null; }
  const worked = s.mind;
  assert.ok(worked < 80, `mind after a year of work ${worked}`);
  C.setFocus(s, "rest");
  for (let i = 0; i < 12; i++) { C.advance(s); s.ev = null; }
  assert.ok(s.mind > worked);
});
