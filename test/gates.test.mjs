import { test } from "node:test";
import assert from "node:assert/strict";
import { newLife, gateOffers, gateOp } from "../src/core/index.js";
import { GATES, MONSTERS, ELEMENTS } from "../src/data/index.js";

const eligible = (g, rank) => rank >= g.ranks[0] && rank <= g.ranks[1];

test("gate themes cover F–S with distinct scenes and valid existing creatures", () => {
  assert.ok(GATES.length >= 8 && GATES.length <= 10);
  assert.equal(new Set(GATES.map((g) => g.id)).size, GATES.length);
  const scenes = new Set();
  for (const g of GATES) {
    assert.ok(Number.isInteger(g.ranks[0]) && Number.isInteger(g.ranks[1]));
    assert.ok(0 <= g.ranks[0] && g.ranks[0] <= g.ranks[1] && g.ranks[1] <= 6);
    assert.ok(ELEMENTS[g.el], g.id);
    assert.ok(g.mon.length > 0);
    for (const n of g.mon) assert.ok(MONSTERS[n] && MONSTERS[n].kind !== "boss", n);
    assert.equal(MONSTERS[g.boss]?.kind, "boss", g.boss);
    assert.ok(g.decisions.length >= 1 && g.decisions.length <= 2);
    for (const d of g.decisions) {
      assert.ok(!scenes.has(d.t), g.id);
      scenes.add(d.t);
      assert.ok(d.o.some((o) => !o.need), d.t);
      for (const o of d.o) {
        assert.ok(o.l && o.y?.m);
        if (o.risk || o.s) assert.ok(o.n?.m, o.l);
      }
    }
  }
  for (let rank = 0; rank <= 6; rank++) {
    assert.ok(GATES.filter((g) => eligible(g, rank)).length >= 2, `rank ${rank}`);
  }
  assert.ok(GATES.filter((g) => eligible(g, 6)).every((g) => !eligible(g, 0)));
});

test("seeded offers select rank-appropriate themes and build their own operations", () => {
  const seen = new Set();
  for (let rank = 0; rank <= 6; rank++) {
    const a = newLife(`gate-rank-${rank}`), b = newLife(`gate-rank-${rank}`);
    for (const s of [a, b]) s.hunter = { rank, lv: 100 };
    for (let i = 0; i < 100; i++) {
      const offers = gateOffers(a);
      assert.deepEqual(offers, gateOffers(b));
      for (const offer of offers) {
        const theme = GATES.find((g) => g.id === offer.id);
        assert.ok(eligible(theme, offer.rank));
        seen.add(theme.id);
        for (const boss of [false, true]) {
          // Separate state keeps operation RNG from changing the offer stream.
          const op = gateOp(newLife("gate-op"), { ...offer, boss });
          assert.equal(op.decisions, theme.decisions);
          assert.ok(op.t.includes(theme.n));
          assert.equal(op.rank, offer.rank);
          assert.equal(op.foes.length, boss ? 3 : 2);
          for (const f of op.foes) {
            assert.ok(f.boss ? f.n === theme.boss : theme.mon.includes(f.n));
            assert.equal(f.el, theme.el);
          }
        }
      }
    }
  }
  assert.deepEqual([...seen].sort(), GATES.map((g) => g.id).sort());
});
