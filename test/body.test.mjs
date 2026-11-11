import { test } from "node:test";
import assert from "node:assert/strict";
import { newLife, injure, lifespan, changeMind, tick } from "../src/core/index.js";

test("permanent injury costs 2 years of lifespan", () => {
  const s = newLife("b");
  const base = lifespan(s);
  injure(s, "arm", null);
  assert.equal(lifespan(s), base - 2);
});

test("temporary injury heals", () => {
  const s = newLife("b2");
  s.ageM = 3 * 12;
  injure(s, "rib", 2);
  tick(s);
  assert.equal(s.injuries.length, 0);
});

test("mind clamps 0..100", () => {
  const s = newLife("m");
  changeMind(s, -500); assert.equal(s.mind, 0);
  changeMind(s, 500); assert.equal(s.mind, 100);
});
