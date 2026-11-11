import { test } from "node:test";
import assert from "node:assert/strict";
import { newLife, optionView, choose, openEvent, eligible, EVENT_INDEX } from "../src/core/index.js";
import { KID_EVENTS } from "../src/data/events/kid.js";

const kid = (seed = "k") => { const s = newLife(seed); s.ageM = 8 * 12; return s; };
const st = (over) => { const s = kid(); Object.assign(s.st, over); return s; };

test("known requirement shows lock with text", () => {
  const v = optionView(kid(), { l: "x", need: { str: 50 }, y: {} });
  assert.equal(v.visible, true);
  assert.equal(v.locked, true);
  assert.match(v.lockText, /กาย 50/);
});

test("hidden requirement hides option until met, then shows unlocked", () => {
  const s = kid();
  assert.equal(optionView(s, { l: "x", need: { secretKey: 1 }, y: {} }).visible, false);
  s.c.secretKey = 1;
  const v = optionView(s, { l: "x", need: { secretKey: 1 }, y: {} });
  assert.equal(v.visible, true);
  assert.equal(v.locked, false);
});

test("odds formula clamps", () => {
  assert.equal(optionView(st({ str: 100 }), { l: "x", s: "str", diff: 10, y: {} }).odds, 95);
  assert.equal(optionView(st({ str: 0 }), { l: "x", s: "str", diff: 50, y: {} }).odds, 5);
  assert.equal(optionView(kid(), { l: "x", y: {} }).odds, null);
});

const run = (seed) => { const s = kid(seed); openEvent(s, KID_EVENTS[0]); choose(s, 0); return s; };

test("choose is deterministic and applies outcome", () => {
  const a = run("e1");
  assert.deepEqual(a, run("e1"));
  assert.equal(a.ev, null);
  assert.ok(a.log.length >= 2);
});

test("once events are not eligible again", () => {
  const s = kid();
  const ev = KID_EVENTS.find((e) => e.once);
  s.ageM = ev.age[0] * 12;
  assert.equal(eligible(s, ev), true);
  openEvent(s, ev);
  choose(s, ev.o.findIndex((o) => !o.need));
  assert.equal(eligible(s, ev), false);
});

test("every kid event has an option with no requirement", () => {
  for (const e of KID_EVENTS) assert.ok(e.o.some((o) => !o.need), e.id);
  assert.ok(EVENT_INDEX.get(KID_EVENTS[0].id));
});

test("view text never contains rank ceiling or rarity words", () => {
  const s = kid();
  const txt = JSON.stringify(KID_EVENTS.flatMap((e) => e.o.map((o) => optionView(s, o))));
  assert.doesNotMatch(txt, /ceil|Legendary|Mythic|คลาสลับ/);
});
