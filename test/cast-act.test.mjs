// Story outcomes write onto the cast person (P2a Task 4, castAct).
import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import * as C from "../src/core/index.js";

const ID = "castact";
afterEach(() => { delete C.STORY_DEFS[ID]; });
const def = (act) => ({
  id: ID, title: "t", discover: () => true, entry: "a", cast: { x: (s) => ({ id: C.castPerson(s, "dohyun").id }) },
  nodes: { a: { t: "a {cast:x}", delay: [0, 0], o: [{ l: "go", y: { m: "m", end: "e", castAct: { x: act } } }] } },
  endings: { e: { title: "e" } },
});
const run = (act, setup = () => {}) => {
  C.STORY_DEFS[ID] = def(act);
  const s = C.newLife("ca-" + act); s.ageM = 30 * 12; setup(s);
  C.narrativeMonth(s); C.narrativeMonth(s);
  assert.equal(s.ev?.story?.id, ID);
  C.choose(s, 0);
  return [s, C.castPerson(s, "dohyun")];
};

test("rescued keeps them from gate deaths for ten years", () => {
  const [s, p] = run("rescued");
  assert.equal(p.savedUntilWM, C.worldMonth(s) + 120);
});
test("friend, enemy and owes are family ties the heirs can see", () => {
  for (const t of ["friend", "enemy", "owes"]) { const [s, p] = run(t); assert.equal(p.ties[s.familyId], t); }
});
test("rankUp stays within the ceiling, retire and injured land on the person", () => {
  const [, p] = run("rankUp"); assert.ok(p.rank <= p.ceiling);
  const [, r] = run("retire"); assert.equal(r.retired, true);
  const [s3, h] = run("injured"); assert.ok(h.hurtUntilWM > C.worldMonth(s3));
});
test("partner marries the player and ties the family", () => {
  const [s, p] = run("partner");
  assert.equal(s.c.married, 1);
  assert.equal(p.ties[s.familyId], "partner");
  assert.equal(p.partnerOf, s.lifeId);
});
test("the validator knows castAct", () => {
  assert.deepEqual(C.validateNarrative({ [ID]: def("friend") }), []);
});
test("romance is only for a romanceable member near the player's age, both unmarried", () => {
  const s = C.newLife("rom"); s.ageM = 25 * 12;
  const lalin = C.castPerson(s, "lalin"), poramet = C.castPerson(s, "poramet");
  C.changeRelation(s, lalin.id, { trust: 60 }); C.changeRelation(s, poramet.id, { trust: 60 });
  assert.equal(C.canRomance(s, lalin), true);
  assert.equal(C.canRomance(s, poramet), false);
  s.c.married = 1; assert.equal(C.canRomance(s, lalin), false);
  const old = C.newLife("rom2"); old.mon0 = 0; old.ageM = 25 * 12; old.familyId = "x";
  const pim = C.castPerson(old, "pim"); // born 26 years after the first player
  assert.equal(C.canRomance(old, pim), false);
});

test("a romance option shows only when the romance rule allows it", () => {
  const d = def("friend");
  d.cast = { x: (s) => ({ id: C.castPerson(s, "lalin").id }) };
  d.nodes.a.o.push({ l: "ขอคบ", romance: "x", y: { m: "m", end: "e", castAct: { x: "partner" } } });
  C.STORY_DEFS[ID] = d;
  const s = C.newLife("rm1"); s.ageM = 25 * 12;
  C.changeRelation(s, C.castPerson(s, "lalin").id, { trust: 60 });
  C.narrativeMonth(s); C.narrativeMonth(s);
  assert.ok(s.ev.opts.some((o) => o.l === "ขอคบ"));
  const t = C.newLife("rm2"); t.ageM = 25 * 12; t.c.married = 1;
  C.narrativeMonth(t); C.narrativeMonth(t);
  assert.ok(!t.ev.opts.some((o) => o.l === "ขอคบ"));
});

test("romance also needs real trust (spec §6: trust 60)", () => {
  const s = C.newLife("rom3"); s.ageM = 25 * 12;
  const lalin = C.castPerson(s, "lalin");
  assert.equal(C.canRomance(s, lalin), false);
  C.changeRelation(s, lalin.id, { trust: 60 });
  assert.equal(C.canRomance(s, lalin), true);
});
