import { test } from "node:test";
import assert from "node:assert/strict";
import {
  newLife, giveItem, equip, lockItem, sellItem, compare, sortFilter, autoJunk, saveLoadout, useLoadout, die, heroPower,
  awakenCheck,
} from "../src/core/index.js";

const adult = () => { const s = newLife("it"); s.ageM = 25 * 12; awakenCheck(s, "event"); return s; };

test("locked item cannot be sold", () => {
  const s = adult(); const u = giveItem(s, "ironSword", "test");
  lockItem(s, u, true);
  assert.equal(sellItem(s, u), false);
  lockItem(s, u, false);
  assert.equal(sellItem(s, u), true);
  assert.equal(s.ledger.at(-1).label, "ขายของ");
});

test("autoJunk skips equipped and locked", () => {
  const s = adult();
  const a = giveItem(s, "rustyKnife", "t"), b = giveItem(s, "rustyKnife", "t"), c = giveItem(s, "rustyKnife", "t");
  equip(s, a); lockItem(s, b, true);
  autoJunk(s, { belowRarity: 1 });
  assert.deepEqual(s.items.map((i) => i.uid).sort(), [a, b].sort());
  assert.ok(!s.items.some((i) => i.uid === c));
});

test("compare shows deltas vs equipped and gear adds power", () => {
  const s = adult();
  const a = giveItem(s, "rustyKnife", "t"); equip(s, a);
  const base = heroPower(s).atk;
  const b = giveItem(s, "ironSword", "t");
  assert.ok(compare(s, b).atk > 0);
  equip(s, b);
  assert.ok(heroPower(s).atk > base);
});

test("provenance stored", () => {
  const s = adult(); const u = giveItem(s, "ironSword", "เกตสถานีรถไฟ");
  assert.equal(s.items.find((i) => i.uid === u).from, "เกตสถานีรถไฟ");
});

test("sortFilter by rarity and query", () => {
  const s = adult(); giveItem(s, "rustyKnife", "t"); giveItem(s, "ironSword", "t"); giveItem(s, "healPotion", "t");
  const r = sortFilter(s.items, { kind: "weapon", sort: "rarity" });
  assert.equal(r.length, 2);
  assert.equal(r[0].id, "ironSword");
});

test("loadouts save and restore", () => {
  const s = adult(); const a = giveItem(s, "rustyKnife", "t"), b = giveItem(s, "ironSword", "t");
  equip(s, a); saveLoadout(s, "x"); equip(s, b);
  useLoadout(s, "x");
  assert.equal(s.equip.weapon, a);
});

test("revival token saves once, second fatal blow kills", () => {
  const s = adult(); giveItem(s, "phoenixToken", "t");
  die(s, "test");
  assert.equal(s.dead, null);
  assert.equal(s.hp, 30);
  die(s, "test");
  assert.ok(s.dead);
});
