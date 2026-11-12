// The monthly clock. One tick = 1 month (3 months in childhood).
import { stream, stageOf, ageY } from "./state.js";
import { ch, wp } from "./rng.js";
import { eligible, openEvent, EVENT_INDEX } from "./events.js";
import { kindsOf } from "./kinds.js";
import { addLedger } from "./money.js";
import { bodyMonth, yearEnd, changeMind } from "./body.js";
import { FOCUS } from "../data/stats.js";
import { MILESTONES } from "../data/milestones.js";
import { ALL_EVENTS } from "../data/events/index.js";

for (const m of MILESTONES) EVENT_INDEX.set(m.id, m);

import { monthly, books, lastly } from "./registry.js";
export { monthly, books, lastly };
const EVENT_CHANCE = 0.22;
const REPEAT_CAP = 1;
const COOLDOWN = 60; // months before the same random event can come back (playtest: 3 years felt repetitive)

export function focusList(s) {
  const table = FOCUS[stageOf(s)];
  const hunting = !!s.hunter && !s.flags.stoppedHunting;
  const a = ageY(s), fits = (f) => !f.age || (a >= f.age[0] && a <= f.age[1]);
  return Object.entries(table).filter(([, f]) => (!f.hunter || hunting) && fits(f)).map(([id, f]) => ({ id, ...f }));
}

export function setFocus(s, id) {
  if (!focusList(s).some((f) => f.id === id)) return;
  s.focus = id;
  if (s.focus2 === id) s.focus2 = null;
}

// The secondary plan (from 13): half the monthly stat growth and a smaller pull on events, nothing else. Hunting and
// work are whole-time systems and cannot be secondary. Spec: 2026-11-13-life-plans-and-choices-design.md.
const NOT_SECOND = new Set(["hunt", "work"]);
export function focus2List(s) {
  if (ageY(s) < 13) return [];
  return focusList(s).filter((f) => f.id !== s.focus && !NOT_SECOND.has(f.id));
}

export function setFocus2(s, id) {
  if (id == null) s.focus2 = null;
  else if (focus2List(s).some((f) => f.id === id)) s.focus2 = id;
}

export function applyFocus(s, step) {
  const table = FOCUS[stageOf(s)];
  if (!focusList(s).some((f) => f.id === s.focus)) s.focus = focusList(s)[0].id;
  if (s.focus2 && !focus2List(s).some((f) => f.id === s.focus2)) s.focus2 = null;
  const f = table[s.focus];
  for (const [k, v] of Object.entries(f.st)) s.st[k] += v * step;
  if (s.focus2) for (const [k, v] of Object.entries(table[s.focus2].st)) s.st[k] += (v / 2) * step;
  if (f.gold) addLedger(s, "ค่าขนม/งานพิเศษ", f.gold * step);
  if (f.mind) changeMind(s, f.mind * step);
  if (f.hp) s.hp = Math.min(100, s.hp + f.hp * step);
}

function dueEvent(s) {
  const i = s.sched.findIndex((x) => x.atM <= s.ageM);
  if (i >= 0) {
    const [due] = s.sched.splice(i, 1);
    const ev = EVENT_INDEX.get(due.id);
    if (ev) return ev;
  }
  return MILESTONES.find((m) => ageY(s) >= m.age[0] && !s.c["ev:" + m.id]);
}

// The random events this life could draw now. Each comes at most REPEAT_CAP times in a life (cap: n on the event
// overrides) and waits COOLDOWN months before coming back: variety over habit.
export function randomPool(s) {
  const fresh = (e) => s.ageM - (s.c["last:" + e.id] ?? -999) >= COOLDOWN
    && (s.c["ev:" + e.id] ?? 0) < (e.cap ?? REPEAT_CAP);
  return ALL_EVENTS.filter((e) => !e.k && fresh(e) && eligible(s, e));
}

function randomEvent(s, step) {
  const R = stream(s, "pick");
  // the chance is per month: a 3-month childhood tick rolls for all three (playtest: childhood had 1/3 the events)
  if (!ch(R, 1 - (1 - EVENT_CHANCE) ** step)) return null;
  const pool = randomPool(s);
  if (!pool.length) return null;
  return wp(R, pool, (e) => ((e.w ?? 1) * planWeight(s, e)) / (1 + (s.c["ev:" + e.id] ?? 0) * 2));
}

// How hard the life's plans pull an event: the main plan's kinds ×2.5, the secondary's ×1.5 (the main wins).
const MAIN_PULL = 2.5, SECOND_PULL = 1.5;
const planOf = (s, id) => (id ? FOCUS[stageOf(s)][id] : null);
export function planWeight(s, ev) {
  const k = kindsOf(ev), main = planOf(s, s.focus), side = planOf(s, s.focus2);
  if (main?.kinds?.some((x) => k.includes(x))) return MAIN_PULL;
  if (side?.kinds?.some((x) => k.includes(x))) return SECOND_PULL;
  return 1;
}

// A random event, opened with the name of the plan that pulled it (shown in the log), if one did.
export function openRandom(s, ev) {
  openEvent(s, ev);
  if (planWeight(s, ev) > 1) {
    const main = planOf(s, s.focus);
    s.ev.fromPlan = main?.kinds?.some((x) => kindsOf(ev).includes(x)) ? main.n : planOf(s, s.focus2).n;
  }
}

export function tick(s) {
  if (s.dead || s.ev || s.op) return;
  const step = stageOf(s) === "kid" ? 3 : 1;
  const yearBefore = ageY(s);
  s.ageM += step;
  applyFocus(s, step);
  bodyMonth(s, step);
  // The year rolls over first: a system that opens an event this month must not skip the old-age check.
  if (ageY(s) > yearBefore) { yearEnd(s); if (s.dead) return; }
  for (const sys of books) { sys(s, step); if (s.dead) return; }
  for (const sys of monthly) { sys(s, step); if (s.dead || s.ev || s.op) return; }
  for (const sys of lastly) { sys(s, step); if (s.dead || s.ev || s.op) return; }
  const due = dueEvent(s), ev = due ?? randomEvent(s, step);
  if (!ev) return;
  s.c["last:" + ev.id] = s.ageM;
  if (due) openEvent(s, ev); else openRandom(s, ev);
}
