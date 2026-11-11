import { test } from "node:test";
import assert from "node:assert/strict";
import * as C from "../src/core/index.js";
import { hooks } from "../src/core/registry.js";

const adult = (seed) => { const s = C.newLife(seed); s.ageM = 25 * 12; s.gold = 1e5; s.ev = null; return s; };

test("stash and take round-trip; equipped items stay in the bag", () => {
  const s = adult("st");
  const a = C.giveItem(s, "ironSword", "t"), b = C.giveItem(s, "healPotion", "t");
  C.equip(s, a);
  assert.equal(C.stash(s, a, "home"), false);
  assert.ok(C.stash(s, b, "home"));
  assert.ok(!s.items.some((i) => i.uid === b));
  assert.ok(C.take(s, b, "home"));
  assert.ok(s.items.some((i) => i.uid === b));
});

test("the vault is bound to its country and charges rent while full", () => {
  const s = adult("vt");
  const b = C.giveItem(s, "healPotion", "t");
  assert.ok(C.stash(s, b, "vault"));
  C.tick(s);
  assert.ok(s.ledger.some((e) => e.label === "ค่าเช่าตู้นิรภัย"), "rent");
  s.country = s.country === "th" ? "kr" : "th";
  assert.equal(C.take(s, b, "vault"), false, "abroad");
});

test("old saves without a store still work", () => {
  const s = adult("old"); delete s.store;
  const b = C.giveItem(s, "healPotion", "t");
  assert.ok(C.stash(s, b, "home"));
});

test("forging adds 10% base stats per plus, caps at +5, costs the fee", () => {
  const s = adult("fg");
  const a = C.giveItem(s, "ironSword", "t"); C.equip(s, a);
  const it = s.items.find((i) => i.uid === a);
  const base = C.heroPower(s).atk;
  const fee = C.forgeCost(s, it), g0 = s.gold;
  for (let i = 0; i < 60 && (it.plus ?? 0) < 5; i++) C.forge(s, a);
  assert.equal(it.plus, 5);
  assert.equal(C.forge(s, a), null);
  assert.ok(C.heroPower(s).atk > base);
  assert.ok(g0 - s.gold >= fee);
  assert.equal(C.forgeOdds({ plus: 2 }), 0.7);
});

test("legacy: enemies from betrayal, assets add up", () => {
  const s = adult("lg"); s.gold = 1000;
  C.giveItem(s, "healPotion", "t");
  s.party = { leader: { n: "คิมแท", rank: 3 }, trust: 50, rank: "member" };
  C.leaveParty(s, "betray");
  const L = C.legacyOf(s);
  assert.deepEqual(L.enemies, ["คิมแท"]);
  assert.ok(L.assets >= s.gold + 60 - 1);
});

test("a gate break reveals a hidden rank and costs association standing", () => {
  const s = adult("gb"); s.flags.hiddenRank = true; const a0 = s.fac.assoc;
  hooks.act.breakHelp(s);
  assert.equal(s.flags.hiddenRank, false);
  assert.equal(s.fac.assoc, a0 - 5);
});

test("imported saves: bad uids are dropped, plus is a whole number 0..5, the token stays in the bag", () => {
  const s = adult("imp");
  C.giveItem(s, "ironSword", "t");
  s.items.push({ uid: 'x"><img>', id: "ironSword", from: "t" });
  s.items[0].plus = -10;
  const t = C.deserialize(C.serialize(s));
  assert.equal(t.items.length, 1);
  assert.equal(t.items[0].plus, 0);
  const tok = C.giveItem(t, "phoenixToken", "t");
  assert.equal(C.stash(t, tok, "home"), false);
});

test("imported saves: teammates with odd ids or text numbers are cleaned", () => {
  const s = adult("tm");
  s.team = [{ id: 'x" onclick="y', n: "a", rank: 1 }, { id: "m1", n: "b", rank: "2", lv: "9", loyalty: "50" }, 5];
  const t = C.deserialize(C.serialize(s));
  assert.equal(t.team.length, 1);
  assert.equal(t.team[0].rank, 2);
});
