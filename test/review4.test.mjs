// Regression tests for the Phase 4 review.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  newLife, awakenCheck, recruitOffers, hire, tick, setFocus, joinParty, openGateChoice, leaveParty, choose, loseAlly,
  moodWord, autoDecide, staffOffers, hireStaff, startOp, decide, stepOp, gateOffers, gateOp,
} from "../src/core/index.js";
import { CALENDAR } from "../src/data/index.js";

const hunter = (seed) => {
  const s = newLife(seed); s.ageM = 25 * 12; awakenCheck(s, "event"); s.gold = 1e6; s.c.famGift = 1;
  for (const e of CALENDAR) s.world.done[e.id] = 1;
  for (const k of ["ms6", "ms12", "ms15", "ms18", "ms22", "ms30"]) s.c["ev:" + k] = 1;
  return s;
};

test("C1 a hunt-focused hunter still pays team wages every month", () => {
  const s = hunter("c1"); hire(s, recruitOffers(s)[0]); setFocus(s, "hunt");
  for (let i = 0; i < 12; i++) { s.hp = 100; s.ev = null; s.op = null; tick(s); }
  assert.equal(s.ledger.filter((e) => e.label === "ค่าจ้างลูกทีม").length, 12);
});

test("I1 leaving a party while its event is open does not throw", () => {
  const s = hunter("i1"); joinParty(s, { n: "L", rank: 4, cls: "knight" });
  openGateChoice(s); leaveParty(s, "leave");
  assert.doesNotThrow(() => choose(s, 0));
});

test("I2 loyalty never goes negative and mood words are total", () => {
  const s = hunter("i2"); hire(s, recruitOffers(s)[0]); s.team[0].loyalty = 4;
  loseAlly(s, false);
  assert.ok(s.team[0].loyalty >= 0);
  assert.equal(typeof moodWord(-5), "string"); assert.equal(typeof moodWord(NaN), "string");
});

test("I3 unpaid staff lose loyalty", () => {
  const s = newLife("i3"); s.ageM = 40 * 12; s.flags.ownFirm = true; s.c.famGift = 1; for (const e of CALENDAR) s.world.done[e.id] = 1;
  s.gold = 1e5; hireStaff(s, staffOffers(s)[0]); s.gold = -1e6; s.debt = 1e9;
  const l0 = s.staff[0].loyalty; s.ev = null; tick(s);
  assert.ok(s.staff[0].loyalty < l0);
});

test("I4 a party offer is important", () => {
  const s = hunter("i4"); s.ageM = 25 * 12 + 5; setFocus(s, "train");
  for (let i = 0; i < 60 && s.ev?.id !== "partyOffer"; i++) { s.ev = null; tick(s); }
  if (s.ev?.id === "partyOffer") assert.equal(autoDecide(s, "important"), -1);
});

test("I5 abandoning an ally in a party costs trust", () => {
  const s = hunter("i5"); joinParty(s, { n: "L", rank: 4, cls: "knight" });
  const g = gateOffers(s)[0];
  startOp(s, gateOp(s, g), { plan: "careful", skills: [], quick: [], team: [], share: 0.4 });
  s.ev = { id: "opDecision", op: true, opts: [{ l: "ทิ้ง", lose: { ally: 1 }, y: {} }] };
  const t0 = s.party.trust; decide(s, 0);
  for (let i = 0; i < 200 && s.op; i++) { if (s.ev) choose(s, s.ev.opts.length - 1); else stepOp(s); }
  assert.ok(s.party === null || s.party.trust < t0);
});
