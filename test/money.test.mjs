import { test } from "node:test";
import assert from "node:assert/strict";
import { newLife, living, borrow, repay, debtCap, monthSummary, takeJob, workMonth } from "../src/core/index.js";
import { playUntil } from "./helpers.mjs";

test("every gold change has a ledger line", () => {
  const s = newLife("g");
  s.flags.fullLedger = true;
  playUntil(s, (x) => x.ageM >= 45 * 12);
  const sum = s.ledger.reduce((a, e) => a + e.amt, 0);
  assert.equal(Math.round(s.gold), Math.round(sum));
});

test("no living cost before 18, cost after", () => {
  const s = newLife("l");
  s.ageM = 10 * 12; living(s); assert.equal(s.gold, 0);
  s.ageM = 20 * 12; living(s); assert.ok(s.ledger.some((e) => e.label === "ค่าครองชีพ"));
});

test("family support arrives once at 18", () => {
  const s = newLife("fam");
  playUntil(s, (x) => x.ageM >= 19 * 12);
  assert.equal(s.ledger.concat().filter((e) => e.label === "เงินตั้งตัวจากครอบครัว").length <= 1, true);
  assert.equal(s.c.famGift, 1);
});

test("borrow cap and repay", () => {
  const s = newLife("b"); s.ageM = 25 * 12;
  assert.equal(borrow(s, debtCap(s) + 1), false);
  assert.equal(borrow(s, 1000), true);
  assert.equal(s.debt, 1000);
  repay(s, 400);
  assert.equal(s.debt, 600);
});

test("month summary splits in and out", () => {
  const s = newLife("ms"); s.ageM = 25 * 12;
  takeJob(s, "office"); workMonth(s); living(s);
  const m = monthSummary(s);
  assert.ok(m.in.length && m.out.length);
  assert.equal(m.net, m.in.reduce((a, e) => a + e.amt, 0) + m.out.reduce((a, e) => a + e.amt, 0));
});
