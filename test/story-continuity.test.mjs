// Story lines must agree with what the player actually did (Codex story audit, 2026-11-13).
import { test } from "node:test";
import assert from "node:assert/strict";
import { newLife, openEvent, choose, optionView } from "../src/core/index.js";
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

test("letting the poisoned frontliner go is remembered, and the next chapter does not say everyone came home", () => {
  const s = adult("support-lost"), ch = STORIES.support.chapters;
  open(s, "support:3", ch[3]); pick(s, "ยอมรับว่าช่วยไม่ได้");
  assert.equal(s.c.spLost, 1);
  assert.ok(!ch[4].t.includes("ทีมนั้นกลับมาครบ"), ch[4].t);
  assert.ok(!ch[4].o.some((o) => (o.y?.m ?? "").includes("ทุกคนกลับบ้านได้")));
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
