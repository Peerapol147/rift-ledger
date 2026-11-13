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
