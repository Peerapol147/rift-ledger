import { test } from "node:test";
import assert from "node:assert/strict";
import * as C from "../src/core/index.js";
import { FOCUS } from "../src/data/stats.js";

const at = (seed, years) => { const s = C.newLife(seed); s.ageM = years * 12; s.ev = null; return s; };

test("every plan says what it grows and which kind of event it brings", () => {
  for (const [stage, table] of Object.entries(FOCUS)) for (const [id, p] of Object.entries(table)) {
    assert.ok(p.desc && p.desc.length > 10, `${stage}.${id} desc`);
    assert.ok(p.kinds?.length && p.kinds.every((k) => C.KINDS.includes(k)), `${stage}.${id} kinds`);
  }
});

test("a secondary plan opens at 13, never the main one, never hunting or work", () => {
  assert.deepEqual(C.focus2List(at("p12", 12)), []);
  const t = at("p15", 15); C.setFocus(t, "study");
  assert.ok(!C.focus2List(t).some((f) => f.id === "study"));
  const a = at("p30", 30);
  for (const id of ["work", "hunt"]) { C.setFocus2(a, id); assert.equal(a.focus2, null, id); }
  C.setFocus2(a, "social"); assert.equal(a.focus2, "social");
});

test("a secondary plan grows its stats at half the rate, and nothing else", () => {
  const main = at("half", 30), side = at("half", 30);
  C.setFocus(main, "train"); C.setFocus(side, "rest"); C.setFocus2(side, "train");
  const str0 = main.st.str, mind0 = side.mind;
  C.applyFocus(main, 1); C.applyFocus(side, 1);
  const restOnly = at("half", 30); C.setFocus(restOnly, "rest"); C.applyFocus(restOnly, 1);
  assert.equal(+(side.st.str - str0).toFixed(6), +((main.st.str - str0) / 2).toFixed(6));
  assert.equal(side.mind, restOnly.mind, "train's mind cost is not paid as a secondary");
  assert.ok(side.mind >= mind0);
});

test("moving the main plan onto the secondary clears the secondary", () => {
  const s = at("swap", 30); C.setFocus(s, "work"); C.setFocus2(s, "study");
  C.setFocus(s, "study");
  assert.equal(s.focus2, null);
});

test("a secondary that does not exist in the next stage clears", () => {
  const s = at("stage", 17); C.setFocus(s, "study"); C.setFocus2(s, "social");
  s.focus2 = "work"; // a teen-only id in spirit: 'work' is a teen plan but not allowed as an adult secondary
  s.ageM = 18 * 12; C.applyFocus(s, 1);
  assert.equal(s.focus2, null);
});

// Task 3: the main plan pulls its kind of event, and the log says so.
const studyShare = (s) => {
  const pool = C.randomPool(s);
  const w = (e) => (e.w ?? 1) * C.planWeight(s, e);
  const all = pool.reduce((a, e) => a + w(e), 0);
  return pool.filter((e) => C.kindsOf(e).includes("study")).reduce((a, e) => a + w(e), 0) / all;
};

test("a study plan makes study events far likelier than a work plan does", () => {
  const a = at("pull", 30), b = at("pull", 30);
  C.setFocus(a, "study"); C.setFocus(b, "work");
  assert.ok(studyShare(a) / studyShare(b) >= 1.8, `${studyShare(a)} vs ${studyShare(b)}`);
});

test("plan weights: main 2.5, secondary 1.5, otherwise 1", () => {
  const s = at("w", 30); C.setFocus(s, "study"); C.setFocus2(s, "social");
  const e = (st) => ({ id: "x", tag: "ชีวิต", o: [{ l: "a", y: { st } }] });
  assert.equal(C.planWeight(s, e({ int: 1 })), 2.5);
  assert.equal(C.planWeight(s, e({ cha: 1 })), 1.5);
  assert.equal(C.planWeight(s, e({ str: 1 })), 1);
});

test("an event a plan brought on says so in the log", () => {
  const s = at("log", 30); C.setFocus(s, "study");
  C.openRandom(s, { id: "x", tag: "ชีวิต", t: "หนังสือเล่มใหม่", o: [{ l: "อ่าน", y: { st: { int: 0.1 } } }] });
  assert.equal(s.ev.fromPlan, "เรียนเพิ่ม");
  C.choose(s, 0);
  assert.match(s.log.at(-1).text, / · มาจากแผน เรียนเพิ่ม$/);
});

test("a milestone or calendar event is not credited to a plan", () => {
  const s = at("ms", 30); C.setFocus(s, "study");
  C.openEvent(s, { id: "y", tag: "ชีวิต", t: "t", o: [{ l: "a", y: { st: { int: 0.1 } } }] });
  assert.equal(s.ev.fromPlan, undefined);
});

// Task 4: the first-birthday grab sets the plan at four.
const toFour = (s) => { s.ageM = 45; s.ev = null; for (let i = 0; i < 6 && C.ageY(s) < 4; i++) { s.ev = null; C.advance(s); } return s; };

test("the baby who grabbed the book starts school age set to study", () => {
  const s = C.newLife("grab2"); s.c.grab = 2;
  assert.equal(toFour(s).focus, "study");
});

test("with no grab the child starts on the first plan", () => {
  assert.equal(toFour(C.newLife("grab0")).focus, "play");
});

test("a plan the player picks later is kept", () => {
  const s = C.newLife("grab3"); s.c.grab = 3; toFour(s);
  assert.equal(s.focus, "chores");
  C.setFocus(s, "sport"); s.ageM = 5 * 12; s.ev = null; C.advance(s);
  assert.equal(s.focus, "sport");
});

test("each toy in the grab sets its own number", () => {
  const toy = (i) => C.EVENT_INDEX.get("infToy").o[i].y.c.grab;
  assert.deepEqual([toy(0), toy(1), toy(2)], [1, 2, 3]);
});
