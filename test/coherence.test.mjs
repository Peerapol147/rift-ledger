// The story must agree with itself: the fixed calendar, the life the player actually has, and what the text claims.
import { test } from "node:test";
import assert from "node:assert/strict";
import { newLife, yearsAfterRift, gateOffers, eligible, canHire, jobOffers, workMonth, hooks }
  from "../src/core/index.js";
import { CALENDAR, GATES, MILESTONES, CAREERS } from "../src/data/index.js";
import { ALL_EVENTS } from "../src/data/events/index.js";
import { playUntil } from "./helpers.mjs";

const news = (s) => s.log.filter((l) => l.tag === "ข่าวโลก").map((l) => l.text);
const ev = (id) => ALL_EVENTS.find((e) => e.id === id);

test("random world news never breaks a tower record the calendar has promised to someone", () => {
  for (let i = 0; i < 25; i++) {
    const s = newLife("cal" + i);
    let before = null;
    playUntil(s, (x) => {
      const y = yearsAfterRift(x);
      for (const e of CALENDAR) {
        if (e.kind !== "record" || x.world.done[e.id]) continue;
        // an unplayed calendar record: nobody else may already stand on that floor
        assert.ok(x.world.records[e.tower] < e.floor, `seed cal${i}: ${e.tower} at ${x.world.records[e.tower]} `
          + `in year ${y}, but the calendar gives floor ${e.floor} to year ${e.year}`);
      }
      before = y;
      return y > 71;
    }, 9000);
    assert.ok(before > 60);
    assert.ok(!news(s).some((t) => t.includes("เพราะมีคนทำได้ก่อนแล้ว")), "an NPC lost a record to random news");
  }
});

test("every notable hunter has their own name, and none shares the player's", () => {
  for (let i = 0; i < 40; i++) {
    const s = playUntil(newLife("nm" + i), (x) => yearsAfterRift(x) > 60, 9000);
    const names = s.world.roster.map((n) => n.n);
    assert.equal(new Set(names).size, names.length, `seed nm${i}: ${names.join(", ")}`);
    assert.ok(!names.includes(s.name));
  }
});

test("tower news uses one name for a tower, with a space before it", () => {
  const s = playUntil(newLife("tn"), (x) => yearsAfterRift(x) > 70, 9000);
  for (const t of news(s)) assert.ok(!/สถิติ(The|หอ)/.test(t) || /สถิติหอ(เงียบ|จมน้ำ)/.test(t), t);
});

test("the association's list never offers the same gate twice", () => {
  for (let i = 0; i < 30; i++) {
    const s = newLife("go" + i);
    s.hunter = { rank: 2, lv: 20, skills: [], slots: [] };
    for (let k = 0; k < 20; k++) {
      const keys = gateOffers(s).map((g) => g.id + ":" + g.rank);
      assert.equal(new Set(keys).size, keys.length, keys.join(" "));
    }
  }
});

test("there are at least 8 gate themes, and every rank has three or more to draw from (spec §15)", () => {
  assert.ok(GATES.length >= 8);
  for (let r = 0; r <= 6; r++) assert.ok(GATES.filter((g) => r >= g.ranks[0] && r <= g.ranks[1]).length >= 3, "rank " + r);
});

test("events do not contradict the life: no rent rise for an owner, no proposal to the married", () => {
  const s = newLife("st");
  s.ageM = 30 * 12;
  assert.ok(eligible(s, ev("adultRent")));
  s.home = { city: s.city, at: 0 };
  assert.ok(!eligible(s, ev("adultRent")));
  assert.ok(eligible(s, ev("adultLove")));
  s.c.married = 1;
  assert.ok(!eligible(s, ev("adultLove")));
});

test("one-of-a-kind happenings happen once", () => {
  for (const id of ["hktStorm", "selHanRiver", "jobDoc2", "jobOffice2", "midParentsOld", "kidCard", "icnPort", "pusPort"])
    assert.ok(ev(id).once, id);
});

test("between 18 and 22 every life chooses to study on or to work (spec §4.1)", () => {
  const m = MILESTONES.find((x) => x.age[0] >= 18 && x.age[0] <= 19 && x.id !== "ms18");
  assert.ok(m, "no study-or-work milestone");
  assert.ok(m.o.length >= 3);
});

test("a doctor has been to medical school; a clever teenager cannot just walk in", () => {
  const s = newLife("doc");
  s.ageM = 23 * 12;
  s.st.int = 45; s.st.wil = 40;
  assert.ok(!canHire(s, "doc"));
  assert.ok(!jobOffers(s).includes("doc"));
  s.c.med = 1;
  assert.ok(canHire(s, "doc"));
  assert.ok(CAREERS.teach.need0?.degree, "a teacher needs a degree");
});

test("nobody runs a department two years after their first day", () => {
  const s = newLife("promo");
  s.ageM = 24 * 12;
  for (const k of Object.keys(s.st)) s.st[k] = 60;
  s.job = { id: "office", tier: 0, xp: 0 };
  s.focus = "work";
  let months = 0;
  while (s.job.tier < 3 && months < 600) { workMonth(s); months++; }
  assert.ok(months >= 8 * 12, `reached tier 3 in ${months} months`);
  assert.ok(months <= 16 * 12, `tier 3 took ${months} months`);
});

test("big jobs outside the gates are not logged as gates", () => {
  const s = newLife("bj");
  s.ageM = 30 * 12; s.st.int = 60; s.st.wil = 60; s.c.med = 1;
  s.job = { id: "doc", tier: 2, xp: 0 };
  const from = s.log.length;
  hooks.act["bigJob:surgery"](s);
  assert.ok(s.op, "the surgery did not start");
  playUntil(s, (x) => !x.op && !x.ev, 400);
  const lines = s.log.slice(from);
  assert.ok(lines.length >= 3);
  for (const l of lines) assert.notEqual(l.tag, "เกต", l.text);
});
