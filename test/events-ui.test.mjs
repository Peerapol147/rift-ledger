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
  assert.equal(C.eventKind(s).tier, "rare");
  assert.ok(!JSON.stringify(C.eventKind(s)).includes("ลับ"));
});
