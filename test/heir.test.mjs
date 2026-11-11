import { test } from "node:test";
import assert from "node:assert/strict";
import * as C from "../src/core/index.js";

const parent = () => {
  const s = C.newLife("pa"); s.ageM = 40 * 12; C.awakenCheck(s, "event"); s.ev = null;
  s.hunter.rank = 3; s.fame = 60; s.gold = 100000; s.c.kids = 1;
  C.foundGuild(s);
  s.gold = 50000;
  const w = C.giveItem(s, "ironSword", "t"); s.items.find((i) => i.uid === w).plus = 3;
  C.giveItem(s, "phoenixToken", "t");
  s.enemies = [{ n: "คิมแท", why: "x", m: 1 }];
  s.world.done.cal24 = 1; s.world.records.silent = 49;
  s.dead = { cause: "อายุขัย", ageY: 40 };
  return s;
};

test("an heir is born the month the parent died, in the same world and country", () => {
  const P = parent(), h = C.newHeir(P, "pa-g2");
  assert.equal(h.ageM, 0);
  assert.equal(C.dateText(h), C.dateText(P));
  assert.equal(h.country, P.country);
  assert.equal(h.world.records.silent, 49);
  assert.ok(h.world.done.cal24);
  assert.equal(h.gen, 2);
  assert.equal(C.heirWord(P), "ลูก");
});

test("the estate: things wait at home (no token), gold in trust until 18 minus tax", () => {
  const P = parent(), h = C.newHeir(P, "pa-g2");
  assert.ok(h.store.home.some((i) => i.id === "ironSword" && i.plus === 3));
  assert.ok(!h.store.home.some((i) => i.id === "phoenixToken"));
  assert.equal(h.heir.gold, 40000);
  h.ageM = 18 * 12 - 1; h.ev = null;
  for (let i = 0; i < 24 && !h.heir.paid; i++) { h.ev = null; C.tick(h); }
  assert.ok(h.ledger.some((e) => e.label === "มรดกจากครอบครัว" && e.amt === 40000));
});

test("a civilian heir sells the family guild; a hunter heir can take it over", () => {
  const P = parent();
  const a = C.newHeir(P, "pa-c"); a.ageM = 20 * 12 - 1; a.heir.paid = 1;
  for (let i = 0; i < 24 && !a.heir.guildDone; i++) { a.ev = null; C.tick(a); }
  if (!a.hunter) assert.ok(a.ledger.some((e) => e.label === "ขายกิลด์ของครอบครัว"));
  const b = C.newHeir(P, "pa-h"); b.ageM = 20 * 12; C.awakenCheck(b, "event"); b.ev = null; b.heir.paid = 1;
  b.heir.guildDone = 0;
  for (let i = 0; i < 24 && b.ev?.id !== "heirGuild"; i++) { b.ev = null; C.tick(b); }
  assert.equal(b.ev?.id, "heirGuild");
  C.choose(b, 0);
  assert.equal(b.guild?.role, "master");
  assert.equal(b.guild.n, P.guild.n);
});

test("heir saves round-trip", () => {
  const h = C.newHeir(parent(), "pa-s");
  assert.equal(C.serialize(C.deserialize(C.serialize(h))), C.serialize(h));
});

test("calendar entries before the heir's birth never replay", () => {
  const P = parent(); P.world.done = {};
  const h = C.newHeir(P, "pa-cal");
  for (let i = 0; i < 6; i++) { h.ev = null; C.tick(h); }
  assert.ok(!h.log.some((l) => l.text.includes("ปีที่ 24")));
  assert.ok(Object.keys(h.world.done).length > 0);
});
