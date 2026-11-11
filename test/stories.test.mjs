import { test } from "node:test";
import assert from "node:assert/strict";
import { newLife, advance, choose, awakenCheck, activeChains, storyMonth } from "../src/core/index.js";
import { STORIES } from "../src/data/stories/index.js";
import { firstOpen } from "./helpers.mjs";

const ch = (n) => ({ tag: "งาน", t: `บทที่ ${n}`, o: [{ l: "ต่อ", y: { m: "ok" } }] });
STORIES.testCiv = { who: ["office"], gap: [3, 3], chapters: [ch(1), ch(2), ch(3)] };
STORIES.testHunt = { who: ["vanguard", "striker", "support", "scout", "artisan"], hunter: true, gap: [2, 2], chapters: [ch(1), ch(2)] };

const adult = (seed) => {
  const s = newLife(seed); s.ageM = 25 * 12; s.c.famGift = 1;
  for (const k of ["ms6", "ms12", "ms15", "ms18", "ms22"]) s.c["ev:" + k] = 1;
  return s;
};
// Run months with only the story system, so other events do not interfere.
const months = (s, n) => { const seen = []; for (let i = 0; i < n; i++) { s.ageM++; storyMonth(s); if (s.ev) { seen.push(s.ev.id); s.ev = null; } } return seen; };

test("chapters open in order, once each, spaced by the gap", () => {
  const s = adult("st1"); s.job = { id: "office", tier: 0, xp: 0 };
  const seen = months(s, 20);
  assert.deepEqual(seen.filter((x) => x.startsWith("testCiv")), ["testCiv:0", "testCiv:1", "testCiv:2"]);
});

test("a job change pauses the chain and returning resumes it", () => {
  const s = adult("st2"); s.job = { id: "office", tier: 0, xp: 0 };
  months(s, 4);
  const done = s.c["ch:testCiv"];
  s.job = { id: "cook", tier: 0, xp: 0 };
  assert.ok(!months(s, 12).some((x) => x.startsWith("testCiv")));
  assert.equal(s.c["ch:testCiv"], done);
  s.job = { id: "office", tier: 0, xp: 0 };
  assert.ok(months(s, 12).includes(`testCiv:${done}`));
});

test("hunter chains pause when the hunter cannot hunt", () => {
  const s = adult("st3"); awakenCheck(s, "event");
  s.flags.stoppedHunting = true;
  assert.ok(!activeChains(s).includes("testHunt"));
  s.flags.stoppedHunting = false;
  assert.ok(activeChains(s).includes("testHunt"));
});

test("story chapters are important and survive a full life without errors", () => {
  const s = adult("st4"); s.job = { id: "office", tier: 0, xp: 0 };
  let important = true;
  for (let i = 0; i < 20000 && !s.dead; i++) {
    if (s.ev) { if (String(s.ev.id).includes(":")) important &&= s.ev.important; choose(s, firstOpen(s)); } else advance(s);
  }
  assert.ok(important);
  assert.ok(s.dead);
});
