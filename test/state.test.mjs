import { test } from "node:test";
import assert from "node:assert/strict";
import { newLife, dateText, ageY, stageOf } from "../src/core/index.js";
import { FAMILIES, COUNTRIES } from "../src/data/index.js";

test("same seed gives identical life", () => assert.deepEqual(newLife("a1"), newLife("a1")));

test("born 2051, date shows years after Rift", () => {
  const s = newLife("x");
  s.ageM = 7 * 12 - s.mon0;
  assert.match(dateText(s), /^ปี 2058 \(ปีที่ 28 หลังฟ้าแตก\)/);
  assert.equal(ageY({ ageM: 7 * 12 }), 7);
});

test("country split near 65/35", () => {
  let th = 0;
  for (let i = 0; i < 2000; i++) th += newLife("c" + i).country === "th";
  assert.ok(th / 2000 > 0.6 && th / 2000 < 0.7, `th share ${th / 2000}`);
});

test("family and city belong to the birth country", () => {
  for (let i = 0; i < 200; i++) {
    const s = newLife("f" + i);
    assert.equal(FAMILIES.find((f) => f.id === s.family).country, s.country);
    assert.ok(COUNTRIES[s.country].cities.some((c) => c.id === s.city));
  }
});

test("stages", () => {
  const s = newLife("s");
  s.ageM = 12 * 12; assert.equal(stageOf(s), "kid");
  s.ageM = 17 * 12; assert.equal(stageOf(s), "teen");
  s.ageM = 30 * 12; assert.equal(stageOf(s), "adult");
  s.ageM = 60 * 12; assert.equal(stageOf(s), "old");
});
