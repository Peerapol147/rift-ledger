import { test } from "node:test";
import assert from "node:assert/strict";
import { KINDS, kindsOf } from "../src/core/kinds.js";

const opt = (y) => ({ l: "x", y });
const ev = (o, x = {}) => ({ id: "t", tag: "ชีวิต", t: "t", o, ...x });

test("the stat most options touch is the event's kind", () => {
  assert.deepEqual(kindsOf(ev([opt({ st: { int: 0.3 } }), opt({ st: { int: 0.1 } }), opt({ st: { cha: 0.2 } })])), ["study"]);
});

test("a tie keeps every tied stat's kind", () => {
  assert.deepEqual(kindsOf(ev([opt({ st: { int: 0.3 } }), opt({ st: { cha: 0.2 } })])).sort(), ["social", "study"]);
});

test("the tag gives a kind when no stat does", () => {
  assert.deepEqual(kindsOf(ev([opt({ m: "a" }), opt({ m: "b" })], { tag: "งาน" })), ["money"]);
});

test("hunter events are hunt", () => {
  assert.ok(kindsOf(ev([opt({ st: { str: 0.2 } })], { hunter: true })).includes("hunt"));
});

test("kinds written on the event win", () => {
  assert.deepEqual(kindsOf(ev([opt({ st: { int: 1 } })], { kinds: ["luck"] })), ["luck"]);
});

test("news with nothing to read has no kind", () => {
  assert.deepEqual(kindsOf(ev([opt({ m: "a" })], { tag: "ข่าวโลก" })), []);
  assert.deepEqual(KINDS, ["study", "body", "social", "money", "mind", "luck", "hunt"]);
});
