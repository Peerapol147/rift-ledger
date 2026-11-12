import { test } from "node:test";
import assert from "node:assert/strict";
import * as C from "../src/core/index.js";

const mem = () => { const m = new Map(); return { get: (k) => m.get(k) ?? null, set: (k, v) => m.set(k, v), del: (k) => m.delete(k), m }; };

test("a save from before factions and stores migrates to today's schema", () => {
  const s = C.newLife("old1"); s.ageM = 300; s.ev = null;
  delete s.sv; delete s.fac; delete s.store; delete s.enemies;
  const t = C.deserialize(C.serialize(s));
  assert.equal(t.sv, C.SAVE_SV);
  assert.equal(t.fac.assoc, 0);
  assert.deepEqual(t.store.guild, []);
  for (let i = 0; i < 24; i++) { t.ev = null; C.advance(t); }
});

test("a slot that no longer reads falls back to the save before it", () => {
  const st = mem(), sl = C.slots(st);
  const s = C.newLife("bak1");
  sl.save(0, s); s.ageM = 50; sl.save(0, s);
  st.set("riftledger.slot.v2.0", "{broken");
  assert.equal(sl.load(0).ageM, 0, "the earlier save");
  sl.del(0);
  assert.equal(sl.load(0), null);
});
