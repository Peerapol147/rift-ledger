// The four cast stories (P2a Task 4; spec §7, §12.3). Lives that fit each story's entry are played three ways.
import { test } from "node:test";
import assert from "node:assert/strict";
import * as C from "../src/core/index.js";
import { firstOpen } from "./helpers.mjs";

const SETUP = {
  thongbai: (s) => { s.country = "th"; s.city = "cnx"; },
  silawong: (s) => { s.country = "th"; s.city = "bkk"; },
  yoon: (s) => { s.country = "kr"; s.city = "sel"; },
  hong: (s) => { s.country = "th"; s.city = "bkk"; },
};
let turn = 0;
// first, second and last visible option, and one that varies from scene to scene (a player who is not consistent)
// and a player who wants romance: kind (first option) but takes the romance option whenever it is offered
const pickers = [(n) => 0, (n) => Math.min(1, n - 1), (n) => n - 1, (n) => (turn++ * 7 + 3) % n,
  (n, open) => Math.max(0, open.findIndex(([, , o]) => o.romance))];

function play(id, seed, pick, each = () => {}) {
  const s = C.newLife(seed); SETUP[id](s);
  if (id === "hong") s.gold = 0;
  for (let n = 0; n < 80000 && !s.dead && C.ageY(s) < 85 && s.narrative.stories[id]?.status !== "done"; n++) {
    each(s);
    if (!s.ev) { C.advance(s); continue; }
    if (s.ev.story?.id === id) {
      const open = s.ev.opts.map((o, i) => [i, C.optionView(s, o), o]).filter(([, v]) => v.visible && !v.locked);
      C.choose(s, open[pick(open.length, open)][0]);
    } else C.choose(s, Math.max(0, firstOpen(s)));
  }
  return s;
}

for (const id of Object.keys(SETUP)) {
  test(`${id}: the story validates`, () => {
    assert.deepEqual(C.validateNarrative({ [id]: C.STORY_DEFS[id] }), []);
  });

  test(`${id}: lives that fit it meet it, and different choices end it differently`, () => {
    const ends = new Set();
    let started = 0, done = 0, fit = 0;
    for (const seed of ["s1", "s2", "s3", "s4", "s5"]) for (const pick of pickers) {
      let fits = false;
      const st = play(id, `${id}-${seed}`, pick, (x) => { fits ||= C.STORY_DEFS[id].discover(x); }).narrative.stories[id];
      if (fits) fit++;
      if (st) started++;
      if (st?.status === "done") { done++; ends.add(st.ending); }
    }
    assert.ok(fit >= 20, `only ${fit}/25 lives fit the entry`);
    assert.equal(started, fit, `started ${started}/${fit} that fit`);
    assert.ok(done >= Math.ceil(fit * 0.8), `finished ${done}/${fit}`);
    assert.ok(ends.size >= 3, [...ends].join(","));
  });

  test(`${id}: a cast member who dies is mourned, never met alive again`, () => {
    let gone = false;
    play(id, `${id}-dead`, pickers[0], (s) => {
      const st = s.narrative.stories[id];
      if (st && !st.killed && st.lastM != null) {
        for (const pid of Object.values(st.cast)) C.setPersonStatus(s, pid, { diedWorldM: C.worldMonth(s) });
        st.killed = true;
      }
      if (st?.killed && s.ev?.story?.id === id) {
        if (s.ev.story.node === C.STORY_DEFS[id].castGone) gone = true;
        else assert.fail(`met alive at ${s.ev.story.node}`);
      }
    });
    assert.ok(gone, "the gone scene opened");
  });
}

test("hong reaches a hunter who sells loot, even one with money", () => {
  const s = C.newLife("hong-hunter"); s.country = "th"; s.ageM = 25 * 12; s.gold = 50000;
  s.hunter = { rank: 1, lv: 10, xp: 0, skills: [], cls: "knight" };
  assert.equal(C.STORY_DEFS.hong.discover(s), true);
  s.hunter = null;
  assert.equal(C.STORY_DEFS.hong.discover(s), false); // a rich office worker is not her kind of customer
});

test("thongbai's story starts for Thai lives only", () => {
  const s = play("thongbai", "tb-kr", pickers[0], (x) => { x.country = "kr"; x.city = "sel"; });
  assert.equal(s.narrative.stories.thongbai, undefined);
});
