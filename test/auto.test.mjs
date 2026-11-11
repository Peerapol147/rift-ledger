import { test } from "node:test";
import assert from "node:assert/strict";
import { newLife, autoDecide, openEvent, advance, choose } from "../src/core/index.js";
import { firstOpen } from "./helpers.mjs";

const withEv = (ev, extra = {}) => { const s = newLife("a"); s.ageM = 25 * 12; openEvent(s, { id: "x", t: "t", ...ev }); Object.assign(s.ev, extra); return s; };

test("never picks a death-risk option when a safe one exists", () => {
  const s = withEv({ o: [{ l: "risky", risk: 0.05, y: { loot: 3 } }, { l: "safe", y: {} }] }, { op: true });
  assert.equal(autoDecide(s, "important"), 1);
});

test("all options risky → -1", () => {
  const s = withEv({ o: [{ l: "a", risk: 0.1, y: {} }, { l: "b", risk: 0.2, y: {} }] });
  assert.equal(autoDecide(s, "important"), -1);
  assert.equal(autoDecide(s, "skip"), -1);
});

test("milestone and important events → -1 under important, skip stops only at milestones", () => {
  const s = withEv({ important: true, o: [{ l: "a", y: {} }] });
  assert.equal(autoDecide(s, "important"), -1);
  assert.equal(autoDecide(s, "skip"), 0);
  const m = withEv({ important: true, milestone: true, o: [{ l: "a", y: {} }] });
  assert.equal(autoDecide(m, "skip"), -1);
});

test("stop policy always waits; prefers higher odds and avoids mind loss", () => {
  const s = withEv({ o: [{ l: "sad", y: { mind: -5 } }, { l: "ok", y: {} }] });
  assert.equal(autoDecide(s, "stop"), -1);
  assert.equal(autoDecide(s, "important"), 1);
});

test("important policy finishes a civilian life with ≤ 40 stops", () => {
  for (let i = 0; ; i++) {
    const s = newLife("civ" + i);
    let stops = 0;
    for (let n = 0; n < 30000 && !s.dead; n++) {
      if (!s.ev) { advance(s); continue; }
      let k = autoDecide(s, "important");
      if (k < 0) { stops++; k = firstOpen(s); }
      choose(s, k);
    }
    if (s.hunter) continue;
    assert.ok(s.dead);
    assert.ok(stops <= 40, `stops ${stops}`);
    return;
  }
});
