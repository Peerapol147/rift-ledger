// Imports are checked whole, never break a slot, and keep a backup (UX-14).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import * as C from "../src/core/index.js";

const mem = (failWrites = false) => { const m = new Map(); return { m, get: (k) => m.get(k) ?? null,
  set: (k, v) => (failWrites ? false : (m.set(k, v), true)), del: (k) => m.delete(k) }; };
const KEY = "riftledger.slot.v2.2";
const good = () => C.serialize(C.newLife("imp-good"));

test("a save missing c is rejected and the slot is untouched", () => {
  const st = mem(), sl = C.slots(st), mine = C.serialize(C.newLife("mine"));
  st.set(KEY, mine);
  const bad = JSON.parse(good()); delete bad.c;
  const r = sl.importStr(2, JSON.stringify(bad));
  assert.equal(r.ok, false);
  assert.match(r.reason, /ไม่ครบ/);
  assert.equal(st.get(KEY), mine);
});

test("a save whose world is broken is rejected", () => {
  const st = mem(), sl = C.slots(st), bad = JSON.parse(good()); bad.world = { roster: 5 };
  assert.equal(sl.importStr(2, JSON.stringify(bad)).ok, false);
  assert.equal(st.get(KEY), null);
});

test("a valid sv 2 save imports", () => {
  const st = mem(), sl = C.slots(st);
  const old = fs.readFileSync(new URL("./fixtures/v2-before.json", import.meta.url), "utf8");
  assert.deepEqual(sl.importStr(2, old), { ok: true, reason: "" });
  assert.ok(sl.load(2));
});

test("importing over a life keeps it as backup", () => {
  const st = mem(), sl = C.slots(st), mine = C.serialize(C.newLife("mine2"));
  st.set(KEY, mine);
  assert.equal(sl.importStr(2, good()).ok, true);
  assert.equal(st.get(KEY + ".bak"), mine);
});

test("a newer save is rejected with its reason", () => {
  const st = mem(), sl = C.slots(st);
  const r = sl.importStr(2, JSON.stringify({ ...JSON.parse(good()), sv: C.SAVE_SV + 1 }));
  assert.deepEqual([r.ok, r.reason], [false, "เซฟจากเกมเวอร์ชันใหม่กว่า"]);
});

test("a failed write reports it", () => {
  const sl = C.slots(mem(true));
  assert.deepEqual(sl.importStr(2, good()), { ok: false, reason: "บันทึกไม่สำเร็จ" });
});
