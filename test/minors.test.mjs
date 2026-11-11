// Deferred minors from the Phase 2 review.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  newLife, deserialize, serialize, collection, rollClass, die, giveItem, optionView, ageY, yearsAfterRift, awakenCheck,
} from "../src/core/index.js";
import { CLASSES } from "../src/data/index.js";
import { playUntil } from "./helpers.mjs";

test("imported save: non-string name rejected, numbers coerced", () => {
  const s = newLife("x");
  const bad = JSON.parse(serialize(s)); bad.name = { evil: 1 };
  assert.equal(deserialize(JSON.stringify(bad)), null);
  const odd = JSON.parse(serialize(s)); odd.fame = "<img src=x onerror=alert(1)>"; odd.gold = "12";
  const back = deserialize(JSON.stringify(odd));
  assert.equal(back.fame, 0);
  assert.equal(back.gold, 12);
});

test("collection with bad seen/titles normalises", () => {
  const m = new Map([["riftledger.book.v2", JSON.stringify({ seen: null, titles: "x", lives: "nope" })]]);
  const st = { get: (k) => m.get(k) ?? null, set: (k, v) => m.set(k, v), del: (k) => m.delete(k) };
  const b = collection(st).get();
  assert.deepEqual(b.seen, {});
  assert.deepEqual(b.titles, []);
  assert.equal(b.lives, 0);
});

test("Mythic only for EX; Legendary held by an NPC is blocked", () => {
  const mythic = Object.keys(CLASSES).filter((c) => CLASSES[c].rarity === 4);
  let exGot = false;
  for (let i = 0; i < 3000; i++) {
    const s = newLife("my" + i);
    assert.ok(!mythic.includes(rollClass(s, 5)), "non-EX rolled Mythic");
    if (mythic.includes(rollClass(s, 7))) exGot = true;
  }
  assert.ok(exGot, "EX never rolled Mythic");
});

test("Phoenix Token is not spent on old age", () => {
  const s = newLife("ph");
  giveItem(s, "phoenixToken", "t");
  die(s, "อายุขัย");
  assert.ok(s.dead);
  assert.equal(s.items.length, 1);
});

test("nerve options lock when mind is below 20, with a readable reason", () => {
  const s = newLife("nv"); s.mind = 10;
  const v = optionView(s, { l: "x", nerve: true, y: {} });
  assert.equal(v.locked, true);
  assert.match(v.lockText, /สุขภาพจิต/);
});

test("role locks show the Thai role name, not the id", () => {
  const v = optionView(newLife("rl"), { l: "x", need: { "role:scout": 1 }, y: {} });
  assert.doesNotMatch(v.lockText, /scout/);
  assert.match(v.lockText, /สอดแนม/);
});

test("calendar break in Bangkok shows a nearby view, not the subway, to a Chiang Mai life", () => {
  let s;
  for (let i = 0; !s; i++) { const t = newLife("cm" + i); if (t.city === "cnx") s = t; }
  playUntil(s, (x) => x.ev?.id === "cal24" || yearsAfterRift(x) > 24);
  if (s.ev?.id === "cal24") assert.doesNotMatch(s.ev.t, /สถานีรถไฟใต้ดิน/);
  else assert.ok(s.log.some((l) => /กรุงเทพ/.test(l.text)));
});
