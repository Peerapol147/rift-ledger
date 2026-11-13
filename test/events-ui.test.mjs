import { test } from "node:test";
import assert from "node:assert/strict";
import * as C from "../src/core/index.js";

test("fate picks an open option deterministically; event kind labels chains without saying secret", () => {
  const mk = () => { const s = C.newLife("fate"); s.ageM = 300; C.openEvent(s, { id: "x", t: "t", o: [{ l: "a", y: { m: "A" } }, { l: "b", y: { m: "B" } }] }); return s; };
  const a = mk(), b = mk();
  assert.ok(C.chooseByFate(a)); C.chooseByFate(b);
  assert.equal(a.log.at(-1).text, b.log.at(-1).text);
  assert.equal(a.ev, null);
  const s = mk(); s.ev.id = "office:2";
  assert.deepEqual(C.eventKind(s), { tier: "story", part: "ตอนที่ 3 จาก 5" });
  s.ev.id = "sq:phoenix:0";
  assert.equal(C.eventKind(s).tier, "story", "a secret quest looks like any story chapter");
  assert.ok(!JSON.stringify(C.eventKind(s)).includes("ลับ"));
});

// Task 5 (life plans): options show what they touch, from the success outcome only, never secrets.
test("option chips show stats, money and mind, never counters, factions or failure", () => {
  const s = C.newLife("chips"); s.ageM = 300; s.gold = 10000;
  const v = C.optionView(s, { l: "a", y: { st: { int: 0.3 }, gold: -500, mind: 4, c: { x: 1 }, fac: { state: 2 } },
    n: { hp: -20 } });
  assert.deepEqual(v.fx, ["ปัญญา↑", "เงิน−", "สุขภาพจิต+"]);
  const w = C.optionView(s, { l: "b", y: { gold: 300, hp: -5, fame: 2, st: { str: -0.2 } } });
  assert.deepEqual(w.fx, ["กาย↓", "เงิน+", "สุขภาพ−", "ชื่อเสียง+"]);
  assert.deepEqual(C.optionView(s, { l: "c", y: { m: "x" } }).fx, []);
});
