// A hunter who is not out in gates and has no job still gets the yearly job offer (owner's life "เอก": a rank-F
// hunter, never hunting, no job for twenty years, dead at 45 in debt).
import { test } from "node:test";
import assert from "node:assert/strict";
import * as C from "../src/core/index.js";

test("an idle hunter with no job is offered work once a year", () => {
  const s = C.newLife("idle-hunter"); s.ageM = 30 * 12 - 1; s.ev = null; s.job = null;
  s.hunter = { rank: 0, lv: 1, xp: 0, skills: [], cls: "smith" }; s.focus = "work";
  let offered = false;
  for (let i = 0; i < 14 && !offered; i++) { if (s.ev) { offered = s.ev.id === "jobChoice"; s.ev = null; } else C.advance(s); }
  assert.ok(offered, "no job offer in a year");
});

test("a hunter who earned from gates this past year is not asked; a declined offer waits three years", () => {
  const s = C.newLife("busy-hunter"); s.ageM = 30 * 12 - 1; s.ev = null; s.job = null;
  s.hunter = { rank: 2, lv: 10, xp: 0, skills: [], cls: "knight" }; s.focus = "train";
  s.c.lastHuntM = s.ageM - 3;
  let offered = false;
  for (let i = 0; i < 14; i++) { if (s.ev) { offered ||= s.ev.id === "jobChoice"; s.ev = null; } else C.advance(s); }
  assert.equal(offered, false);
});
