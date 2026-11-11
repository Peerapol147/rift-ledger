import { test } from "node:test";
import assert from "node:assert/strict";
import {
  newLife, pinFromOption, goalProgress, alerts, deathSummary, yearSummary, openEvent, choose, die, borrow, debtCap,
} from "../src/core/index.js";

test("pin from locked option creates stat goal", () => {
  const s = newLife("p");
  pinFromOption(s, { l: "x", need: { str: 50 }, y: {} });
  const g = goalProgress(s)[0];
  assert.equal(g.target, 50);
  assert.equal(g.cur, Math.floor(s.st.str));
  assert.match(g.label, /กาย/);
  assert.equal(g.done, false);
});

test("pin ignores hidden requirements", () => {
  const s = newLife("p2");
  pinFromOption(s, { l: "x", need: { secretKey: 1 }, y: {} });
  assert.equal(goalProgress(s).length, 0);
});

test("alerts fire at thresholds", () => {
  const s = newLife("a"); s.ageM = 30 * 12;
  assert.equal(alerts(s).length, 0);
  s.hp = 20; s.mind = 10;
  const k = alerts(s).map((a) => a.kind);
  assert.ok(k.includes("hp") && k.includes("mind"));
  borrow(s, Math.floor(debtCap(s) * 0.9));
  assert.ok(alerts(s).some((a) => a.kind === "debt"));
});

test("known calendar entry within 6 months alerts", () => {
  const s = newLife("cal");
  s.flags["knowCal:cal24"] = true;
  s.ageM = (24 - 21) * 12 + 6 - 3 - (s.mon0 ?? 0);
  assert.ok(alerts(s).some((a) => a.kind === "calendar"));
});

test("death summary counts unseen options without naming them", () => {
  const s = newLife("d"); s.ageM = 20 * 12;
  openEvent(s, { id: "z", t: "t", o: [{ l: "open", y: {} }, { l: "SECRET-LABEL", need: { hid: 1 }, y: {} }] });
  choose(s, 0);
  die(s, "test");
  const d = deathSummary(s);
  assert.equal(d.unseen, 1);
  assert.doesNotMatch(JSON.stringify(d), /SECRET-LABEL/);
});

test("year summary lists notable lines", () => {
  const s = newLife("y");
  assert.ok(yearSummary(s, 0).lines.length >= 1);
});

test("pinning a brave option locked by nerve pins a steady mind", async () => {
  const C = await import("../src/core/index.js");
  const s = C.newLife("nv"); s.ageM = 25 * 12; s.mind = 10;
  assert.ok(C.pinFromOption(s, { l: "x", nerve: true, y: {} }));
  assert.equal(s.goals.at(-1).key, "mind");
  assert.equal(s.goals.at(-1).target, 20);
});
