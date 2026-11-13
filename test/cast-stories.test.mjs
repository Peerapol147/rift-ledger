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
  mingyu: (s) => { s.country = "kr"; s.city = "pus"; },
  dohyun: (s) => { s.country = "kr"; s.city = "icn"; },
  seojin: (s) => { s.country = "kr"; s.city = "sel"; },
  poramet: (s) => { s.country = "th"; s.city = "bkk"; },
  pim: (s) => heirOf(s.seed),
};
// held every month (a career would replace a job set once at birth)
const EACH = { seojin: (s) => { if (!s.hunter && C.ageY(s) >= 18) s.job = { id: "press", tier: 1, xp: 0 }; } };
// a Bangkok parent who died at 40 with a child: the heir is born that month, pim is then 14
function heirOf(seed, tie = null) {
  const P = C.newLife(seed + "-p"); P.country = "th"; P.city = "bkk"; P.ageM = 40 * 12; C.updatePeople(P);
  P.c.kids = 1; P.dead = { cause: "อายุขัย", ageY: 40 };
  const h = C.newHeir(P, seed);
  if (tie) for (const p of Object.values(h.world.people)) if (p.cast === "pim" || p.cast === "lalin") {
    p.ties = { ...p.ties, [h.familyId]: tie };
  }
  return h;
}
let turn = 0;
// first, second and last visible option, and one that varies from scene to scene (a player who is not consistent)
// and a player who wants romance: kind (first option) but takes the romance option whenever it is offered
const pickers = [(n) => 0, (n) => Math.min(1, n - 1), (n) => n - 1, (n) => (turn++ * 7 + 3) % n,
  (n, open) => Math.max(0, open.findIndex(([, , o]) => o.romance))];

