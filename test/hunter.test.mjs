import { test } from "node:test";
import assert from "node:assert/strict";
import { newLife, awakenCheck, xpNeed, gainXp, trainFactor, LV_CAP, tick, setFocus } from "../src/core/index.js";
import { CLASSES } from "../src/data/index.js";

const hunter = (seed = "h") => {
  const s = newLife(seed); s.ageM = 20 * 12; s.c["ev:ms6"] = s.c["ev:ms12"] = s.c["ev:ms15"] = s.c["ev:ms18"] = 1;
  awakenCheck(s, "event"); return s;
};

test("xp curve", () => {
  assert.equal(xpNeed(1), 40);
  assert.equal(xpNeed(4), 320);
});

test("level caps at rank cap and learns class skills", () => {
  const s = hunter();
  s.hunter.rank = 0; s.hunter.lv = 1; // rank F starts at level 1
  gainXp(s, 1e7);
  assert.equal(s.hunter.lv, LV_CAP[0]);
  const want = CLASSES[s.hunter.cls].skills.filter(([lv]) => lv <= LV_CAP[0]).map(([, id]) => id);
  for (const id of want) assert.ok(s.hunter.skills.includes(id), id);
});

test("training slows near the ceiling", () => {
  const s = hunter();
  s.hunter.ceil = 1; s.hunter.lv = 2;
  const far = trainFactor(s);
  s.hunter.lv = 19;
  assert.ok(trainFactor(s) < far);
  assert.ok(trainFactor(s) >= 0.2);
});

test("burnout event reachable when mind is low", () => {
  const s = hunter("burn");
  setFocus(s, "train");
  let seen = false;
  for (let i = 0; i < 400 && !seen; i++) {
    s.mind = 10;
    if (s.ev) { seen = s.ev.id === "burnout"; s.ev = null; continue; }
    tick(s);
  }
  assert.ok(seen);
});
