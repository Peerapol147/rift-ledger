// Old age and debt (owner's play report): an old life with no job gets a state allowance, and interest stops
// growing a debt that is already past what anyone would lend.
import { test } from "node:test";
import assert from "node:assert/strict";
import * as C from "../src/core/index.js";

test("a life of 60 or more with no job gets an old-age allowance each month", () => {
  const s = C.newLife("old-allow"); s.ageM = 65 * 12; s.job = null; s.ev = null; s.gold = 10000; s.debt = 0;
  C.advance(s);
  assert.ok((s.ledger ?? []).some((l) => /เบี้ยผู้สูงอายุ/.test(l.label) && l.amt > 0));
});

test("interest does not grow a debt past what anyone would lend", () => {
  const s = C.newLife("debt-cap"); s.ageM = 70 * 12; s.ev = null; s.gold = 0;
  const cap = C.debtCap(s); s.debt = cap * 3;
  C.advance(s);
  assert.ok(s.debt <= cap * 3, `debt grew from ${cap * 3} to ${s.debt}`);
});
