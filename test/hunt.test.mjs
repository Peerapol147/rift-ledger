import { test } from "node:test";
import assert from "node:assert/strict";
import { newLife, genFloor, gateOffers, awakenCheck, gateOp, towerOp } from "../src/core/index.js";
import { TOWERS, GATES } from "../src/data/index.js";

test("floors 21–50 generate with rising difficulty and filler tag", () => {
  const T = TOWERS.silent;
  assert.ok(genFloor(T, 40).lv > genFloor(T, 21).lv);
  assert.equal(genFloor(T, 30).filler, true);
  assert.equal(genFloor(T, 10).filler, false);
  assert.equal(genFloor(T, 20).boss, true);
});

test("gate offers match hunter rank ±1", () => {
  const s = newLife("g"); s.ageM = 20 * 12; awakenCheck(s, "event");
  s.hunter.rank = 3; s.hunter.lv = 40;
  for (const g of gateOffers(s)) assert.ok(Math.abs(g.rank - 3) <= 1);
});

test("op defs have foes and decisions", () => {
  const s = newLife("o"); s.ageM = 20 * 12; awakenCheck(s, "event");
  const op = gateOp(s, gateOffers(s)[0]);
  assert.ok(op.foes.length && op.decisions.length);
  const t = towerOp(s, "silent", 5);
  assert.equal(t.kind, "tower");
  assert.equal(GATES.length >= 3, true);
});
