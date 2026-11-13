// Settings that always start, and every offered speed runs (UX-11, UX-12).
import { test } from "node:test";
import assert from "node:assert/strict";
import { SPEEDS, STEP_S, cleanCfg, DEFAULT_CFG } from "../src/ui/cfg.js";

test("null, arrays, numbers and strings give defaults", () => {
  for (const raw of [null, [], 3, "x", undefined]) assert.deepEqual(cleanCfg(raw), DEFAULT_CFG);
});
test("an unknown speed or policy falls back alone", () => {
  assert.deepEqual(cleanCfg({ speed: 3, policy: "important", fs: 3 }), { ...DEFAULT_CFG, policy: "important", fs: 3 });
  assert.deepEqual(cleanCfg({ speed: 16, policy: "nope", fs: 9 }), { ...DEFAULT_CFG, speed: 16 });
});
test("a good config is kept", () => {
  assert.deepEqual(cleanCfg({ speed: 8, policy: "skip", fs: 1 }), { speed: 8, policy: "skip", fs: 1 });
});
test("every offered speed has a step time", () => {
  assert.deepEqual(SPEEDS, [1, 2, 4, 8, 16]);
  assert.ok(SPEEDS.every((n) => STEP_S[n] > 0));
  assert.ok(STEP_S[16] < STEP_S[8]);
});
