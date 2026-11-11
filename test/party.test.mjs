import { test } from "node:test";
import assert from "node:assert/strict";
import { newLife, awakenCheck, joinParty, openGateChoice, choose, stepOp, partyMonth, leaveParty, recruitOffers, hire } from "../src/core/index.js";

const hunter = (seed = "pt") => { const s = newLife(seed); s.ageM = 25 * 12; awakenCheck(s, "event"); s.gold = 50000; return s; };

test("in a party the leader picks the gate and the player takes a smaller share", () => {
  const s = hunter();
  joinParty(s, { n: "หัวหน้า", rank: Math.min(6, s.hunter.rank + 2), cls: "knight" });
  openGateChoice(s);
  assert.equal(s.ev.id, "partyGate");
  const before = s.gold;
  choose(s, 0);
  assert.ok(s.op, "op started");
  assert.equal(s.op.prep.share, 0.4);
  while (s.op) { if (s.ev) choose(s, 0); else stepOp(s); }
  assert.ok(s.gold >= before);
});

test("trust promotes to vice and low trust gets the player kicked out", () => {
  const s = hunter("tr");
  joinParty(s, { n: "หัวหน้า", rank: 4, cls: "knight" });
  s.party.trust = 85; partyMonth(s);
  assert.equal(s.ev?.id, "partyVice");
  choose(s, 0);
  assert.equal(s.party.role, "vice");
  s.party.trust = 10; partyMonth(s);
  assert.equal(s.party, null);
});

test("no own hires while in a party; splitting brings a follower only with trust 60+", () => {
  const s = hunter("sp");
  joinParty(s, { n: "หัวหน้า", rank: 4, cls: "knight" });
  assert.equal(hire(s, recruitOffers(s)[0]), false);
  s.party.trust = 40; leaveParty(s, "split");
  assert.equal(s.team.length, 0);
  joinParty(s, { n: "หัวหน้า", rank: 4, cls: "knight" });
  s.party.trust = 70; leaveParty(s, "split");
  assert.equal(s.team.length, 1);
});
