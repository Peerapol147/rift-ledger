// Fixes from the whole-branch review of lives that remember P1.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import * as C from "../src/core/index.js";
import { ALL_EVENTS } from "../src/data/events/index.js";
import { firstOpen } from "./helpers.mjs";

const raw = (f) => fs.readFileSync(new URL(`./fixtures/${f}.json`, import.meta.url), "utf8");
const step = (s) => { if (!s.ev) C.advance(s); else C.choose(s, Math.max(0, firstOpen(s))); };

test("an old adult save never replays the childhood friend story", () => {
  const s = C.deserialize(raw("v2-before"));
  for (let i = 0; i < 400; i++) step(s);
  assert.equal(s.narrative.stories.friend, undefined);
});

test("the friend's awakening scene waits for the player's own screening", () => {
  for (const seed of ["aw1", "aw2", "aw3", "aw19"]) {
    const s = C.newLife(seed);
    let at = null;
    for (let n = 0; n < 40000 && at == null && C.ageY(s) < 30; n++) {
      if (s.ev?.story?.node === "awaken") at = s.ageM;
      step(s);
    }
    assert.ok(at == null || (s.c["ev:ms18"] ?? 0) > 0, seed);
  }
});

const office = (route, extra = {}) => {
  const s = C.newLife("fix-office"); s.ageM = 30 * 12; s.ev = null; s.job = { id: "office", tier: 1, xp: 0 };
  C.startStory(s, "office");
  Object.assign(s.narrative.stories.office, { due: 0, route, ...extra });
  return s;
};
const open = (s, node) => { s.ev = null; s.narrative.stories.office.node = node; s.narrative.stories.office.due = 0;
  C.narrativeMonth(s); return s.ev; };

test("the claimant's letter only comes from a claimant who trusts you and is alive", () => {
  const s = office(null); s.c.offClean = 1;
  const ev = open(s, "pushback");
  assert.ok(!ev.opts.some((o) => /ฮันเตอร์ที่คุณเคยช่วย/.test(o.y?.m ?? "")));
  const t = office(null); t.c.offClean = 1;
  C.changeRelation(t, t.narrative.stories.office.cast.claimant, { trust: 60 });
  assert.ok(open(t, "pushback").opts.some((o) => /ฮันเตอร์ที่คุณเคยช่วย/.test(o.y?.m ?? "")));
});

test("nobody pays back an envelope they never kept", () => {
  for (const node of ["liability", "fallout"]) {
    const s = office("complicity"); s.gold = 99999;
    assert.ok(!open(s, node).opts.some((o) => (o.y?.gold ?? 0) < 0), node);
    const k = office("complicity", { vars: { tookCash: 1 } }); k.gold = 99999;
    assert.ok(open(k, node).opts.some((o) => (o.y?.gold ?? 0) < 0), node + " kept");
  }
});

test("paying the claimant off is not told as the guild's envelope", () => {
  const s = office("complicity", { vars: { hush: 1 } });
  assert.doesNotMatch(open(s, "cover-up").t, /ขอบคุณที่เข้าใจ/);
  const l = office("complicity", { vars: { hush: 1 } });
  assert.doesNotMatch(open(l, "liability").t, /ท้ายตัวเลขที่ถูกแก้/);
});

test("a new company means a job; resigning at pushback means no job", () => {
  const s = office(null); s.gold = 0;
  const ev = open(s, "independent-offer");
  C.choose(s, ev.opts.findIndex((o) => o.l === "หางานบริษัทใหม่"));
  assert.equal(s.job?.id, "office");
  const q = office(null); q.c.offClean = 1;
  const e2 = open(q, "pushback");
  C.choose(q, e2.opts.findIndex((o) => o.l === "ลาออก"));
  assert.equal(q.job, null);
});

test("the friend never recalls themselves in the third person", () => {
  const s = C.newLife("fr3p");
  for (let n = 0; n < 40000 && s.narrative.stories.friend?.node !== "reunion"; n++) step(s);
  const st = s.narrative.stories.friend, name = C.personById(s, st.cast.friend).name;
  s.ev = null; st.due = 0; s.ageM = Math.max(s.ageM, 36 * 12); C.narrativeMonth(s);
  assert.equal(s.ev.t.split(name).length - 1, 1, s.ev.t); // named once, as the person you meet; memories say "เขา"
  assert.match(s.ev.t, /ปีนรั้ว/);
});

test("a partner from the friend story cannot get a second wedding", () => {
  const love = ALL_EVENTS.find((e) => e.id === "adultLove");
  const s = C.newLife("wed"); s.ageM = 38 * 12; s.c.dating = 1; s.c.married = 1;
  assert.equal(C.eligible(s, love), false);
});
