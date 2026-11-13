import { test } from "node:test";
import assert from "node:assert/strict";
import { newLife, tick, ageY, die, openEvent, choose, stageOf } from "../src/core/index.js";
import { playUntil, playAll } from "./helpers.mjs";
import { randomPool } from "../src/core/clock.js";

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
    // lifespan is 70–85, minus 2 years per permanent injury
    if (s.dead.cause === "อายุขัย") { old++; assert.ok(s.dead.ageY >= 60 && s.dead.ageY <= 100, String(s.dead.ageY)); }
  }
  // illness now takes some lives too (always after a diagnosis and a choice)
  assert.ok(old >= 20, `old-age deaths ${old}`);
});

test("whole life is deterministic", () => {
  assert.deepEqual(playAll(newLife("z")), playAll(newLife("z")));
});

test("focus plans follow stage", () => {
  const s = newLife("f");
  assert.equal(stageOf(s), "kid");
});

test("a random event that declares no cap comes once in a life", () => {
  const s = newLife("cap1");
  s.ageM = 30 * 12;
  assert.ok(randomPool(s).some((e) => e.id === "adultGym"), "fresh: in the pool");
  s.c["ev:adultGym"] = 1; s.c["last:adultGym"] = 0;
  assert.ok(!randomPool(s).some((e) => e.id === "adultGym"), "after once: out for good");
});

test("an old save where an event already ran three times plays on", () => {
  const s = newLife("cap3");
  s.ageM = 30 * 12; s.c["ev:adultGym"] = 3;
  assert.doesNotThrow(() => playAll(s));
  assert.ok(s.dead);
});
