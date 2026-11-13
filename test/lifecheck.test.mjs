import { test } from "node:test";
import assert from "node:assert/strict";
import { checkLives } from "./lifecheck-rules.mjs";

const r = checkLives(24, "lc");

test("no random event comes more often in a life than it declares", () => {
  assert.deepEqual([...r.repeats.keys()], []);
});

test("no broken text in any life's log", () => {
  assert.deepEqual([...r.badText.keys()].slice(0, 5), []);
});

test("no event opens in a life it does not fit", () => {
  assert.deepEqual(r.ageMisfits.slice(0, 5), []);
});

test("lifecheck: a story scene with a dead cast member is reported", async () => {
  const { storyMisfit } = await import("./lifecheck-rules.mjs");
  const C = await import("../src/core/index.js");
  const s = C.newLife("lc-hong"); s.country = "th"; s.city = "bkk"; s.ageM = 25 * 12; s.gold = 0;
  for (let n = 0; n < 4000 && s.ev?.story?.id !== "hong"; n++) { if (s.ev) s.ev = null; else C.advance(s); s.gold = 0; }
  assert.equal(s.ev?.story?.id, "hong");
  assert.equal(storyMisfit(s), "");
  C.setPersonStatus(s, s.narrative.stories.hong.cast.hong, { diedWorldM: C.worldMonth(s) });
  assert.match(storyMisfit(s), /hong/);
});
