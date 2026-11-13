// Story engine hardening (P1 review Task D).
import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import * as C from "../src/core/index.js";

const ID = "hard";
const def = () => ({
  id: ID, title: "t", discover: () => true, entry: "a", cast: {},
  nodes: {
    a: { t: "a", delay: [0, 0], o: [{ l: "x", s: "luk", diff: 5, y: { m: "y", gold: 500, st: { int: 1 }, go: "b" },
      n: { m: "n", gold: 500, go: "b" } }] },
    b: { t: "b", delay: [0, 0], o: [{ l: "จบ", y: { m: "จบ", end: "e" } }] },
  },
  endings: { e: { title: "e" } },
});
afterEach(() => { delete C.STORY_DEFS[ID]; });

test("misspelled keys are rejected before play", () => {
  const d = def();
  d.nodes.a.o[0].y.goo = "b";
  d.nodes.b.o[0].y.rell = {};
  d.nodes.b.dealy = [1, 2];
  d.nodes.a.o[0].lable = "x";
  const issues = C.validateNarrative({ [ID]: d }).join("\n");
  for (const k of ["goo", "rell", "dealy", "lable"]) assert.match(issues, new RegExp(k));
  assert.deepEqual(C.validateNarrative({ [ID]: def() }), []);
});

test("every real story passes the stricter check", () => {
  assert.deepEqual(C.validateNarrative(C.STORY_DEFS), []);
});

test("a stale story event changes nothing: no money, no stats, no dice", () => {
  C.STORY_DEFS[ID] = def();
  const s = C.newLife("hd1"); s.ageM = 30 * 12;
  C.narrativeMonth(s); C.narrativeMonth(s); // starts, then opens
  assert.equal(s.ev?.story?.id, ID);
  s.narrative.stories[ID].node = "b"; // the story moved on while this event sat open
  const before = JSON.stringify({ gold: s.gold, st: s.st, r: s.r, log: s.log.length });
  C.choose(s, 0);
  assert.equal(JSON.stringify({ gold: s.gold, st: s.st, r: s.r, log: s.log.length }), before);
  assert.equal(s.ev, null);
});

test("moving city or changing job does not recast the claimant", () => {
  const s = C.newLife("hd2"); s.ageM = 30 * 12; s.job = { id: "office", tier: 1, xp: 0 };
  C.startStory(s, "office");
  const p = s.narrative.stories.office.cast.claimant;
  s.city = s.city === "bkk" ? "cnx" : "bkk"; s.job = null; C.narrativeMonth(s);
  s.job = { id: "office", tier: 0, xp: 0 }; C.narrativeMonth(s);
  assert.equal(s.narrative.stories.office.cast.claimant, p);
});

test("fate on a stale story scene rolls nothing", () => {
  C.STORY_DEFS[ID] = def();
  const s = C.newLife("hd3"); s.ageM = 30 * 12;
  C.narrativeMonth(s); C.narrativeMonth(s);
  s.narrative.stories[ID].node = "b";
  const r = JSON.stringify(s.r);
  C.chooseByFate(s);
  assert.equal(JSON.stringify(s.r), r);
  assert.equal(s.ev, null);
});
