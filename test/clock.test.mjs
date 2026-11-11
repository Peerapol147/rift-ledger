import { test } from "node:test";
import assert from "node:assert/strict";
import { newLife, tick, ageY, die, openEvent, choose, stageOf } from "../src/core/index.js";
import { playUntil, playAll } from "./helpers.mjs";

test("milestone opens at exact age", () => {
  const s = playUntil(newLife("m"), (x) => x.ev?.id === "ms6");
  assert.equal(s.ev.id, "ms6");
  assert.equal(ageY(s), 6);
});

test("tick does nothing after death and never throws", () => {
  const s = newLife("d");
  die(s, "test");
  assert.doesNotThrow(() => tick(s));
  assert.equal(s.ageM, 0);
});

test("death inside an outcome closes the event", () => {
  const s = newLife("o");
  openEvent(s, { id: "t", t: "x", o: [{ l: "a", risk: 1, y: {}, n: { hp: -999 } }] });
  choose(s, 0);
  assert.ok(s.dead);
  assert.equal(s.ev, null);
});

test("kid steps 3 months, adult 1", () => {
  const s = newLife("st");
  tick(s); assert.equal(s.ageM, 3);
  s.ageM = 30 * 12; s.ev = null; tick(s);
  assert.ok(s.ageM === 30 * 12 + 1 || s.ev);
});

test("civilian lives end of old age within lifespan range", () => {
  let old = 0;
  for (let i = 0; i < 30; i++) {
    const s = playAll(newLife("age" + i));
    assert.ok(s.dead, "life ended");
    if (s.dead.cause === "อายุขัย") { old++; assert.ok(s.dead.ageY >= 70 && s.dead.ageY <= 100, String(s.dead.ageY)); }
  }
  assert.ok(old >= 25, `old-age deaths ${old}`);
});

test("whole life is deterministic", () => {
  assert.deepEqual(playAll(newLife("z")), playAll(newLife("z")));
});

test("focus plans follow stage", () => {
  const s = newLife("f");
  assert.equal(stageOf(s), "kid");
});
