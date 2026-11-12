// Story lines must agree with what the player actually did (Codex story audit, 2026-11-13).
import { test } from "node:test";
import assert from "node:assert/strict";
import { newLife, openEvent, choose, optionView, serialize, deserialize } from "../src/core/index.js";
import { STORIES } from "../src/data/stories/index.js";
import { SECRETS } from "../src/data/secrets.js";

const adult = (seed, gold = 10000) => { const s = newLife(seed); s.ageM = 30 * 12; s.ev = null; s.gold = gold; return s; };
const open = (s, id, ev) => openEvent(s, { id, ...ev });
const pick = (s, label) => {
  const i = s.ev.opts.findIndex((o) => o.l === label);
  assert.ok(i >= 0, `option "${label}" exists`);
  choose(s, i);
  s.ev = null;
};
const usable = (s) => s.ev.opts.filter((o) => { const v = optionView(s, o); return v.visible && !v.locked; });
const allOptions = () => [
  ...Object.values(STORIES).flatMap((c) => (c.chapters ?? []).flatMap((ch) => ch.o ?? [])),
  ...Object.values(SECRETS).flatMap((q) => q.steps.flatMap((st) => st.o ?? [])),
];

test("a shop that refused the uncertified stones can pass the inspection honestly", () => {
  const s = adult("shop-refuse"), ch = STORIES.shop.chapters;
  open(s, "shop:1", ch[1]); pick(s, "ปฏิเสธทั้งหมด");
  open(s, "shop:3", ch[3]);
  const honest = usable(s).filter((o) => !o.s && !o.risk && !((o.y?.gold ?? 0) < 0));
  assert.ok(honest.length > 0, "an option with no bribe and no luck roll is open");
});

test("support finale depends on whether the frontliner was saved", () => {
  const ch = STORIES.support.chapters, route = (label) => {
    const s = adult("support-" + label);
    open(s, "support:3", ch[3]); pick(s, label);
    open(s, "support:4", ch[4]);
    return { s, labels: usable(s).map((o) => o.l), text: s.ev.t };
  };
  const saved = route("ใช้ยาจากตลาดมืดที่พกไว้"), lost = route("ยอมรับว่าช่วยไม่ได้");
  assert.equal(saved.s.c.spLost ?? 0, 0);
  assert.equal(lost.s.c.spLost, 1);
  // the shared opening claims neither that every team came home nor that one did not
  for (const r of [saved, lost]) assert.doesNotMatch(r.text, /กลับมาครบ|ไม่ครบ/);
  const extra = lost.labels.filter((l) => !saved.labels.includes(l));
  assert.equal(extra.length, 1, "only the lost route can answer for the frontliner");
});

test("an old save that refused the stones still gets the honest inspection", () => {
  const ch = STORIES.shop.chapters, oldSave = (label) => {
    const s = adult("legacy-" + label);
    open(s, "shop:1", ch[1]); pick(s, label);
    delete s.c.shopClean; s.sv = 2; // what a save from before shopClean looked like
    return deserialize(serialize(s));
  };
  const refused = oldSave("ปฏิเสธทั้งหมด");
  assert.equal(refused.c.shopClean, 1);
  open(refused, "shop:3", ch[3]);
  assert.ok(usable(refused).some((o) => o.l === "ให้ตรวจตามสบาย ร้านไม่เคยรับหินมานา"));
  assert.equal(oldSave("รับมาขาย").c.shopClean ?? 0, 0);
  assert.equal(oldSave("ซื้อเฉพาะของมีใบรับรอง").c.shopClean ?? 0, 0);
  const never = adult("legacy-never"); never.sv = 2;
  assert.equal(deserialize(serialize(never)).c.shopClean ?? 0, 0);
});

test("a secret quest never promises a next scene sooner than its gap allows", () => {
  const soon = /หนึ่งคืน|คืนนี้|พรุ่งนี้|สัปดาห์หน้า/;
  const bad = Object.entries(SECRETS).filter(([, q]) => q.gap[0] >= 1)
    .flatMap(([id, q]) => q.steps.flatMap((st) => st.o).filter((o) => soon.test(o.y?.m ?? "")).map((o) => id + ": " + o.y.m));
  assert.deepEqual(bad, []);
});

test("a line about someone you once helped only shows when the help happened", () => {
  const helpKeys = ["hunterFriend", "hdocTrust", "resLink", "teachKid", "docSaved", "heroic"];
  const bad = allOptions().filter((o) => /คุณเคยช่วย/.test(o.y?.m ?? "")
    && !Object.keys(o.need ?? {}).some((k) => helpKeys.includes(k)));
  assert.deepEqual(bad.map((o) => o.l), []);
});

test("no story outcome promises a raise it does not give", () => {
  const bad = allOptions().filter((o) => /เงินขึ้น|เงินเดือนขึ้น|ขึ้นเงินเดือน/.test(o.y?.m ?? ""));
  assert.deepEqual(bad.map((o) => o.y.m), []);
});

test("the seven-year door does not claim seven years passed when the gap is shorter", () => {
  const q = SECRETS.seven;
  if (q.gap[1] < 84) assert.ok(!q.steps[1].t.includes("ครบเจ็ดปี"), q.steps[1].t);
});

test("the ticket's businessman says why he hands the blade to whoever brought the ticket", () => {
  assert.match(SECRETS.ticket.steps[1].t, /บัตร/);
});
