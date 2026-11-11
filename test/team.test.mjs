import { test } from "node:test";
import assert from "node:assert/strict";
import {
  newLife, awakenCheck, recruitOffers, hire, dismiss, heroPower, teamRoles, loseAlly, moodWord, tick, startOp, gateOp, gateOffers,
} from "../src/core/index.js";

const hunter = (seed = "tm") => { const s = newLife(seed); s.ageM = 25 * 12; awakenCheck(s, "event"); s.gold = 1e6; return s; };

test("offers, hire fee and the four-member cap", () => {
  const s = hunter();
  const offers = recruitOffers(s);
  assert.ok(offers.length >= 1 && offers.length <= 3);
  const g = s.gold;
  assert.equal(hire(s, offers[0]), true);
  assert.ok(s.gold < g);
  assert.equal(s.team.length, 1);
  for (let i = 0; i < 6; i++) { s.ageM += 12; for (const m of recruitOffers(s)) hire(s, m); }
  assert.ok(s.team.length <= 4);
  dismiss(s, s.team[0].id);
  assert.ok(s.team.length <= 3);
});

test("teammates add power and fill roles; hurt ones do not", () => {
  const s = hunter("tp");
  const base = heroPower(s).atk;
  hire(s, recruitOffers(s)[0]);
  assert.ok(heroPower(s).atk > base);
  assert.ok(teamRoles(s).has(s.team[0].role));
  s.team[0].hurtUntilM = s.ageM + 5;
  assert.equal(Math.round(heroPower(s).atk), Math.round(base));
});

test("a lost ally is a real member: dies on a boss op, otherwise hurt and less loyal", () => {
  const s = hunter("la");
  hire(s, recruitOffers(s)[0]);
  const m = s.team[0], l0 = m.loyalty;
  loseAlly(s, false);
  assert.ok(m.hurtUntilM > s.ageM);
  assert.ok(m.loyalty < l0);
  m.hurtUntilM = 0;
  loseAlly(s, true);
  assert.equal(m.alive, false);
  assert.equal(loseAlly(newLife("empty"), true), null);
});

test("low loyalty brings a leave-or-betray event; mood words carry no numbers", () => {
  const s = hunter("lo");
  hire(s, recruitOffers(s)[0]);
  s.team[0].loyalty = 5;
  for (let i = 0; i < 24 && !s.ev?.id?.startsWith("teamLow"); i++) { s.ev = null; tick(s); }
  assert.match(s.ev?.id ?? "", /^teamLow/);
  for (const v of [0, 30, 50, 70, 95]) assert.doesNotMatch(moodWord(v), /\d/);
});

test("each teammate gets their own three-chapter story that moves their loyalty", async () => {
  const { choose, tick } = await import("../src/core/index.js");
  const { CALENDAR } = await import("../src/data/index.js");
  const s = hunter("ts");
  for (const e of CALENDAR) s.world.done[e.id] = 1;
  hire(s, recruitOffers(s)[0]);
  const m = s.team[0];
  let seen = 0;
  for (let i = 0; i < 120 && m.alive; i++) {
    if (s.ev) {
      if (s.ev.id.startsWith("tm:")) { seen++; assert.ok(s.ev.t.includes(m.n)); assert.doesNotMatch(s.ev.t, /\{m\}/); }
      choose(s, s.ev.opts.length - 1); continue;
    }
    s.op = null; tick(s);
  }
  assert.ok(seen >= 1 && seen <= 3);
  assert.ok(m.story >= 1);
});
