import { test } from "node:test";
import assert from "node:assert/strict";
import * as C from "../src/core/index.js";
import { ITEMS } from "../src/data/items.js";
import { CLASSES } from "../src/data/classes.js";

const hunter = (seed) => { const s = C.newLife(seed); s.ageM = 25 * 12; C.awakenCheck(s, "event"); s.ev = null; return s; };

test("loot tier follows danger: an F gate drops common gear, an S gate legendary, sets only in their tower", () => {
  const gear = (def, r) => C.lootTable(def).filter((x) => ITEMS[x.id].slot && ITEMS[x.id].rarity === r && !ITEMS[x.id].set);
  assert.ok(gear({ kind: "gate", rank: 0 }, 0).length > 0);
  assert.equal(gear({ kind: "gate", rank: 0 }, 3).length, 0);
  assert.ok(gear({ kind: "gate", rank: 6 }, 3).length > 0);
  const silent = C.lootTable({ kind: "tower", tower: "silent", floor: 15 }).map((x) => x.id);
  assert.ok(silent.includes("shiftLanyard") && !silent.includes("coralHarpoon"));
  assert.ok(!C.lootTable({ kind: "gate", rank: 3 }).some((x) => ITEMS[x.id].set));
});

test("gear made for your role gives +25%; a full set adds its bonus", () => {
  const s = hunter("lt1");
  const myRole = CLASSES[s.hunter.cls].role;
  const base = C.heroPower(s).atk;
  const uid = C.giveItem(s, "rebarClub", "t"); C.equip(s, uid);
  const withClub = C.heroPower(s).atk - base;
  assert.ok(Math.abs(withClub - 7 * (myRole === "vanguard" ? 1.25 : 1)) < 0.6, `club adds ${withClub} as ${myRole}`);
  for (const id of ["shiftLanyard", "fluoroCoat", "staplerGun"]) C.equip(s, C.giveItem(s, id, "t"));
  assert.deepEqual(C.setBonus(s), { atk: 12, def: 12, hp: 40 });
  // and the same club on a vanguard is worth 25% more
  s.hunter.cls = Object.keys(CLASSES).find((c) => CLASSES[c].role === "vanguard");
  assert.equal(C.gearValue(s, s.items.find((i) => i.id === "rebarClub"), "atk"), 7 * 1.25);
});
