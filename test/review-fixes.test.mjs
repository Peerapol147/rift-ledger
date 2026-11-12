import { test } from "node:test";
import assert from "node:assert/strict";
import * as C from "../src/core/index.js";
import { towerPay } from "../src/core/hunt.js";
import { hooks, afterOpHooks } from "../src/core/registry.js";

const hunter = (seed) => { const s = C.newLife(seed); s.ageM = 25 * 12; C.awakenCheck(s, "event"); s.ev = null; return s; };

test("tower pay rises with every floor, no flat steps or drops", () => {
  let last = 0;
  for (let f = 1; f <= 50; f++) { const p = towerPay(Math.round(4 + f * 1.5)); assert.ok(p > last, `floor ${f}: ${p} <= ${last}`); last = p; }
});

test("a full bag never sells the Phoenix Token, books or locked things, and says what it sold", () => {
  const s = hunter("bag1"); s.items = [];
  const tok = C.giveItem(s, "phoenixToken", "t"), book = C.giveItem(s, "bookTelekinesis", "t");
  const kept = C.giveItem(s, "manaShard", "t"); s.items.find((i) => i.uid === kept).lock = true;
  while (s.items.length < C.bagCap()) C.giveItem(s, "beastHide", "t");
  const n0 = s.log.length;
  // drive the loot hooks directly with a won S-gate boss
  for (const f of afterOpHooks) f(s, { def: { kind: "gate", rank: 6, boss: true, t: "x", foes: [] }, loot: 3, prep: {} }, "won", 0);
  assert.ok(s.items.some((i) => i.uid === tok) && s.items.some((i) => i.uid === book) && s.items.some((i) => i.uid === kept));
  assert.ok(s.log.slice(n0).some((l) => l.text.startsWith("กระเป๋าเต็ม")));
});

test("postponing a rank evaluation waits a year", () => {
  const s = hunter("re1");
  hooks.act.rankEvalLater(s);
  assert.equal(s.c.rankEvalAt, s.ageM + 12);
});

test("children cost until the youngest is grown", () => {
  const s = C.newLife("kid1"); s.ageM = 30 * 12; s.job = { id: "office", tier: 0, xp: 0 }; s.c.kids = 1;
  hooks.act.kidBorn(s);
  const cost = () => { const g = s.gold; C.living(s); return g - s.gold; };
  const young = cost(); s.ageM += 23 * 12; const grown = cost();
  assert.ok(young > grown, `${young} > ${grown}`);
});

test("a relic dropped into a bag full of keepers goes home, never sold for nothing", () => {
  const s = hunter("bag2"); s.items = [];
  while (s.items.length < C.bagCap()) { const u = C.giveItem(s, "ironSword", "t"); s.items.find((i) => i.uid === u).lock = true; }
  // a won op whose loot table is only the token, through the real loot hook
  const real = C.lootTable; const def = { kind: "gate", rank: 6, boss: true, t: "x", foes: [] };
  const homeBefore = C.storeOf(s).home.length;
  for (let k = 0; k < 40 && !C.storeOf(s).home.some((i) => i.id === "phoenixToken"); k++) {
    for (const f of afterOpHooks) f(s, { def, loot: 0, prep: {} }, "won", 0);
  }
  assert.equal(typeof real, "function");
  assert.ok(C.storeOf(s).home.length >= homeBefore);
  assert.ok(!s.ledger.some((e) => e.label === "ขายของที่ถือไม่ไหว" && e.amt === 0), "nothing sold for ₿0");
});

test("choosing to flee in a fight is running away: no xp", () => {
  const s = hunter("fl1");
  const g = C.gateOffers(s)[0];
  C.startOp(s, C.gateOp(s, { ...g, boss: false }), C.defaultPrep(s));
  s.ev = { id: "opDecision", tag: "เกต", t: "t", op: true, opts: [{ l: "หนี", y: { m: "หนี", flee: true } }] };
  const o = s.op;
  C.choose(s, 0);
  assert.equal(o.ranAway, 1);
  assert.equal(o.done, "fled");
});
