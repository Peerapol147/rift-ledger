// A slot holding a save from a newer game version is never loaded from an older backup, never written over, and
// still exports its own bytes (P1 review R1). A save that is merely cut short still recovers from its backup.
import { test } from "node:test";
import assert from "node:assert/strict";
import * as C from "../src/core/index.js";

const mem = () => { const m = new Map(); return { m, get: (k) => m.get(k) ?? null, set: (k, v) => m.set(k, v),
  del: (k) => m.delete(k) }; };
const KEY = "riftledger.slot.v2.0";
const life = (gold) => { const s = C.newLife("sv"); s.gold = gold; return s; };
const newer = () => JSON.stringify({ ...JSON.parse(C.serialize(life(99999))), sv: C.SAVE_SV + 1 });

test("a newer primary with an older backup is not loaded and not overwritten", () => {
  const st = mem(), sl = C.slots(st);
  const primary = newer(), backup = C.serialize(life(100));
  st.set(KEY, primary); st.set(KEY + ".bak", backup);
  assert.equal(sl.load(0), null);
  assert.equal(sl.status(0), "unsupported");
  assert.equal(sl.save(0, life(5)), false);
  assert.equal(st.get(KEY), primary);
  assert.equal(st.get(KEY + ".bak"), backup);
});

test("a newer backup behind a broken primary is reported, not ignored", () => {
  const st = mem(), sl = C.slots(st);
  st.set(KEY, "{\"v\":2,"); st.set(KEY + ".bak", newer());
  assert.equal(sl.status(0), "unsupported");
  assert.equal(sl.load(0), null);
});

test("a cut-short primary still recovers from a good backup", () => {
  const st = mem(), sl = C.slots(st);
  st.set(KEY, "{\"v\":2,\"name\""); st.set(KEY + ".bak", C.serialize(life(100)));
  assert.equal(sl.status(0), "ok");
  assert.equal(sl.load(0).gold, 100);
});

test("the slot list neither counts a newer save as empty nor as finished", () => {
  const st = mem(), sl = C.slots(st);
  st.set(KEY, newer());
  const x = sl.list()[0];
  assert.ok(x, "not empty");
  assert.equal(x.locked, true);
  assert.notEqual(x.dead, true);
});

test("export gives the newer save's own bytes", () => {
  const st = mem(), sl = C.slots(st), primary = newer();
  st.set(KEY, primary); st.set(KEY + ".bak", C.serialize(life(1)));
  assert.equal(sl.exportStr(0), primary);
  assert.equal(st.get(KEY), primary);
});

test("import does not write over a newer save", () => {
  const st = mem(), sl = C.slots(st), primary = newer();
  st.set(KEY, primary);
  assert.equal(sl.importStr(0, C.serialize(life(3))).ok, false);
  assert.equal(st.get(KEY), primary);
});

test("settings shows a newer save as locked, with export and nothing that writes", async () => {
  const { settingsView } = await import("../src/ui/settings.js");
  const html = settingsView({ policy: "important", fs: 2 }, [{ locked: true }, null, null]);
  const row = html.split("ช่อง 1:")[1].split("ช่อง 2:")[0];
  assert.match(row, /เวอร์ชันใหม่กว่า/);
  assert.match(row, /export:0/);
  for (const a of ["save:0", "load:0", "del:0"]) assert.ok(!row.includes(a), a);
});
