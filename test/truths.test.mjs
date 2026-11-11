import { test } from "node:test";
import assert from "node:assert/strict";
import * as C from "../src/core/index.js";
import { TRUTHS } from "../src/data/truths.js";

const adult = (seed) => { const s = C.newLife(seed); s.ageM = 30 * 12; s.ev = null; s.gold = 10000; return s; };
const until = (s, pred, n = 60) => { for (let i = 0; i < n && !pred(); i++) { s.ev = null; C.tick(s); } return pred(); };

test("a truth line opens only with that faction's trust, and is not part of the three drawn quests", () => {
  const s = adult("tr1");
  assert.ok(s.secrets.every((id) => !TRUTHS[id]));
  assert.ok(!until(s, () => s.ev?.id === "sq:truthChurch:0", 30), "no trust, no line");
  s.fac.church = 30;
  assert.ok(until(s, () => s.ev?.id === "sq:truthChurch:0"));
});

test("two finished truths bring the last realisation once; every step has a way out", () => {
  const s = adult("tr2");
  s.flags.truthChurch = true; s.flags.truthUnder = true;
  assert.ok(until(s, () => s.ev?.id === "truthFinal"));
  C.choose(s, 1);
  assert.ok(!until(s, () => s.ev?.id === "truthFinal", 24));
  for (const q of Object.values(TRUTHS)) for (const st of q.steps) assert.ok(st.o.some((o) => !o.need && !o.s && !o.risk));
});

test("one truth and floor 30 also bring the realisation", () => {
  const s = adult("tr3"); s.flags.truthResearch = true; s.c.floor = 30;
  assert.ok(until(s, () => s.ev?.id === "truthFinal"));
});
