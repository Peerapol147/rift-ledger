import { test } from "node:test";
import assert from "node:assert/strict";
import { newLife, tick, businesses, staffOffers, hireStaff } from "../src/core/index.js";
import { CALENDAR } from "../src/data/index.js";

const owner = (flag) => { const s = newLife("bz"); s.ageM = 40 * 12; s.c.famGift = 1; s.flags[flag] = true; s.gold = 100000;
  for (const k of ["ms6", "ms12", "ms15", "ms18", "ms22", "ms30", "ms40"]) s.c["ev:" + k] = 1;
  for (const e of CALENDAR) s.world.done[e.id] = 1; return s; };
const month = (s) => { s.ev = null; s.op = null; tick(s); s.ev = null; };

test("an owned business pays monthly profit through the ledger", () => {
  const s = owner("shopChain");
  assert.equal(businesses(s).length, 1);
  month(s);
  assert.ok(s.ledger.some((e) => e.label.startsWith("กำไรกิจการ") && e.amt > 0));
});

test("staff raise profit and cost wages", () => {
  const a = owner("ownRestaurant"); month(a);
  const p0 = a.ledger.filter((e) => e.label.startsWith("กำไรกิจการ")).at(-1).amt;
  const b = owner("ownRestaurant"); hireStaff(b, staffOffers(b)[0]); month(b);
  const p1 = b.ledger.filter((e) => e.label.startsWith("กำไรกิจการ")).at(-1).amt;
  assert.ok(p1 > p0);
  assert.ok(b.ledger.some((e) => e.label === "ค่าจ้างลูกน้อง"));
});

test("a disloyal staff member embezzles", () => {
  const s = owner("ownFirm"); hireStaff(s, staffOffers(s)[0]);
  s.staff[0].loyalty = 5;
  for (let i = 0; i < 24 && s.ev?.id !== "staffEmbezzle"; i++) { s.ev = null; tick(s); }
  assert.equal(s.ev?.id, "staffEmbezzle");
});
