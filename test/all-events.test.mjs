import { test } from "node:test";
import assert from "node:assert/strict";
import { ALL_EVENTS } from "../src/data/events/index.js";
import { STATS } from "../src/data/stats.js";

test("every random event: a unique id, an option with no need, known check stats", () => {
  const seen = new Set();
  for (const e of ALL_EVENTS) {
    assert.ok(!seen.has(e.id), "duplicate id " + e.id);
    seen.add(e.id);
    assert.ok(e.o.some((o) => !o.need), "no need-free option: " + e.id);
    for (const o of e.o) if (o.s) assert.ok(o.s in STATS, `${e.id}: unknown stat ${o.s}`);
  }
});

test("nobody in the player's lifetime saw the world before the rift: no first-person memories of it", async () => {
  const { CALENDAR } = await import("../src/data/calendar.js");
  const texts = [];
  for (const e of ALL_EVENTS) for (const t of [e.t, ...e.o.flatMap((o) => [o.l, o.y?.m, o.n?.m])]) if (t) texts.push([e.id, t]);
  for (const e of CALENDAR) for (const v of Object.values(e.views ?? {})) for (const t of [v.t, ...v.o.flatMap((o) => [o.l, o.y?.m, o.n?.m])]) if (t) texts.push([e.id, t]);
  for (const [id, t] of texts) {
    if (!/ก่อน(วัน)?ฟ้าแตก|วันฟ้าแตก/.test(t)) continue;
    assert.ok(!/ฟ้าแตกอีกครั้ง|รูปของคุณ|ไม่เหลือใครที่จำ|ยี่สิบเอ็ดปี/.test(t), `${id}: ${t}`);
  }
});
