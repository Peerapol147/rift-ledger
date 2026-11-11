import test from "node:test";
import assert from "node:assert/strict";
import * as C from "../src/core/index.js";

test("a quick potion is drunk once below 30% hp and leaves the bag", () => {
  const s = C.newLife(7);
  C.giveItem(s, "healPotion", "t");
  const prep = C.defaultPrep(s);
  assert.equal(prep.quick.length, 1);
  const o = { prep, hp: 10, maxHp: 100, def: {}, foes: [] };
  C.quickHeal(s, o);
  assert.equal(o.hp, 50);
  assert.equal(s.items.filter((i) => i.id === "healPotion").length, 0);
  o.hp = 10; C.quickHeal(s, o);
  assert.equal(o.hp, 10, "used only once");
});

test("year summary lists last year's notable lines", () => {
  const s = C.newLife(7);
  s.log.push({ m: 24, tag: "t", text: "เรื่องใหญ่", tone: "imp" }, { m: 25, tag: "t", text: "เรื่องเล็ก", tone: "" });
  assert.deepEqual(C.yearSummary(s, 2).lines, ["เรื่องใหญ่"]);
});
