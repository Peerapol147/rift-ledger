// Every way a teammate joins lists them as one person (P1 review R2), and saves made before that are repaired once.
import { test } from "node:test";
import assert from "node:assert/strict";
import * as C from "../src/core/index.js";
import { hooks } from "../src/core/registry.js";

const hunter = (seed) => { const s = C.newLife(seed); s.ageM = 30 * 12; s.gold = 1e7;
  s.hunter = { rank: 3, lv: 40, xp: 0, skills: [], cls: "knight" }; return s; };
const party = (s, trust) => { s.party = { leader: { n: "หัวหน้า", rank: 4 }, trust, role: "member" }; };
const listed = (s) => s.team.every((m) => m.personId && C.personById(s, m.personId)?.name === m.n);
const onePerson = (s) => new Set(s.team.map((m) => m.personId)).size === s.team.length;

test("a sworn ally is listed", () => {
  const s = hunter("tp1"); hooks.act.loyalAlly(s);
  assert.equal(s.team.length, 1);
  assert.ok(listed(s) && onePerson(s));
});

test("followers from splitting a party are listed", () => {
  const s = hunter("tp2"); party(s, 80); C.leaveParty(s, "split");
  assert.equal(s.team.length, 1);
  assert.ok(listed(s));
});

test("an inherited team is listed, two people for two members", () => {
  const s = hunter("tp3"); party(s, 80); C.leaveParty(s, "inherit");
  assert.equal(s.team.length, 2);
  assert.ok(listed(s) && onePerson(s));
});

test("a save from before the fix is repaired once on load, keeping the member as it was", () => {
  const s = hunter("tp4"); party(s, 80); C.leaveParty(s, "inherit");
  const raw = JSON.parse(C.serialize(s));
  for (const m of raw.team) delete m.personId;
  const before = JSON.parse(JSON.stringify(raw.team));
  const once = C.deserialize(JSON.stringify(raw));
  assert.ok(listed(once));
  for (const [i, m] of once.team.entries()) for (const k of ["id", "rank", "lv", "loyalty", "hurtUntilM", "story"]) {
    assert.deepEqual(m[k], before[i][k], k);
  }
  const people = Object.keys(once.world.people).length;
  const twice = C.deserialize(C.serialize(once));
  assert.equal(Object.keys(twice.world.people).length, people);
  assert.deepEqual(twice.team.map((m) => m.personId), once.team.map((m) => m.personId));
});

test("an inherited member who dies is dead in the list, and nobody else is", () => {
  const s = hunter("tp5"); party(s, 80); C.leaveParty(s, "inherit");
  const [a, b] = s.team; a.loyalty = 0; b.loyalty = 90;
  C.loseAlly(s, true);
  assert.equal(C.personAlive(s, a.personId), false);
  assert.equal(C.personAlive(s, b.personId), true);
});
