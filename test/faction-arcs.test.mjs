import { test } from "node:test";
import assert from "node:assert/strict";
import * as C from "../src/core/index.js";
import { hooks } from "../src/core/registry.js";
import { FAC_ARCS } from "../src/data/factions.js";

const adult = (seed, hunter) => {
  const s = C.newLife(seed); s.ageM = 30 * 12; if (hunter) C.awakenCheck(s, "event"); s.ev = null; s.gold = 50000; return s;
};
const tickUntil = (s, id) => { for (let i = 0; i < 24 && s.ev?.id !== id; i++) { s.ev = null; C.tick(s); } return s.ev?.id === id; };

test("a trusting faction makes its offer once; the perk pays while standing holds", () => {
  const s = adult("fa1");
  s.fac.state = 45;
  assert.ok(tickUntil(s, "fachi:state"));
  C.choose(s, 0);
  assert.ok(s.flags.patronState);
  s.ev = null; C.tick(s);
  assert.ok(s.ledger.some((e) => e.label === "เงินเดือนที่ปรึกษารัฐ"));
  for (let i = 0; i < 30; i++) { s.ev = null; C.tick(s); assert.notEqual(s.ev?.id, "fachi:state"); }
});

test("a hostile faction makes trouble; the association blacklist closes teams and clean guilds", () => {
  const s = adult("fa2", true);
  s.fac.assoc = -70;
  assert.ok(tickUntil(s, "facbad:assoc"));
  C.choose(s, 0);
  assert.ok(s.flags.blacklisted);
  assert.ok(C.guildsFor(s).every((g) => g.perk === "shady"));
});

test("a state patron gets no unregistered gates; the tax fine is 10%", () => {
  const s = adult("fa3", true); s.fac.under = 50; s.flags.patronState = true;
  C.openGateChoice(s);
  assert.ok(!s.offers.some((d) => d.illegal));
  const g0 = s.gold; hooks.act.facTaxFine(s);
  assert.equal(s.gold, g0 - Math.round(g0 * 0.1));
});

test("every arc event has an option with no need", () => {
  for (const [k, a] of Object.entries(FAC_ARCS)) for (const side of ["hi", "bad"]) {
    assert.ok(a[side].o.some((o) => !o.need && !o.risk), `${k}.${side}`);
  }
});

test("the association's committee seat goes only to rank C and up", () => {
  const s = adult("fa4", true); s.hunter.rank = 1; s.fac.assoc = 50;
  assert.ok(!tickUntil(s, "fachi:assoc"));
  s.hunter.rank = 3;
  assert.ok(tickUntil(s, "fachi:assoc"));
});
