// The office career as a branching story (lives that remember, Task 4).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import * as C from "../src/core/index.js";
import { firstOpen } from "./helpers.mjs";

const raw = (f) => fs.readFileSync(new URL(`./fixtures/${f}.json`, import.meta.url), "utf8");
const worker = (seed, gold = 0) => {
  const s = C.newLife(seed); s.ageM = 24 * 12; s.ev = null; s.job = { id: "office", tier: 1, xp: 0 }; s.gold = gold;
  for (const k of Object.keys(s.st)) s.st[k] = 40; // checks pass, so the choices alone decide the road
  return s;
};
const story = (s) => s.narrative.stories.office;

// Plays until the office story ends (or age 70). `want` maps a story node to the label to choose there.
function play(s, want = {}, each = () => {}) {
  for (let n = 0; n < 40000 && !s.dead && C.ageY(s) < 70 && story(s)?.status !== "done"; n++) {
    each(s);
    if (!s.ev) { C.advance(s); continue; }
    if (s.ev.story?.id === "office") {
      const k = s.ev.opts.findIndex((o) => o.l === want[s.ev.story.node]);
      C.choose(s, k >= 0 ? k : firstOpen(s));
    } else C.choose(s, Math.max(0, firstOpen(s)));
  }
  return story(s);
}
const keepJob = (s) => { if (!s.job && story(s)?.status !== "done") s.job = { id: "office", tier: 1, xp: 0 }; };

const HELP = { intake: "อ่านแฟ้มทั้งคืน", "seek-help": "ทำเองให้เสร็จ", claim: "ใช้สิ่งที่คุณเจอช่วยเขา",
  appeal: "ช่วยรวบรวมเอกสาร", paid: "ปฏิเสธของฝากอย่างสุภาพ", "paid-late": "ช่วยหาอุปกรณ์มือสอง",
  "routine-review": "ไล่ดูตัวเลขที่ไม่ตรง", audit: "ปฏิเสธ", pushback: "ลาออก", "independent-offer": "เปิดบริษัทที่ปรึกษา",
  "client-return": "เปิดกิจการ", "client-search": "เปิดแล้วหาลูกค้าเอง" };
const DUTY = { intake: "ทำตามแบบฟอร์ม", routine: "อยู่ในขอบเขตงานตัวเอง", "routine-review": "อยู่ต่อ" };
const GAIN = { intake: "อ่านแฟ้มทั้งคืน", "seek-help": "ทำเองให้เสร็จ", claim: "ปฏิเสธตามสัญญา",
  denied: "ไม่ออกไปพบ", "routine-review": "ไล่ดูตัวเลขที่ไม่ตรง", audit: "ยอมแก้ตัวเลข", "cover-up": "รับเงิน",
  liability: "เก็บเงียบ" };

test("the story validates", () => {
  assert.deepEqual(C.validateNarrative({ office: C.STORY_DEFS.office }), []);
});

// Pack §05 C1: on paired seeds, different choices should end differently for most seeds.
test("help, duty and gain reach different endings", () => {
  const ends = new Set();
  let differ = 0;
  for (const seed of ["oe1", "oe2", "oe3", "oe4", "oe5"]) {
    const got = [[HELP, 30000], [DUTY, 0], [GAIN, 0]].map(([want, gold]) => play(worker(seed, gold), want, keepJob));
    for (const st of got) { assert.equal(st?.status, "done", seed); ends.add(st.ending); }
    if (new Set(got.map((st) => st.ending)).size >= 2) differ++;
  }
  assert.ok(ends.size >= 3, [...ends].join(","));
  assert.ok(differ >= 4, `seeds that differ: ${differ}/5`);
});

test("the claimant is one person all story long", () => {
  const s = worker("office-cast", 30000);
  const ids = new Set();
  play(s, HELP, (x) => { if (story(x)) ids.add(story(x).cast.claimant); });
  assert.equal(ids.size, 1);
  const p = C.personById(s, [...ids][0]);
  assert.equal(p.city, s.city);
  assert.ok(p.hunter.rank >= 1 && p.hunter.rank <= 3);
});

