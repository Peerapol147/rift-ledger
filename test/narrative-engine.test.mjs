// Branching stories (lives that remember, Task 3). A small test-only story is registered for each test.
import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import * as C from "../src/core/index.js";

const ID = "tst";
const def = (extra = {}) => ({
  id: ID, title: "เรื่องทดสอบ", tag: "ชีวิต", discover: (s) => C.ageY(s) >= 1, entry: "a",
  cast: { pal: (s) => ({ input: { name: "เพื่อนทดสอบ", country: s.country, city: s.city }, key: "tst:pal:" + s.lifeId }) },
  castGone: "gone",
  nodes: {
    a: { t: "เริ่มกับ {cast:pal}", delay: [0, 0], o: [
      { l: "ไปทางซ้าย", y: { m: "ซ้าย", go: "left", route: "L", gold: 100 } },
      { l: "ลองดู", s: "luk", diff: 99, y: { m: "ได้", go: "left" }, n: { m: "พลาด", go: "right" } },
      { l: "ไปทางขวา", y: { m: "ขวา", go: "right", rel: { pal: { trust: 30, mem: "เคยไปทางขวาด้วยกัน" } } } },
      { l: "ขอคิดก่อน", noAuto: true, y: { m: "รอ", end: "wait" } },
    ] },
    left: { t: "ซ้าย {cast:pal}", needCast: ["pal"], delay: [2, 2], o: [{ l: "จบ", y: { m: "จบ", end: "done" } }] },
    right: { t: "ขวา", delay: [1, 1], o: [{ l: "จบ", y: { m: "จบ", end: "done" } }] },
    gone: { t: "เขาไม่อยู่แล้ว", delay: [0, 0], o: [{ l: "รับรู้", y: { m: "รับรู้", end: "done" } }] },
  },
  endings: { done: { title: "จบ" }, wait: { title: "รอ" } },
  ...extra,
});
afterEach(() => { delete C.STORY_DEFS[ID]; });

const life = (seed, years = 30) => { const s = C.newLife(seed); s.ageM = years * 12; return s; };
const openNext = (s) => { for (let i = 0; i < 400 && !s.ev?.story; i++) { if (s.ev) s.ev = null; C.narrativeMonth(s); s.ageM++; } return s.ev; };
const pick = (s, label) => C.choose(s, s.ev.opts.findIndex((o) => o.l === label));

test("a choice moves to its node and another choice to another node", () => {
  C.STORY_DEFS[ID] = def();
  const a = life("ne1"), b = life("ne1");
  openNext(a); openNext(b);
  assert.match(a.ev.t, /เพื่อนทดสอบ/);
  pick(a, "ไปทางซ้าย"); pick(b, "ไปทางขวา");
  assert.equal(a.narrative.stories[ID].node, "left");
  assert.equal(b.narrative.stories[ID].node, "right");
  assert.equal(a.narrative.stories[ID].route, "L");
});

test("a failed check follows n", () => {
  C.STORY_DEFS[ID] = def();
  const s = life("ne2"); openNext(s); pick(s, "ลองดู");
  assert.equal(s.narrative.stories[ID].node, "right");
});

test("choosing twice moves once", () => {
  C.STORY_DEFS[ID] = def();
  const s = life("ne3"); openNext(s);
  const g = s.gold; pick(s, "ไปทางซ้าย");
  const ev = { ...s.ev };
  C.choose(s, 0);
  assert.equal(s.gold, g + 100);
  assert.equal(s.narrative.stories[ID].node, "left");
  assert.equal(ev.story, undefined);
});

test("a stale event does not move the story", () => {
  C.STORY_DEFS[ID] = def();
  const s = life("ne4"); openNext(s);
  s.narrative.stories[ID].node = "right";
  pick(s, "ไปทางซ้าย");
  assert.equal(s.narrative.stories[ID].node, "right");
});

test("save, reload, choose moves once", () => {
  C.STORY_DEFS[ID] = def();
  const s = C.deserialize(C.serialize((() => { const x = life("ne5"); openNext(x); return x; })()));
  const g = s.gold; pick(s, "ไปทางซ้าย");
  assert.equal(s.gold, g + 100);
  assert.equal(s.narrative.stories[ID].node, "left");
});

