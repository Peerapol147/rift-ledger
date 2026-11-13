// Events that must fit the life they reach (P1 review R3–R7), each with a case that must still open.
import { test } from "node:test";
import assert from "node:assert/strict";
import * as C from "../src/core/index.js";
import { ALL_EVENTS } from "../src/data/events/index.js";

const E = (id) => ALL_EVENTS.find((e) => e.id === id);
const OPS = ["k2LootSplit", "k2Rookie", "k2RookieLater", "k2Freeze", "k2BodyCam", "k2PotionThief", "k2Standby",
  "k2OldHunter"];
const hunter = (seed, extra = {}) => { const s = C.newLife(seed); s.ageM = 30 * 12;
  s.hunter = { rank: 3, lv: 40, xp: 0, skills: [], cls: "knight" }; s.c.gateRuns = 30; s.c.k2Rookie = 1;
  s.c["at:k2Rookie"] = 0; Object.assign(s.c, extra); return s; };
const pool = (s) => new Set(C.randomPool(s).map((e) => e.id));

test("a hunter who stopped hunting, or is on a break, gets no gate-work scenes", () => {
  const stopped = hunter("cx1"); stopped.flags.stoppedHunting = true;
  const resting = hunter("cx2", { huntBreakUntil: 30 * 12 + 6 });
  for (const s of [stopped, resting]) for (const id of OPS) assert.equal(C.eligible(s, E(id)), false, id);
});

test("an active hunter still gets them", () => {
  const s = hunter("cx3");
  for (const id of ["k2LootSplit", "k2Freeze", "k2BodyCam", "k2Standby"]) assert.equal(C.eligible(s, E(id)), true, id);
});

test("reporting the potion thief really stops hunting for three months", () => {
  const s = hunter("cx4"); s.ev = null;
  const ev = E("k2PotionThief");
  C.openEvent(s, ev);
  C.choose(s, s.ev.opts.findIndex((o) => o.l === "แจ้งสมาคม"));
  assert.equal(C.canHunt(s), false);
  s.ageM += 2; assert.equal(C.canHunt(s), false);
  const back = C.deserialize(C.serialize(s));
  assert.equal(C.canHunt(back), false);
  s.ageM += 1; assert.equal(C.canHunt(s), true);
});

test("a new hunter is not told of twenty past gates", () => {
  const rookie = hunter("cx5", { gateRuns: 0 }); rookie.hunter.rank = 0;
  assert.equal(C.eligible(rookie, E("k2Freeze")), false);
  assert.equal(C.eligible(hunter("cx6"), E("k2Freeze")), true);
});

test("a one-month-old is not back from school; a school-age child is", () => {
  const s = C.newLife("cx7"); s.ageM = 40 * 12; s.c.kids = 1; s.c["at:kids"] = s.ageM; s.c.kidAt = s.ageM;
  s.ageM += 1;
  assert.equal(C.eligible(s, E("adKidSchool")), false);
  s.ageM += 7 * 12;
  assert.equal(C.eligible(s, E("adKidSchool")), true);
});

test("without a job there is no boss asking you to teach", () => {
  const s = C.newLife("cx8"); s.ageM = 30 * 12; s.c.k2Course = 1; s.c["at:k2Course"] = 0;
  s.job = null;
  assert.equal(C.eligible(s, E("k2CourseLater")), false);
  s.job = { id: "office", tier: 1, xp: 0 };
  assert.equal(C.eligible(s, E("k2CourseLater")), true);
});
