import { test } from "node:test";
import assert from "node:assert/strict";
import { newLife, jobOffers, takeJob, workMonth, canPromote, promote, awakenCheck } from "../src/core/index.js";
import { CAREERS } from "../src/data/index.js";

const adult = (seed = "w") => { const s = newLife(seed); s.ageM = 25 * 12; return s; };

test("twelve careers, five tiers each, tier 4 needs a stat of 40+", () => {
  assert.equal(Object.keys(CAREERS).length, 12);
  for (const [id, c] of Object.entries(CAREERS)) {
    assert.equal(c.tiers.length, 5, id);
    assert.equal(c.pay.length, 5, id);
    assert.ok(Object.values(c.need[4]).some((v) => v >= 40), id);
  }
});

test("hunter hospital requires support role or heal skill", () => {
  const civ = adult();
  assert.ok(!jobOffers(civ).includes("hdoc"));
  for (let i = 0; i < 200; i++) {
    const s = adult("hd" + i);
    awakenCheck(s, "event");
    if (s.hunter.skills.includes("heal")) { assert.ok(jobOffers(s).includes("hdoc")); return; }
  }
  assert.fail("no healer rolled");
});

test("promotion needs xp and stats", () => {
  const s = adult();
  takeJob(s, "office");
  s.job.xp = 999;
  for (const k in s.st) s.st[k] = 1;
  assert.equal(canPromote(s), false);
  for (const k in s.st) s.st[k] = 99;
  assert.equal(canPromote(s), true);
  promote(s);
  assert.equal(s.job.tier, 1);
});

test("pay goes through ledger", () => {
  const s = adult();
  takeJob(s, "office");
  workMonth(s);
  assert.equal(s.ledger.at(-1).label, "เงินเดือน");
  assert.equal(s.ledger.at(-1).amt, CAREERS.office.pay[0]);
});
