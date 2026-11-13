// Fixes from the whole-branch review of the main cast (P2a).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import * as C from "../src/core/index.js";
import { peopleView } from "../src/ui/people.js";

const P = (s, id) => C.castPerson(s, id);
const life = (seed, y, o = {}) => { const s = C.newLife(seed); Object.assign(s, o); s.ageM = y * 12; s.ev = null; return s; };
const openAt = (s, id, node, extra = {}) => {
  C.startStory(s, id); Object.assign(s.narrative.stories[id], { node, due: 0, status: "active", ...extra });
  s.ev = null; C.narrativeMonth(s); return s.ev;
};

test("Poramet's death is his own scene, never Lalin's funeral", () => {
  const s = life("rf1", 14, { country: "th", city: "bkk" });
  C.setPersonStatus(s, P(s, "poramet").id, { diedWorldM: C.worldMonth(s) });
  const ev = openAt(s, "silawong", "father");
  assert.ok(ev.t.includes(P(s, "poramet").name));
  assert.ok(!/ลลิล ศิลาวงศ์ไม่อยู่แล้ว/.test(ev.t));
  assert.equal(P(s, "lalin").diedWorldM, null);
});

test("a dead father never speaks in the barrier scene, a dead uncle never in his", () => {
  const s = life("rf2", 30, { country: "th", city: "bkk" });
  C.setPersonStatus(s, P(s, "poramet").id, { diedWorldM: C.worldMonth(s) });
  assert.notEqual(openAt(s, "silawong", "barrier").story.node, "barrier");
  const k = life("rf3", 25, { country: "kr", city: "sel" });
  C.setPersonStatus(k, P(k, "seojin").id, { diedWorldM: C.worldMonth(k) });
  assert.notEqual(openAt(k, "yoon", "uncle").story.node, "uncle");
});

test("nobody starts a story with someone already dead", () => {
  for (const id of ["thongbai", "hong"]) {
    const s = life("rf4-" + id, 20, { country: "th", city: "bkk", gold: 0 });
    const who = { thongbai: "thongbai", hong: "hong" }[id];
    C.setPersonStatus(s, P(s, who).id, { diedWorldM: 0 });
    assert.equal(C.STORY_DEFS[id].discover(s), false, id);
  }
});

test("an old save's cast catch up: awakened, retired, dead as their ages say", () => {
  const raw = fs.readFileSync(new URL("./fixtures/v2-before.json", import.meta.url), "utf8");
  const s = C.deserialize(raw); s.ageM = 60 * 12; C.updatePeople(s);
  assert.ok(P(s, "lalin").diedWorldM != null || P(s, "lalin").hunter, "lalin awakened at 18");
  const seojin = P(s, "seojin"), age = (C.worldMonth(s) - seojin.bornWorldM) / 12;
  if (age > 66) assert.ok(seojin.retired || seojin.diedWorldM != null, `seojin at ${age} still hunting`);
  if (age > 91) assert.ok(seojin.diedWorldM != null);
});

test("no cast member is a hunter, or dies in a gate, before eighteen", () => {
  for (let i = 0; i < 300; i++) {
    const s = life("rf5-" + i, 40); C.updatePeople(s);
    for (const p of Object.values(s.world.people).filter((x) => x.cast)) {
      if (p.diedCause === "gate") assert.ok(p.diedWorldM - p.bornWorldM >= 18 * 12, `${p.cast} died at a gate as a child`);
    }
  }
  const s = C.newLife("rf5b");
  for (const p of Object.values(s.world.people).filter((x) => x.cast && x.hunter)) {
    assert.ok(C.worldMonth(s) - p.bornWorldM >= 18 * 12, `${p.cast} hunts as a child`);
  }
});

test("a funeral comes the month the person dies, not when the story was next due", () => {
  const s = life("rf6", 30, { country: "th", city: "bkk" });
  openAt(s, "thongbai", "lesson", { due: C.worldMonth(s) + 100 });
  s.ev = null;
  C.setPersonStatus(s, P(s, "thongbai").id, { diedWorldM: C.worldMonth(s) });
  s.ageM++; C.narrativeMonth(s);
  assert.equal(s.ev?.story?.node, "gone");
});

