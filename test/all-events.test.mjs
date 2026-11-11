import { test } from "node:test";
import assert from "node:assert/strict";
import { ALL_EVENTS } from "../src/data/events/index.js";
import { STATS } from "../src/data/stats.js";

test("every random event: a unique id, an option with no need, known check stats", () => {
  const seen = new Set();
  for (const e of ALL_EVENTS) {
    assert.ok(!seen.has(e.id), "duplicate id " + e.id);
    seen.add(e.id);
    assert.ok(e.o.some((o) => !o.need), "no need-free option: " + e.id);
    for (const o of e.o) if (o.s) assert.ok(o.s in STATS, `${e.id}: unknown stat ${o.s}`);
  }
});
