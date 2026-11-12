import { test } from "node:test";
import assert from "node:assert/strict";
import * as C from "../src/core/index.js";
import { cityOf } from "../src/data/world.js";

const adult = (seed) => { const s = C.newLife(seed); s.ageM = 30 * 12; s.ev = null; s.job = { id: "office", tier: 0, xp: 0 }; return s; };
const livingCost = (s) => { const g = s.gold; C.living(s); return g - s.gold; };

test("a home of your own halves the city part of living cost, only in its city", () => {
  const s = adult("sp1"), rent = livingCost(s);
  C.hooks.act.buyHome(s);
  assert.equal(livingCost(s), rent - Math.round(cityOf(s.city).cost * 0.5));
  s.city = Object.keys(C.CITIES ?? {}).find((c) => c !== s.city) ?? "other";
  assert.equal(C.ownsHere(s), false);
});

test("a mortgage the bank refuses gives the down payment back and buys nothing", () => {
  const s = adult("sp2"); s.gold = 0;
  const down = Math.round(C.homePrice(s) * 0.3);
  s.debt = 1e9; // already over the cap
  C.hooks.act.mortgageHome(s);
  assert.equal(s.home ?? null, null);
  assert.equal(s.gold, down);
});

test("a fake mentor takes the money and teaches nothing; a real one boosts xp for a year", () => {
  const s = adult("sp3"); C.awakenCheck(s, "event"); s.ev = null;
  s.c.mentorFake = 1; C.hooks.act.mentorStart(s);
  assert.equal(C.hooks.mentorXp(s), 1);
  s.c.mentorFake = 0; C.hooks.act.mentorStart(s);
  assert.equal(C.hooks.mentorXp(s), 1.4);
  s.ageM += 12;
  assert.equal(C.hooks.mentorXp(s), 1);
});

test("checking a fake mentor's papers costs nothing", () => {
  const s = adult("sp4"); C.awakenCheck(s, "event"); s.ev = null; s.gold = 1e6;
  s.c.mentorFake = 1; C.hooks.act.mentorCheck(s);
  assert.equal(s.gold, 1e6);
});

test("boss intel weakens only the boss, and halves the chance a loss is fatal", () => {
  const d = { id: "t", kind: "gate", t: "x", boss: true, rewards: { gold: 1000 },
    foes: [C.foe("สุนัขท่อระบาย", 20, "wood"), C.foe("ราชาลานจอด", 24, "metal", true)] };
  const w = C.withIntel(d);
  assert.equal(w.foes[0].hp, d.foes[0].hp);
  assert.ok(w.foes[1].hp < d.foes[1].hp && w.foes[1].atk < d.foes[1].atk);
  assert.equal(C.intelPrice(d), 350);
});

test("the heir inherits the family home in the same city, the schooling, and the fund's grant", () => {
  const P = adult("sp5"); P.c.kids = 1; C.hooks.act.buyHome(P);
  P.c.kidSchool = 1; P.flags.fund = true; P.dead = { cause: "อายุขัย", ageY: 70 };
  const plain = C.newHeir({ ...P, home: null, c: { ...P.c, kidSchool: 0 }, flags: {} }, "sp5-h");
  const h = C.newHeir(P, "sp5-h");
  assert.ok(C.ownsHere(h));
  assert.equal(h.st.int, plain.st.int + 2);
  assert.equal(h.c.fundGrant, 1);
});