test("due between child ticks still opens", () => {
  C.STORY_DEFS[ID] = def({ discover: () => true });
  const s = C.newLife("ne6"); s.ageM = 24;
  C.narrativeMonth(s); s.ev = null;
  s.narrative.stories[ID].due = C.worldMonth(s) + 1;
  s.ageM += 3; C.narrativeMonth(s);
  assert.equal(s.ev?.story?.id, ID);
});

test("a dead cast member's node opens castGone instead", () => {
  C.STORY_DEFS[ID] = def();
  const s = life("ne7"); openNext(s); pick(s, "ไปทางซ้าย");
  C.setPersonStatus(s, s.narrative.stories[ID].cast.pal, { diedWorldM: C.worldMonth(s) });
  openNext(s);
  assert.equal(s.ev.story.node, "gone");
  assert.doesNotMatch(s.ev.t, /เพื่อนทดสอบ/);
});

test("the cast is bound once", () => {
  C.STORY_DEFS[ID] = def();
  const s = life("ne8"); C.startStory(s, ID);
  const p = s.narrative.stories[ID].cast.pal;
  assert.equal(C.startStory(s, ID), false);
  assert.equal(s.narrative.stories[ID].cast.pal, p);
});

test("a relation and memory are kept for the cast member", () => {
  C.STORY_DEFS[ID] = def();
  const s = life("ne9"); openNext(s); pick(s, "ไปทางขวา");
  const r = C.relationOf(s, s.narrative.stories[ID].cast.pal);
  assert.equal(r.trust, 30);
  assert.equal(r.memories[0].text, "เคยไปทางขวาด้วยกัน");
  assert.equal(C.followedStory(s).title, "เรื่องทดสอบ");
});

test("the validator finds a missing node, a check without n, an unreachable node, an undeclared cast role", () => {
  const d = def();
  assert.deepEqual(C.validateNarrative({ [ID]: d }), []);
  const bad = def();
  bad.nodes.a.o[0].y.go = "nowhere";
  bad.nodes.a.o[1] = { l: "x", s: "luk", diff: 9, y: { m: "x", go: "left" } };
  bad.nodes.island = { t: "ไม่มีทางมา", o: [{ l: "x", y: { end: "done" } }] };
  bad.nodes.right.t = "สวัสดี {cast:ghost}";
  const issues = C.validateNarrative({ [ID]: bad }).join("\n");
  for (const w of ["nowhere", "no n", "island", "ghost"]) assert.match(issues, new RegExp(w));
});

test("autopilot stops on noAuto options", () => {
  C.STORY_DEFS[ID] = def();
  const s = life("ne10"); openNext(s);
  assert.equal(C.autoDecide(s, "skip"), -1);
});

test("a beat logs and moves on without asking", () => {
  const d = def();
  d.nodes.right = { beat: { m: "เงียบไปนาน {cast:pal}", mind: 3, go: "gone" }, delay: [0, 0] };
  C.STORY_DEFS[ID] = d;
  const s = life("ne11"); openNext(s); pick(s, "ไปทางขวา");
  s.mind = 50; C.narrativeMonth(s);
  assert.equal(s.ev, null);
  assert.equal(s.mind, 53);
  assert.match(s.log.at(-1).text, /เงียบไปนาน เพื่อนทดสอบ/);
  assert.equal(s.narrative.stories[ID].node, "gone");
});

test("an option hidden by show is not offered", () => {
  const d = def();
  d.nodes.a.o[0].show = (s, st) => st.vars.never === 1;
  C.STORY_DEFS[ID] = d;
  const s = life("ne12"); openNext(s);
  assert.ok(!s.ev.opts.some((o) => o.l === "ไปทางซ้าย"));
});

test("job tier can be needed", () => {
  const s = life("ne13"); s.job = { id: "office", tier: 2, xp: 0 };
  assert.equal(C.val(s, "jobTier"), 2);
  s.job = null;
  assert.equal(C.val(s, "jobTier"), -1);
});
