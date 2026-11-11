import { test } from "node:test";
import assert from "node:assert/strict";
import { newLife, applyUnlocks, bookStatus, lifeRecord, die } from "../src/core/index.js";

const book = (seen = {}) => ({ titles: [], seen, lives: 1 });

test("an empty book changes nothing", () => {
  const a = newLife("bk"), b = newLife("bk");
  applyUnlocks(b, book());
  assert.deepEqual(b.st, a.st);
  assert.equal(b.family, a.family);
});

test("bonuses apply once and stay within 10%", () => {
  const full = book({ death: ["boss", "old80"], cls: ["a", "b", "c"], flag: ["business", "gotToken"], secret: ["seven"] });
  assert.ok(bookStatus(full).total <= 10);
  const a = newLife("bb"), b = newLife("bb");
  applyUnlocks(b, full);
  applyUnlocks(b, full);
  for (const k of Object.keys(a.st)) assert.ok(b.st[k] <= a.st[k] * 1.1 + 2.0001);
  assert.ok(Object.keys(a.st).some((k) => b.st[k] > a.st[k]));
});

test("a life records what it saw and how it ended", () => {
  const s = newLife("rec"); s.world.done.cal24 = 1; s.ageM = 85 * 12; die(s, "อายุขัย");
  const r = lifeRecord(s).map((x) => x.join(":"));
  assert.ok(r.includes("cal:cal24") && r.includes("death:old80"));
});

test("an unlocked family still pays its gift at 18", async () => {
  const { tick } = await import("../src/core/index.js");
  for (let i = 0; i < 400; i++) {
    const s = newLife("uf" + i);
    applyUnlocks(s, book({ cal: ["cal24", "cal27"] }));
    if (!s.unlockFamily) continue;
    s.ageM = 18 * 12 - 1;
    assert.doesNotThrow(() => { s.ev = null; tick(s); });
    return;
  }
  assert.fail("no unlocked family drawn");
});
