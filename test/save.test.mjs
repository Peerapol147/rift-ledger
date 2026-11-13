import { test } from "node:test";
import assert from "node:assert/strict";
import { newLife, serialize, deserialize, slots, collection } from "../src/core/index.js";
import { playUntil } from "./helpers.mjs";

const fakeStore = () => { const m = new Map(); return { get: (k) => m.get(k) ?? null, set: (k, v) => m.set(k, v), del: (k) => m.delete(k), m }; };

test("round-trip keeps the life identical", () => {
  const s = playUntil(newLife("sv"), (x) => x.ageM > 30 * 12);
  assert.deepEqual(deserialize(serialize(s)), s);
});

test("garbage and v1 saves return null", () => {
  assert.equal(deserialize("xx"), null);
  assert.equal(deserialize(JSON.stringify({ v: 1, name: "old" })), null);
  assert.equal(deserialize(JSON.stringify({ v: 2 })), null);
});

test("slots save, list, load, delete; import rejects invalid", () => {
  const st = fakeStore(), sl = slots(st);
  const s = newLife("a");
  sl.save(0, s);
  assert.equal(sl.list()[0].name, s.name);
  assert.equal(sl.list()[1], null);
  assert.deepEqual(sl.load(0), s);
  const str = sl.exportStr(0);
  sl.del(0);
  assert.equal(sl.load(0), null);
  assert.equal(sl.importStr(1, str).ok, true);
  assert.equal(sl.importStr(2, "nope").ok, false);
  st.set("riftledger.slot.v2.2", "xx");
  assert.equal(sl.load(2), null);
});

test("collection survives deleting all slots", () => {
  const st = fakeStore(), sl = slots(st), book = collection(st);
  sl.save(0, newLife("b"));
  book.addTitle("ผู้รอดจากเกตแตก");
  book.addSeen("cal", "cal24");
  sl.del(0);
  assert.deepEqual(collection(st).get().titles, ["ผู้รอดจากเกตแตก"]);
  assert.ok(collection(st).get().seen.cal.includes("cal24"));
});

test("slot save refuses an older state of the same life (another tab is further on)", () => {
  const st = fakeStore(), sl = slots(st);
  const s = newLife("tabs"); s.ageM = 240;
  assert.equal(sl.save(0, s), true);
  const older = deserialize(serialize(s)); older.ageM = 120;
  assert.equal(sl.save(0, older), "newer");
  assert.equal(deserialize(st.get("riftledger.slot.v2.0")).ageM, 240);
  s.ageM = 252; assert.equal(sl.save(0, s), true); // the same life, further on, still saves
});

test("an heir or another life still saves over the slot", () => {
  const st = fakeStore(), sl = slots(st);
  const a = newLife("tabs-a"); a.ageM = 600; sl.save(0, a);
  const b = newLife("tabs-b"); b.ageM = 12;
  assert.equal(sl.save(0, b), true);
});
