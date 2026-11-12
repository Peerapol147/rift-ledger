import { test } from "node:test";
import assert from "node:assert/strict";
import * as C from "../src/core/index.js";
import { sceneOf, isNight, planTitle } from "../src/ui/art.js";
import { PLACE_KEYS } from "../src/place-art.js";

const at = (ageM) => { const s = C.newLife("scene"); s.ageM = ageM; s.ev = null; return s; };

test("a baby is drawn inside the home, an older child out front", () => {
  assert.equal(sceneOf(at(6), "kid"), "room");
  assert.equal(sceneOf(at(3 * 12 + 11), "kid"), "room");
  assert.equal(sceneOf(at(8 * 12), "kid"), "home");
  assert.ok(PLACE_KEYS.includes("room"), "the room has its own scenery");
});

test("a child's night-time event happens indoors", () => {
  const s = at(8 * 12);
  C.openEvent(s, { id: "n", t: "ไซเรนเตือนเกตดังกลางดึก แม่อุ้มคุณลงไปหลบ", o: [{ l: "a", y: {} }] });
  assert.equal(sceneOf(s, "kid"), "room");
});

test("events that say night, a blackout or the small hours are drawn at night", () => {
  for (const t of ["คืนหนึ่งไฟดับทั้งเมือง ข้างนอกมีแสงสีม่วง", "ไซเรนดังกลางดึก", "ฮันเตอร์เคาะประตูตอนตีสาม",
    "คืนที่นอนไม่หลับ คุณเดินไป"]) assert.equal(isNight(t), true, t);
  for (const t of ["วันแรกที่โรงเรียนอนุบาล", "ไซเรนดังกลางวันแสกๆ", "", undefined]) assert.equal(isNight(t), false, String(t));
});

test("a baby's plan is the parents' way of raising them, not the baby's choice", () => {
  assert.equal(planTitle(at(12)), "พ่อแม่เลี้ยงคุณแบบ");
  assert.equal(planTitle(at(6 * 12)), "แผนเดือนนี้");
});
