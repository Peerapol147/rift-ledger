// Regression tests for the whole-branch review findings.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
import {
  newLife, advance, choose, openEvent, optionView, autoDecide, ageY, lifespan, awakenCheck, openGateChoice,
  startOp, gateOp, gateOffers, borrow, debtCap, tick,
} from "../src/core/index.js";

test("#1 crossing a birthday past lifespan kills even when a job offer opens that month", () => {
  const s = newLife("imm1");
  s.c.famGift = 1;
  for (const k of ["ms6", "ms12", "ms15", "ms18", "ms22", "ms30", "ms40", "ms50", "ms60"]) s.c["ev:" + k] = 1;
  s.ageM = (lifespan(s) + 1) * 12 - 1; // one month before the birthday after lifespan
  s.focus = "rest";
  tick(s);
  assert.equal(s.ageM % 12, 0);
  assert.ok(s.dead, `alive at ${ageY(s)}, ev ${s.ev?.id}`);
});

test("#2 an outcome without risk is never lethal", () => {
  const s = newLife("nl"); s.ageM = 30 * 12; s.hp = 5;
  openEvent(s, { id: "x", t: "t", o: [{ l: "ทนเอา", y: { hp: -8 } }] });
  choose(s, 0);
  assert.equal(s.dead, null);
  assert.ok(s.hp >= 1);
});

test("#2 autopilot stops when an option could cost all remaining health or a permanent injury", () => {
  const s = newLife("ap"); s.ageM = 30 * 12; s.hp = 30;
  openEvent(s, { id: "x", t: "t", o: [{ l: "a", s: "str", diff: 99, y: {}, n: { hp: -40, injury: ["scar", null] } }] });
  assert.equal(autoDecide(s, "important"), -1);
});

test("#2 street gate break is important", async () => {
  const { ADULT_EVENTS } = await import("../src/data/events/adult.js");
  assert.ok(ADULT_EVENTS.find((e) => e.id === "adultBreakNear").important);
});

const hunter = (seed) => { const s = newLife(seed); s.ageM = 25 * 12; awakenCheck(s, "event"); s.focus = "hunt"; return s; };

test("#3 picking a dangerous gate always starts the operation", () => {
  for (let i = 0; i < 40; i++) {
    const s = hunter("dg" + i);
    openGateChoice(s);
    const k = s.ev.opts.findIndex((o) => optionView(s, o).risk > 0);
    if (k < 0) continue;
    choose(s, k);
    assert.ok(s.op, "operation started");
  }
});

test("#4 autopilot never enters a boss offer and never decides inside a boss fight", () => {
  for (let i = 0; i < 40; i++) {
    const s = hunter("bo" + i);
    s.hunter.lv = 90; s.hunter.rank = 6;
    openGateChoice(s);
    const k = autoDecide(s, "skip");
    if (k >= 0 && k < s.offers.length) assert.ok(!s.offers[k].boss, "auto picked a boss offer");
  }
  const s = hunter("bf");
  const g = gateOffers(s)[0]; g.boss = true;
  startOp(s, gateOp(s, g), { plan: "careful", skills: [], quick: [], team: [] });
  while (s.op && !s.ev) advance(s);
  if (s.ev) assert.equal(autoDecide(s, "skip"), -1);
});

test("#5 every core module imports on its own without throwing", () => {
  for (const f of readdirSync("src/core")) {
    execFileSync("node", ["-e", `await import("./src/core/${f}")`], { stdio: "pipe" });
  }
});

test("#7 debt is repaid in monthly instalments through the ledger", () => {
  const s = newLife("debt"); s.ageM = 30 * 12; s.c.famGift = 1;
  s.job = { id: "office", tier: 2, xp: 0 };
  borrow(s, 3000);
  const d0 = s.debt;
  for (let i = 0; i < 12; i++) { s.ev = null; tick(s); }
  assert.ok(s.debt < d0, `debt ${s.debt} not below ${d0}`);
  assert.ok(s.ledger.some((e) => e.label === "ผ่อนหนี้"));
});

test("#7 debt cap uses trailing income, not only this month", () => {
  const s = newLife("cap"); s.ageM = 30 * 12;
  for (let m = 1; m <= 12; m++) s.ledger.push({ m: s.ageM - m, label: "เงินเดือน", amt: 1000 });
  assert.ok(debtCap(s) >= 24000);
});
