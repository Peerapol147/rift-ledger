import { test } from "node:test";
import assert from "node:assert/strict";
import { newLife, openEvent, choose, facWord, val, gatePayMul } from "../src/core/index.js";

test("standing starts at 0 and outcomes move it, directly and through mapped counters", () => {
  const s = newLife("fa"); s.ageM = 30 * 12;
  assert.equal(val(s, "fac:assoc"), 0);
  openEvent(s, { id: "x", t: "t", o: [{ l: "a", y: { fac: { state: 5 }, flags: { blackMarket: true } } }] });
  choose(s, 0);
  assert.equal(s.fac.state, 5);
  assert.ok(s.fac.under > 0 && s.fac.assoc < 0);
});

test("association standing changes gate pay; words carry no numbers", () => {
  const s = newLife("fb");
  s.fac.assoc = 40; assert.ok(gatePayMul(s) > 1);
  s.fac.assoc = -40; assert.ok(gatePayMul(s) < 1);
  for (const v of [-100, -30, 0, 30, 100]) assert.doesNotMatch(facWord(v), /\d/);
});
