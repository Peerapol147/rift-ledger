// Which plan a decision's option fits (choice card design §3.4): its tested stat or a stat it raises.
import { test } from "node:test";
import assert from "node:assert/strict";
import * as C from "../src/core/index.js";

const teen = (focus, focus2 = null) => { const s = C.newLife("fit"); s.ageM = 15 * 12; s.focus = focus; s.focus2 = focus2; return s; };

test("an option testing a main-plan stat fits the main plan", () => {
  assert.equal(C.planFit(teen("study"), { s: "int" }), "main");
});
test("an option raising a main-plan stat fits the main plan", () => {
  assert.equal(C.planFit(teen("study"), { y: { st: { wil: 0.3 } } }), "main");
});
test("the second plan's stat fits the second plan, and the main plan wins", () => {
  assert.equal(C.planFit(teen("study", "train"), { s: "str" }), "second");
  assert.equal(C.planFit(teen("study", "train"), { s: "int", y: { st: { str: 1 } } }), "main");
});
test("no fit without a second plan, for an unrelated stat, or for a plan with no stats", () => {
  assert.equal(C.planFit(teen("study"), { s: "str" }), null);
  const old = C.newLife("fit-rest"); old.ageM = 30 * 12; old.focus = "rest"; old.focus2 = null;
  assert.equal(C.planFit(old, { s: "int", y: { st: { int: 1 } } }), null);
});