test("an unhelped claimant is not the first client", () => {
  const s = worker("office-unhelped", 30000);
  const seen = [];
  play(s, { ...GAIN, audit: "ปฏิเสธ", pushback: "ลาออก", "independent-offer": "เปิดบริษัทที่ปรึกษา",
    "client-search": "เปิดแล้วหาลูกค้าเอง" }, (x) => { if (x.ev?.story) seen.push(x.ev.story.node); });
  assert.ok(!seen.includes("client-return"), seen.join(","));
});

test("the firm needs the money", () => {
  const s = worker("office-poor", 0);
  play(s, HELP, (x) => { x.gold = Math.min(x.gold, 1000); keepJob(x); });
  assert.notEqual(story(s).ending, "independent");
});

test("a dead claimant gets claimant-gone, then the story continues", () => {
  const s = worker("office-gone", 0);
  const seen = [];
  play(s, { intake: "อ่านแฟ้มทั้งคืน", "seek-help": "ทำเองให้เสร็จ" }, (x) => {
    keepJob(x);
    const st = story(x);
    if (st?.cast.claimant && C.personAlive(x, st.cast.claimant) && st.node === "claim") {
      C.setPersonStatus(x, st.cast.claimant, { diedWorldM: C.worldMonth(x) });
    }
    if (x.ev?.story) { seen.push(x.ev.story.node); assert.ok(!(x.ev.story.node === "claim")); }
  });
  assert.ok(seen.includes("claimant-gone"), seen.join(","));
  assert.equal(story(s).status, "done");
});

test("an old save mid-chain keeps the old chain", () => {
  const s = C.deserialize(raw("v2-office-open"));
  assert.match(s.ev.id, /^office:1$/);
  for (let i = 0; i < 60; i++) { if (s.ev) C.choose(s, Math.max(0, firstOpen(s))); else C.advance(s); }
  assert.equal(story(s), undefined);
});

test("a finished old chain never starts the new story", () => {
  const s = C.deserialize(raw("v2-office-done"));
  for (let i = 0; i < 60; i++) { if (s.ev) C.choose(s, Math.max(0, firstOpen(s))); else C.advance(s); }
  assert.equal(story(s), undefined);
});

test("leaving office work pauses, and 36 months away closes as transfer", () => {
  const s = worker("office-leave");
  for (let i = 0; i < 6 && !story(s); i++) C.narrativeMonth(s), s.ageM++;
  assert.equal(story(s).status, "active");
  s.job = null; s.ev = null; C.narrativeMonth(s);
  assert.equal(story(s).status, "paused");
  s.job = { id: "office", tier: 1, xp: 0 }; s.ageM += 12; C.narrativeMonth(s);
  assert.notEqual(story(s).status, "paused");
  s.ev = null; s.job = null; C.narrativeMonth(s); s.ageM += 37; C.narrativeMonth(s);
  assert.deepEqual([story(s).status, story(s).ending], ["done", "transfer"]);
});

test("a small job tier gets a team trial, not the national reform", () => {
  const s = worker("office-reform", 0);
  s.job.tier = 0;
  const st = play(s, { ...HELP, pushback: "ขอแรงหนุนจากคนที่เชื่อคุณ", "reform-offer": "รับเป็นผู้ช่วยทีมทดลอง" },
    (x) => { x.gold = 0; if (!x.job) x.job = { id: "office", tier: 0, xp: 0 }; });
  assert.ok(!s.flags.insureReform);
  assert.ok(st.status === "done");
});

// Pack §05 C1 with natural stats: looking at the books is enough for the guild to come to you, pass or fail.
test("failing the review check still brings the guild's request", () => {
  const s = worker("office-review-fail");
  for (const k of Object.keys(s.st)) s.st[k] = 1;
  C.startStory(s, "office");
  Object.assign(story(s), { node: "routine-review", due: 0 });
  s.ev = null; C.narrativeMonth(s);
  C.choose(s, s.ev.opts.findIndex((o) => o.l === "ไล่ดูตัวเลขที่ไม่ตรง"));
  assert.equal(story(s).node, "audit");
});
