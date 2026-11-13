// What the player sees of stories and people (lives that remember, Task 6).
import { test } from "node:test";
import assert from "node:assert/strict";
import * as C from "../src/core/index.js";
import { storyLine, peopleView } from "../src/ui/people.js";
import { firstOpen } from "./helpers.mjs";

const met = (seed) => {
  const s = C.newLife(seed);
  for (let n = 0; n < 20000 && !s.narrative.stories.friend?.lastText; n++) {
    if (!s.ev) C.advance(s); else C.choose(s, Math.max(0, firstOpen(s)));
  }
  return s;
};

test("the story line names the title and the last scene", () => {
  const s = met("ui1");
  const html = storyLine(s);
  assert.match(html, /เรื่องที่ติดตาม/);
  assert.match(html, /เด็กบ้านข้างๆ/);
  assert.ok(html.includes(C.followedStory(s).last.slice(0, 10)));
  assert.equal(storyLine(C.newLife("ui0")), "");
});

test("the people view shows trust as words, never numbers", () => {
  const s = met("ui2");
  const html = peopleView(s);
  const f = C.personById(s, s.narrative.stories.friend.cast.friend);
  assert.ok(html.includes(f.name));
  assert.match(html, /ไว้ใจคุณ|รู้จักกัน|ไม่ไว้ใจคุณ/);
  assert.doesNotMatch(html.replace(/<[^>]+>/g, ""), /-?\d+\s*\/\s*100|trust/i);
});

test("nothing about routes, endings or unseen stories is in the HTML", () => {
  const s = met("ui3");
  s.narrative.stories.friend.route = "close";
  const html = storyLine(s) + peopleView(s);
  for (const w of ["route", "close", "ending", "lifelong", "office", "friend", "claimant", "story:"]) {
    assert.ok(!html.includes(w), w);
  }
});

test("names are escaped", () => {
  const s = met("ui4");
  C.personById(s, s.narrative.stories.friend.cast.friend).name = "<b>x</b>";
  assert.ok(!peopleView(s).includes("<b>x</b>"));
  assert.ok(peopleView(s).includes("&lt;b&gt;x&lt;/b&gt;"));
});

test("a child sees only the friend, not the world's hunters", () => {
  const s = met("ui5");
  const html = peopleView(s);
  for (const n of s.world.roster) assert.ok(!html.includes(n.n) || n.n === C.personById(s,
    s.narrative.stories.friend.cast.friend).name, n.n);
});