test("a retired hunter does not break tower records in the news", () => {
  const s = life("rf7", 30);
  P(s, "poramet").retired = true; P(s, "seojin").retired = true;
  C.updatePeople(s);
  for (const n of s.world.roster.filter((x) => x.cast)) assert.equal(n.retired, true);
});

test("when a cast spouse dies, the player is told and is no longer married", () => {
  const s = life("rf8", 30, { country: "th", city: "bkk" });
  const l = P(s, "lalin"); l.hunter = { rank: 2, cls: "healer" };
  C.applyCastAct(s, l, "partner");
  l.lifeMaxY = 30; l.doneWM = C.worldMonth(s) - 1; l.retireAtY = 99;
  s.ageM = (l.bornWorldM + 30 * 12) - (s.mon0 ?? 0); C.updatePeople(s);
  assert.equal(s.c.married, 0);
  assert.ok(s.log.some((x) => x.tag === "ครอบครัว" && x.text.includes(l.name)));
});

test("your own spouse is your spouse, not someone else's past partner", () => {
  const s = life("rf9", 30);
  const l = P(s, "lalin"); C.changeRelation(s, l.id, { trust: 70 }); C.remember(s, l.id, { id: "m", text: "แต่งงานกัน" });
  C.applyCastAct(s, l, "partner");
  const html = peopleView(s);
  assert.ok(!html.includes("เคยเป็นคู่ชีวิตของคนในครอบครัวคุณ"));
  assert.match(html, /คู่ชีวิตของคุณ/);
});

test("Lalin is not 'not awakened' just because she is younger", () => {
  const s = life("rf10", 18, { country: "th", city: "bkk" }); s.c["ev:ms18"] = 1;
  C.startStory(s, "silawong");
  Object.assign(s.narrative.stories.silawong, { node: "screening", due: 0 });
  const lalinAge = (C.worldMonth(s) - P(s, "lalin").bornWorldM) / 12;
  s.ev = null; C.narrativeMonth(s);
  if (lalinAge < 18) assert.ok(!s.ev || s.ev.story?.node !== "screening");
});

test("Harin's last scene does not praise a rank she does not have", () => {
  const s = life("rf11", 30, { country: "kr", city: "sel" });
  const h = P(s, "harin"); h.hunter = { rank: 1, cls: "sword" }; h.rank = 1;
  assert.doesNotMatch(openAt(s, "yoon", "ending").t, /ทุกคนจับตา/);
});

test("Thongbai's story waits while the player lives abroad", () => {
  const s = life("rf12", 20, { country: "th", city: "bkk" });
  openAt(s, "thongbai", "break", { due: C.worldMonth(s) + 1 }); s.ev = null;
  s.country = "kr"; s.city = "sel"; s.ageM += 2; C.narrativeMonth(s);
  assert.equal(s.ev, null);
  assert.equal(s.narrative.stories.thongbai.status, "paused");
});

test("informing on Hong takes her out of the trade", () => {
  const s = life("rf13", 30, { country: "th", city: "bkk" });
  C.startStory(s, "hong");
  Object.assign(s.narrative.stories.hong, { node: "reckoning", due: 0, route: "informer" });
  s.ev = null; C.narrativeMonth(s);
  C.choose(s, s.ev.opts.findIndex((o) => o.l === "ให้การเพิ่มกับตำรวจ"));
  assert.equal(P(s, "hong").retired, true);
});

test("if Lalin dies while her father's gone scene waits, it becomes her funeral, not her phone call", () => {
  const s = life("rf14", 30, { country: "th", city: "bkk" });
  C.setPersonStatus(s, P(s, "poramet").id, { diedWorldM: C.worldMonth(s) });
  C.startStory(s, "silawong");
  Object.assign(s.narrative.stories.silawong, { node: "fatherGone", due: C.worldMonth(s) + 1 });
  C.setPersonStatus(s, P(s, "lalin").id, { diedWorldM: C.worldMonth(s) });
  s.ev = null; s.ageM += 1; C.narrativeMonth(s);
  assert.equal(s.ev?.story?.node, "gone");
});
