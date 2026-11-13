// Fixes from the review of the P1 review-fix round.
import { test } from "node:test";
import assert from "node:assert/strict";
import * as C from "../src/core/index.js";
import { ALL_EVENTS } from "../src/data/events/index.js";

const E = (id) => ALL_EVENTS.find((e) => e.id === id);
const mem = () => { const m = new Map(); return { get: (k) => m.get(k) ?? null, set: (k, v) => m.set(k, v),
  del: (k) => m.delete(k) }; };
const KEY = "riftledger.slot.v2.2";
const newer = () => JSON.stringify({ ...JSON.parse(C.serialize(C.newLife("n2"))), sv: C.SAVE_SV + 1 });

test("a newer backup behind an older primary is never rotated over", () => {
  const st = mem(), sl = C.slots(st), back = newer();
  st.set(KEY, C.serialize(C.newLife("old"))); st.set(KEY + ".bak", back);
  assert.equal(sl.status(2), "unsupported");
  assert.equal(sl.save(2, C.newLife("x")), false);
  assert.equal(st.get(KEY + ".bak"), back);
});

test("a locked slot exports the newer save that locked it", () => {
  const st = mem(), sl = C.slots(st), back = newer();
  st.set(KEY, "{\"v\":2,"); st.set(KEY + ".bak", back);
  assert.equal(sl.exportStr(2), back);
  const st2 = mem(), sl2 = C.slots(st2); st2.set(KEY + ".bak", back);
  assert.equal(sl2.exportStr(2), back);
});

test("a grown child does not come home from school", () => {
  const s = C.newLife("ks"); s.ageM = 48 * 12; s.c.kids = 1; s.c["at:kids"] = 20 * 12; s.c.kidAt = 20 * 12;
  assert.equal(C.eligible(s, E("adKidSchool")), false);
  s.c["at:kids"] = 40 * 12;
  assert.equal(C.eligible(s, E("adKidSchool")), true);
});

const retired = () => { const s = C.newLife("rt"); s.ageM = 30 * 12;
  s.hunter = { rank: 2, lv: 30, xp: 0, skills: [], cls: "knight" }; s.flags.stoppedHunting = true;
  s.guild = { id: "x", role: "member" }; return s; };
test("a retired hunter gets no gate-day scenes from the older files either", () => {
  const s = retired();
  for (const id of ["guildRivalGate", "firstParty", "licenseExam"]) assert.equal(C.eligible(s, E(id)), false, id);
});

test("team scenes need a team", () => {
  const s = C.newLife("tm"); s.ageM = 30 * 12; s.hunter = { rank: 2, lv: 30, xp: 0, skills: [], cls: "knight" };
  for (const id of ["k2PotionThief", "k2OldHunter"]) assert.equal(C.eligible(s, E(id)), false, id);
  s.party = { leader: { n: "ก", rank: 3 }, trust: 50, role: "member" };
  s.ageM = 45 * 12;
  assert.equal(C.eligible(s, E("k2OldHunter")), true);
});

test("workplace scenes need a job, and taking the severance ends it", () => {
  const s = C.newLife("wk"); s.ageM = 55 * 12; s.job = null;
  for (const id of ["lateLayoff", "k2Raffle", "midInvestTip"]) assert.equal(C.eligible(s, E(id)), false, id);
  s.ageM = 40 * 12; assert.equal(C.eligible(s, E("k2ScrapOffer")), false);
  const w = C.newLife("wk2"); w.ageM = 55 * 12; w.job = { id: "office", tier: 1, xp: 0 };
  assert.equal(C.eligible(w, E("lateLayoff")), true);
  C.openEvent(w, E("lateLayoff"));
  C.choose(w, w.ev.opts.findIndex((o) => o.l === "รับเงินชดเชยแล้วออก"));
  assert.equal(w.job, null);
});

test("after a failed look at the books, refusing the guild does not claim you sent real numbers", () => {
  const s = C.newLife("au"); s.ageM = 30 * 12; s.job = { id: "office", tier: 1, xp: 0 };
  C.startStory(s, "office");
  Object.assign(s.narrative.stories.office, { node: "audit", due: 0, vars: {} });
  s.ev = null; C.narrativeMonth(s);
  const refuse = s.ev.opts.find((o) => o.l === "ปฏิเสธ");
  assert.doesNotMatch(refuse.y.m, /ตัวเลขจริง/);
  const t = C.newLife("au2"); t.ageM = 30 * 12; t.job = { id: "office", tier: 1, xp: 0 };
  C.startStory(t, "office");
  Object.assign(t.narrative.stories.office, { node: "audit", due: 0, vars: { numbers: 1 } });
  t.ev = null; C.narrativeMonth(t);
  assert.match(t.ev.opts.find((o) => o.l === "ปฏิเสธ").y.m, /ตัวเลขจริง/);
});
