// Regression tests for the Phase 3 review.
import { test } from "node:test";
import assert from "node:assert/strict";
import { newLife, openEvent, optionView, choose, serialize, deserialize, awakenCheck, startOp, stepOp, activeChains } from "../src/core/index.js";

test("#1 an event whose options are all locked still offers a way through", () => {
  const s = newLife("stk"); s.ageM = 35 * 12; s.mind = 10;
  openEvent(s, { id: "x", t: "t", important: true, o: [{ l: "a", need: { secret: 1 }, y: {} }, { l: "b", nerve: true, y: {} }] });
  const open = s.ev.opts.filter((o) => { const v = optionView(s, o); return v.visible && !v.locked; });
  assert.ok(open.length >= 1);
  choose(s, s.ev.opts.indexOf(open[0]));
  assert.equal(s.ev, null);
});

test("#2 imported save: counters, goals and log tones are sanitised", () => {
  const s = newLife("xs"); const j = JSON.parse(serialize(s));
  j.c.floor = "<img>"; j.c["ch:office"] = "x"; j.goals = [{ kind: "stat", key: "str", target: "<b>" }]; j.log.push({ m: 0, tag: "t", text: "x", tone: '"><img>' });
  const b = deserialize(JSON.stringify(j));
  assert.equal(b.c.floor, 0); assert.equal(b.c["ch:office"], 0); assert.equal(b.goals[0].target, 0); assert.equal(b.log.at(-1).tone, "");
});

test("#3 op decisions apply counters, flags and gold", () => {
  const s = newLife("dc"); s.ageM = 25 * 12; awakenCheck(s, "event"); s.gold = 1000;
  startOp(s, { id: "t", kind: "tower", t: "t", foes: [{ n: "x", lv: 1, el: "ice", hp: 9999, atk: 0, def: 0, cur: 9999 }], boss: false,
    rewards: { gold: 0, items: [] }, decisions: [{ t: "d", o: [{ l: "pay", y: { gold: -500, goldLabel: "จ่าย", c: { drownedMap: 1 }, flags: { f: true } } }] }] }, { plan: "careful", skills: [], quick: [], team: [] });
  while (s.op && !s.ev) stepOp(s);
  choose(s, 0);
  assert.equal(s.c.drownedMap, 1); assert.equal(s.flags.f, true); assert.equal(s.gold, 500);
});

test("#7 hunter story chains pause in old age", () => {
  const s = newLife("old"); s.ageM = 30 * 12; awakenCheck(s, "event");
  assert.ok(activeChains(s).length > 0);
  s.ageM = 63 * 12;
  assert.ok(!activeChains(s).some((id) => ["vanguard", "striker", "support", "scout", "artisan"].includes(id)));
});
