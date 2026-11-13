// The childhood friend every life gets (lives that remember, Task 5).
import { test } from "node:test";
import assert from "node:assert/strict";
import * as C from "../src/core/index.js";
import { firstOpen } from "./helpers.mjs";

const story = (s) => s.narrative.stories.friend;
const friendOf = (s) => C.personById(s, story(s).cast.friend);
// Plays until the friend story ends or `stop(s)`; `want` maps node → label.
function play(s, want = {}, stop = () => false, each = () => {}) {
  for (let n = 0; n < 60000 && !s.dead && story(s)?.status !== "done" && !stop(s); n++) {
    each(s);
    if (!s.ev) { C.advance(s); continue; }
    if (s.ev.story?.id === "friend") {
      const k = s.ev.opts.findIndex((o) => o.l === want[s.ev.story.node]);
      C.choose(s, k >= 0 ? k : firstOpen(s));
    } else C.choose(s, Math.max(0, firstOpen(s)));
  }
  return s;
}
const nodesSeen = (s, want) => { const seen = []; play(s, want, () => false, (x) => {
  if (x.ev?.story?.id === "friend" && seen.at(-1) !== x.ev.story.node) seen.push(x.ev.story.node); }); return seen; };

test("the story validates", () => {
  assert.deepEqual(C.validateNarrative({ friend: C.STORY_DEFS.friend }), []);
});

test("every life meets a friend between 4 and 7", () => {
  for (const seed of ["fr1", "fr2", "fr3", "fr4"]) {
    const s = C.newLife(seed);
    play(s, {}, (x) => x.ev?.story?.node === "meet");
    const age = C.ageY(s);
    assert.ok(age >= 4 && age <= 7, `${seed} met at ${age}`);
    const f = friendOf(s);
    assert.equal(f.city, s.city);
    assert.ok(Math.abs(f.bornWorldM - (s.mon0 ?? 0)) <= 12);
  }
});

test("close and drift lives see different later nodes", () => {
  const close = nodesSeen(C.newLife("frx"), { meet: "ชวนเล่นด้วยกัน", teenFork: "ยกที่ให้เขา" });
  const drift = nodesSeen(C.newLife("frx"), { meet: "ส่งลูกบอลคืนแล้วกลับเข้าบ้าน", teenFork: "แยกไปชมรมอื่น" });
  assert.notDeepEqual(close, drift);
  const a = C.newLife("frx"), b = C.newLife("frx");
  play(a, { meet: "ชวนเล่นด้วยกัน", teenFork: "ยกที่ให้เขา" });
  play(b, { meet: "ส่งลูกบอลคืนแล้วกลับเข้าบ้าน", teenFork: "แยกไปชมรมอื่น", school: "เงียบไว้", ask: "ไม่รับสาย" });
  assert.notEqual(story(a).ending, story(b).ending);
});

test("a later scene quotes an earlier memory", () => {
  const s = C.newLife("frm");
  play(s, { meet: "ชวนเล่นด้วยกัน" }, (x) => x.ev?.story?.node === "school");
  assert.match(s.ev.t, /ปีนรั้วมาเอาลูกบอลคืน/);
});

test("partner never opens for a married player", () => {
  const s = C.newLife("frp");
  play(s, { meet: "ชวนเล่นด้วยกัน", school: "บอกครูตามจริง", teenFork: "ยกที่ให้เขา" },
    (x) => x.ev?.story?.node === "reunion", (x) => { x.c.married = 1; });
  if (s.ev?.story?.node === "reunion") assert.ok(!s.ev.opts.some((o) => o.l === "ขอคบกันจริงจัง"));
});

test("the friend's awakening is fixed at birth", () => {
  const a = C.newLife("fraw"), b = C.newLife("fraw");
  play(a, {}, (x) => !!story(x)); play(b, {}, (x) => !!story(x));
  assert.deepEqual(friendOf(a).hunter, friendOf(b).hunter);
});

test("awaken text follows who awakened", () => {
  const texts = new Set();
  for (const [me, them] of [[1, 1], [1, 0], [0, 1], [0, 0]]) {
    const s = C.newLife("frw");
    play(s, {}, (x) => x.ev?.story?.node === "awaken" || C.ageY(x) >= 17);
    s.ev = null; story(s).node = "awaken"; story(s).due = 0; s.ageM = 19 * 12;
    s.hunter = me ? { rank: 1, lv: 1, skills: [], xp: 0, cls: "knight" } : null;
    friendOf(s).hunter = them ? { rank: 1, cls: null } : null;
    C.narrativeMonth(s);
    texts.add(s.ev.t);
  }
  assert.equal(texts.size, 4);
});

test("a dead friend gets the funeral, which recalls one memory", () => {
  const s = C.newLife("frd");
  play(s, { meet: "ชวนเล่นด้วยกัน" }, (x) => story(x)?.node === "school");
  C.setPersonStatus(s, story(s).cast.friend, { diedWorldM: C.worldMonth(s) });
  play(s, {}, (x) => x.ev?.story?.node === "funeral");
  assert.equal(s.ev.story.node, "funeral");
  assert.match(s.ev.t, /ปีนรั้วมาเอาลูกบอลคืน/);
});

test("an heir gets a different friend", () => {
  const p = C.newLife("frh");
  play(p, {}, (x) => !!story(x));
  p.ageM = 60 * 12;
  const h = C.newHeir(p, "frh-2");
  play(h, {}, (x) => !!story(x));
  assert.notEqual(story(h).cast.friend, story(p).cast.friend);
});