function play(id, seed, pick, each = () => {}) {
  let s = C.newLife(seed); s = SETUP[id](s) ?? s; // a setup may hand back another life (an heir)
  if (id === "hong") s.gold = 0;
  for (let n = 0; n < 80000 && !s.dead && C.ageY(s) < 85 && s.narrative.stories[id]?.status !== "done"; n++) {
    EACH[id]?.(s);
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
        const g = C.STORY_DEFS[id].castGone; // one node, or one per person
        if ((typeof g === "object" ? Object.values(g) : [g]).includes(s.ev.story.node)) gone = true;
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

const castOf = (s, id) => Object.values(s.world.people).find((p) => p.cast === id);
// a life of that age in a world where the cast member it is about is still alive (background deaths are seeded)
const adult = (seed, country, city, years = 25, alive = null) => {
  for (let i = 0; i < 200; i++) {
    const s = C.newLife(i ? `${seed}-${i}` : seed); s.country = country; s.city = city; s.ageM = years * 12;
    C.updatePeople(s);
    if (!alive || castOf(s, alive).diedWorldM == null) return s;
  }
  throw new Error(`${alive} is dead at ${years} in every world tried`);
};

test("mingyu reaches Korean lives in Busan, and Korean lives hurt or in medicine anywhere", () => {
  const D = C.STORY_DEFS.mingyu;
  assert.equal(D.discover(adult("mg1", "kr", "pus", 25, "mingyu")), true);
  const hurt = adult("mg2", "kr", "sel", 25, "mingyu"); assert.equal(D.discover(hurt), false);
  hurt.injuries = [{ id: "breakScar", untilM: null }]; assert.equal(D.discover(hurt), true);
  const doc = adult("mg3", "kr", "icn", 25, "mingyu"); doc.job = { id: "hdoc" }; assert.equal(D.discover(doc), true);
  assert.equal(D.discover(adult("mg4", "kr", "pus", 15, "mingyu")), false);
  assert.equal(D.discover(adult("mg5", "kr", "pus", 61, "mingyu")), false);
});

test("mingyu: never for Thai lives, never after his death", () => {
  const D = C.STORY_DEFS.mingyu;
  const th = adult("mg6", "th", "bkk", 25, "mingyu"); th.injuries = [{ id: "breakScar", untilM: null }];
  assert.equal(D.discover(th), false);
  const kr = adult("mg7", "kr", "pus", 25, "mingyu");
  C.setPersonStatus(kr, castOf(kr, "mingyu").id, { diedWorldM: C.worldMonth(kr) });
  assert.equal(D.discover(kr), false);
});

test("mingyu: a Korean life that moves to Thailand pauses the story", () => {
  const s = adult("mg8", "kr", "pus", 20, "mingyu");
  for (let n = 0; n < 4000 && !s.narrative.stories.mingyu; n++) {
    if (s.ev) C.choose(s, Math.max(0, firstOpen(s))); else C.advance(s);
  }
  assert.ok(s.narrative.stories.mingyu, "started");
  if (s.ev?.story?.id === "mingyu") C.choose(s, Math.max(0, firstOpen(s)));
  s.country = "th"; s.city = "bkk";
  const until = s.ageM + 48;
  while (s.ageM < until && !s.dead) {
    assert.notEqual(s.ev?.story?.id, "mingyu", "a mingyu scene opened in Thailand");
    if (s.ev) C.choose(s, Math.max(0, firstOpen(s))); else C.advance(s);
  }
  assert.equal(s.narrative.stories.mingyu.status, "paused");
  for (let n = 0; n < 4000 && !s.dead && s.narrative.stories.mingyu.status !== "done"; n++) {
    assert.notEqual(s.ev?.story?.id, "mingyu", "a mingyu scene opened in Thailand");
    if (s.ev) C.choose(s, Math.max(0, firstOpen(s))); else C.advance(s);
  }
  assert.equal(s.narrative.stories.mingyu.ending, "patient"); // ten years away: he is someone you met once
});

test("dohyun reaches Korean hunters, traders and Incheon lives aged 18–50", () => {
  const D = C.STORY_DEFS.dohyun;
  const h = adult("dh1", "kr", "sel", 30, "dohyun");
  h.hunter = { rank: 1, lv: 10, xp: 0, skills: [], cls: "knight" };
  assert.equal(D.discover(h), true);
  const p = adult("dh2", "kr", "pus", 30, "dohyun"); p.job = { id: "porter" }; assert.equal(D.discover(p), true);
  assert.equal(D.discover(adult("dh3", "kr", "icn", 30, "dohyun")), true);
  const o = adult("dh4", "kr", "sel", 30, "dohyun"); o.job = { id: "office" }; assert.equal(D.discover(o), false);
  assert.equal(D.discover(adult("dh5", "kr", "icn", 55, "dohyun")), false);
  assert.equal(D.discover(adult("dh6", "th", "bkk", 30, "dohyun")), false);
  const dead = adult("dh7", "kr", "icn", 30, "dohyun");
  C.setPersonStatus(dead, castOf(dead, "dohyun").id, { diedWorldM: C.worldMonth(dead) });
  assert.equal(D.discover(dead), false);
});

test("dohyun: reformed sends him to haneul as a friend of the family", () => {
  const D = C.STORY_DEFS.dohyun;
  const reform = Object.values(D.nodes).flatMap((n) => n.o).flatMap((o) => [o.y, o.n]).find((r) => r?.end === "reformed");
  assert.ok(reform, "a reformed ending exists");
  assert.deepEqual(reform.castAct, { dohyun: "joinGuild:haneul" });
  assert.ok(Object.values(D.nodes).flatMap((n) => n.o).some((o) => o.y?.castAct?.dohyun === "friend"
    && o.y.go), "a road to reformed makes him a friend first");
});

const hunter = (s, rank) => { s.hunter = { rank, lv: 10, xp: 0, skills: [], cls: "knight" }; return s; };

test("seojin reaches hunters at C or above anywhere, and Korean reporters and porters", () => {
  const D = C.STORY_DEFS.seojin;
  assert.equal(D.discover(hunter(adult("sj1", "th", "bkk", 25, "seojin"), 2)), true);
  assert.equal(D.discover(hunter(adult("sj2", "th", "bkk", 25, "seojin"), 1)), false);
  const kr = adult("sj3", "kr", "sel", 30, "seojin"); kr.job = { id: "press" }; assert.equal(D.discover(kr), true);
  const th = adult("sj4", "th", "bkk", 30, "seojin"); th.job = { id: "press" }; assert.equal(D.discover(th), false);
  const old = hunter(adult("sj5", "th", "bkk", 51, "seojin"), 3); assert.equal(D.discover(old), false);
});

test("seojin: not while the yoon story runs; once it is done, yes", () => {
  const D = C.STORY_DEFS.seojin;
  const s = adult("sj6", "kr", "sel", 30, "seojin"); s.job = { id: "press" };
  s.narrative.stories.yoon = { status: "active" }; assert.equal(D.discover(s), false);
  s.narrative.stories.yoon = { status: "done" }; assert.equal(D.discover(s), true);
});

test("seojin: retired, he is met in the training hall, never at a gate", () => {
  const s = adult("sj7", "kr", "sel", 30, "seojin"); s.job = { id: "press" };
  hunter(s, 3);
  castOf(s, "seojin").retired = true;
  for (let n = 0; n < 4000 && s.ev?.story?.id !== "seojin"; n++) {
    if (s.ev) C.choose(s, Math.max(0, firstOpen(s))); else C.advance(s);
    if (castOf(s, "seojin").diedWorldM != null) break;
  }
  assert.equal(s.ev?.story?.id, "seojin");
  assert.match(s.ev.t, /ห้องฝึก/);
  assert.doesNotMatch(s.ev.t, /ในเกต|เข้าเกต/);
});

test("seojin: the student ending is for hunters only", () => {
  const D = C.STORY_DEFS.seojin;
  const civ = adult("sj8", "kr", "sel", 30, "seojin");
  const st = { vars: {}, route: "student", cast: { seojin: castOf(civ, "seojin").id } };
  const toStudent = Object.values(D.nodes).flatMap((n) => n.o).filter((o) => o.y?.end === "student");
  assert.ok(toStudent.length > 0);
  for (const o of toStudent) assert.equal(!!o.show && !o.show(civ, st), true);
});

test("poramet reaches Bangkok lives 18–55, after the silawong story if they had it", () => {
  const D = C.STORY_DEFS.poramet;
  const s = adult("pr1", "th", "bkk", 25, "poramet"); assert.equal(D.discover(s), true);
  s.narrative.stories.silawong = { status: "active" }; assert.equal(D.discover(s), false);
  s.narrative.stories.silawong = { status: "done" }; assert.equal(D.discover(s), true);
  assert.equal(D.discover(adult("pr2", "th", "cnx", 25, "poramet")), false);
  const late = adult("pr3", "th", "bkk", 25, "poramet"); late.ageM = 56 * 12; // he lives; the window has closed
  assert.equal(D.discover(late), false);
  assert.equal(D.discover(adult("pr4", "kr", "sel", 25, "poramet")), false);
  const dead = adult("pr5", "th", "bkk", 25, "poramet");
  C.setPersonStatus(dead, castOf(dead, "poramet").id, { diedWorldM: C.worldMonth(dead) });
  assert.equal(D.discover(dead), false);
});

test("poramet: the successor ending is for barrier makers only", () => {
  const D = C.STORY_DEFS.poramet;
  const s = adult("pr6", "th", "bkk", 30, "poramet"); hunter(s, 3);
  const st = { vars: {}, route: "apprentice", cast: { poramet: castOf(s, "poramet").id } };
  const toSucc = Object.values(D.nodes).flatMap((n) => n.o).filter((o) => o.y?.end === "successor");
  assert.ok(toSucc.length > 0);
  for (const o of toSucc) assert.equal(!!o.show && !o.show(s, st), true, "a knight is offered the family technique");
  s.hunter.cls = "barrier";
  assert.ok(toSucc.some((o) => o.show(s, st)), "a barrier maker is never offered it");
});

test("poramet: retired, he teaches at home or inspects the posts, never in a gate", () => {
  const s = adult("pr7", "th", "bkk", 25, "poramet"); hunter(s, 3);
  castOf(s, "poramet").retired = true;
  for (let n = 0; n < 4000 && s.ev?.story?.id !== "poramet"; n++) {
    if (s.ev) C.choose(s, Math.max(0, firstOpen(s))); else C.advance(s);
    if (castOf(s, "poramet").diedWorldM != null) break;
  }
  assert.equal(s.ev?.story?.id, "poramet");
  assert.match(s.ev.t, /เกษียณ/);
  assert.doesNotMatch(s.ev.t, /ในเกต|เข้าเกต/);
});

test("silawong: the father once set the silent-tower record", () => {
  const s = adult("pr8", "th", "bkk", 12, "poramet");
  const st = { vars: {}, cast: { lalin: castOf(s, "lalin").id, father: castOf(s, "poramet").id } };
  const text = C.STORY_DEFS.silawong.nodes.father.t(s, st);
  assert.match(text, /เคยตั้งสถิติหอเงียบ/);
  assert.doesNotMatch(text, /เจ้าของสถิติหอเงียบ/);
});

const grow = (s, years) => { s.ageM = years * 12; C.updatePeople(s); return s; };

test("pim reaches heirs in Bangkok aged 12–40 while she lives", () => {
  const D = C.STORY_DEFS.pim;
  let i = 0, h;
  do h = grow(heirOf(`pm1-${i++}`), 20); while (castOf(h, "pim").diedWorldM != null);
  assert.equal(D.discover(h), true);
  h.city = "cnx"; assert.equal(D.discover(h), false); h.city = "bkk";
  h.gen = 1; assert.equal(D.discover(h), false); h.gen = 2;
  const late = grow(heirOf(h.seed), 20); late.ageM = 41 * 12; assert.equal(D.discover(late), false);
  C.setPersonStatus(h, castOf(h, "pim").id, { diedWorldM: C.worldMonth(h) });
  assert.equal(D.discover(h), false);
});

test("pim greets by the family's old tie, and an old grudge can end as rivals", () => {
  const D = C.STORY_DEFS.pim;
  const plain = grow(heirOf("pm2"), 20), foe = grow(heirOf("pm2", "enemy"), 20);
  const st = (s) => ({ vars: {}, route: null, cast: { pim: castOf(s, "pim").id, lalin: castOf(s, "lalin").id } });
  assert.notEqual(D.nodes[D.entry].t(foe, st(foe)), D.nodes[D.entry].t(plain, st(plain)));
  const toRivals = Object.values(D.nodes).flatMap((n) => n.o).filter((o) => o.y?.end === "rivals" || o.n?.end === "rivals");
  assert.ok(toRivals.some((o) => !o.show || o.show(foe, st(foe))), "an old enemy can end as rivals");
});

test("pim: no romance in her story", () => {
  for (const n of Object.values(C.STORY_DEFS.pim.nodes)) for (const o of n.o) {
    assert.equal(o.romance, undefined);
    for (const r of [o.y, o.n]) assert.notEqual(r?.castAct?.pim, "partner");
  }
});
