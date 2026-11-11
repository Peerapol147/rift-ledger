import { test } from "node:test";
import assert from "node:assert/strict";
import {
  newLife, awakenCheck, startOp, stepOp, choose, optionView, skillDamage, heroPower, jobOp, foe, advance,
} from "../src/core/index.js";
import { GATES, SKILLS, BIG_JOBS } from "../src/data/index.js";
import { firstOpen } from "./helpers.mjs";

const hunter = (seed, lv = 10) => {
  const s = newLife(seed); s.ageM = 25 * 12;
  awakenCheck(s, "event"); s.hunter.lv = lv; return s;
};
const op = (foes, boss = false) => ({
  id: "t", kind: "gate", t: "test", foes, decisions: GATES[0].decisions, boss, rewards: { gold: 100, items: [] },
});
const runOp = (s, def, plan = "careful") => {
  startOp(s, def, { plan, skills: s.hunter?.slots ?? [], quick: [], team: [] });
  let r = "running";
  for (let i = 0; i < 200 && s.op; i++) {
    if (s.ev) { choose(s, firstOpen(s)); continue; }
    r = stepOp(s);
  }
  return { r, s };
};

test("same prep same seed same result", () => {
  const a = runOp(hunter("o1"), op([foe("สุนัขท่อระบาย", 10, "wood")]));
  const b = runOp(hunter("o1"), op([foe("สุนัขท่อระบาย", 10, "wood")]));
  assert.deepEqual(a.s, b.s);
});

test("skill vsEl multiplies damage vs element", () => {
  const sk = SKILLS.flameStorm;
  const ice = skillDamage(sk, 100, { el: "ice", def: 0 });
  const wood = skillDamage(sk, 100, { el: "wood", def: 0 });
  assert.equal(ice, wood * 2);
});

test("retreat plan flees at half hp instead of dying (non-boss)", () => {
  for (let i = 0; i < 30; i++) {
    const s = hunter("rt" + i, 1);
    const { s: t } = runOp(s, op([foe("มนุษย์คอนกรีต", 40, "metal")]), "retreat");
    assert.equal(t.dead, null);
  }
});

test("boss loss can kill", () => {
  let dead = 0;
  for (let i = 0; i < 200; i++) {
    const s = hunter("bs" + i, 1);
    runOp(s, op([foe("ราชาลานจอด", 60, "metal", true)], true), "push");
    dead += !!s.dead;
  }
  assert.ok(dead > 0);
});

test("locked decision option needs skill", () => {
  const s = hunter("lk");
  const opt = GATES[0].decisions[1].o.find((o) => o.need?.["skill:telekinesis"]);
  const v = optionView(s, opt);
  assert.equal(v.locked, true);
  assert.match(v.lockText, /Telekinesis/);
});

test("civilian job op runs decisions without foes", () => {
  const s = newLife("cj"); s.ageM = 30 * 12; s.job = { id: "doc", tier: 1, xp: 0 };
  const def = jobOp(s, BIG_JOBS.find((j) => j.who.includes("doc")));
  assert.equal(def.foes.length, 0);
  const { r } = runOp(s, def);
  assert.ok(["won", "fled", "lost"].includes(r));
  assert.equal(s.op, null);
});

test("power declines after 45", () => {
  const s = hunter("age", 30);
  const young = heroPower(s).atk;
  s.ageM = 60 * 12;
  assert.ok(heroPower(s).atk < young);
});

test("advance runs ops and ticks", () => {
  const s = hunter("adv");
  startOp(s, op([foe("สุนัขท่อระบาย", 1, "wood")]), { plan: "push", skills: [], quick: [], team: [] });
  for (let i = 0; i < 50 && s.op; i++) { if (s.ev) choose(s, firstOpen(s)); else advance(s); }
  assert.equal(s.op, null);
});
