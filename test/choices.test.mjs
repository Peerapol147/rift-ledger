import { test } from "node:test";
import assert from "node:assert/strict";
import { ALL_EVENTS } from "../src/data/events/index.js";
import { KINDS, kindsOf } from "../src/core/kinds.js";

const RANDOM = ALL_EVENTS.filter((e) => !e.k);

test("every random event with a choice offers at least three", () => {
  const two = RANDOM.filter((e) => e.o.length === 2).map((e) => e.id);
  assert.deepEqual(two, []);
});

test("no third option is a stock line used everywhere", () => {
  const n = {};
  for (const e of RANDOM) if (e.o[2]) n[e.o[2].l] = (n[e.o[2].l] ?? 0) + 1;
  assert.deepEqual(Object.entries(n).filter(([, k]) => k > 3), []);
});

test("every option that spends money is guarded, and every event keeps a free way out", () => {
  const bad = [];
  for (const e of RANDOM) {
    for (const o of e.o) if ((o.y?.gold ?? 0) < 0 && !(o.need?.gold >= -o.y.gold)) bad.push(`${e.id}: ${o.l}`);
    if (!e.o.some((o) => !o.need && (o.y?.gold ?? 0) >= 0)) bad.push(`${e.id}: no free option`);
  }
  assert.deepEqual(bad, []);
});

test("every kind a plan can pull has enough adult events behind it", () => {
  const adult = RANDOM.filter((e) => !e.age || (e.age[0] <= 59 && e.age[1] >= 18));
  for (const k of KINDS.filter((x) => !["social", "money"].includes(x))) {
    const n = adult.filter((e) => kindsOf(e).includes(k)).length;
    assert.ok(n >= 12, `${k}: ${n}`);
  }
});
