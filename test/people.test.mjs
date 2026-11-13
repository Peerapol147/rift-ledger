// One list of people (lives that remember, Task 2).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import * as C from "../src/core/index.js";

const raw = (f) => fs.readFileSync(new URL(`./fixtures/${f}.json`, import.meta.url), "utf8");
const adult = (seed) => { const s = C.newLife(seed); s.ageM = 30 * 12; return s; };
const P = { name: "ทดสอบ", country: "th", city: "bkk", sex: "f", bornWorldM: 0 };

test("same source key gives the same person", () => {
  const s = adult("pp1");
  const a = C.ensurePerson(s, P, "k1"), b = C.ensurePerson(s, { ...P, name: "อื่น" }, "k1");
  assert.equal(a, b);
  assert.equal(C.personById(s, a).name, "ทดสอบ");
  assert.notEqual(C.ensurePerson(s, P, "k2"), a);
});

test("a person who died in month 0 is dead", () => {
  const s = adult("pp2"), id = C.ensurePerson(s, P, "k");
  assert.equal(C.personAlive(s, id), true);
  C.setPersonStatus(s, id, { diedWorldM: 0 });
  assert.equal(C.personAlive(s, id), false);
  assert.equal(C.personPresent(s, id), false);
});

test("migration lists the roster and team without changing them", () => {
  const old = JSON.parse(raw("v2-before"));
  old.team = [{ id: "m1", n: "สมชาย", rank: 2, cls: "knight", role: "vanguard",
    lv: 20, loyalty: 61, alive: true, hurtUntilM: 3, story: 1, tpl: 2 }];
  const s = C.deserialize(JSON.stringify(old));
  const m = s.team[0];
  for (const k of ["id", "rank", "lv", "loyalty", "hurtUntilM", "story"]) assert.deepEqual(m[k], old.team[0][k], k);
  assert.ok(m.personId && C.personById(s, m.personId).name === "สมชาย");
  for (const n of s.world.roster) assert.ok(C.personById(s, n.personId), n.id);
  assert.equal(Object.keys(s.world.people).length, s.world.roster.length + 1);
});

test("a new life lists its world roster", () => {
  const s = C.newLife("pp-new");
  assert.ok(s.world.roster.length > 0);
  for (const n of s.world.roster) assert.ok(C.personById(s, n.personId));
});

test("hiring lists the member, dismissing marks them gone", () => {
  const s = adult("pp3"); s.gold = 1e7; s.hunter = { rank: 2, lv: 30 };
  const m = C.recruitOffers(s)[0];
  assert.equal(C.hire(s, m), true);
  assert.ok(m.personId && C.personPresent(s, m.personId));
  C.dismiss(s, m.id);
  assert.equal(C.personPresent(s, m.personId), false);
  assert.equal(C.personAlive(s, m.personId), true);
});

test("a teammate lost on a boss gate is dead in the list", () => {
  const s = adult("pp4"); s.gold = 1e7; s.hunter = { rank: 2, lv: 30 };
  const m = C.recruitOffers(s)[0]; C.hire(s, m);
  C.loseAlly(s, true);
  assert.equal(C.personAlive(s, m.personId), false);
});

test("a roster death marks the person dead", () => {
  const s = adult("pp5");
  const n = s.world.roster.find((x) => !x.holds && x.id !== "unmeasured");
  n.alive = false; C.syncRosterPeople(s);
  assert.equal(C.personAlive(s, n.personId), false);
});

test("remember is idempotent and capped at 24", () => {
  const s = adult("pp6"), id = C.ensurePerson(s, P, "k");
  C.remember(s, id, { id: "a", text: "x", worldM: 1 }); C.remember(s, id, { id: "a", text: "x", worldM: 1 });
  assert.equal(C.relationOf(s, id).memories.length, 1);
  for (let i = 0; i < 40; i++) C.remember(s, id, { id: "m" + i, text: "t", worldM: i });
  assert.equal(C.relationOf(s, id).memories.length, 24);
  assert.equal(C.relationOf(s, id).memories.at(-1).id, "m39");
});

test("trust is clamped and shown as words", () => {
  const s = adult("pp7"), id = C.ensurePerson(s, P, "k");
  C.changeRelation(s, id, { trust: 500, owe: -500, tag: "friend" });
  assert.deepEqual([C.relationOf(s, id).trust, C.relationOf(s, id).owe], [100, -100]);
  assert.ok(C.relationOf(s, id).tags.includes("friend"));
  assert.doesNotMatch(C.trustWord(100), /\d/);
});

test("two roster people with the same name stay two people", () => {
  const s = adult("pp8");
  const a = C.ensurePerson(s, P, "legacy-roster:x1"), b = C.ensurePerson(s, P, "legacy-roster:x2");
  assert.notEqual(a, b);
});
