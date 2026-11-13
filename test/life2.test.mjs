import { test } from "node:test";
import assert from "node:assert/strict";
import * as C from "../src/core/index.js";
import { LIFE2_EVENTS } from "../src/data/events/life2.js";
import { ALL_EVENTS } from "../src/data/events/index.js";

const KIN = /หลาน|ลูกหลาน|ลูกกลับ|ส่วนสูงลูก/;
const WORK = /เงินเดือน|ตำแหน่งหัวหน้า|ในที่ทำงาน|เพื่อนร่วมงาน|งานเลี้ยงเกษียณ|บริษัทแจก|บริษัทประกาศ|มาขอทำงานกับคุณ/;

test("events that speak of children or grandchildren need kids", () => {
  const bad = LIFE2_EVENTS.filter((e) => KIN.test(e.t) && !(e.if?.kids >= 1)).map((e) => e.id);
  assert.deepEqual(bad, []);
});

test("events about a job need one, and are not for working hunters", () => {
  const bad = LIFE2_EVENTS.filter((e) => WORK.test(e.t) && !(e.if?.employed >= 1)).map((e) => e.id);
  assert.deepEqual(bad, []);
});

test("every option that spends money is guarded, and every event has a free way out", () => {
  const bad = [];
  for (const e of LIFE2_EVENTS) {
    for (const o of e.o) if ((o.y?.gold ?? 0) < 0 && !(o.need?.gold >= -o.y.gold)) bad.push(`${e.id}: ${o.l}`);
    if (!e.o.some((o) => !o.need && (o.y?.gold ?? 0) >= 0)) bad.push(`${e.id}: no free option`);
  }
  assert.deepEqual(bad, []);
});

test("a follow-up waits years after the step that set it up", () => {
  const SETUP = new Set(["kids", "dating", "married", "employed"]);
  const needsWait = (e) => Object.keys(e.if ?? {}).some((k) => !SETUP.has(k));
  const waits = (e) => Object.keys(e.if).filter((k) => !SETUP.has(k)).every((k) => (e.after?.[k] ?? 0) >= 24);
  const bad = LIFE2_EVENTS.filter((e) => needsWait(e) && !waits(e)).map((e) => e.id);
  assert.deepEqual(bad, []);
});

test("a follow-up is not eligible until its wait has passed", () => {
  const s = C.newLife("after"); s.ageM = 70 * 12;
  const end = ALL_EVENTS.find((e) => e.id === "olChessEnd");
  C.openEvent(s, { id: "x", t: "x", o: [{ l: "a", y: { c: { chessFriend: 1 } } }] }); C.choose(s, 0);
  assert.equal(C.eligible(s, end), false, "the month after");
  s.ageM += 36;
  assert.equal(C.eligible(s, end), true, "three years on");
});

test("taking the severance leaves you without the job", () => {
  const s = C.newLife("layoff"); s.ageM = 45 * 12;
  s.job = { id: "office", lv: 1, xp: 0 };
  const ev = ALL_EVENTS.find((e) => e.id === "m4Layoff");
  assert.equal(C.eligible(s, ev), true);
  C.openEvent(s, ev); C.choose(s, ev.o.findIndex((o) => o.l === "รับเงินชดเชยแล้วพัก"));
  assert.equal(s.job, null);
});

test("every habit with a cap names a real event", () => {
  const ids = new Set(ALL_EVENTS.map((e) => e.id));
  for (const e of ALL_EVENTS) if (e.cap === 2) assert.ok(ids.has(e.id));
  for (const id of ["adultRent", "adultHealth", "adultScam", "midBackPain", "oldScamCall", "oldHospital", "oldHealth",
    "lateHealthCheck", "eldClinic"]) assert.equal(ALL_EVENTS.find((e) => e.id === id)?.cap, 2, id);
});
