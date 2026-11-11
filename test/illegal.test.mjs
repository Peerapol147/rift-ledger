import { test } from "node:test";
import assert from "node:assert/strict";
import { newLife, awakenCheck, openGateChoice, openEvent, choose } from "../src/core/index.js";
import { hooks } from "../src/core/registry.js";

const hunter = (seed) => { const s = newLife(seed); s.ageM = 25 * 12; awakenCheck(s, "event"); s.gold = 1e5; return s; };

test("illegal gates appear only with underground standing", () => {
  const s = hunter("il");
  openGateChoice(s); assert.ok(!s.offers.some((d) => d.illegal)); s.ev = null;
  s.fac.under = 30; openGateChoice(s);
  const d = s.offers.find((x) => x.illegal);
  assert.ok(d); assert.match(s.ev.opts[s.offers.indexOf(d)].l, /เกตเถื่อน/);
});

test("taking an illegal gate costs association standing; getting caught is a ledger fine", () => {
  let caught = 0;
  for (let i = 0; i < 60; i++) {
    const s = hunter("ic" + i); s.fac.under = 30; const a0 = s.fac.assoc;
    hooks.illegalEnd(s, { kind: "gate", illegal: true, rank: 2, t: "x" });
    assert.ok(s.fac.assoc < a0);
    if (s.ledger.some((e) => e.label === "ค่าปรับเกตเถื่อน")) caught++;
  }
  assert.ok(caught > 0 && caught < 30);
});

test("a hidden rank halves fame gains", () => {
  const s = hunter("hr"); s.flags.hiddenRank = true;
  openEvent(s, { id: "x", t: "t", o: [{ l: "a", y: { fame: 10 } }] }); choose(s, 0);
  assert.equal(s.fame, 5);
});

test("a ranked hunter can take the illegal gate, and it is a real rank up", () => {
  const s = hunter("ir"); s.hunter.rank = 2; s.fac.under = 30; openGateChoice(s);
  const i = s.offers.findIndex((x) => x.illegal), d = s.offers[i];
  assert.ok(i >= 4, "after 3 gates and the tower");
  const reg = s.offers.find((x) => !x.illegal && x.kind === "gate" && x.rank === d.rank);
  if (reg) assert.ok(Math.max(...d.foes.map((f) => f.lv)) >= Math.max(...reg.foes.map((f) => f.lv)) - 4);
  choose(s, i);
  assert.ok(s.op && s.op.def.illegal, "the op started");
});
